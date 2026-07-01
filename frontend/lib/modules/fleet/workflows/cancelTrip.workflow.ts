import type { Trip } from "../types/trip.types";
import { TripsService } from "../services/trips.service";
import { OrdersService } from "../../orders/services/orders.service";
import { isTracked, Product } from "../../products/types/product.types";
import { canCancelTrip } from "../guards/trip.guards";
import { releaseItemsWorkflow } from "../../inventory/workflows/release.workflow";
import { AuditService } from "../../audit/services/audit.service";
import { CURRENT_ACTOR } from "../../audit/constants/current-actor";
import { ProductsService } from "../../products/services/products.service";

export async function cancelTripWorkflow(trip: Trip, reason?: string): Promise<Trip> {
    if (!canCancelTrip(trip)) {
        throw new Error("This trip cannot be cancelled in its current state");
    }

    // Release any reserved tracked inventory across all orders on this trip
    for (const orderId of trip.order_ids) {
        const order = await OrdersService.getOrderById(orderId);
        if (!order?.orderItems) continue;

        for (const lineItem of order.orderItems) {
            const product = await ProductsService.getProductById(lineItem.productId);
            if (!product || !isTracked(product)) continue;

            const itemIds = lineItem.inventoryItemIds ?? [];
            if (itemIds.length > 0) {
                await releaseItemsWorkflow({ item_ids: itemIds, recorded_by: "System" });
            }
        }
    }

    const cancelled = await TripsService.cancelTrip(trip.id, reason);

    await AuditService.record({
        entity_type: "trip",
        entity_id: trip.id,
        action: "cancelled",
        description: reason ? `Trip cancelled: ${reason}` : "Trip cancelled",
        actor: CURRENT_ACTOR,
    });

    for (const orderId of trip.order_ids) {
        await AuditService.record({
            entity_type: "order",
            entity_id: orderId,
            action: "removed_from_trip",
            description: `Order returned to dispatch queue — trip ${trip.trip_number} was cancelled`,
            actor: CURRENT_ACTOR,
        });
    }

    return cancelled;
}