// app/fleet/trips/[id]/assign-inventory/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CheckCircle, Package } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

import { useTripById, useTripByNo } from "@/lib/modules/fleet/hooks/useTrips";
import { useOrders } from "@/lib/modules/orders/hooks/useOrders";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import {
  useInventoryItems,
  useLocations,
} from "@/lib/modules/inventory/hooks/useInventory";
import { useAssignInventoryWorkflow } from "@/lib/modules/fleet/hooks/useAssignInventoryWorkflow";

import { getAvailableItems } from "@/lib/modules/inventory/selectors/inventory.selectors";
import { isTracked } from "@/lib/modules/products/types/product.types";
import { canAssignInventory } from "@/lib/modules/fleet/guards/trip.guards";
import InventoryUnitPickerModal from "@/components/ui/InventoryUnitPickerModal";

import { FLEET_ROUTES } from "@/lib/modules/fleet/constants/routes";
import { INVENTORY_ROUTES } from "@/lib/modules/inventory/constants/routes";
import { DISPOSITION_OPTIONS } from "@/lib/modules/inventory/constants/inventory-form.constants";
import { cn } from "@/lib/utils";

import type { Trip } from "@/lib/modules/fleet/types/trip.types";
import type { ItemDisposition } from "@/lib/modules/inventory/types/inventory.types";
import FormSelect from "@/components/forms/FormSelect";

// ── Types ─────────────────────────────────────────────────
// Each tracked line item now carries its own disposition alongside selected unit ids
type LineSelection = {
  itemIds: string[];
  disposition: ItemDisposition;
  locationId?: string;
};
type SelectionMap = Record<string, LineSelection>;

// ── Helper ────────────────────────────────────────────────
function lineItemKey(orderId: string, productId: string) {
  return `${orderId}__${productId}`;
}

// ── Sub-components ────────────────────────────────────────

// function ConsumableLineItem({ productName }: { productName: string }) {
//   return (
//     <div className="flex items-center gap-3 py-3 px-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
//       <CheckCircle size={15} className="shrink-0" />
//       <span>
//         <span className="font-medium">{productName}</span>
//         {" — "}Consumable, no unit assignment needed
//       </span>
//     </div>
//   );
// }

function ConsumableLineItem({
  productName,
  quantity,
  value,
  locations,
  onChange,
}: {
  productName: string;
  quantity: number;
  value?: string;
  locations: { value: string; label: string }[];
  onChange: (locationId: string) => void;
}) {
  return (
    <div className="border border-brand-border rounded-xl">
      <div className="px-4 py-3 bg-gray-50 border-b border-brand-border">
        <div className="flex items-center justify-between">
          <span className="font-medium">{productName}</span>
          <Badge
            variant="neutral"
            label={`Consumable × ${quantity}`}
          />
        </div>
      </div>

      <div className="p-4">
        <FormSelect
          label="Warehouse"
          required
          placeholder="Select warehouse"
          options={locations}
          value={value ?? ""}
          onValueChange={onChange}
          hint="Choose the warehouse this stock will be deducted from during dispatch."
          searchable
        />
      </div>
    </div>
  );
}

