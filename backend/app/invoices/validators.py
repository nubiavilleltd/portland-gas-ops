from __future__ import annotations

from datetime import date


def validate_due_date(issued_date: date, due_date: date) -> date:
    if due_date < issued_date:
        raise ValueError("Due date must be on or after issued date")
    return due_date