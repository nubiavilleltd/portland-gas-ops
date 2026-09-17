// app/fleet/trips/[id]/assign-inventory/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

import { useTripById } from "@/lib/modules/fleet/hooks/useTrips";
import { useOrders } from "@/lib/modules/orders/hooks/useOrders";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import {
  useConsumableLocations,
  useInventoryItems,
} from "@/lib/modules/inventory/hooks/useInventory";
import { useAssignInventoryWorkflow } from "@/lib/modules/fleet/hooks/useAssignInventoryWorkflow";

import { getAvailableItems } from "@/lib/modules/inventory/selectors/inventory.selectors";
import { isIndividualItems } from "@/lib/modules/products/types/product.types";
import { canAssignInventory } from "@/lib/modules/fleet/guards/trip.guards";
import InventoryUnitPickerModal from "@/components/ui/InventoryUnitPickerModal";

import { FLEET_ROUTES } from "@/lib/modules/fleet/constants/routes";
import { cn } from "@/lib/utils";

import type { Trip } from "@/lib/modules/fleet/types/trip.types";
import FormSelect from "@/components/forms/FormSelect";
import CollapsibleTagList from "@/components/ui/CollapsibleTagList";
import AssignmentProgress from "@/components/ui/AssignmentProgress";
import AssignInventorySkeleton from "@/lib/modules/fleet/components/AssignInventorySkeleton";

// ── Types ─────────────────────────────────────────────────

type LineSelection = {
  itemIds: string[];
  locationId?: string;
};

type SelectionMap = Record<string, LineSelection>;

// ── Helper ────────────────────────────────────────────────

function lineItemKey(orderId: string, productId: string) {
  return `${orderId}__${productId}`;
}

// ── Sub-components ────────────────────────────────────────

