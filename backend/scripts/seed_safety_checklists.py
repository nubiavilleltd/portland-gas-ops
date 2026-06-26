"""
Seed safety checklist templates.

Run from the backend directory:
    python3 scripts/seed_safety_checklists.py

The seed is idempotent: existing templates/items are updated in place and
removed seed items are deactivated instead of deleted.
"""

import os
import sys
from dataclasses import dataclass
from typing import Any


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.safety.checklists.models import (
    SafetyChecklistInputType,
    SafetyChecklistItem,
    SafetyChecklistParentType,
    SafetyChecklistStage,
    SafetyChecklistTemplate,
)
from app.employees.models import Employee  # noqa: F401 - needed for relationship resolution
from app.shared.models.document import Document  # noqa: F401 - needed for relationship resolution
from app.shared.models.user import User  # noqa: F401 - needed for relationship resolution


@dataclass(frozen=True)
class ChecklistItemSeed:
    id: str
    item_key: str
    label: str
    input_type: SafetyChecklistInputType
    options_json: Any
    is_required: bool
    sort_order: int
    default_value: str | None = None
    severity_weight: int | None = None


@dataclass(frozen=True)
class ChecklistTemplateSeed:
    id: str
    code: str
    name: str
    parent_type: SafetyChecklistParentType
    stage: SafetyChecklistStage
    description: str
    items: tuple[ChecklistItemSeed, ...]
    version: int = 1


TEMPLATES: tuple[ChecklistTemplateSeed, ...] = (
    ChecklistTemplateSeed(
        id="11111111-1111-1111-1111-111111111101",
        code="WA_RISK_ASSESSMENT",
        name="Work Authorization Risk Assessment",
        parent_type=SafetyChecklistParentType.work_authorization,
        stage=SafetyChecklistStage.risk_assessment,
        description="Risk indicators completed before work authorization.",
        items=(
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222101",
                item_key="gas_involved",
                label="Gas/CNG/LNG involved",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=10,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222102",
                item_key="pressurized_system",
                label="Pressurized system involved",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=20,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222103",
                item_key="heat_or_sparks",
                label="Heat, sparks, welding, cutting, or grinding",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=30,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222104",
                item_key="electrical_isolation",
                label="Electrical isolation required",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=40,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222105",
                item_key="lifting_equipment",
                label="Lifting/heavy equipment involved",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=50,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222106",
                item_key="ppe_available",
                label="All required PPE available",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=60,
            ),
        ),
    ),
    ChecklistTemplateSeed(
        id="11111111-1111-1111-1111-111111111102",
        code="WC_COMPLETION",
        name="Work Close-Out Completion Checks",
        parent_type=SafetyChecklistParentType.work_closeout,
        stage=SafetyChecklistStage.completion,
        description="Completion checks submitted by the requester.",
        items=(
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222201",
                item_key="work_completed",
                label="Was work completed?",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=10,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222202",
                item_key="completed_as_approved",
                label="Was work completed as approved?",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=20,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222203",
                item_key="incident_observed",
                label="Any incident, hazard, or near miss observed?",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=30,
            ),
        ),
    ),
    ChecklistTemplateSeed(
        id="11111111-1111-1111-1111-111111111103",
        code="WC_MONITORING",
        name="Work Close-Out Monitoring Checks",
        parent_type=SafetyChecklistParentType.work_closeout,
        stage=SafetyChecklistStage.monitoring,
        description="Monitoring and safety control attestations.",
        items=(
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222301",
                item_key="monitored_during_execution",
                label="Work was monitored during execution",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=10,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222302",
                item_key="stayed_within_scope",
                label="Work stayed within approved scope",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=20,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222303",
                item_key="ppe_and_controls_maintained",
                label="Required PPE and safety controls were maintained",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=30,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222304",
                item_key="unsafe_condition_addressed",
                label="Unsafe condition was reported/addressed if noticed",
                input_type=SafetyChecklistInputType.enum,
                options_json=[
                    {"value": "yes", "label": "Yes"},
                    {"value": "no", "label": "No"},
                    {"value": "not_applicable", "label": "N/A"},
                ],
                is_required=True,
                sort_order=40,
            ),
        ),
    ),
    ChecklistTemplateSeed(
        id="11111111-1111-1111-1111-111111111104",
        code="WC_AREA_CONDITION",
        name="Work Close-Out Area Condition",
        parent_type=SafetyChecklistParentType.work_closeout,
        stage=SafetyChecklistStage.closeout_review,
        description="Final work area and equipment condition checks.",
        items=(
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222401",
                item_key="work_area_cleaned",
                label="Work area cleaned after completion",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=10,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222402",
                item_key="tools_removed",
                label="Tools/equipment removed from work area",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=20,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222403",
                item_key="system_safe",
                label="Vehicle/equipment/system left in safe condition",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=30,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222404",
                item_key="remaining_hazard",
                label="Any remaining hazard?",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=40,
            ),
        ),
    ),
    ChecklistTemplateSeed(
        id="11111111-1111-1111-1111-111111111105",
        code="INCIDENT_HSE_REVIEW",
        name="Incident HSE Review Checks",
        parent_type=SafetyChecklistParentType.incident_hse_review,
        stage=SafetyChecklistStage.hse_review,
        description="HSE review checks completed before incident resolution or corrective action recommendation.",
        items=(
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222501",
                item_key="report_details_verified",
                label="Report details verified?",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=10,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222502",
                item_key="immediate_action_sufficient",
                label="Immediate action sufficient?",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=20,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222503",
                item_key="corrective_action_required",
                label="Corrective Action Required?",
                input_type=SafetyChecklistInputType.boolean,
                options_json=None,
                is_required=True,
                sort_order=30,
            ),
            ChecklistItemSeed(
                id="22222222-2222-2222-2222-222222222504",
                item_key="root_cause",
                label="Root Cause / Likely Cause",
                input_type=SafetyChecklistInputType.text,
                options_json=None,
                is_required=False,
                sort_order=40,
            ),
        ),
    ),
)


