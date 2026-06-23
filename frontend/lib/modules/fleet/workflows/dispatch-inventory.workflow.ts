// import { OrdersService } from "../../orders/services/orders.service";
// import { InventoryService } from "../../inventory/services/inventory.service";
// import { ProductsService } from "../../products/services/products.service";
// import { isTracked } from "../../products/types/product.types";
// import type { Trip } from "../types/trip.types";
// import { AuditService } from "../../audit/services/audit.service";
// import { SYSTEM_ACTOR } from "../../audit/constants/current-actor";

// const DEFAULT_LOCATION_ID = "loc-1";
// const RECORDED_BY = "System";

// export async function dispatchInventoryWorkflow(trip: Trip): Promise<void> {
//   if (trip.order_ids.length === 0) return;

//    const orders = await Promise.all(
//     trip.order_ids.map((id) => OrdersService.getOrderById(id))
//   );

//   const products = await ProductsService.getProducts()
//   const productMap = new Map(products.map((p) => [p.id, p]));

//     for (const order of orders) {
//     if (!order?.order_items) continue;

//     for (const lineItem of order.order_items) {
//       // const product = products.find((p) => p.id === lineItem.product_id);
//       const product = productMap.get(lineItem.product_id);
//       if (!product || isTracked(product)) continue;

//       const stock = await InventoryService.getConsumableStockByProduct(lineItem.product_id);
//       const available = stock?.quantity ?? 0;

//       if (available < lineItem.quantity) {
//         throw new Error(
//           `Insufficient ${product.name} stock. Available: ${available} ${product.unit}, Required: ${lineItem.quantity} ${product.unit}`
//         );
//       }
//     }
//   }

//   for (const order of orders) {
//     if (!order?.order_items) continue;

//     const orderId = order.id;

//     for (const lineItem of order.order_items) {
//       const product = productMap.get(lineItem.product_id);
//       if (!product) continue;

//       if (isTracked(product)) {
//         const itemIds = lineItem.inventory_item_ids ?? [];
//         if (itemIds.length === 0) continue;

//         await InventoryService.checkOutItems({
//           item_ids: itemIds,
//           trip_id: trip.id,
//           disposition: lineItem.disposition ?? "sold",
//           recorded_by: RECORDED_BY,
//         });

//         await AuditService.record({
//           entity_type: "order",
//           entity_id: orderId,
//           action: "inventory_checked_out",
//           description: `${itemIds.length} unit(s) of ${product.name} checked out for dispatch`,
//           actor: SYSTEM_ACTOR,
//         });
//       } else {
//         await InventoryService.decrementConsumableStock(
//           lineItem.product_id,
//           DEFAULT_LOCATION_ID,
//           lineItem.quantity,
//           trip.id,
//           RECORDED_BY,
//         );

//         await AuditService.record({
//           entity_type: "order",
//           entity_id: orderId,
//           action: "stock_decremented",
//           description: `${lineItem.quantity} ${product.unit} of ${product.name} deducted from stock`,
//           actor: SYSTEM_ACTOR,
//         });
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

  const orders = await Promise.all(
    trip.order_ids.map((id) => OrdersService.getOrderById(id))
  );
  const products = await ProductsService.getProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  // ── VALIDATION PASS — unchanged ──────────────────────────
  for (const order of orders) {
    if (!order?.order_items) continue;
    for (const lineItem of order.order_items) {
      const product = productMap.get(lineItem.product_id);
      if (!product || isTracked(product)) continue;

      const stock = await InventoryService.getConsumableStockByProduct(lineItem.product_id);
      const available = stock?.quantity ?? 0;

      if (available < lineItem.quantity) {
        throw new Error(
          `Insufficient ${product.name} stock. Available: ${available} ${product.unit}, Required: ${lineItem.quantity} ${product.unit}`
        );
      }
    }
  }

  // ── EXECUTION PASS — one summary audit entry per order ───
  for (const order of orders) {
    if (!order?.order_items) continue;
    const orderId = order.id;

    let trackedUnitsCount = 0;
    let trackedLineCount = 0;
    let consumableLineCount = 0;

    for (const lineItem of order.order_items) {
      const product = productMap.get(lineItem.product_id);
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

        trackedUnitsCount += itemIds.length;
        trackedLineCount += 1;
      } else {
        await InventoryService.decrementConsumableStock(
          lineItem.product_id,
          DEFAULT_LOCATION_ID,
          lineItem.quantity,
          trip.id,
          RECORDED_BY,
        );

        consumableLineCount += 1;
      }
    }

    // ── One condensed entry per order, regardless of line count ──
    const parts: string[] = [];
    if (trackedUnitsCount > 0) {
      parts.push(`${trackedUnitsCount} tracked item(s) across ${trackedLineCount} product(s) checked out`);
    }
    if (consumableLineCount > 0) {
      parts.push(`${consumableLineCount} consumable product(s) deducted`);
    }

    if (parts.length > 0) {
      await AuditService.record({
        entity_type: "order",
        entity_id: orderId,
        action: "inventory_dispatched",
        description: parts.join(" · "),
        actor: SYSTEM_ACTOR,
      });
    }
  }
}
