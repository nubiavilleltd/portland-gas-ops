"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Upload, X, FileText, Trash2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";
import FormPhoneInput from "@/components/forms/FormPhoneInput";
import FormTextarea from "@/components/forms/FormTextarea";
import FormSelect from "@/components/forms/FormSelect";
import type { VendorCategory, VendorSize } from "@/types";

const CATEGORY_OPTIONS = [
  { value: "equipment",     label: "EQUIPMENT" },
  { value: "ppe",           label: "PPE" },
  { value: "technical",     label: "TECHNICAL" },
  { value: "consumables",   label: "CONSUMABLES" },
  { value: "food_beverage", label: "FOOD & BEVERAGE" },
  { value: "services",      label: "SERVICES" },
  { value: "it",            label: "IT" },
  { value: "logistics",     label: "LOGISTICS" },
];

const BUSINESS_SIZE_OPTIONS = [
  { value: "small",        label: "Small (Turnover ≤ ₦25 million)" },
  { value: "medium_large", label: "Medium / Large (Turnover > ₦25 million)" },
];

export interface VendorFormValues {
  name: string;
  category: VendorCategory | "";
  business_size: VendorSize | "";
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  logo_url: string;
  // Existing document URLs (from backend)
  cac_certificate_url: string;
  tin_certificate_url: string;
  vat_certificate_url: string;
}

export const EMPTY_VENDOR_FORM: VendorFormValues = {
  name: "", category: "", business_size: "", contact_person: "", phone: "",
  email: "", address: "", bank_name: "", account_name: "", account_number: "",
  logo_url: "", cac_certificate_url: "", tin_certificate_url: "", vat_certificate_url: "",
};

export interface VendorDocumentFiles {
  cac: File | null;
  tin: File | null;
  vat: File | null;
}

interface Props {
  title: string;
  description: string;
  initial: VendorFormValues;
  loading: boolean;
  onSubmit: (values: VendorFormValues, logoFile: File | null, documentFiles: VendorDocumentFiles) => void;
}

