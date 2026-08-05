"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, X, ChevronDown, ArrowLeft } from "lucide-react";
import FileDropzone from "@/components/ui/FileDropzone";
import FormSection from "@/components/ui/FormSection";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FormSelect from "@/components/forms/FormSelect";
import FormInput from "@/components/forms/FormInput";
import FormPhoneInput from "@/components/forms/FormPhoneInput";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import { useCreateProcurement, useUpdateProcurement, useSubmitProcurement, useProcurement, useRemoveProcurementAttachment, useUploadProcurementAttachment, PROCUREMENT_MESSAGES } from "@/lib/modules/procurement";
import type { AttachmentInProcurement } from "@/types";
import { useVendors, useCreateVendor } from "@/lib/modules/vendors";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, capitalize } from "@/lib/utils";
import { useApproverPicker } from "@/lib/modules/workflow/useApproverPicker";
import WorkflowApproversSection from "@/components/ui/WorkflowApproversSection";

// ── Zod schema ─────────────────────────────────────────────────────────────────

const itemSchema = z.object({
  description: z.string().min(1, PROCUREMENT_MESSAGES.ITEM_DESCRIPTION_REQUIRED).max(500, PROCUREMENT_MESSAGES.ITEM_DESCRIPTION_MAX),
  quantity: z.string()
    .min(1, PROCUREMENT_MESSAGES.ITEM_QUANTITY_REQUIRED)
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, PROCUREMENT_MESSAGES.ITEM_QUANTITY_MIN),
  unit: z.string().min(1, PROCUREMENT_MESSAGES.ITEM_UNIT_REQUIRED),
  unit_cost: z.string()
    .min(1, PROCUREMENT_MESSAGES.ITEM_COST_REQUIRED)
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, PROCUREMENT_MESSAGES.ITEM_COST_MIN),
  total_cost: z.string(),
});

