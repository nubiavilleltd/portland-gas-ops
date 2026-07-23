"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import ErrorBanner from "@/components/ui/ErrorBanner";

import {
  useInventoryItemById,
} from "@/lib/modules/inventory/hooks/useInventory";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import { useReturnItem } from "@/lib/modules/inventory/hooks/useInventoryMutations";

import { getProductById } from "@/lib/modules/products/selectors/products.selectors";
import { canReturn } from "@/lib/modules/inventory/guards/inventory.guards";
import { INVENTORY_ROUTES } from "@/lib/modules/inventory/constants/routes";
import { CONDITION_OPTIONS } from "@/lib/modules/inventory/constants/inventory-form.constants";
import { formatDate } from "@/lib/utils";

import type { InventoryItem } from "@/lib/modules/inventory/types/inventory.types";
import { BadgeVariant } from "@/config/badge.config";
import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";

// ── Schema ────────────────────────────────────────────────
const returnItemSchema = z.object({
  condition: z.enum(
    ["new", "used", "refurbished", "damaged"],
    { message: "Select the condition on return" }
  ),
  notes: z.string().optional(),
});

type ReturnItemFormValues = z.infer<typeof returnItemSchema>;

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

// ── Info row ──────────────────────────────────────────────
function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary">{label}</p>
      <div className="font-medium mt-0.5 text-sm">{value ?? "—"}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function ReturnItemPage() {
  const router   = useRouter();
  const { id }   = useParams<{ id: string }>();

  const { item,     isLoading: itemLoading     } = useInventoryItemById(id);
  const {order} = useOrderById(item?.order_id as string)
  const { products, isLoading: productsLoading } = useProducts();
  const returnItem = useReturnItem();

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReturnItemFormValues>({
    resolver: zodResolver(returnItemSchema),
    defaultValues: {
      condition: "used",
      notes:     "",
    },
  });

  const isLoading = itemLoading || productsLoading;

  // ── Loading ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <AppLayout pageTitle="Return Item">
        <p className="text-brand-text-secondary">Loading…</p>
      </AppLayout>
    );
  }

  // ── Not found ─────────────────────────────────────────────
  if (!item) {
    return (
      <AppLayout pageTitle="Item Not Found">
        <p className="text-brand-text-secondary">Inventory item not found.</p>
      </AppLayout>
    );
  }

  // ── Guard ─────────────────────────────────────────────────
  if (!canReturn(item)) {
    return (
      <AppLayout pageTitle="Cannot Return Item">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
          <h2 className="font-semibold mb-2">Item Cannot Be Returned</h2>
          <p className="text-sm text-brand-text-secondary mb-2">
            Only loaned items that are currently with a customer can be
            returned.
          </p>
          <p className="text-sm text-brand-text-secondary mb-6">
            Current status:{" "}
            <Badge
              variant={STATUS_VARIANT[item.status]}
              label={STATUS_LABEL[item.status]}
            />
            {item.disposition && (
              <>
                {" "}· Disposition:{" "}
                <span className="font-medium">{item.disposition}</span>
              </>
            )}
          </p>
          <Button
            variant="outline"
            href={INVENTORY_ROUTES.trackedDetail(id)}
          >
            Back to Item
          </Button>
        </div>
      </AppLayout>
    );
  }

  const product = getProductById(products, item.product_id);

  // ── Submit ────────────────────────────────────────────────
  async function handleFormSubmit(data: ReturnItemFormValues) {
    try {
      await returnItem.mutateAsync({
        item_id:     id,
        condition:   data.condition,
        notes:       data.notes,
        recorded_by: "Warehouse Staff",
      });
      router.push(INVENTORY_ROUTES.trackedDetail(id));
    } catch (err) {
      setError("root", {
        message:
          err instanceof Error ? err.message : "Failed to return item",
      });
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <AppLayout pageTitle="Return Item">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Item
      </button>

      <PageHeader
        title="Return Item"
        description="Record the return of a loaned item from a customer"
        className="mb-6"
      />

      <div className="space-y-6">

        {/* ── ITEM SUMMARY ───────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">
              Item Being Returned
            </h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
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
            {item.serial_number && (
              <InfoRow
                label="Serial Number"
                value={item.serial_number}
              />
            )}
            <InfoRow
              label="Current Status"
              value={
                <Badge
                  variant={STATUS_VARIANT[item.status]}
                  label={STATUS_LABEL[item.status]}
                />
              }
            />
            {item.checked_out_at && (
              <InfoRow
                label="Checked Out"
                value={formatDate(item.checked_out_at)}
              />
            )}
            {item.order_id && (
              <InfoRow
                label="Order"
                value={
                  <Button
                    variant="outline"
                    size="sm"
                    href={`/orders/${order?.orderNumber}`}
                  >
                    View Order
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {/* ── WHAT HAPPENS NEXT ──────────────────────────── */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-800 space-y-1">
          <p className="font-medium">What happens after return:</p>
          <ul className="space-y-1 text-blue-700 list-disc list-inside">
            <li>
              <strong>Good / Used / Refurbished</strong> → item goes back
              to <strong>Available</strong>
            </li>
            <li>
              <strong>Damaged</strong> → item goes to{" "}
              <strong>Maintenance</strong>
            </li>
          </ul>
        </div>

        {/* ── RETURN FORM ────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">
              Return Details
            </h2>
          </div>

          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="p-6 space-y-5"
          >
            <Controller
              control={control}
              name="condition"
              render={({ field }) => (
                <FormSelect
                  label="Condition on Return"
                  required
                  options={CONDITION_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.condition?.message}
                  hint="This determines the item's next status"
                />
              )}
            />

            <FormTextarea
              label="Notes"
              placeholder="Any observations about the item's condition, damage details, etc."
              {...register("notes")}
            />

            <ErrorBanner message={errors.root?.message} />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                loadingText="Processing return…"
              >
                Confirm Return
              </Button>
            </div>
          </form>
        </div>

      </div>
    </AppLayout>
  );
}