from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

logger = logging.getLogger(__name__)
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import settings

# Import all models so SQLAlchemy can resolve relationship strings at startup
from app.models import user, employee, document, token, vendor  # noqa: F401
from app.domains.customers.model import Customer

from app.domains.customers.router import router as customers_router

from app.routers import (
    auth,
    users,
    employees,
    vendors,
    assets,
    safety,
    finance,
    hr,
    customers,
    orders,
    dashboard,
)

# Rate limiter — shared instance, routers import this
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Portland Gas Operations API",
    description="Internal ERP API for Portland Gas Limited",
    version="1.0.0",
    docs_url="/api/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT == "development" else None,
)

# Attach rate limiter state and handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
    # Extract first error for the main message, include all in details
    first = errors[0] if errors else {}
    field  = " → ".join(str(loc) for loc in first.get("loc", []) if loc != "body")
    msg    = first.get("msg", "Validation error")
    
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
    """
    Catch-all for unhandled exceptions.

    Why this exists:
      FastAPI's CORSMiddleware only adds headers to responses it processes normally.
      When an unhandled exception causes a 500, Starlette's default error handler
      returns a plain response BEFORE the CORS middleware can add its headers.
      The browser then sees no Access-Control-Allow-Origin and reports a CORS error —
      masking the real problem.

      This handler adds the CORS headers manually so the browser shows the actual
      HTTP status code and the real error can be debugged.
    """
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


app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(assets.router, prefix="/api/assets", tags=["Assets"])
app.include_router(safety.router, prefix="/api/safety", tags=["Safety"])
app.include_router(finance.router, prefix="/api/finance", tags=["Finance"])
app.include_router(hr.router, prefix="/api/hr", tags=["HR"])
# app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

# Customers routes
app.include_router(customers_router, prefix="/api/customers", tags=["Customers"])


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "app": "Portland Gas Operations API"}
