FROM python:3.11-slim

WORKDIR /app

# Copy and install dependencies
COPY requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend source code into the 'backend' folder to maintain package imports
COPY . ./backend

# Set PYTHONPATH so both 'from backend.src...' and 'from src...' imports work
ENV PYTHONPATH=/app:/app/backend

# Expose FastAPI port
EXPOSE 8000

# Run the FastAPI server in production
CMD ["uvicorn", "backend.src.main:app", "--host", "0.0.0.0", "--port", "8000"]