export default function VendorForm({ title, description, initial, loading, onSubmit }: Props) {
  const [form, setForm] = useState<VendorFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof VendorFormValues | "cac" | "tin" | "vat", string>>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(initial.logo_url || "");
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document files state
  const [documentFiles, setDocumentFiles] = useState<VendorDocumentFiles>({ cac: null, tin: null, vat: null });
  const cacInputRef = useRef<HTMLInputElement>(null);
  const tinInputRef = useRef<HTMLInputElement>(null);
  const vatInputRef = useRef<HTMLInputElement>(null);

  const MAX_LOGO_SIZE_MB = 2;
  const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;
  const MAX_DOC_SIZE_MB = 5;
  const MAX_DOC_SIZE_BYTES = MAX_DOC_SIZE_MB * 1024 * 1024;

  const isMediumLarge = form.business_size === "medium_large";

  function set(field: keyof VendorFormValues, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setLogoError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is ${MAX_LOGO_SIZE_MB} MB.`);
      // Clear the input so the same file can be re-selected after they pick a smaller one
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setLogoError(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleDocumentChange(docType: keyof VendorDocumentFiles, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setErrors((prev) => ({ ...prev, [docType]: "Only PDF files are allowed" }));
      return;
    }

    if (file.size > MAX_DOC_SIZE_BYTES) {
      setErrors((prev) => ({ ...prev, [docType]: `File is too large. Maximum size is ${MAX_DOC_SIZE_MB} MB.` }));
      return;
    }

    setErrors((prev) => ({ ...prev, [docType]: undefined }));
    setDocumentFiles((prev) => ({ ...prev, [docType]: file }));
  }

  function clearDocument(docType: keyof VendorDocumentFiles) {
    setDocumentFiles((prev) => ({ ...prev, [docType]: null }));
    // Clear the existing URL if removing
    const urlField = `${docType}_certificate_url` as keyof VendorFormValues;
    setForm((f) => ({ ...f, [urlField]: "" }));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim())           e.name           = "Vendor name is required";
    if (!form.category)              e.category       = "Category is required";
    if (!form.business_size)         e.business_size  = "Business size is required";
    if (!form.contact_person.trim()) e.contact_person = "Contact person is required";
    if (!form.phone.trim())          e.phone          = "Phone number is required";
    if (!form.email.trim())          e.email          = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.address.trim())        e.address        = "Address is required";
    if (!form.bank_name.trim())      e.bank_name      = "Bank name is required";
    if (!form.account_name.trim())   e.account_name   = "Account name is required";
    if (!form.account_number.trim()) e.account_number = "Account number is required";
    else if (!/^\d{10}$/.test(form.account_number)) e.account_number = "Account number must be exactly 10 digits";

    // Document requirements - only validate if business_size is set
    if (form.business_size) {
      // CAC & TIN are required for all vendors
      const hasCac = !!form.cac_certificate_url || !!documentFiles.cac;
      const hasTin = !!form.tin_certificate_url || !!documentFiles.tin;
      if (!hasCac) e.cac = "CAC certificate is required";
      if (!hasTin) e.tin = "TIN certificate is required";

      // VAT is required only for medium/large vendors
      if (form.business_size === "medium_large") {
        const hasVat = !!form.vat_certificate_url || !!documentFiles.vat;
        if (!hasVat) e.vat = "VAT certificate is required for medium/large businesses";
      }
    }

    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit(form, logoFile, documentFiles);
  }

  // Helper to render document upload row
  function DocumentUploadRow({
    label,
    docType,
    required,
    existingUrl,
    file,
    inputRef,
    error,
  }: {
    label: string;
    docType: keyof VendorDocumentFiles;
    required: boolean;
    existingUrl: string;
    file: File | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    error?: string;
  }) {
    const hasExisting = !!existingUrl;
    const hasFile = !!file;

    return (
      <div className="flex items-start justify-between py-3 border-b border-brand-border last:border-b-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-brand-text-primary">
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </p>
            {(hasExisting || hasFile) && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Uploaded
              </span>
            )}
          </div>
          {hasFile && (
            <p className="text-xs text-brand-text-secondary mt-1 truncate">{file.name}</p>
          )}
          {hasExisting && !hasFile && (
            <a
              href={existingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-purple hover:underline mt-1 inline-block"
            >
              View document
            </a>
          )}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => handleDocumentChange(docType, e)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Upload size={14} />}
            onClick={() => inputRef.current?.click()}
          >
            {hasExisting || hasFile ? "Replace" : "Upload"}
          </Button>
          {(hasExisting || hasFile) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              onClick={() => clearDocument(docType)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <AppLayout pageTitle="Admin — Vendors">
      <Link
        href="/admin/vendors"
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors mb-5"
      >
        <ArrowLeft size={14} /> Back to Vendors
      </Link>

      <PageHeader title={title} description={description} className="mb-6" />

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Vendor Logo */}
        <FormSection title="Vendor Logo" description="Upload a logo to display on the vendor profile and documents">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-xl border border-brand-border bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview ? (
                <Image src={logoPreview} alt="Vendor logo" width={80} height={80} className="object-contain h-full w-full" />
              ) : (
                <span className="text-2xl font-bold text-gray-300">
                  {form.name ? form.name.charAt(0).toUpperCase() : "?"}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload size={14} />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? "Change Logo" : "Upload Logo"}
                </Button>
                {logoPreview && (
                  <>
                    <span className="w-px h-5 bg-brand-border shrink-0" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      leftIcon={<X size={13} />}
                      onClick={() => { setLogoPreview(""); setLogoFile(null); setLogoError(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    >
                      Remove logo
                    </Button>
                  </>
                )}
              </div>
              <p className="text-xs text-brand-text-secondary">PNG, JPG, SVG or WebP. Max 2 MB.</p>
              {logoError && <p className="text-xs text-red-600">{logoError}</p>}
            </div>
          </div>
        </FormSection>

        {/* Vendor Details */}
        <FormSection title="Vendor Details" description="Basic information about the supplier or service provider">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <FormInput
                label="Vendor Name"
                required
                placeholder="e.g. Persianas Furniture Limited"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                error={errors.name}
              />
            </div>
            <FormSelect
              label="Category"
              required
              placeholder="Select category…"
              options={CATEGORY_OPTIONS}
              value={form.category}
              onValueChange={(v) => set("category", v)}
              error={errors.category}
              sortOptions={false}
            />
            <FormSelect
              label="Business Size"
              required
              placeholder="Select business size…"
              options={BUSINESS_SIZE_OPTIONS}
              value={form.business_size}
              onValueChange={(v) => set("business_size", v)}
              error={errors.business_size}
              sortOptions={false}
            />
            <FormInput
              label="Contact Person"
              required
              placeholder="e.g. Emeka Okafor"
              value={form.contact_person}
              onChange={(e) => set("contact_person", e.target.value)}
              error={errors.contact_person}
            />
            <FormPhoneInput
              label="Phone"
              required
              placeholder="+234 (0) 800 000 0000"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              error={errors.phone}
            />
            <FormInput
              label="Email"
              type="email"
              required
              placeholder="vendor@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
            />
            <div className="sm:col-span-2">
              <FormTextarea
                label="Address"
                required
                placeholder="Street, City, State"
                rows={2}
                maxLength={300}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                error={errors.address}
              />
            </div>
          </div>
        </FormSection>

        {/* Bank Details */}
        <FormSection title="Bank Details" description="Payment and remittance information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormInput
              label="Bank Name"
              required
              placeholder="e.g. First Bank"
              value={form.bank_name}
              onChange={(e) => set("bank_name", e.target.value)}
              error={errors.bank_name}
            />
            <FormInput
              label="Account Name"
              required
              placeholder="e.g. Persianas Furniture Ltd"
              value={form.account_name}
              onChange={(e) => set("account_name", e.target.value)}
              error={errors.account_name}
            />
            <FormPhoneInput
              label="Account Number"
              required
              placeholder="10-digit account number"
              inputMode="numeric"
              maxLength={10}
              value={form.account_number}
              onChange={(e) => set("account_number", e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                // Tighten to digits only — block +, -, (, ), space that FormPhoneInput permits
                if (!e.ctrlKey && !e.metaKey && e.key.length === 1 && !/\d/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 10);
                set("account_number", digits);
              }}
              error={errors.account_number}
            />
          </div>
        </FormSection>

        {/* Compliance Documents */}
        <FormSection
          title="Compliance Documents"
          description={
            form.business_size
              ? form.business_size === "small"
                ? "CAC and TIN certificates are required. VAT is optional for small businesses."
                : "CAC, TIN and VAT certificates are required for medium/large businesses"
              : "Select a business size above to see document requirements"
          }
        >
          {form.business_size ? (
            <div className="divide-y divide-brand-border">
              <DocumentUploadRow
                label="CAC Certificate"
                docType="cac"
                required
                existingUrl={form.cac_certificate_url}
                file={documentFiles.cac}
                inputRef={cacInputRef}
                error={errors.cac}
              />
              <DocumentUploadRow
                label="TIN Certificate"
                docType="tin"
                required
                existingUrl={form.tin_certificate_url}
                file={documentFiles.tin}
                inputRef={tinInputRef}
                error={errors.tin}
              />
              <DocumentUploadRow
                label="VAT Certificate"
                docType="vat"
                required={isMediumLarge}
                existingUrl={form.vat_certificate_url}
                file={documentFiles.vat}
                inputRef={vatInputRef}
                error={errors.vat}
              />
            </div>
          ) : (
            <div className="py-8 text-center">
              <FileText size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-brand-text-secondary">
                Please select a business size above to see the required documents.
              </p>
            </div>
          )}
          <p className="text-xs text-brand-text-secondary mt-4">
            PDF files only. Max 5 MB per document.
          </p>
        </FormSection>

        {/* Actions */}
        <div className="flex items-center gap-3 py-2">
          <Button type="submit" loading={loading} loadingText="Saving…">
            Save Vendor
          </Button>
        </div>

      </form>
    </AppLayout>
  );
}
