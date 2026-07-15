"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FormSection from "@/components/ui/FormSection";
import DynamicLineItems, { type LineItemColumn } from "@/components/ui/DynamicLineItems";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import { useCreateAssetRequest, useAssetTypes, useAssetAvailability } from "@/lib/modules/assets";
import { useToast } from "@/hooks/useToast";
import { capitalize } from "@/lib/utils";

// ── Zod schema ─────────────────────────────────────────────────────────────────

const schema = z.object({
  request_type: z.enum(["loan", "requisition"]),
  return_date: z.string().optional(),
  purpose: z.string().min(3, "Purpose must be at least 3 characters").max(2000, "Max 2000 characters"),
}).refine(
  (data) => {
    if (data.request_type === "loan") return !!data.return_date;
    return true;
  },
  { message: "Return date is required for loan requests", path: ["return_date"] }
);

type FormData = z.infer<typeof schema>;

// ── Line item type ─────────────────────────────────────────────────────────────

interface LineItem extends Record<string, unknown> {
  asset_type_id: string;
  quantity: number;
}

const DEFAULT_LINE_ITEM: LineItem = { asset_type_id: "", quantity: 1 };

// ── Component ──────────────────────────────────────────────────────────────────

function NewAssetRequestForm() {
  const router = useRouter();
  const toast = useToast();
  const createRequest = useCreateAssetRequest();
  const { data: assetTypes = [] } = useAssetTypes();
  const availability = useAssetAvailability();

  const [items, setItems] = useState<LineItem[]>([{ ...DEFAULT_LINE_ITEM }]);
  const [itemsError, setItemsError] = useState<string | null>(null);

  // Only show asset types that have at least 1 unit available
  const availableAssetTypes = assetTypes.filter((t) => (availability[t.id] ?? 0) > 0);

  // Items where requested qty exceeds available stock
  const stockErrors = items.filter(
    (item) => item.asset_type_id && item.quantity > (availability[item.asset_type_id] ?? 0)
  );
  const hasStockErrors = stockErrors.length > 0;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { request_type: "loan" },
  });

  const requestType = useWatch({ control, name: "request_type" });

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function onSubmit(formData: FormData) {
    const validItems = items.filter((item) => item.asset_type_id);
    if (validItems.length === 0) {
      setItemsError("Select at least one asset type");
      return;
    }
    const zeroed = validItems.find((item) => item.quantity < 1);
    if (zeroed) {
      setItemsError("All quantities must be at least 1");
      return;
    }
    setItemsError(null);

    try {
      await createRequest.mutateAsync({
        request_type: formData.request_type,
        purpose: formData.purpose,
        return_date: formData.return_date || undefined,
        items: validItems.map((item) => ({
          asset_type_id: item.asset_type_id,
          quantity: item.quantity,
        })),
      });
      toast.success("Request submitted successfully");
      router.push("/assets/requests");
    } catch {
      toast.error("Failed to submit request. Please try again.");
    }
  }

  return (
    <AppLayout pageTitle="Assets">
      <PageHeader
        title="New Asset Request"
        description="Submit a loan or requisition request for company assets"
        className="mb-6"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Section 1: Request Type ──────────────────────────────────────── */}
        <FormSection title="Request Type" required description="Is this a temporary loan or a permanent requisition?" bodyClassName="p-6 space-y-0">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {(["loan", "requisition"] as const).map((type) => (
              <label
                key={type}
                className={[
                  "px-4 py-1.5 text-sm font-medium rounded-md cursor-pointer transition-colors",
                  requestType === type
                    ? "bg-white text-brand-text-primary shadow-sm"
                    : "text-brand-text-secondary hover:text-brand-text-primary",
                ].join(" ")}
              >
                <input
                  type="radio"
                  value={type}
                  className="sr-only"
                  {...register("request_type")}
                />
                {capitalize(type)}
              </label>
            ))}
          </div>
          <p className="text-xs text-brand-text-secondary mt-2">
            {requestType === "loan"
              ? "Asset will be returned after the specified return date."
              : "Asset will be permanently assigned — no return required."}
          </p>
        </FormSection>

        {/* ── Section 2: Items ─────────────────────────────────────────────── */}
        <FormSection title="Requested Items" required description="Select the asset type(s) you need — at least one item required" bodyClassName="p-6 space-y-0">
          <DynamicLineItems<LineItem>
            columns={[
              {
                key: "asset_type_id",
                label: "Asset Type",
                width: "3fr",
                render: (value, onChange) => {
                  // Exclude types already selected in other rows
                  const selectedElsewhere = new Set(
                    items
                      .filter((item) => item.asset_type_id && item.asset_type_id !== value)
                      .map((item) => item.asset_type_id)
                  );
                  const options = availableAssetTypes.filter(
                    (t) => !selectedElsewhere.has(t.id)
                  );
                  return (
                    <select
                      value={value as string}
                      onChange={(e) => onChange(e.target.value)}
                      className="w-full text-sm bg-transparent outline-none"
                    >
                      <option value="">Select asset type…</option>
                      {options.map((t) => {
                        const avail = availability[t.id] ?? 0;
                        return (
                          <option key={t.id} value={t.id}>
                            {t.name} — {avail} available
                          </option>
                        );
                      })}
                    </select>
                  );
                },
              },
              {
                key: "quantity",
                label: "Qty",
                width: "80px",
                render: (value, onChange) => (
                  <input
                    type="number"
                    min="1"
                    value={value as number}
                    onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-sm bg-transparent outline-none text-center"
                  />
                ),
              },
            ] as LineItemColumn<LineItem>[]}
            rows={items}
            onChange={setItems}
            defaultRow={{ ...DEFAULT_LINE_ITEM }}
            addLabel="Add Another Item"
            error={itemsError ?? undefined}
          />
          {/* Stock error — blocks submission */}
          {hasStockErrors && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-xs font-semibold text-red-700 mb-1">Insufficient stock</p>
              {stockErrors.map((item) => {
                const type = assetTypes.find((t) => t.id === item.asset_type_id);
                const avail = availability[item.asset_type_id] ?? 0;
                return (
                  <p key={item.asset_type_id} className="text-xs text-red-600">
                    {type?.name ?? "Unknown"}: only {avail} {avail === 1 ? "unit" : "units"} available, but you requested {item.quantity}.
                  </p>
                );
              })}
              <p className="text-xs text-red-500 mt-1">Reduce the quantity to what is currently in stock to proceed.</p>
            </div>
          )}
        </FormSection>

        {/* ── Section 3: Purpose & Return Date ────────────────────────────── */}
        <FormSection title="Purpose & Details" description="Describe why you need these assets">
          <FormTextarea
            label="Purpose / Description"
            required
            placeholder="Describe what you need the asset(s) for…"
            rows={3}
            error={errors.purpose?.message}
            {...register("purpose")}
          />
          {requestType === "loan" && (
            <FormDatePicker
              label="Return Date"
              required
              error={errors.return_date?.message}
              {...register("return_date")}
            />
          )}
        </FormSection>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="py-2">
          <button
            type="submit"
            disabled={isSubmitting || createRequest.isPending || hasStockErrors}
            className="px-6 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createRequest.isPending ? (
              <>
                <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit Request"
            )}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}

export default function NewAssetRequestPage() {
  return (
    <Suspense>
      <NewAssetRequestForm />
    </Suspense>
  );
}
