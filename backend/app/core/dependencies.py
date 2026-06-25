from fastapi import Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User

# Re-export for clean imports in domain routers
__all__ = ["get_db", "get_current_user", "CurrentUser", "AdminUser"]

CurrentUser = Depends(get_current_user)

def require_roles(*roles: str):
    from app.middleware.auth import require_roles as _require_roles
    return Depends(_require_roles(*roles))

AdminUser = require_roles("super_admin", "admin")