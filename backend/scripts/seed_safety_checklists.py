"""Seed baseline safety checklist templates.

Run after migrations:
    cd backend
    source venv/bin/activate
    python scripts/seed_safety_checklists.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models import document, employee, user  # noqa: F401
from app.safety.checklists.models import (
    SafetyChecklistInputType,
    SafetyChecklistItem,
    SafetyChecklistParentType,
    SafetyChecklistStage,
    SafetyChecklistTemplate,
)


PASS_FAIL_NA = [
    {"value": "pass", "label": "Pass"},
    {"value": "fail", "label": "Fail"},
    {"value": "not_applicable", "label": "N/A"},
]


TEMPLATES = [
    {
        "code": "INCIDENT_REPORT_IMPACT",
        "name": "Incident Report Impact Checklist",
        "parent_type": SafetyChecklistParentType.incident_report,
        "stage": SafetyChecklistStage.risk_assessment,
        "version": 1,
        "description": "Reporter impact checks captured when raising an incident or hazard report.",
        "is_active": True,
        "items": [
            {
                "item_key": "anyone_injured",
                "label": "Was anyone injured?",
                "input_type": SafetyChecklistInputType.boolean,
                "default_value": "false",
                "is_required": True,
                "severity_weight": 5,
                "sort_order": 10,
            },
            {
                "item_key": "property_damaged",
                "label": "Was equipment/property damaged?",
                "input_type": SafetyChecklistInputType.boolean,
                "default_value": "false",
                "is_required": True,
                "severity_weight": 4,
                "sort_order": 20,
            },
            {
                "item_key": "gas_fire_environmental_concern",
                "label": "Is there gas/fire/environmental concern?",
                "input_type": SafetyChecklistInputType.boolean,
                "default_value": "false",
                "is_required": True,
                "severity_weight": 5,
                "sort_order": 30,
            },
        ],
    },
    {
        "code": "WORK_AUTH_RISK",
        "name": "Work Authorization Risk Assessment",
        "parent_type": SafetyChecklistParentType.work_authorization,
        "stage": SafetyChecklistStage.risk_assessment,
        "version": 1,
        "description": "Requester risk indicators before HSE inspection.",
        "is_active": True,
        "items": [
            {
                "item_key": "gas_involved",
                "label": "Is gas involved?",
                "input_type": SafetyChecklistInputType.boolean,
                "default_value": "false",
                "is_required": True,
                "severity_weight": 4,
                "sort_order": 10,
            },
            {
                "item_key": "hot_work",
                "label": "Will there be heat or sparks?",
                "input_type": SafetyChecklistInputType.boolean,
                "default_value": "false",
                "is_required": True,
                "severity_weight": 5,
                "sort_order": 20,
            },
            {
                "item_key": "gas_isolation_confirmed",
                "label": "Has gas isolation been confirmed?",
                "input_type": SafetyChecklistInputType.boolean,
                "default_value": "false",
                "is_required": True,
                "severity_weight": 5,
                "sort_order": 30,
            },
            {
                "item_key": "safety_note",
                "label": "Additional safety note",
                "input_type": SafetyChecklistInputType.text,
                "is_required": False,
                "sort_order": 40,
            },
        ],
    },
    {
        "code": "HSE_INSPECTION",
        "name": "HSE Inspection Checklist",
        "parent_type": SafetyChecklistParentType.work_authorization,
        "stage": SafetyChecklistStage.inspection,
        "version": 1,
        "description": "HSE pass/fail/N/A inspection before work execution.",
        "is_active": True,
        "items": [
            {
                "item_key": "work_area_safe",
                "label": "Work area safe?",
                "input_type": SafetyChecklistInputType.enum,
                "options_json": PASS_FAIL_NA,
                "is_required": True,
                "severity_weight": 5,
                "sort_order": 10,
            },
            {
                "item_key": "emergency_equipment_available",
                "label": "Emergency equipment available?",
                "input_type": SafetyChecklistInputType.enum,
                "options_json": PASS_FAIL_NA,
                "is_required": True,
                "severity_weight": 4,
                "sort_order": 20,
            },
            {
                "item_key": "gas_pressure_check_completed",
                "label": "Gas pressure check completed?",
                "input_type": SafetyChecklistInputType.enum,
                "options_json": PASS_FAIL_NA,
                "is_required": True,
                "severity_weight": 5,
                "sort_order": 30,
            },
            {
                "item_key": "inspection_comments",
                "label": "Inspection comments",
                "input_type": SafetyChecklistInputType.text,
                "is_required": False,
                "sort_order": 40,
            },
        ],
    },
    {
        "code": "CLOSEOUT_MONITORING",
        "name": "Closeout Monitoring Checklist",
        "parent_type": SafetyChecklistParentType.work_closeout,
        "stage": SafetyChecklistStage.monitoring,
        "version": 1,
        "description": "Completion and monitoring checks after authorized work.",
        "is_active": True,
        "items": [
            {
                "item_key": "work_completed",
                "label": "Was the work completed?",
                "input_type": SafetyChecklistInputType.boolean,
                "default_value": "false",
                "is_required": True,
                "severity_weight": 3,
                "sort_order": 10,
            },
            {
                "item_key": "completed_as_approved",
                "label": "Was work completed as approved?",
                "input_type": SafetyChecklistInputType.boolean,
                "default_value": "true",
                "is_required": True,
                "severity_weight": 4,
                "sort_order": 20,
            },
            {
                "item_key": "remaining_hazard",
                "label": "Any remaining hazard?",
                "input_type": SafetyChecklistInputType.boolean,
                "default_value": "false",
                "is_required": True,
                "severity_weight": 5,
                "sort_order": 30,
            },
            {
                "item_key": "completion_summary",
                "label": "Completion summary",
                "input_type": SafetyChecklistInputType.text,
                "is_required": True,
                "sort_order": 40,
            },
        ],
    },
    {
        "code": "INCIDENT_HSE_REVIEW",
        "name": "Incident HSE Review Checklist",
        "parent_type": SafetyChecklistParentType.incident_hse_review,
        "stage": SafetyChecklistStage.hse_review,
        "version": 1,
        "description": "Structured checks used during incident/hazard review.",
        "is_active": True,
        "items": [
            {
                "item_key": "root_cause_identified",
                "label": "Has root cause been identified?",
                "input_type": SafetyChecklistInputType.boolean,
                "default_value": "false",
                "is_required": True,
                "severity_weight": 4,
                "sort_order": 10,
            },
            {
                "item_key": "corrective_action_required",
                "label": "Is corrective action required?",
                "input_type": SafetyChecklistInputType.boolean,
                "default_value": "false",
                "is_required": True,
                "severity_weight": 5,
                "sort_order": 20,
            },
            {
                "item_key": "hse_review_notes",
                "label": "HSE review notes",
                "input_type": SafetyChecklistInputType.text,
                "is_required": False,
                "sort_order": 30,
            },
        ],
    },
]


def upsert_template(db, template_data):
    items = template_data.pop("items")
    template = (
        db.query(SafetyChecklistTemplate)
        .filter(
            SafetyChecklistTemplate.code == template_data["code"],
            SafetyChecklistTemplate.version == template_data["version"],
        )
        .first()
    )
    if template:
        for key, value in template_data.items():
            setattr(template, key, value)
        template.items.clear()
        db.flush()
    else:
        template = SafetyChecklistTemplate(**template_data)
        db.add(template)
        db.flush()

    for item_data in items:
        template.items.append(SafetyChecklistItem(**item_data))

    return template


def main():
    db = SessionLocal()
    try:
        for template_data in TEMPLATES:
            upsert_template(db, dict(template_data))
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
