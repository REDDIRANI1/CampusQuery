from sqlalchemy.orm import Session
from sqlalchemy import text
import re
from tenacity import retry, stop_after_attempt, wait_exponential
from google import genai
from backend.src.core.config import settings

def ask_allocation_question(question: str, db: Session):
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    # 1. Fetch DDL for public schema tables
    ddl = """
    Table: courses
    Columns: id (UUID), name (String), total_seats (Int), general_seats (Int), obc_seats (Int), sc_seats (Int), st_seats (Int), rejection_count (Int)
    
    Table: students
    Columns: id (UUID), student_id_str (String), name (String), marks (Float), category (Enum: General, OBC, SC, ST), allocation_status (Enum: Pending, Allocated, Rejected), allocated_course_id (UUID), allocated_quota (Enum)
    
    Table: student_preferences
    Columns: id (UUID), student_id (UUID), course_id (UUID), priority (Int)
    """

    prompt = f"""
    You are an AI SQL Assistant for a university course allocation system.
    Convert the following natural language question into a valid PostgreSQL query.
    
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
        
        # Robust markdown stripping
        match = re.search(r'```(?:sql)?\s*(.*?)\s*```', sql_query, re.IGNORECASE | re.DOTALL)
        if match:
            sql_query = match.group(1).strip()
            
        # Robust SELECT check
        if not re.match(r'^\s*(?:WITH\s+.*?)?SELECT', sql_query, re.IGNORECASE | re.DOTALL):
            return {
                "answer": "Error: Generated query is not a read-only SELECT statement.",
                "sql": sql_query
            }
            
        # Execute query
        result = db.execute(text(sql_query))
        rows = result.fetchall()
        
        # Format results (simplified for prototype)
        answer = f"Found {len(rows)} results.\n" + "\n".join([str(r) for r in rows[:10]])
        if len(rows) > 10:
            answer += "\n... (truncated)"
            
        return {
            "answer": answer,
            "sql": sql_query
        }
    except Exception as e:
        return {
            "answer": f"I couldn't process that query correctly. Error: {str(e)}\n\nTry asking: 'How many students were allocated to Computer Science?'",
            "sql": None
        }
