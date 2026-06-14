// app/fleet/trips/[id]/assign-inventory/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, CheckCircle, Package } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

import { useTripById } from "@/lib/modules/fleet/hooks/useTrips";
import { useOrders } from "@/lib/modules/orders/hooks/useOrders";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import { useInventoryItems } from "@/lib/modules/inventory/hooks/useInventory";
import { useAssignInventoryWorkflow } from "@/lib/modules/fleet/hooks/useAssignInventoryWorkflow";

import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";
import { getAvailableItems } from "@/lib/modules/inventory/selectors/inventory.selectors";
import { isTracked } from "@/lib/modules/products/types/product.types";
import { canAssignInventory } from "@/lib/modules/fleet/guards/trip.guards";
import InventoryUnitPickerModal from "@/components/ui/InventoryUnitPickerModal";

import { FLEET_ROUTES } from "@/lib/modules/fleet/constants/routes";
import type { InventoryItem } from "@/lib/modules/inventory/types/inventory.types";
import { Trip } from "@/lib/modules/fleet/types/trip.types";
import { OrderLineItem } from "@/lib/modules/orders/types/orders.types";
import { INVENTORY_ROUTES } from "@/lib/modules/inventory/constants/routes";
import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";

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
  const assignInventory = useAssignInventoryWorkflow();

  const { trip, isLoading: tripLoading } = useTripById(id);
  const { orders, isLoading: ordersLoading } = useOrders();
  const { products, isLoading: productsLoading } = useProducts();
  const { customers, isLoading: customersLoading } = useCustomers();
  const { items, isLoading: itemsLoading } = useInventoryItems();

  const [selection, setSelection] = useState<SelectionMap>({});
  const [activePicker, setActivePicker] = useState<{
    orderId: string;
    productId: string;
    productName: string;
    required: number;
  } | null>(null);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));

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

  // Add this before isAllAssigned:
  function getTrackedLineItems() {
    return tripOrders.flatMap((order) =>
      (order?.order_items ?? [])
        .filter((lineItem) => {
          const product = productMap.get(lineItem.product_id);
          return product && isTracked(product);
        })
        .map((lineItem) => ({
          order: order!,
          lineItem,
          product: productMap.get(lineItem.product_id)!,
          key: lineItemKey(order!.id, lineItem.product_id),
          required: Math.ceil(lineItem.quantity),
        })),
    );
  }

  // ── Validation ────────────────────────────────────────────
  //   function isAllAssigned(): boolean {
  //     for (const order of tripOrders) {
  //       if (!order?.order_items) continue;
  //       for (const lineItem of order.order_items) {
  //           // const product = getProductById(products, lineItem.product_id);
  //         const product = productMap.get(lineItem.product_id);
  //         if (!product || !isTracked(product)) continue;
  //         const key = lineItemKey(order.id, lineItem.product_id);
  //         const selected = selection[key]?.length ?? 0;
  //         const required = Math.ceil(lineItem.quantity);
  //         if (selected < required) return false;
  //       }
  //     }
  //     return true;
  //   }

  function isAllAssigned(): boolean {
    return getTrackedLineItems().every(({ key, required }) => {
      const selected = selection[key]?.length ?? 0;
      return selected >= required;
    });
  }

  //   async function handleSubmit() {
  //     if (!isAllAssigned()) {
  //       toast.error("Please assign all required units before proceeding");
  //       return;
  //     }

  //     const assignments = [];
  //     for (const order of tripOrders) {
  //       if (!order?.order_items) continue;
  //       for (const lineItem of order.order_items) {
  //         const product = productMap.get(lineItem.product_id);
  //         if (!product || !isTracked(product)) continue;
  //         const key = lineItemKey(order.id, lineItem.product_id);
  //         const itemIds = selection[key] ?? [];
  //         if (itemIds.length === 0) continue;
  //         assignments.push({
  //           orderId: order.id,
  //           productId: lineItem.product_id,
  //           itemIds,
  //         });
  //       }
  //     }

  //     await assignInventory.mutateAsync({ trip: trip as Trip, assignments });
  //   }

  async function handleSubmit() {
    if (!isAllAssigned()) {
      toast.error("Please assign all required units before proceeding");
      return;
    }

    const assignments = getTrackedLineItems()
      .map(({ order, lineItem, key }) => ({
        orderId: order.id,
        productId: lineItem.product_id,
        itemIds: selection[key] ?? [],
      }))
      .filter((a) => a.itemIds.length > 0);

    await assignInventory.mutateAsync({ trip: trip as Trip, assignments });
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

      <div className="space-y-8">
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
                  {/* {order.customer_name} */}
                  {customerMap.get(order.customer_id)?.name ?? "-"}
                </p>
              </div>

              {/* Line items */}
              <div className="p-6 space-y-4">
                {order.order_items?.map((lineItem) => {
                  const product = productMap.get(lineItem.product_id);
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
                  const required = Math.ceil(lineItem.quantity);
                  const fulfilled = selectedIds.length >= required;

                  //   return (
                  //     <TrackedLineItem
                  //       key={lineItem.product_id}
                  //       orderId={order.id}
                  //       lineItem={lineItem}
                  //       productName={product.name}
                  //       availableItems={available}
                  //       selectedIds={selectedIds}
                  //       onToggle={(itemId) =>
                  //         handleToggle(
                  //           order.id,
                  //           lineItem.product_id,
                  //           itemId,
                  //           Math.ceil(lineItem.quantity),
                  //         )
                  //       }
                  //     />
                  //   );

                  return (
                    <div
                      key={lineItem.product_id}
                      className="border border-brand-border rounded-xl overflow-hidden"
                    >
                      {/* Header */}
                      <div className="px-4 py-3 bg-gray-50 border-b border-brand-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package
                            size={14}
                            className="text-brand-text-secondary"
                          />
                          <span className="text-sm font-medium">
                            {product.name}
                          </span>
                          <span className="text-sm text-brand-text-secondary">
                            × {required}
                          </span>
                        </div>
                        <Badge
                          variant={fulfilled ? "success" : "warning"}
                          label={`${selectedIds.length} of ${required} selected`}
                        />
                      </div>

                      {/* Trigger */}
                      <div className="px-4 py-4 flex items-center justify-between">
                        {/* Selected unit tags */}
                        <div className="flex flex-wrap gap-2">
                          {selectedIds.length === 0 ? (
                            <p className="text-sm text-brand-text-secondary">
                              No units selected yet
                            </p>
                          ) : (
                            selectedIds.map((itemId) => {
                              const unit = items.find((i) => i.id === itemId);
                              return (
                                <span
                                  key={itemId}
                                  className="text-xs font-mono bg-brand-purple/10 text-brand-purple px-2 py-1 rounded-lg"
                                >
                                  {unit?.tag_number ?? itemId}
                                </span>
                              );
                            })
                          )}
                        </div>

                        {/* Open picker button */}
                        <button
                          type="button"
                          onClick={() =>
                            setActivePicker({
                              orderId: order.id,
                              productId: lineItem.product_id,
                              productName: product.name,
                              required,
                            })
                          }
                          className="shrink-0 ml-4 text-sm text-brand-purple font-medium hover:underline"
                        >
                          {selectedIds.length === 0
                            ? "Select units →"
                            : "Change →"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

         <div className="flex-1 mr-6">
            {isAllAssigned() ? (
              <p className="text-sm text-green-700 flex items-center gap-1.5">
                <CheckCircle
                  size={14}
                  className="shrink-0"
                />
                All tracked items assigned — ready to proceed
              </p>
            ) : (
              <div className="space-y-1">
                {/* Show a specific message per unresolved line item */}
                {/* {tripOrders.flatMap(
                  (order) =>
                    order?.order_items
                      ?.filter((lineItem) => {
                       const product = productMap.get(lineItem.product_id);
                        if (!product || !isTracked(product)) return false;
                        const key = lineItemKey(order.id, lineItem.product_id);
                        const selected = selection[key]?.length ?? 0;
                        return selected < Math.ceil(lineItem.quantity);
                      })
                      .map((lineItem) => {
                        const product = productMap.get(lineItem.product_id);
                        const key = lineItemKey(order!.id, lineItem.product_id);
                        const selected = selection[key]?.length ?? 0;
                        const required = Math.ceil(lineItem.quantity);
                        const available = getAvailableItems(
                          items,
                          lineItem.product_id,
                        ).length;
                        const isStockGap = available < required;

                        return (
                          <p
                            key={lineItem.product_id}
                            className="text-sm text-amber-700 flex items-start gap-1.5"
                          >
                            <AlertCircle
                              size={14}
                              className="shrink-0 mt-0.5"
                            />
                            {isStockGap ? (
                              <>
                                <span>
                                  <strong>{product?.name}</strong>: only{" "}
                                  {available} of {required} units available in
                                  stock.{" "}
                                  <a
                                    href={INVENTORY_ROUTES.checkIn()}
                                    className="underline hover:text-amber-900"
                                  >
                                    Check in more stock
                                  </a>{" "}
                                  before proceeding.
                                </span>
                              </>
                            ) : (
                              <span>
                                <strong>{product?.name}</strong>: select{" "}
                                {required - selected} more unit
                                {required - selected !== 1 ? "s" : ""} to
                                continue.
                              </span>
                            )}
                          </p>
                        );
                      }) ?? [],
                )} */}

                {getTrackedLineItems()
                  .filter(
                    ({ key, required }) =>
                      (selection[key]?.length ?? 0) < required,
                  )
                  .map(({ product, key, required }) => {
                    const selected = selection[key]?.length ?? 0;
                    const available = getAvailableItems(
                      items,
                      product.id,
                    ).length;
                    const isStockGap = available < required;

                    return (
                      <p
                        key={product.id}
                        className="text-sm text-amber-700 flex items-start gap-1.5"
                      >
                        <AlertCircle
                          size={14}
                          className="shrink-0 mt-0.5"
                        />
                        {isStockGap ? (
                          <span>
                            <strong>{product.name}</strong>: only {available} of{" "}
                            {required} units available in stock.{" "}
                            <a
                              href={INVENTORY_ROUTES.checkIn()}
                              className="underline hover:text-amber-900"
                            >
                              Check in more stock
                            </a>{" "}
                            before proceeding.
                          </span>
                        ) : (
                          <span>
                            <strong>{product.name}</strong>: select{" "}
                            {required - selected} more unit
                            {required - selected !== 1 ? "s" : ""} to continue.
                          </span>
                        )}
                      </p>
                    );
                  })}
              </div>
            )}
          </div>

        {/* Actions */}
        <div className="flex justify-end pb-10">
         

          <div className="flex gap-3 shrink-0">
            {/* <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={assignInventory.isPending}
            >
              Cancel
            </Button> */}
            <Button
              onClick={handleSubmit}
              loading={assignInventory.isPending}
              loadingText="Saving…"
              disabled={!isAllAssigned() || assignInventory.isPending}
            >
              Confirm & Mark Ready
            </Button>
          </div>
        </div>

        {/* Inventory Unit Picker Modal */}
        {activePicker && (
          <InventoryUnitPickerModal
            open={activePicker !== null}
            onClose={() => setActivePicker(null)}
            onConfirm={(itemIds) => {
              const key = lineItemKey(
                activePicker.orderId,
                activePicker.productId,
              );
              setSelection((prev) => ({ ...prev, [key]: itemIds }));
              setActivePicker(null);
            }}
            items={getAvailableItems(items, activePicker.productId)}
            selectedIds={
              selection[
                lineItemKey(activePicker.orderId, activePicker.productId)
              ] ?? []
            }
            productName={activePicker.productName}
            required={activePicker.required}
          />
        )}
      </div>
    </AppLayout>
  );
}
