"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ChevronDown, X, AlertCircle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import { useCreateAssetRequest, useAssets } from "@/hooks/useAssets";
import { useToast } from "@/hooks/useToast";
import { capitalize } from "@/lib/utils";
import type { Asset } from "@/types";

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

interface LineItem {
  id: string;
  asset_id: string;
  asset: Asset | null;
  quantity: number;
  notes: string;
  dropdownOpen: boolean;
  search: string;
}

function makeItem(asset?: Asset, index = 1): LineItem {
  return {
    id: asset ? `asset-${asset.id}` : `item-${index}`,
    asset_id: asset?.id ?? "",
    asset: asset ?? null,
    quantity: 1,
    notes: "",
    dropdownOpen: false,
    search: "",
  };
}

// ── Asset status badge ─────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  in_use: "bg-blue-100 text-blue-700",
  under_maintenance: "bg-amber-100 text-amber-700",
  decommissioned: "bg-gray-100 text-gray-500",
};

// ── Component ──────────────────────────────────────────────────────────────────

function NewAssetRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const createRequest = useCreateAssetRequest();
  const { data: allAssets = [] } = useAssets();

  // Pre-populate from ?asset_id=xxx
  const preloadAssetId = searchParams.get("asset_id");
  const preloadAsset = allAssets.find((a) => a.id === preloadAssetId) ?? null;

  const [items, setItems] = useState<LineItem[]>([makeItem(preloadAsset ?? undefined)]);
  const [itemsError, setItemsError] = useState<string | null>(null);

  // If preloadAsset loads after component mount, update first row
  useEffect(() => {
    if (preloadAsset && items[0].asset_id === "") {
      const timeoutId = window.setTimeout(() => setItems((prev) => {
        const next = [...prev];
        next[0] = { ...next[0], asset_id: preloadAsset.id, asset: preloadAsset, quantity: 1 };
        return next;
      }), 0);

      return () => window.clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadAsset?.id]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      request_type: "loan",
    },
  });

  const requestType = useWatch({ control, name: "request_type" });

  // ── Item helpers ─────────────────────────────────────────────────────────────

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function selectAsset(index: number, asset: Asset) {
    updateItem(index, {
      asset_id: asset.id,
      asset,
      quantity: 1,
      dropdownOpen: false,
      search: "",
    });
  }

  function clearAsset(index: number) {
    updateItem(index, { asset_id: "", asset: null, quantity: 1, search: "", dropdownOpen: false });
  }

  function filteredAssets(search: string) {
    const term = search.toLowerCase();
    return allAssets.filter((a) =>
      a.name.toLowerCase().includes(term) ||
      (a.category?.name ?? "").toLowerCase().includes(term) ||
      (a.serial_number ?? "").toLowerCase().includes(term)
    );
  }

  // Group assets by category name for the dropdown
  function groupedAssets(search: string) {
    const list = filteredAssets(search);
    const groups: Record<string, typeof list> = {};
    for (const asset of list) {
      const key = asset.category?.name ?? "Uncategorised";
      if (!groups[key]) groups[key] = [];
      groups[key].push(asset);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function onSubmit(formData: FormData) {
    // Validate items
    const validItems = items.filter((item) => item.asset_id);
    if (validItems.length === 0) {
      setItemsError("Add at least one asset item");
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
          asset_id: item.asset_id,
          quantity: item.quantity,
          notes: item.notes || undefined,
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

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-6">

        {/* ── Section 1: Request Details ───────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">Request Details</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">Choose request type and describe your need</p>
          </div>
          <div className="p-6 space-y-5">

            {/* Request type toggle */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-2">
                Request Type <span className="text-red-500">*</span>
              </label>
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
              {requestType === "loan" && (
                <p className="text-xs text-brand-text-secondary mt-1.5">
                  Asset will be returned after the specified return date.
                </p>
              )}
              {requestType === "requisition" && (
                <p className="text-xs text-brand-text-secondary mt-1.5">
                  Asset will be permanently assigned — no return required.
                </p>
              )}
            </div>

            {/* Return date — loan only */}
            {requestType === "loan" && (
              <FormDatePicker
                label="Return Date"
                required
                error={errors.return_date?.message}
                {...register("return_date")}
              />
            )}

            <FormTextarea
              label="Purpose / Description"
              required
              placeholder="Describe what you need the asset for and how long you need it…"
              rows={3}
              error={errors.purpose?.message}
              {...register("purpose")}
            />
          </div>
        </div>

        {/* ── Section 2: Items ─────────────────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">Requested Items</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">Select the assets you need</p>
          </div>
          <div className="p-6">
            {itemsError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                <AlertCircle size={13} /> {itemsError}
              </div>
            )}

            {/* Items table */}
            <div className="border border-brand-border rounded-xl mb-4">
              {/* Header */}
              <div className="grid grid-cols-[1fr_80px_1fr_40px] gap-0 bg-gray-50 border-b border-brand-border rounded-t-xl">
                {["Asset", "Qty", "Notes", ""].map((h) => (
                  <div key={h} className="px-3 py-2.5 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {items.map((item, i) => {
                const groups = groupedAssets(item.search);
                const totalMatches = groups.reduce((n, [, list]) => n + list.length, 0);

                return (
                  <div
                    key={item.id}
                    className={[
                      "grid grid-cols-[1fr_80px_1fr_40px] gap-0 border-b border-brand-border last:border-b-0",
                      i % 2 === 1 ? "bg-gray-50/40" : "bg-white",
                    ].join(" ")}
                  >
                    {/* Asset picker */}
                    <div className="px-3 py-2 relative">
                      {item.asset ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-brand-text-primary truncate">{item.asset.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[item.asset.status] ?? "bg-gray-100 text-gray-500"}`}>
                                {capitalize(item.asset.status.replace(/_/g, " "))}
                              </span>
                              <span className="text-[10px] text-brand-text-secondary">
                                {item.asset.available_quantity} available
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => clearAsset(i)}
                            className="text-gray-300 hover:text-gray-500 shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Search or browse assets…"
                              value={item.search}
                              onChange={(e) => updateItem(i, { search: e.target.value, dropdownOpen: true })}
                              onFocus={() => updateItem(i, { dropdownOpen: true })}
                              className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
                            />
                            <ChevronDown size={13} className="text-gray-400 shrink-0" />
                          </div>

                          {item.dropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => updateItem(i, { dropdownOpen: false })}
                              />
                              <div className="absolute z-20 top-full left-0 mt-1 w-72 bg-white border border-brand-border rounded-xl shadow-lg">
                                {totalMatches === 0 ? (
                                  <div className="px-4 py-4 text-sm text-brand-text-secondary text-center">
                                    No assets match &quot;{item.search}&quot;
                                  </div>
                                ) : (
                                  <ul className="max-h-64 overflow-y-auto py-1">
                                    {groups.map(([category, assetList]) => (
                                      <li key={category}>
                                        {/* Category header */}
                                        <div className="px-3 py-1.5 text-[10px] font-semibold text-brand-text-secondary uppercase tracking-wide bg-gray-50 border-b border-brand-border/50 sticky top-0">
                                          {category}
                                        </div>
                                        {assetList.map((asset) => {
                                          const notAvailable = asset.available_quantity === 0;
                                          return (
                                            <button
                                              key={asset.id}
                                              type="button"
                                              disabled={notAvailable}
                                              onClick={() => !notAvailable && selectAsset(i, asset)}
                                              className={[
                                                "w-full text-left px-4 py-2 text-sm transition-colors",
                                                notAvailable
                                                  ? "opacity-40 cursor-not-allowed"
                                                  : "hover:bg-brand-purple/5",
                                              ].join(" ")}
                                            >
                                              <p className="font-medium text-brand-text-primary">{asset.name}</p>
                                              <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[asset.status] ?? "bg-gray-100 text-gray-500"}`}>
                                                  {notAvailable ? "Out of stock" : capitalize(asset.status.replace(/_/g, " "))}
                                                </span>
                                                <span className="text-[10px] text-brand-text-secondary">
                                                  {asset.available_quantity} / {asset.total_quantity} available
                                                </span>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="px-3 py-2 border-l border-brand-border/50">
                      <input
                        type="number"
                        min="1"
                        max={item.asset?.available_quantity ?? undefined}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
                        }
                        disabled={!item.asset}
                        className="w-full text-sm outline-none bg-transparent disabled:opacity-40"
                      />
                    </div>

                    {/* Notes */}
                    <div className="px-3 py-2 border-l border-brand-border/50">
                      <input
                        type="text"
                        placeholder="Optional note…"
                        value={item.notes}
                        onChange={(e) => updateItem(i, { notes: e.target.value })}
                        className="w-full text-sm outline-none bg-transparent placeholder:text-gray-400"
                      />
                    </div>

                    {/* Remove */}
                    <div className="flex items-center justify-center border-l border-brand-border/50">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, makeItem(undefined, prev.length + 1)])}
              className="flex items-center gap-2 text-sm text-brand-purple hover:text-brand-purple-dark transition-colors font-medium"
            >
              <Plus size={15} /> Add Item
            </button>
          </div>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between py-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium border border-brand-border rounded-lg text-brand-text-secondary hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createRequest.isPending}
            className="px-6 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 flex items-center gap-2"
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
