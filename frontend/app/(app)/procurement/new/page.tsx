"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, X, ChevronDown, ArrowLeft } from "lucide-react";
import FormSection from "@/components/ui/FormSection";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import { useCreateProcurement, PROCUREMENT_ERRORS } from "@/lib/modules/procurement";
import { useVendors } from "@/lib/modules/vendors";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/utils";

// ── Zod schema ─────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  description: z.string().min(1, "Description is required").max(255, "Max 255 characters"),
  quantity: z.string()
    .min(1, "Required")
    .refine((v) => !isNaN(parseInt(v)) && parseInt(v) > 0, "Must be a whole number greater than 0"),
  unit_price: z.string().optional(),
  total_price: z.string(),
});

const schema = z.object({
  title:            z.string().min(1, "Title is required").max(200, "Max 200 characters"),
  description:      z.string().max(2000, "Max 2000 characters").optional(),
  estimated_amount: z.string().optional(),
  vendor_id:        z.string().optional(),
  items:            z.array(itemSchema).min(1, "Add at least one item"),
});

type FormData = z.infer<typeof schema>;

// ── Component ──────────────────────────────────────────────────────────────────

export default function NewProcurementPage() {
  const router = useRouter();
  const toast = useToast();
  const createMutation = useCreateProcurement();
  const { data: vendors = [] } = useVendors();

  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [selectedVendorName, setSelectedVendorName] = useState<string>("");
  const [costDisplays, setCostDisplays] = useState<Record<number, string>>({});

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      items: [{ description: "", quantity: "1", unit_price: "", total_price: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");

  const updateTotal = useCallback(
    (index: number) => {
      const qty   = parseInt(watchedItems[index]?.quantity ?? "0") || 0;
      const price = parseFloat(watchedItems[index]?.unit_price ?? "0") || 0;
      setValue(`items.${index}.total_price`, String(qty * price));
    },
    [watchedItems, setValue]
  );

  const grandTotal = watchedItems.reduce(
    (sum, item) => sum + (parseFloat(item.total_price) || 0),
    0
  );

  function applyCommas(raw: string): string {
    const clean = raw.replace(/[^0-9.]/g, "");
    const [int, dec] = clean.split(".");
    const formatted = (int || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return dec !== undefined ? `${formatted}.${dec}` : formatted;
  }

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  function selectVendor(id: string, name: string) {
    setValue("vendor_id", id);
    setSelectedVendorName(name);
    setVendorDropdownOpen(false);
    setVendorSearch("");
  }

  function clearVendor() {
    setValue("vendor_id", "");
    setSelectedVendorName("");
  }

  async function onSubmit(formData: FormData) {
    try {
      await createMutation.mutateAsync({
        title:            formData.title,
        description:      formData.description || undefined,
        estimated_amount: formData.estimated_amount
          ? parseFloat(formData.estimated_amount)
          : undefined,
        vendor_id: formData.vendor_id || undefined,
        items: formData.items.map((item) => ({
          description: item.description,
          quantity:    parseInt(item.quantity) || 1,
          unit_price:  item.unit_price ? parseFloat(item.unit_price) : null,
          total_price: parseFloat(item.total_price) || null,
        })),
      });
      toast.success("Purchase request submitted successfully");
      router.push("/procurement");
    } catch (err) {
      toast.error(getErrorMessage(err, PROCUREMENT_ERRORS));
    }
  }

  return (
    <AppLayout pageTitle="Procurement">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Procurement
      </button>
      <PageHeader
        title="New Purchase & Service Request"
        description="Fill in the details below and submit for approval"
        className="mb-6"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Section 1: Request Details ─────────────────────────────────────── */}
        <FormSection title="Request Details" description="Basic information about this request">
          <FormInput
            label="Title"
            required
            placeholder="e.g. Office supplies purchase — Q3"
            error={errors.title?.message}
            {...register("title")}
          />
          <FormTextarea
            label="Description / Justification"
            placeholder="Describe what is needed and why"
            rows={3}
            {...register("description")}
          />
          <FormInput
            label="Estimated Total Amount (₦)"
            placeholder="e.g. 250000"
            type="number"
            step="0.01"
            {...register("estimated_amount")}
          />
        </FormSection>

        {/* ── Section 2: Preferred Vendor ───────────────────────────────────── */}
        <FormSection
          title="Preferred Vendor"
          description="Optional — select a vendor from your registered supplier list"
          bodyClassName="p-6 space-y-0"
        >
          <div className="relative">
            {selectedVendorName ? (
              <div className="flex items-center justify-between h-10 px-3 rounded-lg border border-brand-border bg-white text-sm text-brand-text-primary">
                <span>{selectedVendorName}</span>
                <button type="button" onClick={clearVendor} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div>
                <div
                  className="flex items-center h-10 px-3 rounded-lg border border-brand-border bg-white gap-2 cursor-text"
                  onClick={() => setVendorDropdownOpen(true)}
                >
                  <input
                    type="text"
                    placeholder="Search vendors…"
                    value={vendorSearch}
                    onChange={(e) => { setVendorSearch(e.target.value); setVendorDropdownOpen(true); }}
                    onFocus={() => setVendorDropdownOpen(true)}
                    className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
                  />
                  <ChevronDown size={14} className="text-gray-400 shrink-0" />
                </div>

                {vendorDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setVendorDropdownOpen(false)} />
                    <div className="absolute z-20 top-full mt-1 w-full bg-white border border-brand-border rounded-xl shadow-lg overflow-hidden">
                      {filteredVendors.length === 0 ? (
                        <div className="px-4 py-3">
                          <p className="text-sm text-brand-text-secondary">No vendors found</p>
                        </div>
                      ) : (
                        <ul className="max-h-52 overflow-y-auto">
                          {filteredVendors.map((vendor) => (
                            <li key={vendor.id}>
                              <button
                                type="button"
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors"
                                onClick={() => selectVendor(vendor.id, vendor.name)}
                              >
                                <span className="font-medium text-brand-text-primary">{vendor.name}</span>
                                <span className="ml-2 text-xs text-brand-text-secondary capitalize">
                                  {vendor.category.replace(/_/g, " ")}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            <p className="text-xs text-brand-text-secondary mt-1.5">
              Vendor details will be included on the Purchase Order
            </p>
          </div>
        </FormSection>

        {/* ── Section 3: Line Items ──────────────────────────────────────────── */}
        <FormSection
          title="Line Items"
          description="Add each item or service being requested — costs are in Nigerian Naira (₦)"
          className="overflow-hidden"
          bodyClassName="p-6 space-y-0"
        >
          <div>
            {errors.items?.root && (
              <p className="text-xs text-red-600 mb-3">{errors.items.root.message}</p>
            )}

            <div className="border border-brand-border rounded-xl overflow-hidden mb-4">
              {/* Header */}
              <div className="grid grid-cols-[1fr_80px_150px_150px_40px] gap-0 bg-gray-50 border-b border-brand-border">
                {["Description", "Qty", "Unit Price (₦)", "Total (₦)", ""].map((h) => (
                  <div key={h} className="px-3 py-2.5 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">
                    {h}
                  </div>
                ))}
              </div>

              {fields.map((field, i) => (
                <div
                  key={field.id}
                  className={[
                    "grid grid-cols-[1fr_80px_150px_150px_40px] gap-0 border-b border-brand-border last:border-b-0",
                    i % 2 === 1 ? "bg-gray-50/40" : "bg-white",
                  ].join(" ")}
                >
                  <div className="px-3 py-2">
                    <input
                      {...register(`items.${i}.description`)}
                      placeholder="Item description"
                      className="w-full text-sm outline-none bg-transparent placeholder:text-gray-400"
                    />
                    {errors.items?.[i]?.description && (
                      <p className="text-[10px] text-red-500 mt-0.5">{errors.items[i]?.description?.message}</p>
                    )}
                  </div>

                  <div className="px-3 py-2 border-l border-brand-border/50">
                    <input
                      {...register(`items.${i}.quantity`)}
                      type="number"
                      min="1"
                      placeholder="1"
                      className={["w-full text-sm outline-none bg-transparent placeholder:text-gray-400", errors.items?.[i]?.quantity ? "text-red-500" : ""].join(" ")}
                      onChange={(e) => {
                        setValue(`items.${i}.quantity`, e.target.value);
                        setTimeout(() => updateTotal(i), 0);
                      }}
                    />
                  </div>

                  <div className="px-3 py-2 border-l border-brand-border/50">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0.00"
                      value={costDisplays[i] ?? ""}
                      className="w-full text-sm outline-none bg-transparent placeholder:text-gray-400"
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, "");
                        setCostDisplays((prev) => ({ ...prev, [i]: applyCommas(e.target.value) }));
                        setValue(`items.${i}.unit_price`, raw || "0");
                        setTimeout(() => updateTotal(i), 0);
                      }}
                    />
                  </div>

                  <div className="px-3 py-2 border-l border-brand-border/50 flex items-center">
                    <span className="text-sm text-brand-text-primary">
                      {parseFloat(watchedItems[i]?.total_price ?? "0") > 0
                        ? formatCurrency(parseFloat(watchedItems[i].total_price))
                        : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-center border-l border-brand-border/50">
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(i)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Grand total row */}
              <div className="grid grid-cols-[1fr_80px_150px_150px_40px] gap-0 bg-brand-purple/5 border-t-2 border-brand-purple/20">
                <div className="col-span-3 px-3 py-2.5 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">
                  Total
                </div>
                <div className="px-3 py-2.5 font-semibold text-sm text-brand-purple">
                  {formatCurrency(grandTotal)}
                </div>
                <div />
              </div>
            </div>

            <button
              type="button"
              onClick={() => append({ description: "", quantity: "1", unit_price: "", total_price: "0" })}
              className="flex items-center gap-2 text-sm text-brand-purple hover:text-brand-purple-dark transition-colors font-medium"
            >
              <Plus size={15} /> Add Item
            </button>
          </div>
        </FormSection>

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="py-2">
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="px-6 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {createMutation.isPending ? (
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
