// import { OrdersService } from "../../orders/services/orders.service";
// import { InventoryService } from "../../inventory/services/inventory.service";
// import { ProductsService } from "../../products/services/products.service";
// import { isTracked } from "../../products/types/product.types";
// import type { Trip } from "../types/trip.types";

// const DEFAULT_LOCATION_ID = "loc-1";
// const RECORDED_BY = "System";

// export async function dispatchInventoryWorkflow(trip: Trip): Promise<void> {
//   if (trip.order_ids.length === 0) return; // orderless trip — nothing to do

//   for (const orderId of trip.order_ids) {
//     const order = await OrdersService.getOrderById(orderId);
//     if (!order?.order_items) continue;

//     for (const lineItem of order.order_items) {
//       const product = await ProductsService.getProductById(lineItem.product_id);
//       if (!product) continue;

//       if (isTracked(product)) {
//         // Tracked — check out the reserved units
//         const itemIds = lineItem.inventory_item_ids ?? [];
//         if (itemIds.length === 0) continue;

//         await InventoryService.checkOutItems({
//           item_ids: itemIds,
//           trip_id: trip.id,
//           disposition: lineItem.disposition ?? "sold",
//           recorded_by: RECORDED_BY,
//         });
//       } else {
//         // Consumable — decrement stock
//         await InventoryService.decrementConsumableStock(
//           lineItem.product_id,
//           DEFAULT_LOCATION_ID,
//           lineItem.quantity,
//           trip.id,
//           RECORDED_BY,
//         );
//       }
//     }
//   }
// }








import { OrdersService } from "../../orders/services/orders.service";
import { InventoryService } from "../../inventory/services/inventory.service";
import { ProductsService } from "../../products/services/products.service";
import { isTracked } from "../../products/types/product.types";
import type { Trip } from "../types/trip.types";
import { AuditService } from "../../audit/services/audit.service";
import { SYSTEM_ACTOR } from "../../audit/constants/current-actor";

const DEFAULT_LOCATION_ID = "loc-1";
const RECORDED_BY = "System";

export async function dispatchInventoryWorkflow(trip: Trip): Promise<void> {
  if (trip.order_ids.length === 0) return;

  for (const orderId of trip.order_ids) {
    const order = await OrdersService.getOrderById(orderId);
    if (!order?.order_items) continue;

    for (const lineItem of order.order_items) {
      const product = await ProductsService.getProductById(lineItem.product_id);
      if (!product) continue;

      if (isTracked(product)) {
        const itemIds = lineItem.inventory_item_ids ?? [];
        if (itemIds.length === 0) continue;

        await InventoryService.checkOutItems({
          item_ids: itemIds,
          trip_id: trip.id,
          disposition: lineItem.disposition ?? "sold",
          recorded_by: RECORDED_BY,
        });

        await AuditService.record({
          entity_type: "order",
          entity_id: orderId,
          action: "inventory_checked_out",
          description: `${itemIds.length} unit(s) of ${product.name} checked out for dispatch`,
          actor: SYSTEM_ACTOR,
        });
      } else {
        await InventoryService.decrementConsumableStock(
          lineItem.product_id,
          DEFAULT_LOCATION_ID,
          lineItem.quantity,
          trip.id,
          RECORDED_BY,
        );

        await AuditService.record({
          entity_type: "order",
          entity_id: orderId,
          action: "stock_decremented",
          description: `${lineItem.quantity} ${product.unit} of ${product.name} deducted from stock`,
          actor: SYSTEM_ACTOR,
        });
      }
    }
  }
}
