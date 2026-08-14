"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { CustomerForm } from "@/lib/modules/crm/types";
import CustomerInformationCard from "@/lib/modules/crm/components/CustomerInformationCard";
import BusinessInformationCard from "@/lib/modules/crm/components/BusinessInformationCard";
import PrimaryContactCard from "@/lib/modules/crm/components/PrimaryContactCard";
import AddressInformationCard from "@/lib/modules/crm/components/AddressInformationCard";
import CommercialInformationCard from "@/lib/modules/crm/components/CommercialInformationCard";
import InternalNotesCard from "@/lib/modules/crm/components/InternalNotesCard";
import { BackButton } from "@/components/ui/BackButton";
import AccountManagementCard from "@/lib/modules/crm/components/AccountManagementCard";
import { useToast } from "@/hooks/useToast";
import {
  validateCustomer,
  buildCustomerPayload,
} from "@/lib/modules/crm/utils/customer";
import { useCreateCustomer, useUploadCustomerLogo } from "@/lib/modules/crm";
import { X, CheckCircle2, Upload } from "lucide-react";
import FormSection from "@/components/ui/FormSection";

export default function NewCustomerPage() {
  const router = useRouter();
  const toast = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoError, setLogoError] = useState<string | null>(null);

  const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
  const [form, setForm] = useState<CustomerForm>({
    customerName: "",
    entityType: "",
    category: "",
    companyEmail: "",
    rcNumber: "",
    tin: "",
    vatNumber: "",
    industry: "",
    customerType: "potential",
    salesContact: "",
    referrerType: "",
    referrerId: "",
    contactPerson: "",
    department: "",
    email: "",
    phone: "",
    alternatePhone: "",
    country: "",
    state: "",
    city: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    preferredProducts: [],
    supplyMethod: "",
    estimatedMonthlyDemand: "",
    internalNotes: "",
    position: "",
    role: "",
    preferredChannel: "",
    otherIndustry: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const createCustomer = useCreateCustomer();
  const uploadCustomerLogo = useUploadCustomerLogo();
  function handleChange<K extends keyof CustomerForm>(
    field: K,
    value: CustomerForm[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  }

  async function submitCustomer() {
    const { valid, errors } = validateCustomer(form);

    if (!valid) {
      setErrors(errors);
      toast.error("Please correct the highlighted errors.");
      return;
    }

    try {
      const payload = buildCustomerPayload(form, "active");

      const customer = await createCustomer.mutateAsync(payload);
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);

        await uploadCustomerLogo.mutateAsync({
          id: customer.id,
          data: formData,
        });
      }
      toast.success("Customer created successfully.");

      router.push("/crm/customers");
    } catch (error: any) {
      const detail = error?.response?.data?.detail;

      // Backend field validation errors
      const backendErrors = detail?.details?.errors;

      if (Array.isArray(backendErrors)) {
        const fieldErrors: Record<string, string> = {};

        for (const item of backendErrors) {
          const field = item?.loc?.find(
            (location: unknown) => location !== "body",
          );

          if (typeof field === "string") {
            fieldErrors[field] = item?.msg || "Invalid value.";
          }
        }

        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({
            ...prev,
            ...fieldErrors,
          }));

          toast.error("Please correct the highlighted errors.");
          return;
        }
      }

      // Backend business/application error
      toast.error(
        detail?.message ??
          (typeof detail === "string" ? detail : null) ??
          "Failed to create customer. Please try again.",
      );
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/svg+xml",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setLogoError("Only PNG, JPG, SVG or WebP images are allowed.");

      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }

      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setLogoError("Logo must not exceed 2 MB.");

      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }

      return;
    }

    setLogoError(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview("");
    setLogoError(null);

    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  }
  return (
    <AppLayout pageTitle="New Customer">
      <BackButton href="/crm/customers" label="Back to Customers" />
      <PageHeader
        title="New Customer"
        description="Register a new customer for review and activation."
      />

      <div className="space-y-6">
        <FormSection
          title="Customer Logo"
          description="Optional. Upload a logo for company customers."
        >
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brand-border bg-gray-50">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Customer logo preview"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-300">
                  {form.customerName
                    ? form.customerName.charAt(0).toUpperCase()
                    : "?"}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <input
                ref={logoInputRef}
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
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoPreview ? "Change Logo" : "Upload Logo"}
                </Button>

                {logoPreview && (
                  <>
                    <span className="h-5 w-px bg-brand-border" />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      leftIcon={<X size={13} />}
                      onClick={removeLogo}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </>
                )}
              </div>

              <p className="text-xs text-brand-text-secondary">
                Optional. PNG, JPG, SVG or WebP. Maximum 2 MB.
              </p>

              {logoError && <p className="text-xs text-red-600">{logoError}</p>}
            </div>
          </div>
        </FormSection>
        <CustomerInformationCard
          values={{
            customerName: form.customerName,
            entityType: form.entityType,
            category: form.category,
            companyEmail: form.companyEmail,
          }}
          errors={errors}
          onChange={handleChange}
        />

        {form.entityType === "company" && (
          <BusinessInformationCard
            values={{
              rcNumber: form.rcNumber,
              tin: form.tin,
              vatNumber: form.vatNumber,
              industry: form.industry,
              otherIndustry: form.otherIndustry ?? "",
            }}
            errors={errors}
            onChange={handleChange}
          />
        )}

        <PrimaryContactCard
          values={{
            contactPerson: form.contactPerson,
            department: form.department,
            email: form.email,
            phone: form.phone,
            alternatePhone: form.alternatePhone,
            position: form.role,
            preferredChannel: form.preferredChannel,
            role: form.role,
          }}
          errors={errors}
          onChange={handleChange}
        />

        <AddressInformationCard
          values={{
            country: form.country,
            state: form.state,
            city: form.city,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2,
            postalCode: form.postalCode,
          }}
          errors={errors}
          onChange={handleChange}
        />

        <CommercialInformationCard
          values={{
            preferredProducts: form.preferredProducts,
            supplyMethod: form.supplyMethod,
            estimatedMonthlyDemand: form.estimatedMonthlyDemand,
          }}
          errors={errors}
          onChange={handleChange}
        />
        <AccountManagementCard
          values={{
            customerType: form.customerType,
            salesContact: form.salesContact,
            referrerType: form.referrerType,
            referrerId: form.referrerId,
          }}
          errors={errors}
          onChange={handleChange}
        />

        <InternalNotesCard
          value={form.internalNotes}
          onChange={(value) => handleChange("internalNotes", value)}
        />

        <div className="flex justify-start gap-3 pb-10">
          <Button
            variant="outline"
            leftIcon={<X size={14} />}
            onClick={() => router.back()}
          >
            Cancel
          </Button>

          <Button
            disabled={createCustomer.isPending}
            leftIcon={<CheckCircle2 size={15} />}
            onClick={submitCustomer}
          >
            Submit
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
