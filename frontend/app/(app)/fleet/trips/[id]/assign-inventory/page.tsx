// app/fleet/trips/[id]/assign-inventory/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Package } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

import { useTripById } from "@/lib/modules/fleet/hooks/useTrips";
import { useOrders } from "@/lib/modules/orders/hooks/useOrders";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import { useInventoryItems } from "@/lib/modules/inventory/hooks/useInventory";

import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";
import { getProductById } from "@/lib/modules/products/selectors/products.selectors";
import { getAvailableItems } from "@/lib/modules/inventory/selectors/inventory.selectors";
import { isTracked } from "@/lib/modules/products/types/product.types";
import { canAssignInventory } from "@/lib/modules/fleet/guards/trip.guards";

import { reserveItemsWorkflow } from "@/lib/modules/inventory/workflows/reserve.workflow";
import { TripsService } from "@/lib/modules/fleet/services/trips.service";
import { OrdersService } from "@/lib/modules/orders/services/orders.service";

import { FLEET_ROUTES } from "@/lib/modules/fleet/constants/routes";
import type { OrderLineItem } from "@/lib/modules/orders/schemas/create-order.schema";
import type { InventoryItem } from "@/lib/modules/inventory/types/inventory.types";

// ── Types ─────────────────────────────────────────────────
// Tracks selected unit IDs per order line item
// key: `${orderId}__${productId}`
type SelectionMap = Record<string, string[]>;

// ── Helper ────────────────────────────────────────────────
function lineItemKey(orderId: string, productId: string) {
  return `${orderId}__${productId}`;
}

// ── Sub-components ────────────────────────────────────────

function ConsumableLineItem({ productName }: { productName: string }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
      <CheckCircle
        size={15}
        className="shrink-0"
      />
      <span>
        <span className="font-medium">{productName}</span>
        {" — "}Consumable, no unit assignment needed
      </span>
    </div>
  );
}

interface TrackedLineItemProps {
  orderId: string;
  lineItem: OrderLineItem;
  productName: string;
  availableItems: InventoryItem[];
  selectedIds: string[];
  onToggle: (itemId: string) => void;
}

