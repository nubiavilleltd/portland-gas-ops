"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, X, ChevronDown } from "lucide-react";
import FileDropzone from "@/components/ui/FileDropzone";
import FormSection from "@/components/ui/FormSection";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import { useCreateProcurement } from "@/hooks/useProcurement";
import { useVendors } from "@/hooks/useVendors";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, capitalize } from "@/lib/utils";
import type { ProcurementCategory, ProcurementPriority, ItemUnit } from "@/types";

// ── Zod schema ─────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500, "Max 500 characters"),
  quantity: z.string()
    .min(1, "Required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Must be greater than 0"),
  unit: z.string().min(1, "Required"),
  unit_cost: z.string()
    .min(1, "Required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Must be greater than 0"),
  total_cost: z.string(),
});


const schema = z.object({
  category: z.string().min(1, "Select a category"),
  priority: z.string().min(1, "Select priority"),
  justification: z.string().max(2000, "Max 2000 characters").optional(),
  required_by: z.string().optional(),
  vendor_id: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item"),
});

type FormData = z.infer<typeof schema>;

// ── Options ────────────────────────────────────────────────────────────────────

const categoryOptions = [
  { value: "consumables", label: "Consumables" },
  { value: "technical", label: "Technical" },
  //{ value: "services", label: "Services" },
];

const priorityOptions = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
];