const schema = z.object({
  category: z.string().min(1, PROCUREMENT_MESSAGES.CATEGORY_REQUIRED),
  justification: z.string().min(1, PROCUREMENT_MESSAGES.JUSTIFICATION_REQUIRED).max(2000, "Max 2000 characters"),
  required_by: z.string().min(1, PROCUREMENT_MESSAGES.REQUIRED_BY_REQUIRED),
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

function NewProcurementContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get("edit"); // present when editing a returned request
  const isEditMode   = !!editId;
  const toast = useToast();

  const createMutation           = useCreateProcurement();
  const updateMutation           = useUpdateProcurement(editId ?? "");
  const submitMutation           = useSubmitProcurement();
  const removeAttachmentMutation = useRemoveProcurementAttachment();
  const uploadAttachmentMutation = useUploadProcurementAttachment();
  const createVendor             = useCreateVendor();
  const { data: vendors = [] }   = useVendors();
  const { data: existingReq }    = useProcurement(editId ?? "", { enabled: isEditMode });

  const [attachedFiles, setAttachedFiles]         = useState<File[]>([]);
  const [existingAttachment, setExistingAttachment] = useState<AttachmentInProcurement | null>(null);
  const [attachmentRemoved, setAttachmentRemoved]   = useState(false);
  const [qtyDisplays, setQtyDisplays] = useState<Record<number, string>>({});
  const [costDisplays, setCostDisplays] = useState<Record<number, string>>({});

  // Workflow-driven approver picks — reusable across all request form types
  const approverPicker = useApproverPicker("procurement", editId ?? undefined);

  const [vendorMode, setVendorMode] = useState<VendorMode>("existing");
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [selectedVendorName, setSelectedVendorName] = useState<string>("");
  const [vendorError, setVendorError] = useState<string>("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      required_by: "",
      items: [{ description: "", quantity: "", unit: "pieces", unit_cost: "", total_cost: "0" }],
    },
  });

  // Pre-populate form when editing an existing returned request
  useEffect(() => {
    if (!existingReq || !isEditMode) return;

    const mappedItems = existingReq.items.length > 0
      ? existingReq.items.map((item) => ({
          description: item.description,
          quantity:    String(item.quantity),
          unit:        item.unit ?? "pieces",
          unit_cost:   item.unit_price  != null ? String(item.unit_price)  : "",
          total_cost:  item.total_price != null ? String(item.total_price) : "0",
        }))
      : [{ description: "", quantity: "", unit: "pieces", unit_cost: "", total_cost: "0" }];

    reset({
      category:      existingReq.category    ?? "",
      justification: existingReq.description ?? "",
      required_by:   existingReq.required_by != null ? String(existingReq.required_by) : "",
      vendor_id:     existingReq.vendor_id   ?? "",
      items:         mappedItems,
    });

    // Populate qty and unit cost display states (these are separate from form state)
    const newQtyDisplays: Record<number, string>  = {};
    const newCostDisplays: Record<number, string> = {};
    existingReq.items.forEach((item, i) => {
      newQtyDisplays[i]  = applyCommas(String(item.quantity));
      if (item.unit_price != null) newCostDisplays[i] = applyCommas(String(item.unit_price));
    });
    setQtyDisplays(newQtyDisplays);
    setCostDisplays(newCostDisplays);

    // Pre-select existing vendor
    if (existingReq.vendor) {
      setSelectedVendorName(existingReq.vendor.name);
      setVendorMode("existing");
    }

    // Set existing attachment
    if (existingReq.attachment) {
      setExistingAttachment(existingReq.attachment);
    }
  }, [existingReq, isEditMode, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const watchedCategory = watch("category");
  const isServices = watchedCategory === "services";
  const unitOptions = isServices ? serviceUnitOptions : goodsUnitOptions;

  const updateTotal = useCallback(
    (index: number) => {
      const qty  = parseFloat(watchedItems[index]?.quantity ?? "0") || 0;
      const cost = parseFloat(watchedItems[index]?.unit_cost ?? "0") || 0;
      setValue(`items.${index}.total_cost`, String(qty * cost));
    },
    [watchedItems, setValue]
  );

  const grandTotal = watchedItems.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0);

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
    setVendorError("");
  }

  function clearVendor() {
    setValue("vendor_id", "");
    setSelectedVendorName("");
  }

  function switchVendorMode(mode: VendorMode) {
    setVendorMode(mode);
    clearVendor();
    setValue("new_vendor_name", "");
    setVendorError("");
  }

  async function onSubmit(formData: FormData) {
    // Validate vendor — required in both modes
    if (vendorMode === "existing" && !formData.vendor_id?.trim()) {
      setVendorError(PROCUREMENT_MESSAGES.VENDOR_REQUIRED);
      return;
    }
    if (vendorMode === "new") {
      const newVendorRequired: Array<{ field: keyof FormData; message: string }> = [
        { field: "new_vendor_name",           message: PROCUREMENT_MESSAGES.VENDOR_NAME_REQUIRED },
        { field: "new_vendor_contact_person", message: PROCUREMENT_MESSAGES.VENDOR_CONTACT_PERSON_REQUIRED },
        { field: "new_vendor_address",        message: PROCUREMENT_MESSAGES.VENDOR_ADDRESS_REQUIRED },
        { field: "new_vendor_phone",          message: PROCUREMENT_MESSAGES.VENDOR_PHONE_REQUIRED },
        { field: "new_vendor_email",          message: PROCUREMENT_MESSAGES.VENDOR_EMAIL_REQUIRED },
        { field: "new_vendor_bank_name",      message: PROCUREMENT_MESSAGES.VENDOR_BANK_NAME_REQUIRED },
        { field: "new_vendor_account_name",   message: PROCUREMENT_MESSAGES.VENDOR_ACCOUNT_NAME_REQUIRED },
        { field: "new_vendor_account_number", message: PROCUREMENT_MESSAGES.VENDOR_ACCOUNT_NUMBER_REQUIRED },
      ];
      let hasVendorError = false;
      for (const { field, message } of newVendorRequired) {
        if (!(formData[field] as string | undefined)?.trim()) {
          setError(field, { message });
          hasVendorError = true;
        }
      }
      if (hasVendorError) return;
    }
    setVendorError("");

    // Validate approver picks for any requester_pick steps
    const picksError = approverPicker.validate();
    if (picksError) { toast.error(picksError); return; }

    try {
      let vendorId = vendorMode === "existing" ? formData.vendor_id || undefined : undefined;

      // For new vendor mode: create the vendor first, then use its ID
      if (vendorMode === "new" && formData.new_vendor_name?.trim()) {
        const newVendor = await createVendor.mutateAsync({
          name:           formData.new_vendor_name.trim(),
          category:       formData.category,
          vendor_type:    "adhoc",
          contact_person: formData.new_vendor_contact_person || undefined,
          phone:          formData.new_vendor_phone          || undefined,
          email:          formData.new_vendor_email          || undefined,
          address:        formData.new_vendor_address        || undefined,
          bank_name:      formData.new_vendor_bank_name      || undefined,
          account_name:   formData.new_vendor_account_name   || undefined,
          account_number: formData.new_vendor_account_number || undefined,
        } as Parameters<typeof createVendor.mutateAsync>[0]);
        vendorId = newVendor.id;
      }

      // Map form fields to backend schema:
      //   justification → description
      //   unit_cost     → unit_price
      //   total_cost    → total_price
      const payload = {
        category:         formData.category,
        description:      formData.justification || undefined,
        required_by:      formData.required_by   || undefined,
        estimated_amount: grandTotal > 0 ? grandTotal : undefined,
        vendor_id:        vendorId,
        items: formData.items.map((item) => ({
          description: item.description,
          quantity:    parseFloat(item.quantity) || 1,
          unit:        item.unit || undefined,
          unit_price:  parseFloat(item.unit_cost) || null,
          total_price: parseFloat(item.total_cost) || null,
        })),
        picked_approvers: approverPicker.picksPayload,
      };
      if (isEditMode && editId) {
        // Edit mode: PATCH to update fields
        await updateMutation.mutateAsync(payload);
        // Handle attachment changes
        if (attachedFiles[0]) {
          // Upload new file (backend will delete the old one if it exists)
          await uploadAttachmentMutation.mutateAsync({ id: editId, file: attachedFiles[0] });
        } else if (attachmentRemoved) {
          // Remove existing attachment with no replacement
          await removeAttachmentMutation.mutateAsync(editId);
        }
        await submitMutation.mutateAsync(editId);
        toast.success("Request updated and resubmitted for approval");
      } else {
        // Create mode: POST with file
        const fd = new FormData();
        fd.append("data", JSON.stringify(payload));
        if (attachedFiles[0]) {
          fd.append("attachment", attachedFiles[0]);
        }
        await createMutation.mutateAsync(fd);
        toast.success("Purchase request submitted successfully");
      }
      router.push("/procurement");
    } catch (err) {
      toast.error((err as Error).message);
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
        title={isEditMode ? "Edit Purchase & Service Request" : "New Purchase & Service Request"}
        description={isEditMode ? "Update the details below and resubmit for approval" : "Fill in the details below and submit for approval"}
        className="mb-6"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Section 1: Request Details ───────────────────────────────────── */}
        <FormSection title="Request Details" description="Basic information about this request">
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <FormSelect
                  label="Category"
                  required
                  options={categoryOptions}
                  placeholder="Select category"
                  error={errors.category?.message}
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            <Controller
              control={control}
              name="required_by"
              render={({ field }) => (
                <FormDatePicker
                  label="Required By"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  error={errors.required_by?.message}
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
          <FormTextarea
            label="Justification / Purpose"
            required
            placeholder="Describe what is needed and why — this appears on the Purchase Order document"
            rows={3}
            error={errors.justification?.message}
            {...register("justification")}
          />
        </FormSection>

        {/* ── Section 2: Preferred Vendor ──────────────────────────────────── */}
        <FormSection title="Preferred Vendor" required description="Select an existing vendor from the list or enter a new vendor" bodyClassName="p-6 space-y-0">

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

          {vendorError && (
            <p className="text-xs text-red-600 mb-3">{vendorError}</p>
          )}

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
                  required
                  placeholder="e.g. John Adeyemi"
                  error={errors.new_vendor_contact_person?.message}
                  {...register("new_vendor_contact_person")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormPhoneInput
                  label="Phone"
                  required
                  placeholder="+234 xxx xxx xxxx"
                  error={errors.new_vendor_phone?.message}
                  {...register("new_vendor_phone")}
                />
                <FormInput
                  label="Email"
                  type="email"
                  required
                  placeholder="vendor@example.com"
                  error={errors.new_vendor_email?.message}
                  {...register("new_vendor_email")}
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <FormInput
                  label="Address"
                  required
                  placeholder="Street, City"
                  error={errors.new_vendor_address?.message}
                  {...register("new_vendor_address")}
                />
              </div>
              <div className="pt-1">
                <p className="text-xs font-medium text-brand-text-secondary uppercase tracking-wide mb-3">Bank Details</p>
                <div className="grid grid-cols-3 gap-4">
                  <FormInput
                    label="Bank Name"
                    required
                    placeholder="e.g. First Bank"
                    error={errors.new_vendor_bank_name?.message}
                    {...register("new_vendor_bank_name")}
                  />
                  <FormInput
                    label="Account Name"
                    required
                    placeholder="Account holder name"
                    error={errors.new_vendor_account_name?.message}
                    {...register("new_vendor_account_name")}
                  />
                  <FormInput
                    label="Account Number"
                    required
                    placeholder="0123456789"
                    error={errors.new_vendor_account_number?.message}
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
          required
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
                      type="text"
                      inputMode="numeric"
                      placeholder="1"
                      value={qtyDisplays[i] ?? ""}
                      className={["w-full text-sm outline-none bg-transparent placeholder:text-gray-400", errors.items?.[i]?.quantity ? "text-red-500" : ""].join(" ")}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, "");
                        setQtyDisplays((prev) => ({ ...prev, [i]: applyCommas(e.target.value) }));
                        setValue(`items.${i}.quantity`, raw);
                        clearErrors(`items.${i}.quantity`);
                        setTimeout(() => updateTotal(i), 0);
                      }}
                    />
                    {errors.items?.[i]?.quantity && (
                      <p className="text-[10px] text-red-500 mt-0.5">{errors.items[i]?.quantity?.message}</p>
                    )}
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
                      type="text"
                      inputMode="numeric"
                      placeholder="0.00"
                      value={costDisplays[i] ?? ""}
                      className={["w-full text-sm outline-none bg-transparent placeholder:text-gray-400", errors.items?.[i]?.unit_cost ? "text-red-500" : ""].join(" ")}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, "");
                        setCostDisplays((prev) => ({ ...prev, [i]: applyCommas(e.target.value) }));
                        setValue(`items.${i}.unit_cost`, raw);
                        clearErrors(`items.${i}.unit_cost`);
                        setTimeout(() => updateTotal(i), 0);
                      }}
                    />
                    {errors.items?.[i]?.unit_cost && (
                      <p className="text-[10px] text-red-500 mt-0.5">{errors.items[i]?.unit_cost?.message}</p>
                    )}
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
              onClick={() => append({ description: "", quantity: "", unit: isServices ? "days" : "pieces", unit_cost: "", total_cost: "0" })}
              className="flex items-center gap-2 text-sm text-brand-purple hover:text-brand-purple-dark transition-colors font-medium"
            >
              <Plus size={15} /> {isServices ? "Add Service Item" : "Add Item"}
            </button>
          </div>
        </FormSection>

        {/* ── Section 4: Attachment ────────────────────────────────────────── */}
        <FormSection title="Supporting Document" description="Optional — attach a quote, spec sheet, or any supporting file" bodyClassName="p-6 space-y-0">
          {isEditMode && existingAttachment && !attachmentRemoved ? (
            <div className="flex items-center justify-between rounded-lg border border-brand-border bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-text-primary truncate">{existingAttachment.name}</p>
                  <p className="text-xs text-brand-text-secondary mt-0.5">
                    {existingAttachment.mime_type ?? "Unknown type"}
                    {existingAttachment.file_size != null && ` · ${(existingAttachment.file_size / 1024).toFixed(1)} KB`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <a
                  href={existingAttachment.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-purple hover:text-brand-purple-dark transition-colors"
                >
                  Open
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentRemoved(true);
                    setExistingAttachment(null);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <FileDropzone
              value={attachedFiles}
              onChange={setAttachedFiles}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              maxFiles={1}
              maxSizeMB={10}
              hint="PDF, Word, Excel, or images — max 10 MB"
            />
          )}
        </FormSection>

        {/* ── Approvers (rendered by reusable hook + component) ───────────── */}
        <WorkflowApproversSection {...approverPicker} />

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="py-2">
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || createVendor.isPending || updateMutation.isPending || submitMutation.isPending || uploadAttachmentMutation.isPending || removeAttachmentMutation.isPending}
            className="px-6 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isSubmitting || createMutation.isPending || createVendor.isPending || updateMutation.isPending || submitMutation.isPending || uploadAttachmentMutation.isPending || removeAttachmentMutation.isPending ? (
              <>
                <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              isEditMode ? "Update & Resubmit" : "Submit Request"
            )}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}

export default function NewProcurementPage() {
  return (
    <Suspense
      fallback={
        <AppLayout pageTitle="Procurement">
          <div className="flex justify-center py-20"><LoadingSpinner /></div>
        </AppLayout>
      }
    >
      <NewProcurementContent />
    </Suspense>
  );
}
