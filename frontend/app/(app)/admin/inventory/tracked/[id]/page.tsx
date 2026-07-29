"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Tag, MapPin, Calendar, Package } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

import {
  useInventoryItemById,
  useStockMovementsByItem,
} from "@/lib/modules/inventory/hooks/useInventory";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";

import { getProductById } from "@/lib/modules/products/selectors/products.selectors";
import { canReturn } from "@/lib/modules/inventory/guards/inventory.guards";
import { INVENTORY_ROUTES } from "@/lib/modules/inventory/constants/routes";
import { formatDate } from "@/lib/utils";

import type { InventoryItem } from "@/lib/modules/inventory/types/inventory.types";
import { BadgeVariant } from "@/config/badge.config";
import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
import InventoryItemDetailSkeleton from "@/lib/modules/inventory/components/InventoryItemDetailSkeleton";

// ── Status config ─────────────────────────────────────────
const STATUS_VARIANT: Record<InventoryItem["status"], BadgeVariant> = {
  available:     "success",
  reserved:      "warning",
  checked_out:   "info",
  with_customer: "cyan",
  maintenance:   "orange",
  retired:       "neutral",
  returned:       "neutral",
};

const STATUS_LABEL: Record<InventoryItem["status"], string> = {
  available:     "Available",
  reserved:      "Reserved",
  checked_out:   "Checked Out",
  with_customer: "With Customer",
  maintenance:   "Maintenance",
  retired:       "Retired",
  returned:       "Returned",
};

const CONDITION_VARIANT: Record<InventoryItem["condition"], BadgeVariant> = {
  new:         "success",
  refurbished: "info",
  used:        "neutral",
  damaged:     "danger",
};

// ── Info row ──────────────────────────────────────────────
function InfoRow({
  label,
  value,
  toolTip
}: {
  label: string;
  value: React.ReactNode;
  toolTip?:string;
}) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary" title={toolTip ?? ""}>{label}</p>
      <div className="font-medium mt-0.5 text-sm">{value ?? "—"}</div>
    </div>
  );
}

// ── Movement type label ───────────────────────────────────
const MOVEMENT_LABELS: Record<string, { label: string; variant: BadgeVariant }> = {
  check_in:    { label: "Check In",    variant: "success" },
  check_out:   { label: "Check Out",   variant: "info"    },
  reservation: { label: "Reserved",    variant: "warning" },
  return:      { label: "Return",      variant: "cyan"    },
  adjustment:  { label: "Adjustment",  variant: "neutral" },
};

// ── Page ──────────────────────────────────────────────────
export default function InventoryItemDetailPage() {
  const router     = useRouter();
  const { id }     = useParams<{ id: string }>();

  const { item,      isLoading: itemLoading      } = useInventoryItemById(id);
  const { movements, isLoading: movementsLoading } = useStockMovementsByItem(id);
  const { products,  isLoading: productsLoading  } = useProducts();
  const {order, isLoading: orderLoading} = useOrderById(item?.order_id as string)

  const isLoading = itemLoading || movementsLoading || productsLoading || orderLoading;

  if (isLoading) {
    return <InventoryItemDetailSkeleton />;
  }

  if (!item) {
    return (
      <AppLayout pageTitle="Item Not Found">
        <p className="text-brand-text-secondary">Inventory item not found.</p>
      </AppLayout>
    );
  }

  const product = getProductById(products, item.product_id);

  return (
    <AppLayout pageTitle={item.tag_number}>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Inventory
      </button>

      <PageHeader
        title={item.tag_number}
        description={product?.name ?? "Tracked Asset"}
        className="mb-6"
        action={
          canReturn(item) ? (
            <Button href={INVENTORY_ROUTES.returnTracked(id)}>
              Return Item
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-6">

        {/* ── ITEM DETAILS ───────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">
              Item Details
            </h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-5">
            <InfoRow
              label="Tag Number"
              value={
                <span className="font-mono">{item.tag_number}</span>
              }
            />
            <InfoRow
              label="Product"
              value={product?.name}
            />
            {/* <InfoRow
              label="Serial Number"
              value={item.serial_number}
            /> */}
            <InfoRow
              label="Status"
              value={
                <Badge
                  variant={STATUS_VARIANT[item.status]}
                  label={STATUS_LABEL[item.status]}
                />
              }
            />
            <InfoRow
              label="Condition"
              value={
                <Badge
                  variant={CONDITION_VARIANT[item.condition]}
                  label={item.condition}
                />
              }
            />
            <InfoRow
              label="Disposition"
              value={item.disposition ?? "—"}
              toolTip="The mode of check-out e.g sold or loaned"
            />
            <InfoRow
              label="Location"
              value={item.location_name}
            />
            <InfoRow
              label="Received"
              value={formatDate(item.received_at)}
            />
            {item.checked_out_at && (
              <InfoRow
                label="Checked Out"
                value={formatDate(item.checked_out_at)}
              />
            )}
            {item.expected_return_date && (
              <InfoRow
                label="Expected Return"
                value={formatDate(item.expected_return_date)}
              />
            )}
          </div>

          {item.notes && (
            <div className="px-6 pb-6">
              <p className="text-xs text-brand-text-secondary mb-1">Notes</p>
              <p className="text-sm">{item.notes}</p>
            </div>
          )}
        </div>

        {/* ── CUSTOMER / ORDER INFO (if out) ─────────────── */}
        {(item.order_id || item.customer_id) && (
          <div className="bg-white border border-brand-border rounded-2xl">
            <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
              <h2 className="text-sm font-semibold text-brand-text-primary">
                Assignment
              </h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-5">
              {item.order_id && (
                <InfoRow
                  label="Order"
                  value={
                    <Button
                      variant="outline"
                      size="sm"
                      href={`/orders/${order?.id}`}
                    >
                      View Order
                    </Button>
                  }
                />
              )}
              {item.customer_id && (
                <InfoRow
                  label="Customer"
                  value={order?.customerName}
                />
              )}
            </div>
          </div>
        )}

        {/* ── MOVEMENT HISTORY ───────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">
              Movement History
            </h2>
          </div>

          {movements.length === 0 ? (
            <p className="px-6 py-8 text-sm text-brand-text-secondary text-center">
              No movements recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-brand-border">
              {[...movements]
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .map((movement) => {
                  const config =
                    MOVEMENT_LABELS[movement.movement_type] ??
                    { label: movement.movement_type, variant: "neutral" as BadgeVariant };

                  return (
                    <div
                      key={movement.id}
                      className="px-6 py-4 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={config.variant}
                            label={config.label}
                          />
                          {movement.reference_id && (
                            <span className="text-xs text-brand-text-secondary">
                              Ref: {movement.reference_id}
                            </span>
                          )}
                        </div>
                        {movement.notes && (
                          <p className="text-xs text-brand-text-secondary">
                            {movement.notes}
                          </p>
                        )}
                        <p className="text-xs text-brand-text-secondary">
                          By {movement.recorded_by_name}
                        </p>
                      </div>
                      <span className="text-xs text-brand-text-secondary shrink-0">
                        {formatDate(movement.created_at)}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}