function TrackedLineItem({
  orderId,
  lineItem,
  productName,
  availableItems,
  selectedIds,
  onToggle,
}: TrackedLineItemProps) {
  const required = Math.ceil(lineItem.quantity);
  const selected = selectedIds.length;
  const fulfilled = selected >= required;

  return (
    <div className="border border-brand-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-brand-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package
            size={14}
            className="text-brand-text-secondary"
          />
          <span className="text-sm font-medium">{productName}</span>
          <span className="text-sm text-brand-text-secondary">
            × {required}
          </span>
        </div>
        <Badge
          variant={fulfilled ? "success" : "warning"}
          label={`${selected} of ${required} selected`}
        />
      </div>

      {/* Available units */}
      {availableItems.length === 0 ? (
        <div className="px-4 py-4 text-sm text-red-600">
          ⚠ No available units in stock for this product.
        </div>
      ) : (
        <div className="divide-y divide-brand-border">
          {availableItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <label
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  isSelected ? "bg-brand-purple/5" : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(item.id)}
                  className="accent-brand-purple"
                />
                <div className="flex-1 text-sm">
                  <span className="font-medium">{item.tag_number}</span>
                  {item.serial_number && (
                    <span className="text-brand-text-secondary ml-2">
                      SN: {item.serial_number}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      item.condition === "new"
                        ? "success"
                        : item.condition === "refurbished"
                          ? "info"
                          : item.condition === "used"
                            ? "neutral"
                            : "danger"
                    }
                    label={item.condition}
                  />
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function AssignInventoryPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { trip, isLoading: tripLoading } = useTripById(id);
  const { orders, isLoading: ordersLoading } = useOrders();
  const { products, isLoading: productsLoading } = useProducts();
  const { items, isLoading: itemsLoading } = useInventoryItems();

  const [selection, setSelection] = useState<SelectionMap>({});
  const [isSubmitting, setSubmitting] = useState(false);

  const isLoading =
    tripLoading || ordersLoading || productsLoading || itemsLoading;

  // ── Loading ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <AppLayout pageTitle="Assign Inventory">
        <p className="text-brand-text-secondary">Loading…</p>
      </AppLayout>
    );
  }

  // ── Not found ────────────────────────────────────────────
  if (!trip) {
    return (
      <AppLayout pageTitle="Trip Not Found">
        <p className="text-brand-text-secondary">Trip not found.</p>
      </AppLayout>
    );
  }

  // ── Guard ─────────────────────────────────────────────────
  if (!canAssignInventory(trip)) {
    return (
      <AppLayout pageTitle="Cannot Assign Inventory">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
          <h2 className="font-semibold mb-2">
            Inventory Assignment Unavailable
          </h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            This trip is not awaiting inventory assignment. Current status:{" "}
            <strong>{trip.status}</strong>
          </p>
          <Button
            variant="outline"
            href={FLEET_ROUTES.tripDetail(id)}
          >
            Back to Trip
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ── No orders on this trip ────────────────────────────────
  if (trip.order_ids.length === 0) {
    return (
      <AppLayout pageTitle="Assign Inventory">
        <p className="text-brand-text-secondary">
          This trip has no linked orders.
        </p>
      </AppLayout>
    );
  }

  // ── Derive trip orders ────────────────────────────────────
  const tripOrders = trip.order_ids
    .map((oid) => getOrderById(orders, oid))
    .filter(Boolean);

  // ── Toggle handler ────────────────────────────────────────
  function handleToggle(
    orderId: string,
    productId: string,
    itemId: string,
    required: number,
  ) {
    const key = lineItemKey(orderId, productId);
    const current = selection[key] ?? [];
    const isSelected = current.includes(itemId);

    if (isSelected) {
      // Deselect
      setSelection((prev) => ({
        ...prev,
        [key]: current.filter((id) => id !== itemId),
      }));
    } else {
      // Select — enforce max = required
      if (current.length >= required) {
        toast.warning(
          `You can only select ${required} unit(s) for this line item`,
        );
        return;
      }
      setSelection((prev) => ({
        ...prev,
        [key]: [...current, itemId],
      }));
    }
  }

  // ── Validation ────────────────────────────────────────────
  function isAllAssigned(): boolean {
    for (const order of tripOrders) {
      if (!order?.order_items) continue;
      for (const lineItem of order.order_items) {
        const product = getProductById(products, lineItem.product_id);
        if (!product || !isTracked(product)) continue;
        const key = lineItemKey(order.id, lineItem.product_id);
        const selected = selection[key]?.length ?? 0;
        const required = Math.ceil(lineItem.quantity);
        if (selected < required) return false;
      }
    }
    return true;
  }

  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit() {
    if (!isAllAssigned()) {
      toast.error("Please assign all required units before proceeding");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Reserve each selected group of items + update order line items
      for (const order of tripOrders) {
        if (!order?.order_items) continue;
        for (const lineItem of order.order_items) {
          const product = getProductById(products, lineItem.product_id);
          if (!product || !isTracked(product)) continue;

          const key = lineItemKey(order.id, lineItem.product_id);
          const itemIds = selection[key] ?? [];
          if (itemIds.length === 0) continue;

          // Reserve the items
          await reserveItemsWorkflow({
            item_ids: itemIds,
            order_id: order.id,
            recorded_by: "Warehouse Staff",
          });

          // Update order line item with assigned inventory IDs
          await OrdersService.updateOrderLineItem(
            order.id,
            lineItem.product_id,
            itemIds,
          );
        }
      }

      // 2. Mark trip as ready
      await TripsService.setReady(id);

      toast.success("Inventory assigned — trip is ready to dispatch");
      router.push(FLEET_ROUTES.tripDetail(id));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to assign inventory",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <AppLayout pageTitle="Assign Inventory">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Trip
      </button>

      <PageHeader
        title="Assign Inventory"
        description="Select the specific units to send out for each tracked line item"
        className="mb-6"
      />

      <div className="space-y-8 max-w-2xl">
        {tripOrders.map((order) => {
          if (!order) return null;

          return (
            <div
              key={order.id}
              className="bg-white border border-brand-border rounded-2xl"
            >
              {/* Order header */}
              <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
                <h2 className="text-sm font-semibold text-brand-text-primary">
                  {order.order_number}
                </h2>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  {order.customer_name}
                </p>
              </div>

              {/* Line items */}
              <div className="p-6 space-y-4">
                {order.order_items?.map((lineItem) => {
                  const product = getProductById(products, lineItem.product_id);
                  if (!product) return null;

                  if (!isTracked(product)) {
                    return (
                      <ConsumableLineItem
                        key={lineItem.product_id}
                        productName={product.name}
                      />
                    );
                  }

                  const available = getAvailableItems(
                    items,
                    lineItem.product_id,
                  );
                  const key = lineItemKey(order.id, lineItem.product_id);
                  const selectedIds = selection[key] ?? [];

                  return (
                    <TrackedLineItem
                      key={lineItem.product_id}
                      orderId={order.id}
                      lineItem={lineItem}
                      productName={product.name}
                      availableItems={available}
                      selectedIds={selectedIds}
                      onToggle={(itemId) =>
                        handleToggle(
                          order.id,
                          lineItem.product_id,
                          itemId,
                          Math.ceil(lineItem.quantity),
                        )
                      }
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Actions */}
        <div className="flex items-center justify-between pb-10">
          <p className="text-sm text-brand-text-secondary">
            {isAllAssigned()
              ? "✓ All tracked items assigned"
              : "Assign all tracked items to continue"}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              loadingText="Saving…"
              disabled={!isAllAssigned()}
            >
              Confirm & Mark Ready
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
