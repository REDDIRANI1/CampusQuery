from sqlalchemy.orm import Session
from sqlalchemy import text, inspect, MetaData, Table
from google import genai
from backend.src.core.config import settings

metadata = MetaData(schema="datasets_schema")

def ask_dataset_question(dynamic_table_name: str, question: str, db: Session):
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
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL_PRO,
            contents=prompt
        )
        
        sql_query = response.text.strip()
        
        # Strip markdown if LLM disobeyed
        if sql_query.startswith("```sql"):
            sql_query = sql_query[6:]
        if sql_query.startswith("```"):
            sql_query = sql_query[3:]
        if sql_query.endswith("```"):
            sql_query = sql_query[:-3]
        sql_query = sql_query.strip()
        
        if not sql_query.lower().startswith("select"):
            raise ValueError("Only SELECT queries are allowed.")
            
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
        insight_response = client.models.generate_content(
            model=settings.GEMINI_MODEL_FLASH, # Flash is faster for simple insights
            contents=insight_prompt
        )
        
        return {
            "sql": sql_query,
            "results": rows,
            "insight": insight_response.text.strip(),
            "chart_config": None # Placeholder for Recharts config
        }
    except Exception as e:
        return {
            "error": str(e),
            "sql": None,
            "results": [],
            "insight": "Failed to process query.",
            "chart_config": None
        }
