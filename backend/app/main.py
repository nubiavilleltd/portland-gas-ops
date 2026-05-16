from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.routers import (
    auth,
    users,
    approvals,
    procurement,
    vendors,
    fleet,
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
app.include_router(approvals.router, prefix="/api/approvals", tags=["Approvals"])
app.include_router(procurement.router, prefix="/api/procurement", tags=["Procurement"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(fleet.router, prefix="/api/fleet", tags=["Fleet"])
app.include_router(assets.router, prefix="/api/assets", tags=["Assets"])
app.include_router(safety.router, prefix="/api/safety", tags=["Safety"])
app.include_router(finance.router, prefix="/api/finance", tags=["Finance"])
app.include_router(hr.router, prefix="/api/hr", tags=["HR"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "app": "Portland Gas Operations API"}
