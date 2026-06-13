from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from uuid import UUID
from typing import List, Optional

from backend.src.core.database import get_db, get_datasets_readonly_db
from backend.src.models.dataset import UploadedDataset, DatasetQuery
from backend.src.services.dataset_service import process_and_store_dataset

router = APIRouter(prefix="/datasets", tags=["Datasets"])

class DatasetResponse(BaseModel):
    id: UUID
    filename: str
    dynamic_table_name: str
    row_count: Optional[str]

    class Config:
        from_attributes = True

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # In a real app, use run_in_threadpool. For simplicity in prototype, calling directly.
        from starlette.concurrency import run_in_threadpool
        dataset = await run_in_threadpool(process_and_store_dataset, file, db)
        return dataset
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[DatasetResponse])
def list_datasets(db: Session = Depends(get_db)):
    return db.query(UploadedDataset).all()

# Placeholder for AI query integration
class DatasetQueryRequest(BaseModel):
    question: str

@router.post("/{dataset_id}/query")
def query_dataset(dataset_id: UUID, request: DatasetQueryRequest, db: Session = Depends(get_datasets_readonly_db), app_db: Session = Depends(get_db)):
    dataset = app_db.query(UploadedDataset).filter(UploadedDataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    from backend.src.services.ai_sql_service import ask_dataset_question
    return ask_dataset_question(dataset.dynamic_table_name, request.question, db, dataset.id)

@router.get("/{dataset_id}/queries")
def get_dataset_queries(dataset_id: str, db: Session = Depends(get_db)):
    """Retrieve history of AI queries executed against a specific dataset."""
    queries = db.query(DatasetQuery).filter(DatasetQuery.dataset_id == dataset_id).order_by(DatasetQuery.created_at.desc()).limit(50).all()
    return queries

@router.get("/{dataset_id}/export")
def export_dataset_query(dataset_id: UUID):
    # Bonus feature placeholder
    return {"message": "Export feature pending implementation"}
