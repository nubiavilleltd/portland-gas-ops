import type { Order } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";
import { canCancelOrder } from "../guards/orders.guards";
import { AuditService } from "../../audit/services/audit.service";
import { CURRENT_ACTOR } from "../../audit/constants/current-actor";
import { TripsService } from "../../fleet/services/trips.service";
import { InvoicesService } from "../../invoices/services/invoice.services";

export async function cancelOrderWorkflow(order: Order, reason?: string): Promise<Order> {
    if (!canCancelOrder(order)) {
        throw new Error("This order cannot be cancelled in its current state");
    }

    const cancelled = await OrdersService.cancelOrder(order.id, reason);
    // If this order was on a trip, pull it out of that trip's order list
    if (order.trip_id) {
        await TripsService.removeOrderFromTrip(order.trip_id, order.id);
    }

    await InvoicesService.voidInvoice(order.id);

    await AuditService.record({
        entity_type: "order",
        entity_id: order.id,
        action: "cancelled",
        description: reason ? `Order cancelled: ${reason}` : "Order cancelled",
        actor: CURRENT_ACTOR,
    });

    return cancelled;
}