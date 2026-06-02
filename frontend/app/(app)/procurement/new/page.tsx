"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, X, ChevronDown, ArrowLeft } from "lucide-react";
import FileDropzone from "@/components/ui/FileDropzone";
import FormSection from "@/components/ui/FormSection";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FormSelect from "@/components/forms/FormSelect";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import { useCreateProcurement } from "@/hooks/useProcurement";
import { useVendors } from "@/hooks/useVendors";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, capitalize } from "@/lib/utils";
import type { ProcurementCategory, ItemUnit } from "@/types";

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
  justification: z.string().max(2000, "Max 2000 characters").optional(),
  required_by: z.string().optional(),
  vendor_id: z.string().optional(),
  // one-time vendor fields
  new_vendor_name: z.string().optional(),
  new_vendor_contact_person: z.string().optional(),
  new_vendor_address: z.string().optional(),
  new_vendor_phone: z.string().optional(),
  new_vendor_email: z.string().optional(),
  new_vendor_bank_name: z.string().optional(),
  new_vendor_account_name: z.string().optional(),
  new_vendor_account_number: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item"),
});

type FormData = z.infer<typeof schema>;
type VendorMode = "existing" | "new";

// ── Options ────────────────────────────────────────────────────────────────────

const categoryOptions = [
  { value: "consumables", label: "Consumables" },
  { value: "technical",   label: "Technical" },
  { value: "services",    label: "Services" },
];

const goodsUnitOptions = [
  { value: "pieces",  label: "Pieces" },
  { value: "litres",  label: "Litres" },
  { value: "kg",      label: "KG" },
  { value: "boxes",   label: "Boxes" },
  { value: "metres",  label: "Metres" },
  { value: "sets",    label: "Sets" },
  { value: "cartons", label: "Cartons" },
  { value: "units",   label: "Units" },
];

