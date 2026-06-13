from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.src.models.student import Student, StudentPreference, CategoryEnum, AllocationStatusEnum
from backend.src.models.course import Course, SystemState

def run_allocation(db: Session):
    # 1. Lock system state
    state = db.query(SystemState).with_for_update().first()
    if not state:
        state = SystemState(id=1)
        db.add(state)
        db.flush()
    
    state.is_allocation_locked = True

    # 2. Idempotency reset
    db.query(Student).update({
        Student.allocated_course_id: None,
        Student.allocated_quota: None,
        Student.allocation_status: AllocationStatusEnum.Pending
    })
    db.query(Course).update({
        Course.rejection_count: 0
    })
    db.flush()

    # Get all courses to manage seat tracking in memory
    courses_db = db.query(Course).all()
    courses = {c.id: {
        "general_seats": c.general_seats,
        "obc_seats": c.obc_seats,
        "sc_seats": c.sc_seats,
        "st_seats": c.st_seats,
        "total_seats": c.total_seats,
        "db_obj": c
    } for c in courses_db}

    # 3. Process Student-by-Student by Merit
    students = db.query(Student).order_by(desc(Student.marks)).all()

    for student in students:
        prefs = db.query(StudentPreference).filter(StudentPreference.student_id == student.id).order_by(StudentPreference.priority).all()
        
        allocated = False
        for pref in prefs:
            c_data = courses.get(pref.course_id)
            if not c_data:
                continue

            # Check if General seat available (Everyone competes for General first)
            if c_data["general_seats"] > 0:
                c_data["general_seats"] -= 1
                c_data["total_seats"] -= 1
                student.allocated_course_id = pref.course_id
                student.allocated_quota = CategoryEnum.General
                student.allocation_status = AllocationStatusEnum.Allocated
                allocated = True
                break
            
            # If General is full, try Category-specific seat
            elif student.category == CategoryEnum.OBC and c_data["obc_seats"] > 0:
                c_data["obc_seats"] -= 1
                c_data["total_seats"] -= 1
                student.allocated_course_id = pref.course_id
                student.allocated_quota = CategoryEnum.OBC
                student.allocation_status = AllocationStatusEnum.Allocated
                allocated = True
                break
            elif student.category == CategoryEnum.SC and c_data["sc_seats"] > 0:
                c_data["sc_seats"] -= 1
                c_data["total_seats"] -= 1
                student.allocated_course_id = pref.course_id
                student.allocated_quota = CategoryEnum.SC
                student.allocation_status = AllocationStatusEnum.Allocated
                allocated = True
                break
            elif student.category == CategoryEnum.ST and c_data["st_seats"] > 0:
                c_data["st_seats"] -= 1
                c_data["total_seats"] -= 1
                student.allocated_course_id = pref.course_id
                student.allocated_quota = CategoryEnum.ST
                student.allocation_status = AllocationStatusEnum.Allocated
                allocated = True
                break
            else:
                # Preference denied, increment rejection count
                c_data["db_obj"].rejection_count += 1
                
        if not allocated:
            student.allocation_status = AllocationStatusEnum.Rejected

    db.commit()

    return {"message": "Allocation completed successfully."}

def get_allocation_stats(db: Session):
    total_students = db.query(Student).count()
    allocated_students = db.query(Student).filter(Student.allocation_status == AllocationStatusEnum.Allocated).count()
    rejected_students = db.query(Student).filter(Student.allocation_status == AllocationStatusEnum.Rejected).count()
    
    return {
        "total_students": total_students,
        "allocated_students": allocated_students,
        "rejected_students": rejected_students
    }
