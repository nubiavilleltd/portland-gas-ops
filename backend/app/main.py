from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import (
    auth,
    users,
    approvals,
    procurement,
    fleet,
    assets,
    safety,
    finance,
    hr,
    customers,
    orders,
    dashboard,
)

app = FastAPI(
    title="Portland Gas Operations API",
    description="Internal ERP API for Portland Gas Limited",
    version="1.0.0",
    docs_url="/api/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT == "development" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(approvals.router, prefix="/api/approvals", tags=["Approvals"])
app.include_router(procurement.router, prefix="/api/procurement", tags=["Procurement"])
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
