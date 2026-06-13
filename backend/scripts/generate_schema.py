import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from sqlalchemy.schema import CreateTable
from backend.src.models.base import Base
from backend.src.models.student import Student, StudentPreference
from backend.src.models.course import Course, SystemState
from backend.src.models.dataset import UploadedDataset, DatasetQuery
from sqlalchemy import create_engine

engine = create_engine('postgresql://postgres:postgres_password@localhost:5432/student_portal_db')
with open('schema.sql', 'w') as f:
    for table in Base.metadata.sorted_tables:
        f.write(str(CreateTable(table).compile(engine)).strip() + ';\n\n')
print("Schema generated successfully.")
