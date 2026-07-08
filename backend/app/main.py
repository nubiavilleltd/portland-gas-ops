from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

logger = logging.getLogger(__name__)
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings

# Import all models so SQLAlchemy can resolve relationships at startup
from app.shared.models import approval, document, reference_counter, token, user  # noqa: F401
# approval.py now contains all workflow engine models (ApprovalWorkflow, WorkflowStep,
# ApprovalRequest, ApprovalHistory, WorkflowAuditTrail, AllRequest, Notification, etc.)
from app.employees import models as _employee_models  # noqa: F401
from app.vendors import models as _vendor_models  # noqa: F401
from app.assets import models as _asset_models  # noqa: F401
from app.procurement import models as _procurement_models  # noqa: F401
from app.customers import model as _customer_models  # noqa: F401
from app.products import model as _product_models  # noqa: F401
from app.safety.checklists import models as _safety_checklist_models  # noqa: F401
from app.safety.incidents import models as _safety_incident_models  # noqa: F401
from app.safety.work_initiations import models as _safety_work_initiation_models  # noqa: F401
from app.safety.work_authorizations import models as _safety_work_authorization_models  # noqa: F401
from app.orders.model import Order, OrderItem    # noqa: F401
from app.invoices.model import Invoice           # noqa: F401
from app.payments.model import Payment           # noqa: F401
from app.audit.model import AuditLog                          # noqa: F401
from app.inventory.model import (                             # noqa: F401
    WarehouseLocation, InventoryItem, ConsumableStock,
    StockMovement, StockMovementItem, OrderItemInventory,
)

from app.fleet.drivers.model import Driver # noqa: F401
from app.fleet.vehicles.model import Vehicle # noqa: F401
from app.fleet.trips.model import Trip, TripOrder  # noqa: F401



from app.shared.workflow.router import router as workflow_router
from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.employees.router import router as employees_router
from app.vendors.router import router as vendors_router
from app.assets.router import router as assets_router
from app.safety.router import router as safety_router
from app.customers.router import router as customers_router
from app.procurement.router import router as procurement_router
from app.products.router import router as products_router
from app.orders.router import router as orders_router
from app.invoices.router import router as invoices_router
from app.payments.router import router as payments_router
from app.audit.router import router as audit_router
from app.inventory.router import router as inventory_router
from app.fleet.drivers.router import router as drivers_router
from app.fleet.vehicles.router import router as vehicles_router
from app.fleet.trips.router import router as trips_router



limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Portland Gas Operations API",
    description="Internal ERP API for Portland Gas Limited",
    version="1.0.0",
    docs_url="/api/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT == "development" else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Convert Pydantic's 422 validation errors into our standard error envelope.
    This means the frontend always receives the same shape: {error_code, message, details}.
    """
    errors = exc.errors()
    first = errors[0] if errors else {}
    field = " → ".join(str(loc) for loc in first.get("loc", []) if loc != "body")
    msg   = first.get("msg", "Validation error")

    return JSONResponse(
        status_code=422,
        content={
            "detail": {
                "error_code": "VALIDATION_ERROR",
                "message": f"{field}: {msg}" if field else msg,
                "details": {"errors": errors},
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    allowed = settings.ALLOWED_ORIGINS
    logger.exception("Unhandled server error on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check server logs for details."},
        headers={
            "Access-Control-Allow-Origin": origin if origin in allowed else (allowed[0] if allowed else "*"),
            "Access-Control-Allow-Credentials": "true",
        },
    )


app.include_router(workflow_router, prefix="/api/workflow", tags=["Workflow Engine"])
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(employees_router, prefix="/api/employees", tags=["Employees"])
app.include_router(vendors_router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(assets_router, prefix="/api/assets", tags=["Assets"])
app.include_router(safety_router, prefix="/api/safety", tags=["Safety"])
app.include_router(customers_router, prefix="/api/customers", tags=["Customers"])
app.include_router(procurement_router, prefix="/api/procurement", tags=["Procurement"])

# Products routes
app.include_router(products_router, prefix="/api/products", tags=["Products"])

app.include_router(orders_router,   prefix="/api/orders",   tags=["Orders"])
app.include_router(invoices_router, prefix="/api/invoices", tags=["Invoices"])
app.include_router(payments_router, prefix="/api/payments", tags=["Payments"])
app.include_router(audit_router,     prefix="/api/audit",     tags=["Audit"])
app.include_router(inventory_router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(drivers_router, prefix="/api/fleet/drivers", tags=["Drivers"])
app.include_router(vehicles_router, prefix="/api/fleet/vehicles", tags=["Vehicles"])
app.include_router(trips_router, prefix="/api/fleet/trips", tags=["Trips"])


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "app": "Portland Gas Operations API"}