const serviceUnitOptions = [
  { value: "days",   label: "Days" },
  { value: "hours",  label: "Hours" },
  { value: "months", label: "Months" },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function NewProcurementPage() {
  const router = useRouter();
  const toast = useToast();
  const createMutation = useCreateProcurement();
  const { data: vendors = [] } = useVendors();

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [vendorMode, setVendorMode] = useState<VendorMode>("existing");
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
      items: [{ description: "", quantity: "1", unit: "pieces", unit_cost: "0", total_cost: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const watchedCategory = watch("category");
  const isServices = watchedCategory === "services";
  const unitOptions = isServices ? serviceUnitOptions : goodsUnitOptions;

  const updateTotal = useCallback(
    (index: number) => {
      const qty = parseFloat(watchedItems[index]?.quantity ?? "0") || 0;
      const cost = parseFloat(watchedItems[index]?.unit_cost ?? "0") || 0;
      setValue(`items.${index}.total_cost`, String(qty * cost));
    },
    [watchedItems, setValue]
  );

  const grandTotal = watchedItems.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0);

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

  function switchVendorMode(mode: VendorMode) {
    setVendorMode(mode);
    clearVendor();
    setValue("new_vendor_name", "");
  }

  async function onSubmit(formData: FormData) {
    // Validate: if mode is "new", name is required
    if (vendorMode === "new" && !formData.new_vendor_name?.trim()) {
      toast.error("Vendor name is required when entering a new vendor");
      return;
    }

    const oneTimeVendor = vendorMode === "new" && formData.new_vendor_name?.trim() ? {
      name: formData.new_vendor_name.trim(),
      contact_person: formData.new_vendor_contact_person || undefined,
      address: formData.new_vendor_address || undefined,
      phone: formData.new_vendor_phone || undefined,
      email: formData.new_vendor_email || undefined,
      bank_name: formData.new_vendor_bank_name || undefined,
      account_name: formData.new_vendor_account_name || undefined,
      account_number: formData.new_vendor_account_number || undefined,
    } : undefined;

    try {
      await createMutation.mutateAsync({
        data: {
          category: formData.category as ProcurementCategory,
          justification: formData.justification,
          required_by: formData.required_by || undefined,
          vendor_id: vendorMode === "existing" ? formData.vendor_id || undefined : undefined,
          one_time_vendor: oneTimeVendor,
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

        {/* ── Section 1: Request Details ───────────────────────────────────── */}
        <FormSection title="Request Details" description="Basic information about this request">
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Category"
              required
              options={categoryOptions}
              placeholder="Select category"
              error={errors.category?.message}
              {...register("category")}
            />
            <FormDatePicker label="Required By" {...register("required_by")} />
          </div>
          <FormTextarea
            label="Justification / Purpose"
            placeholder="Describe what is needed and why — this appears on the Purchase Order document"
            rows={3}
            {...register("justification")}
          />
        </FormSection>

        {/* ── Section 2: Preferred Vendor ──────────────────────────────────── */}
        <FormSection title="Preferred Vendor" description="Optional — select an existing vendor or enter a new one" bodyClassName="p-6 space-y-0">

          {/* Toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-5">
            {(["existing", "new"] as VendorMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => switchVendorMode(mode)}
                className={[
                  "px-4 py-1.5 text-sm rounded-md transition-colors font-medium",
                  vendorMode === mode
                    ? "bg-white text-brand-text-primary shadow-sm"
                    : "text-brand-text-secondary hover:text-brand-text-primary",
                ].join(" ")}
              >
                {mode === "existing" ? "Use Existing" : "Enter New"}
              </button>
            ))}
          </div>

          {vendorMode === "existing" ? (
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
                Vendor details will be included on the Purchase Order PDF
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Vendor Name"
                  required
                  placeholder="e.g. MRS Filling Station"
                  error={errors.new_vendor_name?.message}
                  {...register("new_vendor_name")}
                />
                <FormInput
                  label="Contact Person"
                  placeholder="e.g. John Adeyemi"
                  {...register("new_vendor_contact_person")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Phone"
                  placeholder="+234 xxx xxx xxxx"
                  {...register("new_vendor_phone")}
                />
                <FormInput
                  label="Email"
                  type="email"
                  placeholder="vendor@example.com"
                  {...register("new_vendor_email")}
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <FormInput
                  label="Address"
                  placeholder="Street, City"
                  {...register("new_vendor_address")}
                />
              </div>
              <div className="pt-1">
                <p className="text-xs font-medium text-brand-text-secondary uppercase tracking-wide mb-3">Bank Details</p>
                <div className="grid grid-cols-3 gap-4">
                  <FormInput
                    label="Bank Name"
                    placeholder="e.g. First Bank"
                    {...register("new_vendor_bank_name")}
                  />
                  <FormInput
                    label="Account Name"
                    placeholder="Account holder name"
                    {...register("new_vendor_account_name")}
                  />
                  <FormInput
                    label="Account Number"
                    placeholder="0123456789"
                    {...register("new_vendor_account_number")}
                  />
                </div>
              </div>
            </div>
          )}
        </FormSection>

        {/* ── Section 3: Line Items ────────────────────────────────────────── */}
        <FormSection
          title={isServices ? "Service Items" : "Line Items"}
          description={isServices
            ? "Add each service being requested — specify duration and rate"
            : "Add each item being requested — costs are in Nigerian Naira (₦)"
          }
          className="overflow-hidden"
          bodyClassName="p-6 space-y-0"
        >
          <div>
            {errors.items?.root && (
              <p className="text-xs text-red-600 mb-3">{errors.items.root.message}</p>
            )}

            <div className="border border-brand-border rounded-xl overflow-hidden mb-4">
              {/* Header */}
              <div className="grid grid-cols-[1fr_80px_100px_130px_130px_40px] gap-0 bg-gray-50 border-b border-brand-border">
                {[
                  "Description",
                  isServices ? "Duration" : "Qty",
                  "Unit",
                  isServices ? "Rate (₦)" : "Unit Cost (₦)",
                  "Total (₦)",
                  "",
                ].map((h) => (
                  <div key={h} className="px-3 py-2.5 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">
                    {h}
                  </div>
                ))}
              </div>

              {fields.map((field, i) => (
                <div
                  key={field.id}
                  className={[
                    "grid grid-cols-[1fr_80px_100px_130px_130px_40px] gap-0 border-b border-brand-border last:border-b-0",
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
                      min="0"
                      step="0.01"
                      placeholder="1"
                      className={["w-full text-sm outline-none bg-transparent placeholder:text-gray-400", errors.items?.[i]?.quantity ? "text-red-500" : ""].join(" ")}
                      onChange={(e) => { register(`items.${i}.quantity`).onChange(e); setTimeout(() => updateTotal(i), 0); }}
                    />
                  </div>

                  <div className="px-2 py-2 border-l border-brand-border/50">
                    <select {...register(`items.${i}.unit`)} className="w-full text-sm outline-none bg-transparent">
                      {unitOptions.map((u) => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="px-3 py-2 border-l border-brand-border/50">
                    <input
                      {...register(`items.${i}.unit_cost`)}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={["w-full text-sm outline-none bg-transparent placeholder:text-gray-400", errors.items?.[i]?.unit_cost ? "text-red-500" : ""].join(" ")}
                      onChange={(e) => { register(`items.${i}.unit_cost`).onChange(e); setTimeout(() => updateTotal(i), 0); }}
                    />
                  </div>

                  <div className="px-3 py-2 border-l border-brand-border/50 flex items-center">
                    <span className="text-sm text-brand-text-primary">
                      {parseFloat(watchedItems[i]?.total_cost ?? "0") > 0
                        ? formatCurrency(parseFloat(watchedItems[i].total_cost))
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
              <div className="grid grid-cols-[1fr_80px_100px_130px_130px_40px] gap-0 bg-brand-purple/5 border-t-2 border-brand-purple/20">
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
              onClick={() => append({ description: "", quantity: "1", unit: isServices ? "days" : "pieces", unit_cost: "0", total_cost: "0" })}
              className="flex items-center gap-2 text-sm text-brand-purple hover:text-brand-purple-dark transition-colors font-medium"
            >
              <Plus size={15} /> {isServices ? "Add Service Item" : "Add Item"}
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
              "Submit Request"
            )}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
