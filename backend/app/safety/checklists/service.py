import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.employees.models import Employee
from app.safety.checklists.models import (
    SafetyChecklistInputType,
    SafetyChecklistItem,
    SafetyChecklistParentType,
    SafetyChecklistResponse,
    SafetyChecklistStage,
    SafetyChecklistTemplate,
)
from app.safety.checklists.schemas import ChecklistAnswerCreate, ChecklistResponsesCreate
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


def get_current_employee(db: Session, current_user: User) -> Employee:
    employee = (
        db.query(Employee)
        .filter(Employee.user_id == current_user.id)
        .first()
    )
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not linked to an employee profile.",
        )
    return employee


def create_parent_responses(
    db: Session,
    data: ChecklistResponsesCreate,
    current_user: User,
) -> list[SafetyChecklistResponse]:
    employee = get_current_employee(db, current_user)
    add_parent_responses(
        db=db,
        data=data,
        answered_by=employee.id,
    )
    db.commit()

    return list_parent_responses(
        db=db,
        parent_type=data.parent_type,
        parent_id=data.parent_id,
    )


def add_parent_responses(
    db: Session,
    data: ChecklistResponsesCreate,
    answered_by: str,
) -> list[SafetyChecklistResponse]:
    item_ids = [answer.item_id for answer in data.answers]
    items = (
        db.query(SafetyChecklistItem)
        .options(
            joinedload(SafetyChecklistItem.template)
            .joinedload(SafetyChecklistTemplate.items)
        )
        .filter(SafetyChecklistItem.id.in_(item_ids))
        .all()
    )
    items_by_id = {item.id: item for item in items}
    missing_item_ids = [item_id for item_id in item_ids if item_id not in items_by_id]
    if missing_item_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist item not found: {missing_item_ids[0]}",
        )

    response_group_id = data.response_group_id or str(uuid.uuid4())
    validate_response_templates(data, items_by_id)
    responses: list[SafetyChecklistResponse] = []
    for answer in data.answers:
        item = items_by_id[answer.item_id]
        template = item.template
        validate_answer_value(item, answer)

        responses.append(
            SafetyChecklistResponse(
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
                parent_type=data.parent_type,
                parent_id=data.parent_id,
                response_group_id=response_group_id,
                value_boolean=answer.value_boolean,
                value_text=answer.value_text,
                value_number=answer.value_number,
                value_date=answer.value_date,
                value_datetime=answer.value_datetime,
                selected_option=answer.selected_option,
                comment=answer.comment,
                answered_by=answered_by,
            )
        )

    db.add_all(responses)
    db.flush()
    return responses


def validate_response_templates(
    data: ChecklistResponsesCreate,
    items_by_id: dict[str, SafetyChecklistItem],
) -> None:
    answered_item_ids = set(items_by_id.keys())
    templates_by_id = {
        item.template.id: item.template
        for item in items_by_id.values()
    }

    for item in items_by_id.values():
        template = item.template
        if not template.is_active:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Checklist template is inactive: {template.code}",
            )

        if template.parent_type != data.parent_type:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"Checklist item {item.item_key} does not belong to "
                    f"{data.parent_type.value}."
                ),
            )

    for template in templates_by_id.values():
        missing_required_items = [
            item.item_key
            for item in template.items
            if item.is_active and item.is_required and item.id not in answered_item_ids
        ]
        if missing_required_items:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Missing required checklist answer: "
                    f"{missing_required_items[0]}"
                ),
            )


def validate_answer_value(
    item: SafetyChecklistItem,
    answer: ChecklistAnswerCreate,
) -> None:
    value_by_input_type = {
        SafetyChecklistInputType.boolean: answer.value_boolean,
        SafetyChecklistInputType.text: answer.value_text,
        SafetyChecklistInputType.number: answer.value_number,
        SafetyChecklistInputType.date: answer.value_date,
        SafetyChecklistInputType.datetime: answer.value_datetime,
        SafetyChecklistInputType.enum: answer.selected_option,
    }
    value = value_by_input_type[item.input_type]
    has_value = value is not None and value != ""

    if item.is_required and not has_value:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Answer is required for checklist item: {item.item_key}",
        )

    if item.input_type == SafetyChecklistInputType.enum and has_value:
        option_values = normalize_option_values(item.options_json)
        if option_values and answer.selected_option not in option_values:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid option for checklist item: {item.item_key}",
            )


def normalize_option_values(options_json) -> set[str]:
    if not isinstance(options_json, list):
        return set()

    values: set[str] = set()
    for option in options_json:
        if isinstance(option, dict) and "value" in option:
            values.add(str(option["value"]))
        elif isinstance(option, str):
            values.add(option)
    return values
