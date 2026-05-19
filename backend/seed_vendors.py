"""
Seed script — creates sample vendors for the procurement module.

Run after alembic upgrade head:
    python seed_vendors.py

Safe to run multiple times — skips vendors that already exist by name.
These are representative Nigerian companies used for demo/testing purposes.
"""

import sys
from dotenv import load_dotenv

load_dotenv()

from app.database import SessionLocal
from app.models import user, procurement  # noqa: F401 — register all mappers before use
from app.models.vendor import Vendor, VendorCategory, VendorStatus

VENDORS = [
    {
        "name": "Joffre Engineering & Gas Services Ltd",
        "category": VendorCategory.equipment,
        "contact_person": "Emeka Okonkwo",
        "phone": "+234 802 345 6789",
        "email": "sales@joffre.com.ng",
        "address": "14 Aba Road, Port Harcourt, Rivers State",
        "bank_name": "First Bank of Nigeria",
        "account_name": "Joffre Engineering & Gas Services Ltd",
        "account_number": "2034567890",
    },
    {
        "name": "Sacofa Safety & PPE Solutions",
        "category": VendorCategory.ppe,
        "contact_person": "Fatima Usman",
        "phone": "+234 803 456 7890",
        "email": "info@sacofa.ng",
        "address": "Plot 7B, Wuse Zone 5, Abuja, FCT",
        "bank_name": "GTBank",
        "account_name": "Sacofa Safety & PPE Solutions",
        "account_number": "0123456789",
    },
    {
        "name": "TechParts Nigeria Limited",
        "category": VendorCategory.technical,
        "contact_person": "Chukwudi Eze",
        "phone": "+234 806 789 0123",
        "email": "procurement@techpartsnigeria.com",
        "address": "22 Apapa Road, Lagos Island, Lagos",
        "bank_name": "Zenith Bank",
        "account_name": "TechParts Nigeria Limited",
        "account_number": "1023456789",
    },
    {
        "name": "ProOffice Supplies & Stationery",
        "category": VendorCategory.consumables,
        "contact_person": "Ngozi Adebayo",
        "phone": "+234 807 890 1234",
        "email": "orders@prooffice.ng",
        "address": "5 Allen Avenue, Ikeja, Lagos",
        "bank_name": "Access Bank",
        "account_name": "ProOffice Supplies & Stationery",
        "account_number": "0987654321",
    },
    {
        "name": "Mama Tee Catering & Welfare Services",
        "category": VendorCategory.food_beverage,
        "contact_person": "Theresa Okafor",
        "phone": "+234 808 901 2345",
        "email": "mamatee.catering@gmail.com",
        "address": "Victoria Island, Lagos",
        "bank_name": "UBA",
        "account_name": "Theresa Okafor",
        "account_number": "2100987654",
    },
    {
        "name": "Greenfield Maintenance & Contractors",
        "category": VendorCategory.services,
        "contact_person": "Abubakar Suleiman",
        "phone": "+234 809 012 3456",
        "email": "ops@greenfieldmaintenance.com.ng",
        "address": "Plot 44, Trans Amadi Industrial Layout, Port Harcourt",
        "bank_name": "Stanbic IBTC",
        "account_name": "Greenfield Maintenance & Contractors",
        "account_number": "0012345678",
    },
    {
        "name": "NetSphere IT Solutions",
        "category": VendorCategory.it,
        "contact_person": "Oluwaseun Adeyemi",
        "phone": "+234 810 123 4567",
        "email": "sales@netsphere.ng",
        "address": "3rd Floor, Bishop Aboyade Cole St, Victoria Island, Lagos",
        "bank_name": "Fidelity Bank",
        "account_name": "NetSphere IT Solutions",
        "account_number": "5012345678",
    },
    {
        "name": "Swifthaul Logistics & Transport",
        "category": VendorCategory.logistics,
        "contact_person": "Yusuf Musa",
        "phone": "+234 811 234 5678",
        "email": "bookings@swifthaul.ng",
        "address": "Km 12 Badagry Expressway, Lagos",
        "bank_name": "Polaris Bank",
        "account_name": "Swifthaul Logistics & Transport",
        "account_number": "4023456789",
    },
]


def seed():
    db = SessionLocal()
    try:
        created = 0
        skipped = 0
        for v in VENDORS:
            existing = db.query(Vendor).filter(Vendor.name == v["name"]).first()
            if existing:
                skipped += 1
                continue

            vendor = Vendor(
                **v,
                status=VendorStatus.active,
                is_active=True,
            )
            db.add(vendor)
            created += 1

        db.commit()
        print(f"✓  Vendors seeded: {created} created, {skipped} already existed.")

    except Exception as e:
        db.rollback()
        print(f"✗  Vendor seed failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
