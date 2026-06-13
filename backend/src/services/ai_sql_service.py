from sqlalchemy.orm import Session
from sqlalchemy import text, inspect, MetaData, Table
from google import genai
from backend.src.core.config import settings
from backend.src.models.dataset import DatasetQuery
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

def ask_dataset_question(dynamic_table_name: str, question: str, db: Session, dataset_id: str = None, app_db: Session = None):
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    # 1. Fetch DDL for the specific dataset table
    # Reflect the table to get its schema
    engine = db.get_bind()
    table = Table(dynamic_table_name, metadata, autoload_with=engine)
    
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
            
        # Robust SELECT check (allows WITH clauses)
        if not re.match(r'^\s*(?:WITH\s+.*?)?SELECT', sql_query, re.IGNORECASE | re.DOTALL):
            return {
                "sql": sql_query,
                "results": None,
                "insight": None,
                "error": "Generated query is not a read-only SELECT statement."
            }
            
        # 2. Execute query (using datasets_readonly_user via FastAPI dependency)
        # Add statement timeout for safety
        db.execute(text("SET statement_timeout = 3000"))
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
            "chart_config": None # Placeholder for Recharts config
        }
    except Exception as e:
        fallback_msg = "I couldn't process that query correctly. Try asking a simpler question, or using specific keywords like 'count', 'average', or 'list'."
        return {
            "error": str(e),
            "sql": None,
            "results": [],
            "insight": fallback_msg,
            "chart_config": None
        }
