"""Run non-critical side effects only after a successful database commit."""

import logging
from collections.abc import Callable

from sqlalchemy import event as sa_event
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def queue_after_commit(
    db: Session,
    callback: Callable[[Session], None],
    *,
    description: str = "post-commit task",
) -> None:
    """Run ``callback`` once after commit, using a fresh database session."""

    state = {"cancelled": False}

    @sa_event.listens_for(db, "after_soft_rollback", once=True)
    def _cancel(_session: Session, _previous_transaction: object) -> None:
        state["cancelled"] = True

    @sa_event.listens_for(db, "after_commit", once=True)
    def _run(_session: Session) -> None:
        if state["cancelled"]:
            return

        from app.core.database import SessionLocal

        fresh_db = SessionLocal()
        try:
            callback(fresh_db)
        except Exception:
            logger.exception("Failed %s", description)
        finally:
            fresh_db.close()
