import pandas as pd
import re
import uuid
from sqlalchemy import Table, Column, Integer, String, Float, MetaData, text
from sqlalchemy.orm import Session
from backend.src.models.dataset import UploadedDataset, DatasetQuery
from fastapi import UploadFile

metadata = MetaData(schema="datasets_schema")

def sanitize_header(header: str) -> str:
    # Strict regex: lowercase, replace spaces with _, remove non-alphanumeric
    clean = header.strip().lower()
    clean = re.sub(r'[^a-z0-9_]', '_', clean)
    clean = re.sub(r'_+', '_', clean)
    clean = clean.strip('_')
    if not clean or clean[0].isdigit():
        clean = "col_" + clean
    return clean

def infer_sqlalchemy_type(dtype):
    if pd.api.types.is_integer_dtype(dtype):
        return Integer
    elif pd.api.types.is_float_dtype(dtype):
        return Float
    else:
        return String

def process_and_store_dataset(file: UploadFile, db: Session) -> UploadedDataset:
    # 1. Read file
    if file.filename.endswith('.csv'):
        df = pd.read_csv(file.file)
    elif file.filename.endswith('.xlsx') or file.filename.endswith('.xls'):
        df = pd.read_excel(file.file, engine='openpyxl')
    else:
        raise ValueError("Unsupported file format. Please upload CSV or Excel.")

    # 2. Sanitize headers
    df.columns = [sanitize_header(str(col)) for col in df.columns]
    
    # 3. Create Dynamic Table
    table_name = f"dataset_{uuid.uuid4().hex[:8]}"
    
    columns = [Column("id", Integer, primary_key=True, autoincrement=True)]
    for col_name, dtype in df.dtypes.items():
        columns.append(Column(col_name, infer_sqlalchemy_type(dtype)))
        
    dynamic_table = Table(table_name, metadata, *columns)
    
    # Create the table in the database
    dynamic_table.create(db.get_bind(), checkfirst=True)
    
    # 4. Insert data in chunks
    df.to_sql(
        table_name,
        db.get_bind(),
        schema="datasets_schema",
        if_exists="append",
        index=False,
        chunksize=1000
    )
    
    # 5. Record metadata
    dataset_record = UploadedDataset(
        filename=file.filename,
        dynamic_table_name=table_name,
        row_count=len(df)
    )
    db.add(dataset_record)
    db.commit()
    db.refresh(dataset_record)
    
    return dataset_record

def delete_dataset(dataset_id: uuid.UUID, db: Session) -> bool:
    # 1. Fetch metadata record
    dataset_record = db.query(UploadedDataset).filter(UploadedDataset.id == dataset_id).first()
    if not dataset_record:
        return False

    # 2. Drop the table from database
    try:
        table_name = dataset_record.dynamic_table_name
        db.execute(text(f'DROP TABLE IF EXISTS datasets_schema."{table_name}"'))
    except Exception as e:
        import logging
        logging.error(f"Error dropping table {dataset_record.dynamic_table_name}: {e}")

    # 3. Delete any query logs
    db.query(DatasetQuery).filter(DatasetQuery.dataset_id == dataset_id).delete()

    # 4. Delete the dataset metadata record
    db.delete(dataset_record)
    db.commit()
    return True

