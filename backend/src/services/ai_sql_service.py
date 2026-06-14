from sqlalchemy.orm import Session
from sqlalchemy import text, inspect, MetaData, Table
from google import genai
from src.core.config import settings
from src.models.dataset import DatasetQuery
import logging
import re
from tenacity import retry, stop_after_attempt, wait_exponential

metadata = MetaData(schema="datasets_schema")

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def _generate_content_with_retry(client, model_name, prompt):
    return client.models.generate_content(
        model=model_name,
        contents=prompt
    )

def _generate_offline_sql_and_insight(dynamic_table_name: str, table, question: str):
    import sqlalchemy.types as sqltypes
    question_lower = question.lower()
    
    # Extract columns
    numeric_cols = []
    text_cols = []
    for col in table.columns:
        if isinstance(col.type, (sqltypes.Integer, sqltypes.Float, sqltypes.Numeric, sqltypes.BigInteger)):
            numeric_cols.append(col.name)
        else:
            text_cols.append(col.name)
            
    # Find referenced column in question
    target_num_col = None
    for col in numeric_cols:
        if col in question_lower:
            target_num_col = col
            break
    if not target_num_col and numeric_cols:
        # Defaults
        for preferred in ["marks", "score", "age", "salary"]:
            if preferred in numeric_cols:
                target_num_col = preferred
                break
        if not target_num_col:
            target_num_col = numeric_cols[0]
            
    # Parse LIMIT/Top N
    limit_match = re.search(r'\b(?:top|highest|best|maximum|max|lowest|worst|minimum|min)\s+(\d+)\b', question_lower)
    if not limit_match:
        limit_match = re.search(r'\b(\d+)\s+(?:top|highest|best|lowest|worst)\b', question_lower)
    limit_val = int(limit_match.group(1)) if limit_match else 100
    
    # Check for keywords
    if any(k in question_lower for k in ["top", "highest", "best", "max", "maximum"]):
        if target_num_col:
            sql = f"SELECT * FROM {dynamic_table_name} ORDER BY {target_num_col} DESC LIMIT {limit_val}"
            insight = f"Showing the top {limit_val} records sorted by {target_num_col}."
        else:
            sql = f"SELECT * FROM {dynamic_table_name} LIMIT {limit_val}"
            insight = f"Showing the top {limit_val} records."
            
    elif any(k in question_lower for k in ["lowest", "worst", "min", "minimum"]):
        if target_num_col:
            sql = f"SELECT * FROM {dynamic_table_name} ORDER BY {target_num_col} ASC LIMIT {limit_val}"
            insight = f"Showing the lowest {limit_val} records sorted by {target_num_col}."
        else:
            sql = f"SELECT * FROM {dynamic_table_name} LIMIT {limit_val}"
            insight = f"Showing the lowest {limit_val} records."
            
    elif any(k in question_lower for k in ["average", "avg", "mean"]):
        if target_num_col:
            sql = f"SELECT AVG({target_num_col}) AS average_{target_num_col} FROM {dynamic_table_name}"
            insight = f"Calculated the average of {target_num_col}."
        else:
            sql = f"SELECT COUNT(*) AS total_count FROM {dynamic_table_name}"
            insight = "Could not find a numeric column to average. Returned total count instead."
            
    elif any(k in question_lower for k in ["sum", "total"]):
        if target_num_col:
            sql = f"SELECT SUM({target_num_col}) AS total_{target_num_col} FROM {dynamic_table_name}"
            insight = f"Calculated the sum of {target_num_col}."
        else:
            sql = f"SELECT COUNT(*) AS total_count FROM {dynamic_table_name}"
            insight = "Could not find a numeric column to sum. Returned total count instead."
            
    elif any(k in question_lower for k in ["count", "how many", "number of"]):
        sql = f"SELECT COUNT(*) AS total_count FROM {dynamic_table_name}"
        insight = "Calculated the total number of records."
        
    else:
        # Check if there is any simple filter condition, e.g., "where category is General"
        filter_clause = ""
        for col in text_cols:
            if col in question_lower:
                for val in ["general", "obc", "sc", "st"]:
                    if val in question_lower:
                        filter_clause = f" WHERE LOWER({col}) = '{val}'"
                        break
        
        sql = f"SELECT * FROM {dynamic_table_name}{filter_clause} LIMIT 100"
        insight = f"Retrieved records from the dataset."
        
    return sql, insight

