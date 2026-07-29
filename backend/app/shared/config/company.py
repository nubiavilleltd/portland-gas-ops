from __future__ import annotations

from dataclasses import dataclass
from app.core.config import settings



@dataclass(frozen=True)
class CompanyInfo:
    name: str
    tagline: str
    address: str
    phone: str
    email: str
    website: str
    logo_url: str


@dataclass(frozen=True)
class CompanyBankDetails:
    bank_name: str
    account_name: str
    account_number: str



COMPANY_INFO = CompanyInfo(
    name="Portland Gas Limited",
    tagline="Clean Energy | CNG | LPG | EV Charging",
    address="2B Water Corporation Road, Victoria Island, Lagos",
    phone="+234 (0) 800 PORTLAND",
    email="info@portlandgasltd.com",
    website="www.portlandgasltd.com",
    logo_url=settings.LOGO_URL,
)

COMPANY_BANK_DETAILS = CompanyBankDetails(
    bank_name="GTBank",
    account_name="Portland Gas Limited",
    account_number="0123456789",
)