def upsert_template(db, seed: ChecklistTemplateSeed) -> None:
    template = (
        db.query(SafetyChecklistTemplate)
        .filter(
            SafetyChecklistTemplate.code == seed.code,
            SafetyChecklistTemplate.version == seed.version,
        )
        .first()
    )

    if template is None:
        template = SafetyChecklistTemplate(id=seed.id, code=seed.code, version=seed.version)
        db.add(template)

    template.name = seed.name
    template.parent_type = seed.parent_type
    template.stage = seed.stage
    template.description = seed.description
    template.is_active = True
    db.flush()

    active_keys = set()
    for item_seed in seed.items:
        active_keys.add(item_seed.item_key)
        item = (
            db.query(SafetyChecklistItem)
            .filter(
                SafetyChecklistItem.template_id == template.id,
                SafetyChecklistItem.item_key == item_seed.item_key,
            )
            .first()
        )
        if item is None:
            item = SafetyChecklistItem(
                id=item_seed.id,
                template_id=template.id,
                item_key=item_seed.item_key,
            )
            db.add(item)

        item.label = item_seed.label
        item.input_type = item_seed.input_type
        item.options_json = item_seed.options_json
        item.default_value = item_seed.default_value
        item.is_required = item_seed.is_required
        item.severity_weight = item_seed.severity_weight
        item.sort_order = item_seed.sort_order
        item.is_active = True

    (
        db.query(SafetyChecklistItem)
        .filter(
            SafetyChecklistItem.template_id == template.id,
            SafetyChecklistItem.item_key.notin_(active_keys),
        )
        .update({SafetyChecklistItem.is_active: False}, synchronize_session=False)
    )


def main() -> None:
    db = SessionLocal()
    try:
        for template_seed in TEMPLATES:
            upsert_template(db, template_seed)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    template_count = len(TEMPLATES)
    item_count = sum(len(template.items) for template in TEMPLATES)
    print(f"Seeded {template_count} safety checklist templates and {item_count} checklist items.")


if __name__ == "__main__":
    main()
