from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.shared.dependencies import get_current_user
from app.shared.models.user import User

# TODO: Create GasOrder, Invoice models/schemas

router = APIRouter()


@router.get("/")
def list_orders(skip: int = 0, limit: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"items": [], "total": 0}


@router.post("/")
def create_order(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"message": "Order created (stub)"}


@router.get("/{item_id}")
def get_order(item_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"id": item_id, "message": "Order detail (stub)"}


@router.put("/{item_id}")
def update_order(item_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"id": item_id, "message": "Order updated (stub)"}


@router.delete("/{item_id}")
def delete_order(item_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"message": "Order deactivated (stub)"}
