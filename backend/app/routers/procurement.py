from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.procurement import ProcurementRequest
from app.schemas.procurement import ProcurementCreate, ProcurementUpdate, ProcurementResponse
from app.utils.helpers import generate_reference

router = APIRouter()


@router.get("/", response_model=List[ProcurementResponse])
def list_procurement(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ProcurementRequest)
        .filter(ProcurementRequest.is_active == True)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/", response_model=ProcurementResponse, status_code=status.HTTP_201_CREATED)
def create_procurement(
    data: ProcurementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    request = ProcurementRequest(
        **data.dict(),
        reference=generate_reference("PRQ"),
        created_by=current_user.id,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.get("/{item_id}", response_model=ProcurementResponse)
def get_procurement(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ProcurementRequest).filter(ProcurementRequest.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Procurement request not found")
    return item


@router.put("/{item_id}", response_model=ProcurementResponse)
def update_procurement(
    item_id: str,
    data: ProcurementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ProcurementRequest).filter(ProcurementRequest.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Procurement request not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_procurement(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ProcurementRequest).filter(ProcurementRequest.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Procurement request not found")
    item.is_active = False
    db.commit()
    return {"message": "Deleted successfully"}
