from __future__ import annotations

from app.inventory.schema import (
    InventoryItemResponse,
    ConsumableStockResponse,
    StockMovementResponse,
    ConsumableStockDetailResponse,
)


def _product_fields(product) -> dict:
    """
    Extract the fields we surface about a product on inventory responses.
    """
    if not product:
        return {
            "product_no": None,
            "product_name": None,
            "sku": None,
            "tag_prefix": None,
            "unit_label": None,
            "unit_code": None,
        }
    unit = getattr(product, "unit", None)
    return {
        "product_no": product.product_no,
        "product_name": product.name,
        "sku": product.code,
        "tag_prefix": product.tag_prefix,
        "unit_label": unit.label if unit else None,
        "unit_code": unit.code if unit else None,
    }


def inventory_item_to_response(item) -> InventoryItemResponse:
    response = InventoryItemResponse.model_validate(item)

    for key, value in _product_fields(item.product).items():
        setattr(response, key, value)

    response.location_name = (
        item.location.name if item.location else None
    )

    response.customer_name = (
        item.customer.name if item.customer else None
    )

    response.order_no = (
        item.order.order_no if item.order else None
    )

    response.trip_no = (
        item.trip.trip_no if item.trip else None
    )

    return response


def consumable_stock_to_response(
    stock,
) -> ConsumableStockResponse:

    response = ConsumableStockResponse.model_validate(stock)

    for key, value in _product_fields(stock.product).items():
        setattr(response, key, value)

    response.location_name = (
        stock.location.name if stock.location else None
    )

    return response


def stock_movement_to_response(
    movement,
) -> StockMovementResponse:

    response = StockMovementResponse.model_validate(movement)

    response.product_name = (
        movement.product.name
        if movement.product
        else None
    )

    response.location_name = (
        movement.location.name
        if movement.location
        else None
    )

    response.item_ids = getattr(
        movement,
        "_item_ids",
        [item.inventory_item_id for item in movement.items],
    )

    return response


def consumable_stock_detail_to_response(
    stock,
    movements,
) -> ConsumableStockDetailResponse:

    response = ConsumableStockDetailResponse(
        **consumable_stock_to_response(stock).model_dump(),
        movements=[
            stock_movement_to_response(m)
            for m in movements
        ],
    )

    return response