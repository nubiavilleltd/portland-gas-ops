"""
Seed the first tax configuration from the rules already in use.

The rates below are lifted verbatim from calcDeductions() in the employee
forms, so payroll keeps behaving exactly as it does today once it starts
reading the config. They reflect the PRE-2026 regime and are a starting point,
not advice: Nigeria's Tax Act 2025 took effect January 2026, so finance should
confirm and correct them in Admin > Setups > Tax & Statutory Deductions.

Idempotent — running it twice does not create a second config.

    cd backend && venv/bin/python scripts/seed_tax_config.py
"""
import sys
from datetime import date
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import app.main  # noqa: F401  (registers every model mapping)
from app.core.database import SessionLocal
from app.hr.models import TaxConfig, TaxBand

NAME = "Nigeria PAYE — as previously applied"
EFFECTIVE_FROM = date(2020, 1, 1)  # far enough back to cover every payslip on record

BANDS = [
    # (width, rate) — width is the size of the band, None means the remainder
    (Decimal("300000"), Decimal("0.07")),
    (Decimal("300000"), Decimal("0.11")),
    (Decimal("500000"), Decimal("0.15")),
    (Decimal("500000"), Decimal("0.19")),
    (Decimal("1600000"), Decimal("0.21")),
    (None, Decimal("0.24")),
]


def main() -> int:
    db = SessionLocal()
    try:
        existing = db.query(TaxConfig).filter(TaxConfig.name == NAME).first()
        if existing:
            print(f"Already seeded: {existing.name} (effective {existing.effective_from})")
            print(f"  bands: {len(existing.bands)}")
            return 0

        config = TaxConfig(
            name=NAME,
            effective_from=EFFECTIVE_FROM,
            is_active=True,
            notes=(
                "Seeded from the calculation previously hardcoded in the employee "
                "forms, to preserve existing behaviour. Reflects the pre-2026 "
                "regime — confirm against the Tax Act 2025 before relying on it."
            ),
            pension_rate=Decimal("0.08"),
            pension_includes_basic=True,
            pension_includes_housing=True,
            pension_includes_transport=True,
            pension_includes_meal=False,
            nhf_rate=Decimal("0.025"),
            nhf_includes_basic=True,
            nhf_includes_housing=False,
            nhf_includes_transport=False,
            nhf_includes_meal=False,
            cra_minimum=Decimal("200000"),
            cra_gross_percent=Decimal("0.01"),
            cra_additional_percent=Decimal("0.20"),
        )
        for i, (width, rate) in enumerate(BANDS, start=1):
            config.bands.append(TaxBand(sequence=i, width=width, rate=rate))

        db.add(config)
        db.commit()
        print(f"Seeded: {config.name} (effective {config.effective_from})")
        for b in config.bands:
            span = f"{b.width:,.0f}" if b.width is not None else "remainder"
            print(f"  band {b.sequence}: {span:>12}  @ {float(b.rate) * 100:.0f}%")
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
