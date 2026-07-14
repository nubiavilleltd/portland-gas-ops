"""
Employee service — handles all employee + user creation/management.

Onboarding flow:
  1. IT admin calls POST /api/employees
  2. We create a User (is_verified=True, account_status=pending, random temp password)
  3. We create an Employee linked to that user
  4. We generate a setup_token (stored on the User row) and email the employee a setup link
  5. Employee clicks link → POST /auth/setup-account → sets password → account_status=active
"""

import secrets
import string
from sqlalchemy.orm import Session, joinedload, contains_eager
from sqlalchemy import func, extract, or_, and_
from fastapi import HTTPException, status, UploadFile
from datetime import datetime, timedelta, timezone, date as date_type

from app.shared.models.user import User, UserRole, AccountStatus
from app.shared.models.document import Document
from app.employees.models import Employee
from app.core.security import hash_password
from app.shared.services.cloudinary_service import upload
from app.shared.services.email_service import send_account_setup
from app.employees.schemas import EmployeeCreate, EmployeeUpdate, EmployeeProfileUpdate
from app.core.config import settings


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _next_employee_no(db: Session) -> str:
    """Auto-generate the next PG-EMP-XXXX number."""
    last = (
        db.query(Employee.employee_no)
        .order_by(Employee.created_at.desc())
        .first()
    )
    if last:
        try:
            num = int(last[0].split("-")[-1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"PG-EMP-{num:04d}"


def _random_temp_password(length: int = 32) -> str:
    """Generate an unguessable temporary password the employee never sees."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _generate_setup_token() -> str:
    """URL-safe 48-char random token stored on the user row."""
    return secrets.token_urlsafe(36)   # 36 bytes → 48-char base64url


# ─── Create Employee (IT admin) ───────────────────────────────────────────────

def create_employee(data: EmployeeCreate, db: Session) -> Employee:
    # 1. Check email not already taken
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email is already registered.")

    # 2. Create user (account_status=pending, is_verified=True since IT controls the email)
    try:
        role = UserRole(data.role)
    except ValueError:
        role = UserRole.staff

    user = User(
        first_name      = data.first_name,
        last_name       = data.last_name,
        name            = f"{data.first_name} {data.last_name}",   # legacy compat
        email           = data.email,
        hashed_password = hash_password(_random_temp_password()),
        role            = role,
        account_status  = AccountStatus.pending,
    )
    db.add(user)
    db.flush()   # get user.id without committing

    # 3. Create employee record
    employee_no = _next_employee_no(db)
    employee = Employee(
        user_id         = user.id,
        employee_no     = employee_no,
        job_title       = data.job_title,
        department      = data.department,
        phone           = data.phone,
        birthday        = data.birthday,
        employment_type = data.employment_type,
        hire_date       = data.hire_date,
        operating_manager_id = data.operating_manager_id,
        basic_salary        = data.basic_salary,
        housing_allowance   = data.housing_allowance,
        transport_allowance = data.transport_allowance,
        meal_allowance      = data.meal_allowance,
        paye                = data.paye,
        pension             = data.pension,
        nhf                 = data.nhf,
        loan_repayment      = data.loan_repayment,
    )
    db.add(employee)

    # 4. Generate setup token (stored on user row, 72-hour window)
    token      = _generate_setup_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=72)
    user.setup_token            = token
    user.setup_token_expires_at = expires_at
    db.commit()
    db.refresh(employee)

    # 5. Send setup email
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    setup_link   = f"{frontend_url}/setup-account?user_id={user.id}&token={token}"
    send_account_setup(
        to_email   = user.email,
        first_name = user.first_name or user.full_name,
        setup_link = setup_link,
        employee_no= employee_no,
    )

    return (
        db.query(Employee)
        .options(
            joinedload(Employee.user).joinedload(User.profile_picture),
            joinedload(Employee.operating_manager).joinedload(Employee.user).joinedload(User.profile_picture),
        )
        .filter(Employee.id == employee.id)
        .first()
    )


# ─── List Employees ───────────────────────────────────────────────────────────

def list_employees(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: str = "",
    department: str = "",
) -> list[Employee]:
    q = db.query(Employee).options(
        joinedload(Employee.user),
        joinedload(Employee.operating_manager).joinedload(Employee.user),
    )

    if search:
        like = f"%{search}%"
        q = q.join(Employee.user).filter(
            User.first_name.ilike(like) |
            User.last_name.ilike(like)  |
            User.email.ilike(like)      |
            Employee.employee_no.ilike(like) |
            Employee.job_title.ilike(like)
        )

    if department:
        q = q.filter(Employee.department == department)

    return q.order_by(Employee.created_at.desc()).offset(skip).limit(limit).all()


def count_employees(db: Session, search: str = "", department: str = "") -> int:
    q = db.query(func.count(Employee.id))
    if search:
        like = f"%{search}%"
        q = q.join(Employee.user).filter(
            User.first_name.ilike(like) |
            User.last_name.ilike(like)  |
            User.email.ilike(like)      |
            Employee.employee_no.ilike(like)
        )
    if department:
        q = q.filter(Employee.department == department)
    return q.scalar()


# ─── Get single employee ──────────────────────────────────────────────────────

def get_employee(employee_id: str, db: Session) -> Employee:
    emp = (
        db.query(Employee)
        .options(
            joinedload(Employee.user).joinedload(User.profile_picture),
            joinedload(Employee.operating_manager).joinedload(Employee.user).joinedload(User.profile_picture),
        )
        .filter(Employee.id == employee_id)
        .first()
    )
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


def get_employee_by_user_id(user_id: str, db: Session) -> Employee:
    emp = (
        db.query(Employee)
        .options(
            joinedload(Employee.user).joinedload(User.profile_picture),
            joinedload(Employee.operating_manager).joinedload(Employee.user).joinedload(User.profile_picture),
        )
        .filter(Employee.user_id == user_id)
        .first()
    )
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return emp


# ─── Update Employee (admin) ──────────────────────────────────────────────────

def update_employee(employee_id: str, data: EmployeeUpdate, db: Session) -> Employee:
    emp = get_employee(employee_id, db)

    for field, value in data.model_dump(exclude_unset=True).items():
        # first_name / last_name go on the User record
        if field in ("first_name", "last_name"):
            setattr(emp.user, field, value)
            emp.user.name = f"{emp.user.first_name or ''} {emp.user.last_name or ''}".strip()
        else:
            setattr(emp, field, value)

    db.commit()
    db.refresh(emp)
    return emp


# ─── Document folder helpers ──────────────────────────────────────────────────

def _get_or_create_folder(name: str, parent_id: int | None, db: Session) -> Document:
    """Return an existing folder or create it. Matched by name + parent."""
    folder = (
        db.query(Document)
        .filter(
            Document.type == "folder",
            Document.name == name,
            Document.parent_id == parent_id,
        )
        .first()
    )
    if not folder:
        folder = Document(type="folder", name=name, parent_id=parent_id)
        db.add(folder)
        db.flush()
    return folder


def _get_employee_folder(employee_no: str, db: Session) -> Document:
    """
    Return (or create) the folder path:  Employees / PG-EMP-XXXX
    The employee_no is used as the folder name — it's stable and unique.
    """
    root   = _get_or_create_folder("Employees", None, db)
    folder = _get_or_create_folder(employee_no, root.id, db)
    return folder


# ─── Profile picture upload ───────────────────────────────────────────────────

def update_profile_picture(employee_id: str, user_id: str, file: UploadFile, db: Session) -> Employee:
    ALLOWED = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in ALLOWED:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP or GIF images are allowed.")

    file_bytes = file.file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB.")

    emp = get_employee(employee_id, db)

    url = upload(file_bytes, public_id=f"profile_{user_id}", folder="portland-gas/profile-pictures", resource_type="image")

    # Place file inside  Employees / PG-EMP-XXXX /
    folder = _get_employee_folder(emp.employee_no, db)

    doc = Document(
        type="file",
        name="profile-picture",
        category="profile",
        file_path=url,
        file_size=len(file_bytes),
        mime_type=file.content_type,
        uploaded_by=employee_id,
        parent_id=folder.id,
    )
    db.add(doc)
    db.flush()
    emp.user.profile_picture_id = doc.id
    db.commit()
    db.refresh(emp)
    return emp


# ─── Self-update (employee) ───────────────────────────────────────────────────

def update_own_profile(employee_id: str, data: EmployeeProfileUpdate, db: Session) -> Employee:
    emp = get_employee(employee_id, db)
    if data.phone is not None:
        emp.phone = data.phone
    if data.profile_picture_id is not None:
        emp.user.profile_picture_id = data.profile_picture_id
    db.commit()
    db.refresh(emp)
    return emp


# ─── Change Role ──────────────────────────────────────────────────────────────

def change_employee_role(employee_id: str, role: str, db: Session) -> Employee:
    try:
        new_role = UserRole(role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {role}")
    emp = get_employee(employee_id, db)
    emp.user.role = new_role
    db.commit()
    db.refresh(emp)
    return emp


# ─── Deactivate / Reactivate ──────────────────────────────────────────────────

def deactivate_employee(employee_id: str, db: Session) -> dict:
    emp = get_employee(employee_id, db)
    emp.user.account_status = AccountStatus.deactivated
    db.commit()
    return {"message": f"{emp.user.full_name}'s account has been deactivated."}


def reactivate_employee(employee_id: str, db: Session) -> dict:
    emp = get_employee(employee_id, db)
    emp.user.account_status = AccountStatus.active
    db.commit()
    return {"message": f"{emp.user.full_name}'s account has been reactivated."}


# ─── Resend setup email ───────────────────────────────────────────────────────

def resend_setup_email(employee_id: str, db: Session) -> dict:
    emp = get_employee(employee_id, db)

    if emp.user.account_status != AccountStatus.pending:
        raise HTTPException(status_code=400, detail="Account is already active.")

    # Rotate setup token
    token      = _generate_setup_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=72)
    emp.user.setup_token            = token
    emp.user.setup_token_expires_at = expires_at
    db.commit()

    frontend_url = settings.FRONTEND_URL.rstrip("/")
    setup_link   = f"{frontend_url}/setup-account?user_id={emp.user_id}&token={token}"
    send_account_setup(
        to_email   = emp.user.email,
        first_name = emp.user.first_name or emp.user.full_name,
        setup_link = setup_link,
        employee_no= emp.employee_no,
    )
    return {"message": "Setup email resent."}


# ─── Employee Documents ───────────────────────────────────────────────────────

def list_employee_documents(employee_id: str, db: Session) -> list[Document]:
    """Return all (non-profile) files inside this employee's document folder."""
    emp = get_employee(employee_id, db)

    employees_root = (
        db.query(Document)
        .filter(Document.type == "folder", Document.name == "Employees", Document.parent_id == None)
        .first()
    )
    if not employees_root:
        return []

    emp_folder = (
        db.query(Document)
        .filter(
            Document.type == "folder",
            Document.name == emp.employee_no,
            Document.parent_id == employees_root.id,
        )
        .first()
    )
    if not emp_folder:
        return []

    return (
        db.query(Document)
        .filter(
            Document.parent_id == emp_folder.id,
            Document.type == "file",
            Document.category != "profile",   # exclude profile picture
        )
        .order_by(Document.created_at.desc())
        .all()
    )


def upload_employee_document(
    employee_id: str,
    uploader_employee_id: str,
    file: UploadFile,
    doc_type: str,
    db: Session,
) -> Document:
    """Upload a file to Cloudinary, store it in the employee's document folder."""
    ALLOWED_MIME = {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg", "image/png", "image/webp",
    }
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    file_bytes = file.file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File must be under 10 MB.")

    emp = get_employee(employee_id, db)
    folder = _get_employee_folder(emp.employee_no, db)

    import time
    public_id = f"{emp.employee_no}_{int(time.time())}"
    url = upload(file_bytes, public_id, folder="portland-gas/employee-documents", resource_type="raw", overwrite=False)

    doc = Document(
        type         = "file",
        name         = file.filename or public_id,
        category     = doc_type,
        file_path    = url,
        file_size    = len(file_bytes),
        mime_type    = file.content_type,
        uploaded_by  = uploader_employee_id,
        parent_id    = folder.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def delete_employee_document(employee_id: str, doc_id: int, db: Session) -> dict:
    """Remove a document from the employee's folder."""
    emp = get_employee(employee_id, db)
    doc = db.query(Document).filter(Document.id == doc_id, Document.type == "file").first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted."}


# ── Birthday week query ────────────────────────────────────────────────────────

def get_week_birthdays(db: Session) -> list[dict]:
    """
    Returns employees whose birthday (month + day) falls within today through
    today + 6 days. Handles year-end wrap-around correctly.
    Only includes active and pending accounts with a birthday set.
    """
    today = date_type.today()

    # Build OR conditions for each of the 7 days
    conditions = []
    for i in range(7):
        d = today + timedelta(days=i)
        conditions.append(and_(
            extract("month", Employee.birthday) == d.month,
            extract("day",   Employee.birthday) == d.day,
        ))

    rows = (
        db.query(Employee)
        .join(Employee.user)
        .options(joinedload(Employee.user).joinedload(User.profile_picture))
        .filter(
            Employee.birthday.isnot(None),
            User.account_status.in_([AccountStatus.active, AccountStatus.pending]),
            or_(*conditions),
        )
        .all()
    )

    results = []
    for emp in rows:
        bday = emp.birthday
        # Find the next occurrence of this birthday on or after today
        this_year = bday.replace(year=today.year)
        if this_year < today:
            this_year = bday.replace(year=today.year + 1)
        days_until = (this_year - today).days

        name = emp.user.full_name if emp.user else ""
        dept = emp.department.value if emp.department else None
        avatar = emp.user.profile_picture_url if emp.user else None

        results.append({
            "employee_id": emp.id,
            "name":        name,
            "department":  dept,
            "avatar_url":  avatar,
            "days_until":  days_until,
        })

    # Sort by days_until so Today comes first
    results.sort(key=lambda r: r["days_until"])
    return results
