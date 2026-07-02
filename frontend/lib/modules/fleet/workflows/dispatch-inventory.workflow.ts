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
    if (!order?.orderItems) continue;
    for (const lineItem of order.orderItems) {
      const product = productMap.get(lineItem.productId);
      if (!product || isTracked(product)) continue;

      const stock = await InventoryService.getConsumableStockByProduct(lineItem.productId);
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
    if (!order?.orderItems) continue;
    const orderId = order.id;

    let trackedUnitsCount = 0;
    let trackedLineCount = 0;
    let consumableLineCount = 0;

    for (const lineItem of order.orderItems) {
      const product = productMap.get(lineItem.productId);
      if (!product) continue;

      if (isTracked(product)) {
        const itemIds = lineItem.inventoryItemIds ?? [];
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
          lineItem.productId,
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