function DispositionPicker({
  value,
  onChange,
}: {
  value: ItemDisposition;
  onChange: (disposition: ItemDisposition) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-brand-border bg-white">
      <p className="text-xs text-brand-text-secondary shrink-0">Disposition:</p>
      <div className="flex gap-2">
        {DISPOSITION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value as ItemDisposition)}
            title={opt.description}
            className={cn(
              "px-3 py-1 text-xs rounded-full border transition-colors",
              value === opt.value
                ? "bg-brand-purple text-white border-brand-purple"
                : "border-brand-border text-brand-text-secondary hover:border-brand-purple/50",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function AssignInventoryPage() {
  const router = useRouter();
  const { id: tripNo } = useParams<{ id: string }>();
  const assignInventory = useAssignInventoryWorkflow();

  const { trip, isLoading: tripLoading } = useTripByNo(tripNo);
  const { orders, isLoading: ordersLoading } = useOrders();
  const { products, isLoading: productsLoading } = useProducts();
  const { items, isLoading: itemsLoading } = useInventoryItems();
  const { locations } = useLocations();




  const [selection, setSelection] = useState<SelectionMap>({});
  const [activePicker, setActivePicker] = useState<{
    orderId: string;
    productId: string;
    productName: string;
    required: number;
  } | null>(null);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const locationOptions = locations.map((location) => ({
    value: location.id,
    label: location.name,
  }));

  function handleLocationChange(key: string, locationId: string) {
    setSelection((prev) => ({
      ...prev,
      [key]: {
        itemIds: prev[key]?.itemIds ?? [],
        disposition: prev[key]?.disposition ?? "sold",
        locationId,
      },
    }));
  }


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
            href={FLEET_ROUTES.tripDetail(tripNo)}
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
  const tripOrders = orders.filter((order) =>
    trip.order_ids.includes(order.id)
  );

  // ── Derive all tracked line items across this trip ────────
  function getTrackedLineItems() {
    return tripOrders.flatMap((order) =>
      (order?.orderItems ?? [])
        .filter((lineItem) => {
          const product = productMap.get(lineItem.productId);
          return product && isTracked(product);
        })
        .map((lineItem) => ({
          order: order!,
          lineItem,
          product: productMap.get(lineItem.productId)!,
          key: lineItemKey(order!.id, lineItem.productId),
          required: Math.ceil(lineItem.quantity),
        })),
    );
  }

  // ── Disposition handler ────────────────────────────────────
  function handleDispositionChange(key: string, disposition: ItemDisposition) {
    setSelection((prev) => ({
      ...prev,
      [key]: { itemIds: prev[key]?.itemIds ?? [], disposition },
    }));
  }

  // ── Validation ────────────────────────────────────────────
  function isTrackedInventoryAssigned(): boolean {
    return getTrackedLineItems().every(({ key, required }) => {
      const selected = selection[key]?.itemIds.length ?? 0;
      return selected >= required;
    });
  }


  function getConsumableLineItems() {
    return tripOrders.flatMap((order) =>
      order.orderItems
        .filter((lineItem) => {
          const product = productMap.get(lineItem.productId);
          return product && !isTracked(product);
        })
        .map((lineItem) => ({
          order,
          lineItem,
          product: productMap.get(lineItem.productId)!,
          key: lineItemKey(order.id, lineItem.productId),
        })),
    );
  }

  function isConsumablesAssigned(): boolean {
    return getConsumableLineItems().every(
      ({ key }) => Boolean(selection[key]?.locationId),
    );
  }

  function isAllAssigned() {
    return (
      isTrackedInventoryAssigned() &&
      isConsumablesAssigned()
    );
  }



  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit() {
    if (!isTrackedInventoryAssigned()) {
      toast.error("Please assign all tracked inventory before proceeding");
      return;
    }

    if (!isConsumablesAssigned()) {
      toast.error("Please select a warehouse for all consumable items");
      return;
    }

    const trackedAssignments = getTrackedLineItems()
      .map(({ order, lineItem, key }) => ({
        order_id: order.id,
        product_id: lineItem.productId,
        item_ids: selection[key]?.itemIds ?? [],
        disposition: selection[key]?.disposition ?? "sold",
      }))
      .filter((a) => a.item_ids.length > 0);

    await assignInventory.mutateAsync({
      trip: trip as Trip,
      assignments: trackedAssignments,
    });
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
                  {order.orderNumber}
                </h2>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  {order.customerName ?? "-"}
                </p>
              </div>

              {/* Line items */}
              <div className="p-6 space-y-4">
                {order.orderItems?.map((lineItem) => {
                  const product = productMap.get(lineItem.productId);
                  if (!product) return null;

                  if (!isTracked(product)) {
                    const key = lineItemKey(order.id, lineItem.productId);
                    return (
                      <ConsumableLineItem
                        key={lineItem.productId}
                        productName={product.name}
                        quantity={lineItem.quantity}
                        value={selection[key]?.locationId}
                        locations={locationOptions}
                        onChange={(locationId) =>
                          handleLocationChange(key, locationId)
                        }
                      />
                    );
                  }

                  const key = lineItemKey(order.id, lineItem.productId);
                  const selectedIds = selection[key]?.itemIds ?? [];
                  const disposition = selection[key]?.disposition ?? "sold";
                  const required = Math.ceil(lineItem.quantity);
                  const fulfilled = selectedIds.length >= required;

                  return (
                    <div
                      key={lineItem.productId}
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

                      {/* Unit selection trigger */}
                      <div className="px-4 py-4 flex items-center justify-between">
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

                        <button
                          type="button"
                          onClick={() =>
                            setActivePicker({
                              orderId: order.id,
                              productId: lineItem.productId,
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

                      {/* Disposition — only shown once at least one unit is selected */}
                      {selectedIds.length > 0 && (
                        <DispositionPicker
                          value={disposition}
                          onChange={(d) => handleDispositionChange(key, d)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

       <div className="space-y-2">
  {!isTrackedInventoryAssigned() && (
    <p className="text-sm text-amber-700 flex items-center gap-1.5">
      <AlertCircle size={14} />
      Assign all required tracked inventory before proceeding.
    </p>
  )}

  {!isConsumablesAssigned() && (
    <p className="text-sm text-amber-700 flex items-center gap-1.5">
      <AlertCircle size={14} />
      Select a warehouse for all consumable items.
    </p>
  )}

  {isTrackedInventoryAssigned() && isConsumablesAssigned() && (
    <p className="text-sm text-green-700 flex items-center gap-1.5">
      <CheckCircle size={14} />
      Inventory assignment complete — ready to proceed.
    </p>
  )}
</div>

        {/* Actions */}
        <div className="flex pb-10">
          <Button
            onClick={handleSubmit}
            loading={assignInventory.isPending}
            loadingText="Saving…"
            disabled={!isAllAssigned() || assignInventory.isPending}
          >
            Confirm & Mark Ready
          </Button>
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
              setSelection((prev) => ({
                ...prev,
                [key]: {
                  itemIds,
                  disposition: prev[key]?.disposition ?? "sold",
                },
              }));
              setActivePicker(null);
            }}
            items={getAvailableItems(items, activePicker.productId)}
            selectedIds={
              selection[
                lineItemKey(activePicker.orderId, activePicker.productId)
              ]?.itemIds ?? []
            }
            productName={activePicker.productName}
            required={activePicker.required}
          />
        )}
      </div>
    </AppLayout>
  );
}
