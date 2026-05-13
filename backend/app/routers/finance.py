from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User

# TODO: Create Budget, Expense models/schemas

router = APIRouter()


@router.get("/budgets")
def list_budgets(skip: int = 0, limit: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"items": [], "total": 0}


@router.post("/budgets")
def create_budget(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"message": "Budget created (stub)"}


@router.get("/expenses")
def list_expenses(skip: int = 0, limit: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"items": [], "total": 0}


@router.get("/expenses/{item_id}")
def get_expense(item_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"id": item_id, "message": "Expense detail (stub)"}


@router.post("/expenses")
def create_expense(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"message": "Expense created (stub)"}


@router.put("/expenses/{item_id}")
def update_expense(item_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"id": item_id, "message": "Expense updated (stub)"}


@router.delete("/expenses/{item_id}")
def delete_expense(item_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"message": "Expense deactivated (stub)"}


@router.get("/reports")
def get_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # TODO: Aggregate financial summary reports
    return {"message": "Reports (stub)"}
