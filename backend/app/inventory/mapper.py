from app.inventory.schema import (
    InventoryItemResponse,
    ConsumableStockResponse,
    StockMovementResponse,
    ConsumableStockDetailResponse,
)



def inventory_item_to_response(item) -> InventoryItemResponse:
    response = InventoryItemResponse.model_validate(item)

    response.product_name = (
        item.product.name if item.product else None
    )

    response.product_code = (
        item.product.code if item.product else None
    )

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

    response.product_name = (
        stock.product.name if stock.product else None
    )

    response.product_code = (
        stock.product.code if stock.product else None
    )

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