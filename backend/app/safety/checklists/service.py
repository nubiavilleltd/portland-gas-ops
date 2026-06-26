import uuid
from typing import Iterable

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.safety.checklists.models import (
    SafetyChecklistInputType,
    SafetyChecklistItem,
    SafetyChecklistParentType,
    SafetyChecklistResponse,
    SafetyChecklistStage,
    SafetyChecklistTemplate,
)
from app.safety.checklists.schemas import ChecklistAnswerCreate
from app.shared.models.user import User


def get_active_template(
    db: Session,
    parent_type: SafetyChecklistParentType,
    stage: SafetyChecklistStage,
) -> SafetyChecklistTemplate:
    template = (
        db.query(SafetyChecklistTemplate)
        .options(joinedload(SafetyChecklistTemplate.items))
        .filter(
            SafetyChecklistTemplate.parent_type == parent_type,
            SafetyChecklistTemplate.stage == stage,
            SafetyChecklistTemplate.is_active == True,
        )
        .order_by(SafetyChecklistTemplate.version.desc())
        .first()
    )
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist template not found",
        )
    return template


def list_parent_responses(
    db: Session,
    parent_type: SafetyChecklistParentType,
    parent_id: str,
) -> list[SafetyChecklistResponse]:
    return (
        db.query(SafetyChecklistResponse)
        .filter(
            SafetyChecklistResponse.parent_type == parent_type,
            SafetyChecklistResponse.parent_id == parent_id,
        )
        .order_by(
            SafetyChecklistResponse.stage_snapshot.asc(),
            SafetyChecklistResponse.sort_order_snapshot.asc(),
            SafetyChecklistResponse.created_at.asc(),
        )
        .all()
    )


def save_parent_responses(
    db: Session,
    parent_type: SafetyChecklistParentType,
    parent_id: str,
    stage: SafetyChecklistStage,
    answers: Iterable[ChecklistAnswerCreate],
    current_user: User,
    response_group_id: str | None = None,
) -> list[SafetyChecklistResponse]:
    answers = list(answers)
    if not answers:
        return []

    template = get_active_template(db, parent_type, stage)
    item_by_id = {item.id: item for item in template.items if item.is_active}
    group_id = response_group_id or str(uuid.uuid4())
    responses: list[SafetyChecklistResponse] = []

    for answer in answers:
        item = item_by_id.get(answer.item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Checklist item does not belong to active {stage.value} template",
            )
        _validate_answer(item, answer)

        response = SafetyChecklistResponse(
            template_id=template.id,
            template_code_snapshot=template.code,
            template_name_snapshot=template.name,
            template_version=template.version,
            stage_snapshot=template.stage.value,
            item_id=item.id,
            item_key_snapshot=item.item_key,
            label_snapshot=item.label,
            input_type_snapshot=item.input_type.value,
            options_json_snapshot=item.options_json,
            is_required_snapshot=item.is_required,
            sort_order_snapshot=item.sort_order,
            parent_type=parent_type,
            parent_id=parent_id,
            response_group_id=group_id,
            value_boolean=answer.value_boolean,
            value_text=answer.value_text,
            value_number=answer.value_number,
            value_date=answer.value_date,
            value_datetime=answer.value_datetime,
            selected_option=answer.selected_option,
            comment=answer.comment,
            answered_by=current_user.id,
        )
        db.add(response)
        responses.append(response)

    return responses


def _validate_answer(item: SafetyChecklistItem, answer: ChecklistAnswerCreate) -> None:
    if item.is_required and not _has_value(item, answer):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{item.label} is required",
        )

    if item.input_type == SafetyChecklistInputType.enum:
        allowed_values = _option_values(item.options_json)
        if answer.selected_option and allowed_values and answer.selected_option not in allowed_values:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{answer.selected_option} is not valid for {item.label}",
            )


def _has_value(item: SafetyChecklistItem, answer: ChecklistAnswerCreate) -> bool:
    if item.input_type == SafetyChecklistInputType.boolean:
        return answer.value_boolean is not None
    if item.input_type == SafetyChecklistInputType.enum:
        return bool(answer.selected_option)
    if item.input_type == SafetyChecklistInputType.text:
        return bool(answer.value_text)
    if item.input_type == SafetyChecklistInputType.number:
        return answer.value_number is not None
    if item.input_type == SafetyChecklistInputType.date:
        return answer.value_date is not None
    if item.input_type == SafetyChecklistInputType.datetime:
        return answer.value_datetime is not None
    return False


def _option_values(options_json) -> set[str]:
    if not isinstance(options_json, list):
        return set()
    values = set()
    for option in options_json:
        if isinstance(option, dict) and option.get("value"):
            values.add(str(option["value"]))
        elif isinstance(option, str):
            values.add(option)
    return values
