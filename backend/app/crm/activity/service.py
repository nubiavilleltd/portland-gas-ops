from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.crm.activity.model import CRMActivityLog
from app.crm.activity.schemas import (
    CRMActivityActorType,
    CRMActivityEntityType,
)


class CRMActivityService:

    @staticmethod
    def record(
        db: Session,
        customer_id: str,
        entity_type: CRMActivityEntityType,
        entity_id: str,
        action: str,
        description: str,
        actor_type: CRMActivityActorType = CRMActivityActorType.employee,
        actor_employee_id: Optional[str] = None,
        actor_name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> CRMActivityLog:
        """
        Records a CRM activity.

        Uses db.flush() so the caller controls the transaction.
        If the caller rolls back, the activity log also rolls back.
        """

        activity = CRMActivityLog(
            customer_id=customer_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            description=description,
            actor_type=actor_type,
            actor_employee_id=actor_employee_id,
            actor_name=actor_name,
            metadata_=metadata,
        )

        db.add(activity)
        db.flush()

        return activity

    @staticmethod
    def get_customer_activity(
        db: Session,
        customer_id: str,
    ) -> List[CRMActivityLog]:
        """
        Returns the activity timeline for a customer.
        """

        return (
            db.query(CRMActivityLog)
            .filter(CRMActivityLog.customer_id == customer_id)
            .order_by(CRMActivityLog.created_at.desc())
            .all()
        )

    @staticmethod
    def get_entity_activity(
        db: Session,
        entity_type: CRMActivityEntityType,
        entity_id: str,
    ) -> List[CRMActivityLog]:
        """
        Returns activity for a specific CRM entity.
        Useful for contacts, complaints, visits, etc.
        """

        return (
            db.query(CRMActivityLog)
            .filter(
                CRMActivityLog.entity_type == entity_type,
                CRMActivityLog.entity_id == entity_id,
            )
            .order_by(CRMActivityLog.created_at.desc())
            .all()
        )

    @staticmethod
    def get_all(
        db: Session,
        limit: int = 200,
    ) -> List[CRMActivityLog]:
        """
        Returns the latest CRM activity.
        """

        return (
            db.query(CRMActivityLog)
            .order_by(CRMActivityLog.created_at.desc())
            .limit(limit)
            .all()
        )