function StockQuantityLineItem({
  productId,
  productName,
  available_quantity,
  value,
  onChange,
}: {
  productId: string;
  productName: string;
  available_quantity: number;
  value?: string;
  onChange: (locationId: string) => void;
}) {
  const { locations } = useConsumableLocations(productId);

  const options = locations.map((location) => ({
    value: location.location_id,
    label: `${location.location_name} (${location.available_quantity})`,
  }));

  return (
    <div className="border border-brand-border rounded-xl">
      <div className="px-4 py-3 bg-gray-50 border-b border-brand-border">
        <div className="flex items-center justify-between">
          <span className="font-medium">{productName}</span>
          <Badge
            variant="neutral"
            label={`Stock Quantity × ${available_quantity}`}
          />
        </div>
      </div>

      <div className="p-4">
        <FormSelect
          label="Warehouse"
          required
          placeholder="Select warehouse"
          options={options}
          value={value ?? ""}
          onValueChange={onChange}
          hint="Choose the warehouse this stock will be deducted from during dispatch."
          searchable
        />
      </div>
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
  const { items, isLoading: itemsLoading } = useInventoryItems();
  const [justSubmitted, setJustSubmitted] = useState(false);

  const [selection, setSelection] = useState<SelectionMap>({});
  const [activePicker, setActivePicker] = useState<{
    orderId: string;
    productId: string;
    productName: string;
    required: number;
  } | null>(null);

  const productMap = new Map(products.map((p) => [p.id, p]));

  function handleLocationChange(key: string, locationId: string) {
    setSelection((prev) => ({
      ...prev,
      [key]: {
        itemIds: prev[key]?.itemIds ?? [],
        locationId,
      },
    }));
  }

  const isLoading =
    tripLoading || ordersLoading || productsLoading || itemsLoading;

  if (isLoading) {
    return <AssignInventorySkeleton />;
  }

  if (!trip) {
    return (
      <AppLayout pageTitle="Trip Not Found">
        <p className="text-brand-text-secondary">Trip not found.</p>
      </AppLayout>
    );
  }

  if (!justSubmitted && !canAssignInventory(trip)) {
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
          <Button variant="outline" href={FLEET_ROUTES.tripDetail(id)}>
            Back to Trip
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (trip.order_ids.length === 0) {
    return (
      <AppLayout pageTitle="Assign Inventory">
        <p className="text-brand-text-secondary">
          This trip has no linked orders.
        </p>
      </AppLayout>
    );
  }

  const tripOrders = orders.filter((order) =>
    trip.order_ids.includes(order.id),
  );

  function getIndividualLineItems() {
    return tripOrders.flatMap((order) =>
      (order?.orderItems ?? [])
        .filter((lineItem) => {
          const product = productMap.get(lineItem.productId);
          return product && isIndividualItems(product);
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

  function isIndividualInventoryAssigned(): boolean {
    return getIndividualLineItems().every(({ key, required }) => {
      const selected = selection[key]?.itemIds.length ?? 0;
      return selected >= required;
    });
  }

  function getStockQuantityLineItems() {
    return tripOrders.flatMap((order) =>
      order.orderItems
        .filter((lineItem) => {
          const product = productMap.get(lineItem.productId);
          return product && !isIndividualItems(product);
        })
        .map((lineItem) => ({
          order,
          lineItem,
          product: productMap.get(lineItem.productId)!,
          key: lineItemKey(order.id, lineItem.productId),
        })),
    );
  }

  function isStockQuantityAssigned(): boolean {
    return getStockQuantityLineItems().every(({ key }) =>
      Boolean(selection[key]?.locationId),
    );
  }

  function isAllAssigned() {
    return isIndividualInventoryAssigned() && isStockQuantityAssigned();
  }

  const individualItems = getIndividualLineItems();
  const stockQuantityItems = getStockQuantityLineItems();

  const individualAssigned = individualItems.filter(({ key, required }) => {
    return (selection[key]?.itemIds.length ?? 0) >= required;
  }).length;

  const stockQuantityAssigned = stockQuantityItems.filter(({ key }) => {
    return Boolean(selection[key]?.locationId);
  }).length;

  async function handleSubmit() {
    if (!isIndividualInventoryAssigned()) {
      toast.error("Please assign all individual items before proceeding");
      return;
    }

    if (!isStockQuantityAssigned()) {
      toast.error("Please select a warehouse for all stock-quantity items");
      return;
    }

    const assignments = tripOrders.flatMap((order) =>
      order.orderItems
        .filter((lineItem) => productMap.has(lineItem.productId))
        .map((lineItem) => {
          const key = lineItemKey(order.id, lineItem.productId);
          const product = productMap.get(lineItem.productId)!;

          if (isIndividualItems(product)) {
            return {
              order_id: order.id,
              product_id: lineItem.productId,
              item_ids: selection[key]?.itemIds ?? [],
            };
          }

          return {
            order_id: order.id,
            product_id: lineItem.productId,
            item_ids: [],
            location_id: selection[key]?.locationId,
          };
        }),
    );

    setJustSubmitted(true);

    try {
      await assignInventory.mutateAsync({
        trip: trip as Trip,
        assignments,
      });
    } catch (err) {
      setJustSubmitted(false);
      throw err;
    }
  }

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
        description="Select the specific units to send out for each line item"
        className="mb-6"
      />

      <div className="divide-y divide-brand-border">
        {tripOrders.map((order) => {
          if (!order) return null;

          return (
            <section key={order.id} className="py-6 first:pt-0">
              <div className="flex items-center justify-between pb-2 border-b border-brand-border">
                <h2 className="text-base font-semibold">
                  {order.orderNumber}
                </h2>

                <span className="text-sm text-brand-text-secondary">
                  {order.orderItems.length} item(s)
                </span>
              </div>

              <div className="p-6 space-y-3">
                {order.orderItems?.map((lineItem) => {
                  const product = productMap.get(lineItem.productId);
                  if (!product) return null;

                  if (!isIndividualItems(product)) {
                    const key = lineItemKey(order.id, lineItem.productId);
                    return (
                      <StockQuantityLineItem
                        key={lineItem.productId}
                        productId={lineItem.productId}
                        productName={product.name}
                        available_quantity={lineItem.quantity}
                        value={selection[key]?.locationId}
                        onChange={(locationId) =>
                          handleLocationChange(key, locationId)
                        }
                      />
                    );
                  }

                  const key = lineItemKey(order.id, lineItem.productId);
                  const selectedIds = selection[key]?.itemIds ?? [];
                  const required = Math.ceil(lineItem.quantity);
                  const fulfilled = selectedIds.length >= required;

                  return (
                    <div
                      key={lineItem.productId}
                      className="border border-brand-border rounded-xl overflow-hidden"
                    >
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

                      <div className="px-4 py-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-brand-text-secondary">
                            {selectedIds.length === 0
                              ? "No units selected"
                              : `${selectedIds.length} of ${required} unit(s) selected`}
                          </p>

                          {selectedIds.length > 0 && (
                            <CollapsibleTagList
                              tags={selectedIds.map(
                                (itemId) =>
                                  items.find((item) => item.id === itemId)
                                    ?.tag_number ?? itemId,
                              )}
                            />
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant={
                            selectedIds.length ? "outline" : "primary"
                          }
                          onClick={() =>
                            setActivePicker({
                              orderId: order.id,
                              productId: lineItem.productId,
                              productName: product.name,
                              required,
                            })
                          }
                        >
                          {selectedIds.length === 0
                            ? "Select Units"
                            : "Review Units"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <AssignmentProgress
          trackedAssigned={individualAssigned}
          trackedTotal={individualItems.length}
          consumablesAssigned={stockQuantityAssigned}
          consumablesTotal={stockQuantityItems.length}
        />

        <div className="sticky bottom-0 z-20 -mx-6 mt-8 border-t border-brand-border bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80">
          <div className="mx-auto flex items-center justify-between px-6 py-4">
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={!isAllAssigned()}
                loading={assignInventory.isPending}
              >
                Confirm &amp; Mark Ready
              </Button>
            </div>
          </div>
        </div>

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