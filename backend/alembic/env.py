from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import sys
import os

# Add backend root to path so app imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.database import Base

# Import all models so Alembic can detect them
from app.shared.models import approval, document, reference_counter, token, user  # noqa: F401
from app.employees import models as _employee_models  # noqa: F401
from app.vendors import models as _vendor_models  # noqa: F401
from app.assets import models as _asset_models  # noqa: F401
from app.procurement import models as _procurement_models  # noqa: F401
from app.products.model import Product    # noqa: F401
from app.customers.model import Customer 
from app.safety.checklists import models as _safety_checklist_models  # noqa: F401
from app.safety.incidents import models as _safety_incident_models  # noqa: F401
from app.safety.work_initiations import models as _safety_work_initiation_models  # noqa: F401
from app.safety.work_authorizations import models as _safety_work_authorization_models  # noqa: F401

config = context.config

# Override sqlalchemy.url from settings (reads .env)
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