def ask_dataset_question(dynamic_table_name: str, question: str, db: Session, dataset_id: str = None, app_db: Session = None):
    # Check if key is placeholder or empty
    is_placeholder = (
        not settings.GEMINI_API_KEY 
        or settings.GEMINI_API_KEY.strip() == "" 
        or "your-gemini-api-key" in settings.GEMINI_API_KEY.lower()
    )
    
    # Reflect the table to get its schema
    engine = db.get_bind()
    table = Table(dynamic_table_name, metadata, autoload_with=engine)

    if is_placeholder:
        sql_query, insight_text = _generate_offline_sql_and_insight(dynamic_table_name, table, question)
        try:
            db.execute(text("SET search_path TO datasets_schema, public"))
            db.execute(text("SET statement_timeout = 3000"))
            result = db.execute(text(sql_query))
            rows = [dict(row._mapping) for row in result.fetchall()]
            
            if dataset_id and app_db:
                q_record = DatasetQuery(
                    dataset_id=dataset_id,
                    natural_language_query=question,
                    generated_sql=sql_query
                )
                app_db.add(q_record)
                app_db.commit()
                
            return {
                "sql": sql_query,
                "results": rows,
                "insight": insight_text + " [Note: Running in offline fallback mode because Gemini API key is not configured.]",
                "chart_config": None
            }
        except Exception as e:
            return {
                "error": f"Offline query failed: {str(e)}",
                "sql": sql_query,
                "results": [],
                "insight": "Please check your database table structure or query.",
                "chart_config": None
            }

    # Otherwise, attempt to call Gemini API
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    columns_info = [f"{col.name} ({col.type})" for col in table.columns]
    ddl = f"Table: {dynamic_table_name}\nColumns: " + ", ".join(columns_info)

    prompt = f"""
    You are an AI SQL Assistant. Convert the natural language question into a valid PostgreSQL query for the uploaded dataset.
    
    Schema:
    {ddl}
    
    Rules:
    1. Only return the raw SQL query. Do NOT wrap it in ```sql markdown blocks.
    2. ONLY use SELECT statements. No modifications allowed.
    3. Always end the query with LIMIT 100.
    
    Question: {question}
    """
    
    try:
        response = _generate_content_with_retry(client, settings.GEMINI_MODEL_PRO, prompt)
        
        sql_query = response.text.strip()
        
        # Robust markdown stripping
        match = re.search(r'```(?:sql)?\s*(.*?)\s*```', sql_query, re.IGNORECASE | re.DOTALL)
        if match:
            sql_query = match.group(1).strip()
            
        # Clean up duplicate LIMIT clauses (e.g., LIMIT 3 LIMIT 100)
        sql_query = re.sub(r'LIMIT\s+(\d+)\s+LIMIT\s+\d+', r'LIMIT \1', sql_query, flags=re.IGNORECASE)
            
        # Robust SELECT check (allows WITH clauses)
        if not re.match(r'^\s*(?:WITH\s+.*?)?SELECT', sql_query, re.IGNORECASE | re.DOTALL):
            return {
                "sql": sql_query,
                "results": None,
                "insight": None,
                "error": "Generated query is not a read-only SELECT statement."
            }
            
        # 2. Execute query (using datasets_readonly_user via FastAPI dependency)
        # Add statement timeout and set search path for safety
        db.execute(text("SET LOCAL search_path TO datasets_schema, public"))
        db.execute(text("SET LOCAL statement_timeout = '3s'"))
        result = db.execute(text(sql_query))
        rows = [dict(row._mapping) for row in result.fetchall()]
        
        # 3. Generate Insights & Chart Configs
        insight_prompt = f"""
        Provide a 1-sentence insight about these data results for the question: "{question}".
        Results: {rows[:5]}
        """
        insight_response = _generate_content_with_retry(client, settings.GEMINI_MODEL_FLASH, insight_prompt)
        insight_text = insight_response.text.strip()

        # Log query to history
        if dataset_id and app_db:
            q_record = DatasetQuery(
                dataset_id=dataset_id,
                natural_language_query=question,
                generated_sql=sql_query
            )
            app_db.add(q_record)
            app_db.commit()
        
        return {
            "sql": sql_query,
            "results": rows,
            "insight": insight_text,
            "chart_config": None
        }
    except Exception as e:
        # Gemini API call failed - trigger offline fallback gracefully
        logging.warning(f"Gemini API call failed, falling back to offline SQL generator: {str(e)}")
        sql_query_off, insight_text_off = _generate_offline_sql_and_insight(dynamic_table_name, table, question)
        try:
            db.execute(text("SET search_path TO datasets_schema, public"))
            db.execute(text("SET statement_timeout = 3000"))
            result = db.execute(text(sql_query_off))
            rows = [dict(row._mapping) for row in result.fetchall()]
            
            if dataset_id and app_db:
                q_record = DatasetQuery(
                    dataset_id=dataset_id,
                    natural_language_query=question,
                    generated_sql=sql_query_off
                )
                app_db.add(q_record)
                app_db.commit()
                
            return {
                "sql": sql_query_off,
                "results": rows,
                "insight": insight_text_off + f" [Note: Gemini API failed ({str(e)}). Running in offline fallback mode.]",
                "chart_config": None
            }
        except Exception as e_inner:
            fallback_msg = "I couldn't process that query correctly. Try asking a simpler question, or using specific keywords like 'count', 'average', or 'list'."
            return {
                "error": f"API Error: {str(e)}. Offline Fallback Error: {str(e_inner)}",
                "sql": None,
                "results": [],
                "insight": fallback_msg,
                "chart_config": None
            }
