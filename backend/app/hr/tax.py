"""
Statutory deduction calculator.

Deliberately pure: it takes earnings and a rule set, and returns the figures
plus the working. No database, no ORM, no I/O — so it can be tested against
worked examples from finance without standing anything up.

Order matters and is the part most easily got wrong: pension and NHF are
deducted from gross BEFORE consolidated relief, and relief is deducted before
the bands are applied. Changing that sequence silently skews every payslip.

Everything is Decimal. Floats accumulate error across a payroll run, and these
figures are filed with a tax authority.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

MONTHS_PER_YEAR = Decimal(12)
ZERO = Decimal("0")


def _money(value: Decimal) -> Decimal:
    """Round to whole units, matching what the payslip shows."""
    return value.quantize(Decimal("1"), rounding=ROUND_HALF_UP)


@dataclass
class Earnings:
    """One employee's monthly earnings."""

    basic: Decimal = ZERO
    housing: Decimal = ZERO
    transport: Decimal = ZERO
    meal: Decimal = ZERO

    @property
    def gross(self) -> Decimal:
        return self.basic + self.housing + self.transport + self.meal


@dataclass
class BandCharge:
    """What one PAYE band contributed, for showing the working."""

    sequence: int
    rate: Decimal
    width: Optional[Decimal]
    amount_taxed: Decimal
    tax: Decimal


@dataclass
class DeductionResult:
    # Monthly figures — what lands on the payslip
    pension: Decimal = ZERO
    nhf: Decimal = ZERO
    paye: Decimal = ZERO

    # The working, annualised
    annual_gross: Decimal = ZERO
    annual_pension: Decimal = ZERO
    annual_nhf: Decimal = ZERO
    consolidated_relief: Decimal = ZERO
    taxable_income: Decimal = ZERO
    annual_tax: Decimal = ZERO
    bands: list[BandCharge] = field(default_factory=list)

    @property
    def total(self) -> Decimal:
        return self.pension + self.nhf + self.paye


def _contribution_base(earnings: Earnings, cfg, prefix: str) -> Decimal:
    """Sum the components a contribution applies to, per the config's flags."""
    total = ZERO
    for component in ("basic", "housing", "transport", "meal"):
        if getattr(cfg, f"{prefix}_includes_{component}"):
            total += getattr(earnings, component)
    return total


def compute_statutory_deductions(earnings: Earnings, cfg) -> DeductionResult:
    """
    Monthly pension, NHF and PAYE for one employee under one rule set.

    ``cfg`` is anything carrying the TaxConfig fields — the ORM row, or a stub
    in a test. Nothing is read from the database here.

    Returns zeroes when there is no pay, so an employee with no salary recorded
    does not produce a spurious tax charge.
    """
    result = DeductionResult()
    if earnings.gross <= ZERO:
        return result

    # 1. Contributions, from the components the config says they apply to.
    result.pension = _money(Decimal(cfg.pension_rate) * _contribution_base(earnings, cfg, "pension"))
    result.nhf = _money(Decimal(cfg.nhf_rate) * _contribution_base(earnings, cfg, "nhf"))

    # 2. Annualise. PAYE bands are published annually.
    result.annual_gross = earnings.gross * MONTHS_PER_YEAR
    result.annual_pension = result.pension * MONTHS_PER_YEAR
    result.annual_nhf = result.nhf * MONTHS_PER_YEAR

    # 3. Consolidated relief: higher of a floor or a share of gross, plus more.
    result.consolidated_relief = (
        max(Decimal(cfg.cra_minimum), Decimal(cfg.cra_gross_percent) * result.annual_gross)
        + Decimal(cfg.cra_additional_percent) * result.annual_gross
    )

    # 4. Taxable income — contributions and relief come off first.
    result.taxable_income = max(
        ZERO,
        result.annual_gross
        - result.annual_pension
        - result.annual_nhf
        - result.consolidated_relief,
    )

    # 5. Walk the bands. A band with no width takes the whole remainder, so any
    #    income above the last finite band is still taxed.
    remaining = result.taxable_income
    annual_tax = ZERO
    for band in sorted(cfg.bands, key=lambda b: b.sequence):
        if remaining <= ZERO:
            break
        width = None if band.width is None else Decimal(band.width)
        slice_ = remaining if width is None else min(remaining, width)
        charge = slice_ * Decimal(band.rate)
        annual_tax += charge
        remaining -= slice_
        result.bands.append(
            BandCharge(
                sequence=band.sequence,
                rate=Decimal(band.rate),
                width=width,
                amount_taxed=slice_,
                tax=_money(charge),
            )
        )

    result.annual_tax = annual_tax
    result.paye = _money(annual_tax / MONTHS_PER_YEAR)
    return result
