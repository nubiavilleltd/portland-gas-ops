"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Upload, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import FormSelect from "@/components/forms/FormSelect";
import type { VendorCategory } from "@/types";

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

export interface VendorFormValues {
  name: string;
  category: VendorCategory | "";
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  logo_url: string;
}

export const EMPTY_VENDOR_FORM: VendorFormValues = {
  name: "", category: "", contact_person: "", phone: "",
  email: "", address: "", bank_name: "", account_name: "", account_number: "",
  logo_url: "",
};

interface Props {
  title: string;
  description: string;
  initial: VendorFormValues;
  loading: boolean;
  onSubmit: (values: VendorFormValues, logoFile: File | null) => void;
}

export default function VendorForm({ title, description, initial, loading, onSubmit }: Props) {
  const [form, setForm] = useState<VendorFormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof VendorFormValues, string>>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(initial.logo_url || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(field: keyof VendorFormValues, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim())           e.name           = "Vendor name is required";
    if (!form.category)              e.category       = "Category is required";
    if (!form.contact_person.trim()) e.contact_person = "Contact person is required";
    if (!form.phone.trim())          e.phone          = "Phone number is required";
    if (!form.email.trim())          e.email          = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.address.trim())        e.address        = "Address is required";
    if (!form.bank_name.trim())      e.bank_name      = "Bank name is required";
    if (!form.account_name.trim())   e.account_name   = "Account name is required";
    if (!form.account_number.trim()) e.account_number = "Account number is required";
    return e;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit(form, logoFile);
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leftIcon={<X size={13} />}
                  onClick={() => { setLogoPreview(""); setLogoFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                >
                  Remove logo
                </Button>
              )}
              <p className="text-xs text-brand-text-secondary">PNG, JPG, SVG or WebP. Max 2MB.</p>
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
            <FormInput
              label="Contact Person"
              required
              placeholder="e.g. Emeka Okafor"
              value={form.contact_person}
              onChange={(e) => set("contact_person", e.target.value)}
              error={errors.contact_person}
            />
            <FormInput
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
            <FormInput
              label="Account Number"
              required
              placeholder="10-digit account number"
              value={form.account_number}
              onChange={(e) => set("account_number", e.target.value)}
              error={errors.account_number}
            />
          </div>
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
