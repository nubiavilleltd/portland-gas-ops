from __future__ import annotations
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.audit.model import AuditLog
from app.audit.schema import AuditLogCreate, AuditEntityType, AuditActorType


class AuditService:

    @staticmethod
    def record(
        db:                Session,
        entity_type:       AuditEntityType,
        entity_id:         str,
        action:            str,
        description:       str,
        actor_type:        AuditActorType = AuditActorType.system,
        actor_employee_id: Optional[str]  = None,
        actor_name:        Optional[str]  = None,
        metadata:          Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Append an audit log entry. Called from any domain service or router.
        Uses db.flush() — caller's db.commit() makes it permanent.
        If the parent transaction rolls back, audit entry rolls back too.
        This is intentional — we never want orphaned audit entries.
        """
        entry = AuditLog(
            entity_type       = entity_type,
            entity_id         = entity_id,
            action            = action,
            description       = description,
            actor_type        = actor_type,
            actor_employee_id = actor_employee_id,
            actor_name        = actor_name,
            metadata_         = metadata,
        )
        db.add(entry)
        db.flush()
        return entry

    @staticmethod
    def get_by_entity(
        db:          Session,
        entity_type: AuditEntityType,
        entity_id:   str,
    ) -> List[AuditLog]:
        return (
            db.query(AuditLog)
            .filter(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id   == entity_id,
            )
            .order_by(AuditLog.created_at.asc())
            .all()
        )

    @staticmethod
    def get_all(db: Session, limit: int = 200) -> List[AuditLog]:
        return (
            db.query(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
            .all()
        )