"""
Seed script — creates the super admin account.

Run once after your first migration:
    python seed.py

Safe to run multiple times — skips if the admin email already exists.
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.utils.security import hash_password

ADMIN_NAME = "Portland Gas Admin"
ADMIN_EMAIL = "admin@portlandgas.com"
ADMIN_PASSWORD = "ChangeMe@2024!"   # <-- change this immediately after first login

def seed():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            print(f"✓  Admin already exists: {ADMIN_EMAIL} — skipping.")
            return

        admin = User(
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
            role=UserRole.super_admin,
        )
        db.add(admin)
        db.commit()

        print("✓  Super admin created successfully.")
        print(f"   Email:    {ADMIN_EMAIL}")
        print(f"   Password: {ADMIN_PASSWORD}")
        print()
        print("⚠  Change the password immediately after first login.")

    except Exception as e:
        db.rollback()
        print(f"✗  Seed failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
