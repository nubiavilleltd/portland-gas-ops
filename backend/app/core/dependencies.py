from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.shared.dependencies import get_current_user, require_roles
from app.shared.models.user import User

# Re-export for clean imports in domain routers
__all__ = ["get_db", "get_current_user", "require_roles", "CurrentUser", "AdminUser"]

CurrentUser = Depends(get_current_user)

AdminUser = Depends(require_roles("super_admin", "admin"))