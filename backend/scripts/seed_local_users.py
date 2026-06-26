"""
Seed local test users for frontend/backend integration work.

Run from the backend directory:
    python3 scripts/seed_local_users.py

This script is intentionally guarded to the local test database
`portland_gas_ops_nubi` so it cannot seed shared/cloud data by accident.
"""

import os
import sys
from dataclasses import dataclass

from sqlalchemy import text


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.employees.models import Department, Employee, EmploymentType
from app.shared.models.document import Document  # noqa: F401 - relationship resolution
from app.shared.models.user import AccountStatus, User, UserRole


LOCAL_DATABASE_NAME = "portland_gas_ops_nubi"
DEFAULT_PASSWORD = "Password@123"


@dataclass(frozen=True)
class LocalUserSeed:
    email: str
    first_name: str
    last_name: str
    role: UserRole
    job_title: str
    department: Department
    employee_no: str


USERS: tuple[LocalUserSeed, ...] = (
    LocalUserSeed(
        email="admin@portlandgas.local",
        first_name="System",
        last_name="Admin",
        role=UserRole.super_admin,
        job_title="System Administrator",
        department=Department.it,
        employee_no="PG-LOCAL-0001",
    ),
    LocalUserSeed(
        email="samuel.bassey@portlandgas.local",
        first_name="Samuel",
        last_name="Bassey",
        role=UserRole.staff,
        job_title="HSE Inspector",
        department=Department.safety,
        employee_no="PG-LOCAL-0002",
    ),
    LocalUserSeed(
        email="workshop.supervisor@portlandgas.local",
        first_name="Workshop",
        last_name="Supervisor",
        role=UserRole.staff,
        job_title="Workshop Supervisor",
        department=Department.operations,
        employee_no="PG-LOCAL-0003",
    ),
    LocalUserSeed(
        email="mary.james@portlandgas.local",
        first_name="Mary",
        last_name="James",
        role=UserRole.staff,
        job_title="Operations Officer",
        department=Department.operations,
        employee_no="PG-LOCAL-0004",
    ),
    LocalUserSeed(
        email="felix.ohemu@portlandgas.local",
        first_name="Felix",
        last_name="Ohemu",
        role=UserRole.staff,
        job_title="Maintenance Technician",
        department=Department.engineering,
        employee_no="PG-LOCAL-0005",
    ),
)


def ensure_local_database(db) -> None:
    database_name = db.execute(text("SELECT DATABASE()")).scalar()
    if database_name != LOCAL_DATABASE_NAME:
        raise RuntimeError(
            f"Refusing to seed users into '{database_name}'. "
            f"Expected local database '{LOCAL_DATABASE_NAME}'."
        )


def upsert_user(db, seed: LocalUserSeed) -> None:
    user = db.query(User).filter(User.email == seed.email).first()
    if user is None:
        user = User(email=seed.email)
        db.add(user)

    user.first_name = seed.first_name
    user.last_name = seed.last_name
    user.name = f"{seed.first_name} {seed.last_name}"
    user.hashed_password = hash_password(DEFAULT_PASSWORD)
    user.role = seed.role
    user.account_status = AccountStatus.active
    db.flush()

    employee = db.query(Employee).filter(Employee.user_id == user.id).first()
    if employee is None:
        employee = Employee(user_id=user.id)
        db.add(employee)

    employee.employee_no = seed.employee_no
    employee.job_title = seed.job_title
    employee.department = seed.department
    employee.employment_type = EmploymentType.full_time


def main() -> None:
    db = SessionLocal()
    try:
        ensure_local_database(db)
        for user_seed in USERS:
            upsert_user(db, user_seed)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print(f"Seeded {len(USERS)} local users.")
    print(f"Password for all local users: {DEFAULT_PASSWORD}")
    print("Primary login: admin@portlandgas.local")


if __name__ == "__main__":
    main()
