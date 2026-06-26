"""
Seed script — creates the first superadmin account + employee record.

Run from the backend directory (with venv active):
    python scripts/seed_admin.py

You will be prompted for email and password.
Change credentials immediately after your first login.
"""

import sys
import os
import getpass

# Add backend root to sys.path so app imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
# Import all models so SQLAlchemy can resolve relationship strings
from app.shared.models import user, document, token, approval  # noqa: F401
from app.employees import models as _employee_models  # noqa: F401
from app.vendors import models as _vendor_models  # noqa: F401
from app.shared.models.user import User, UserRole, AccountStatus
from app.employees.models import Employee
from app.core.security import hash_password


def _next_employee_no(db) -> str:
    last = db.query(Employee.employee_no).order_by(Employee.created_at.desc()).first()
    if last:
        try:
            num = int(last[0].split("-")[-1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"PG-EMP-{num:04d}"


def main():
    print("\n── Portland Gas Ops — Superadmin Seed ──────────────────────\n")

    email = input("Admin email [admin@portlandgas.com]: ").strip() or "admin@portlandgas.com"
    first = input("First name [System]: ").strip() or "System"
    last  = input("Last name  [Admin]:  ").strip() or "Admin"
    job   = input("Job title  [System Administrator]: ").strip() or "System Administrator"

    while True:
        pw  = getpass.getpass("Password (min 8 chars): ")
        pw2 = getpass.getpass("Confirm password:       ")
        if pw != pw2:
            print("Passwords do not match. Try again.\n")
        elif len(pw) < 8:
            print("Password must be at least 8 characters.\n")
        else:
            break

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"\n⚠  Account already exists for {email}")
            print(f"   Role: {existing.role.value}  Status: {existing.account_status.value}")

            # Check if employee record exists, create if missing
            emp = db.query(Employee).filter(Employee.user_id == existing.id).first()
            if not emp:
                employee_no = _next_employee_no(db)
                emp = Employee(
                    user_id    = existing.id,
                    employee_no= employee_no,
                    job_title  = job,
                )
                db.add(emp)
                db.commit()
                print(f"   ✅  Employee record created: {employee_no}")
            else:
                print(f"   Employee record already exists: {emp.employee_no}")
            return

        usr = User(
            first_name      = first,
            last_name       = last,
            name            = f"{first} {last}",
            email           = email,
            hashed_password = hash_password(pw),
            role            = UserRole.super_admin,
            account_status  = AccountStatus.active,
        )
        db.add(usr)
        db.flush()

        employee_no = _next_employee_no(db)
        emp = Employee(
            user_id    = usr.id,
            employee_no= employee_no,
            job_title  = job,
        )
        db.add(emp)
        db.commit()

        print(f"\n✅  Superadmin created!")
        print(f"   Email:       {email}")
        print(f"   Name:        {first} {last}")
        print(f"   Employee No: {employee_no}")
        print(f"   Role:        super_admin")
        print(f"\n   Login at /login — change your password after first login.\n")
    except Exception as e:
        db.rollback()
        print(f"\n❌  Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