const unitOptions = [
  { value: "pieces", label: "Pieces" },
  { value: "litres", label: "Litres" },
  { value: "kg", label: "KG" },
  { value: "boxes", label: "Boxes" },
  { value: "metres", label: "Metres" },
  { value: "hours", label: "Hours" },
  { value: "sets", label: "Sets" },
  { value: "cartons", label: "Cartons" },
  { value: "units", label: "Units" },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function NewProcurementPage() {
  const router = useRouter();
  const toast = useToast();
  const createMutation = useCreateProcurement();
  const { data: vendors = [] } = useVendors();

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [selectedVendorName, setSelectedVendorName] = useState<string>("");

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
      priority: "routine",
      items: [{ description: "", quantity: "1", unit: "pieces", unit_cost: "0", total_cost: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const watchedCategory = watch("category");

  // Auto-calculate total_cost when qty or unit_cost changes
  const updateTotal = useCallback(
    (index: number) => {
      const qty = parseFloat(watchedItems[index]?.quantity ?? "0") || 0;
      const cost = parseFloat(watchedItems[index]?.unit_cost ?? "0") || 0;
      setValue(`items.${index}.total_cost`, String(qty * cost));
    },
    [watchedItems, setValue]
  );

  const grandTotal = watchedItems.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0);

  // Vendor picker helpers
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
        data: {
          title: `${capitalize(formData.category)} request`,
          category: formData.category as ProcurementCategory,
          priority: formData.priority as ProcurementPriority,
          justification: formData.justification,
          required_by: formData.required_by || undefined,
          vendor_id: formData.vendor_id || undefined,
          items: formData.items.map((item) => ({
            description: item.description,
            quantity: parseFloat(item.quantity) || 0,
            unit: item.unit as ItemUnit,
            unit_cost: parseFloat(item.unit_cost) || 0,
            total_cost: parseFloat(item.total_cost) || 0,
          })),
        },
        file: attachedFiles[0] ?? null,
      });
      toast.success("Purchase request submitted successfully");
      router.push("/procurement");
    } catch {
      toast.error("Failed to submit request. Please try again.");
    }
  }

  return (
    <AppLayout pageTitle="Procurement">
      <PageHeader
        title="New Purchase Request"
        description="Fill in the details below and submit for procurement review"
        className="mb-6"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Section 1: Request Details ───────────────────────────────────── */}
        <FormSection title="Request Details" description="Basic information about this purchase request">
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Category"
              required
              options={categoryOptions}
              placeholder="Select category"
              error={errors.category?.message}
              {...register("category")}
            />
            <FormSelect
              label="Priority"
              required
              options={priorityOptions}
              error={errors.priority?.message}
              {...register("priority")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormDatePicker label="Required By" {...register("required_by")} />
          </div>
          <FormTextarea
            label="Justification / Purpose"
            placeholder="Describe what is needed and why — this appears on the Purchase Order document"
            rows={3}
            {...register("justification")}
          />
        </FormSection>

        {/* ── Section 2: Vendor ────────────────────────────────────────────── */}
        {/* No overflow-hidden — dropdown needs to escape the card boundary */}
        <FormSection title="Vendor" description="Optional — select an existing vendor" bodyClassName="p-6 space-y-0">
          <div className="relative">
              <label className="block text-sm font-medium text-brand-text-primary mb-1">Vendor</label>

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
              <p className="text-xs text-brand-text-secondary mt-1">
                Vendor details will be included on the Purchase Order PDF
              </p>
            </div>
        </FormSection>

        {/* ── Section 3: Line Items ────────────────────────────────────────── */}
        <FormSection title="Line Items" description="Add each item being requested — costs are in Nigerian Naira (₦)" className="overflow-hidden" bodyClassName="p-6 space-y-0">
          <div>
            {errors.items?.root && (
              <p className="text-xs text-red-600 mb-3">{errors.items.root.message}</p>
            )}

            {/* Items table */}
            <div className="border border-brand-border rounded-xl overflow-hidden mb-4">
              {/* Header */}
              <div className="grid grid-cols-[1fr_80px_100px_120px_120px_40px] gap-0 bg-gray-50 border-b border-brand-border">
                {["Description", "Qty", "Unit", "Unit Cost (₦)", "Total (₦)", ""].map((h) => (
                  <div key={h} className="px-3 py-2.5 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {fields.map((field, i) => (
                <div
                  key={field.id}
                  className={[
                    "grid grid-cols-[1fr_80px_100px_120px_120px_40px] gap-0 border-b border-brand-border last:border-b-0",
                    i % 2 === 1 ? "bg-gray-50/40" : "bg-white",
                  ].join(" ")}
                >
                  {/* Description */}
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

                  {/* Quantity */}
                  <div className="px-3 py-2 border-l border-brand-border/50">
                    <input
                      {...register(`items.${i}.quantity`)}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="1"
                      className={[
                        "w-full text-sm outline-none bg-transparent placeholder:text-gray-400",
                        errors.items?.[i]?.quantity ? "text-red-500" : "",
                      ].join(" ")}
                      onChange={(e) => {
                        register(`items.${i}.quantity`).onChange(e);
                        setTimeout(() => updateTotal(i), 0);
                      }}
                    />
                    {errors.items?.[i]?.quantity && (
                      <p className="text-[10px] text-red-500 mt-0.5">{errors.items[i]?.quantity?.message}</p>
                    )}
                  </div>

                  {/* Unit */}
                  <div className="px-2 py-2 border-l border-brand-border/50">
                    <select
                      {...register(`items.${i}.unit`)}
                      className="w-full text-sm outline-none bg-transparent"
                    >
                      {unitOptions.map((u) => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Unit Cost */}
                  <div className="px-3 py-2 border-l border-brand-border/50">
                    <input
                      {...register(`items.${i}.unit_cost`)}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={[
                        "w-full text-sm outline-none bg-transparent placeholder:text-gray-400",
                        errors.items?.[i]?.unit_cost ? "text-red-500" : "",
                      ].join(" ")}
                      onChange={(e) => {
                        register(`items.${i}.unit_cost`).onChange(e);
                        setTimeout(() => updateTotal(i), 0);
                      }}
                    />
                    {errors.items?.[i]?.unit_cost && (
                      <p className="text-[10px] text-red-500 mt-0.5">{errors.items[i]?.unit_cost?.message}</p>
                    )}
                  </div>

                  {/* Total */}
                  <div className="px-3 py-2 border-l border-brand-border/50 flex items-center">
                    <span className="text-sm text-brand-text-primary">
                      {parseFloat(watchedItems[i]?.total_cost ?? "0") > 0
                        ? formatCurrency(parseFloat(watchedItems[i].total_cost))
                        : "—"}
                    </span>
                  </div>

                  {/* Remove */}
                  <div className="flex items-center justify-center border-l border-brand-border/50">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="text-gray-300 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Grand total row */}
              <div className="grid grid-cols-[1fr_80px_100px_120px_120px_40px] gap-0 bg-brand-purple/5 border-t-2 border-brand-purple/20">
                <div className="col-span-4 px-3 py-2.5 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">
                  Estimated Total
                </div>
                <div className="px-3 py-2.5 font-semibold text-sm text-brand-purple">
                  {formatCurrency(grandTotal)}
                </div>
                <div />
              </div>
            </div>

            <button
              type="button"
              onClick={() => append({ description: "", quantity: "1", unit: "pieces", unit_cost: "0", total_cost: "0" })}
              className="flex items-center gap-2 text-sm text-brand-purple hover:text-brand-purple-dark transition-colors font-medium"
            >
              <Plus size={15} /> Add Item
            </button>
          </div>
        </FormSection>

        {/* ── Section 4: Attachment ────────────────────────────────────────── */}
        <FormSection title="Supporting Document" description="Optional — attach a quote, spec sheet, or any supporting file" bodyClassName="p-6 space-y-0">
          <FileDropzone
            value={attachedFiles}
            onChange={setAttachedFiles}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            maxFiles={1}
            maxSizeMB={10}
            hint="PDF, Word, Excel, or images — max 10 MB"
          />
        </FormSection>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
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
              "Submit Purchase Request"
            )}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
