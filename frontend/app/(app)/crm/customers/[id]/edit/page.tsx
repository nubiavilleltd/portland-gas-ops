"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import { BackButton } from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";
import AccountManagementCard from "@/lib/modules/crm/components/AccountManagementCard";
import CustomerInformationCard from "@/lib/modules/crm/components/CustomerInformationCard";
import BusinessInformationCard from "@/lib/modules/crm/components/BusinessInformationCard";
import PrimaryContactCard from "@/lib/modules/crm/components/PrimaryContactCard";
import AddressInformationCard from "@/lib/modules/crm/components/AddressInformationCard";
import CommercialInformationCard from "@/lib/modules/crm/components/CommercialInformationCard";
import InternalNotesCard from "@/lib/modules/crm/components/InternalNotesCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import {
  useCustomerDetails,
  useUpdateCustomer,
  useUploadCustomerLogo,
} from "@/lib/modules/crm";
import { Skeleton } from "@/lib/modules/crm/components/Skeleton";
import { useEmployees } from "@/lib/modules/employees/hooks";
import {
  validateCustomer,
  buildCustomerPayload,
} from "@/lib/modules/crm/utils/customer";
import Image from "next/image";
import FormSection from "@/components/ui/FormSection";
import { Upload, X, CheckCircle2 } from "lucide-react";
import { useOrders } from "@/lib/modules/orders/hooks/useOrders";

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useCurrentUser();
  const { orders = [], isLoading: ordersLoading } = useOrders();

  const { data: customer, isLoading } = useCustomerDetails(id);
  const updateCustomer = useUpdateCustomer();
  const uploadCustomerLogo = useUploadCustomerLogo();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const customerOrders = orders.filter(
    (order) => order.customerId === customer.id,
  );
  const hasPurchased = customerOrders.length > 0;
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoError, setLogoError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

  const MAX_LOGO_SIZE_MB = 2;
  const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;
  const customerType = hasPurchased ? "purchasing" : customer?.customer_type;
  const [form, setForm] = useState<any>({
    customerName: "",
    entityType: "company",
    category: "",
    rcNumber: "",
    tin: "",
    vatNumber: "",
    industry: "",
    salesContact: "",
    referrerType: "employee",
    referrerId: "",
    customerType: "potential",
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
    companyEmail: "",
    preferredProducts: [],
    supplyMethod: "",
    estimatedMonthlyDemand: "",
    internalNotes: "",
    position: "",
    role: "",
    preferredChannel: "",
  });
  const { data: employees = [] } = useEmployees();

  useEffect(() => {
    if (!customer) return;
    setLogoPreview(customer.logo_url ?? "");

    setForm({
      customerName: customer.customer_name ?? "",
      entityType: customer.entity_type ?? "company",
      category: customer.category ?? "",
      rcNumber: customer.rc_number ?? "",
      tin: customer.tin ?? "",
      vatNumber: customer.vat_number ?? "",
      industry: customer.industry ?? "",
      salesContact: customer.sales_contact ?? "",
      referrerType: customer.referrer_type ?? "employee",
      referrerId: customer.referrer_id ?? "",
      customerType,
      contactPerson: customer.contact_person ?? "",
      department: customer.department ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      alternatePhone: customer.alternate_phone ?? "",
      companyEmail: customer.company_email ?? "",
      country: customer.country ?? "Nigeria",
      state: customer.state ?? "",
      city: customer.city ?? "",
      addressLine1: customer.address_line1 ?? "",
      addressLine2: customer.address_line2 ?? "",
      postalCode: customer.postal_code ?? "",
      preferredProducts: customer.preferred_products ?? [],
      supplyMethod: customer.supply_method ?? "",
      estimatedMonthlyDemand: customer.estimated_monthly_demand ?? "",
      internalNotes: customer.internal_notes ?? "",
      role: customer.role ?? "",
      position: customer.role ?? "",
      preferredChannel: customer.preferred_channel ?? "",
    });
  }, [customer]);

  function handleChange(field: string, value: any) {
    setForm((prev: any) => ({
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
      setLogoError(
        `File is too large. Maximum size is ${MAX_LOGO_SIZE_MB} MB.`,
      );

      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }

      return;
    }

    setLogoError(null);
    setLogoFile(file);

    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview("");
    setLogoError(null);

    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  }
  async function updateCustomerInfo() {
    const { valid, errors } = validateCustomer(form);

    if (!valid) {
      setErrors(errors);
      toast.error("Please correct the highlighted errors.");
      return;
    }

    try {
      const payload = buildCustomerPayload(form, customer.status);

      await updateCustomer.mutateAsync({
        id,
        data: payload,
      });
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);

        await uploadCustomerLogo.mutateAsync({
          id,
          data: formData,
        });
      }
      toast.success("Customer updated successfully.");

      router.push(`/crm/customers/${id}`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail?.message ??
          error?.response?.data?.detail ??
          "Failed to update customer. Please try again.",
      );
    }
  }

  const isAdmin =
    currentUser?.role === "admin" || currentUser?.role === "super_admin";

  const currentEmployee = employees.find(
    (employee) => employee.id === currentUser?.employee?.id,
  );
  const isOwner = currentEmployee?.id === customer?.created_by;

  const canEdit = isAdmin || isOwner;

  if (isLoading || ordersLoading) {
    return (
      <AppLayout pageTitle="Edit Customer">
        <div className="space-y-6">
          <Skeleton className="h-8 w-60" />

          <div className="rounded-xl p-6 space-y-4">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="rounded-xl p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!customer) {
    return <AppLayout pageTitle="Edit Customer">Customer not found.</AppLayout>;
  }
  return (
    <AppLayout pageTitle="Edit Customer">
      <BackButton
        href={`/crm/customers/${id}`}
        label="Back to Customer Details"
      />

      <div className="space-y-6">
        <FormSection
          title="Customer Logo"
          description="Upload an optional logo for this customer. This is useful for company customers."
        >
          <div className="flex items-center gap-5">
            {/* Logo Preview */}
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-brand-border bg-gray-50 flex items-center justify-center">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt={`${form.customerName || "Customer"} logo`}
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                  unoptimized
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
                  onClick={() => logoInputRef.current?.click()}
                  leftIcon={<Upload size={14} />}
                >
                  {logoPreview ? "Change Logo" : "Upload Logo"}
                </Button>

                {logoPreview && (
                  <>
                    <span className="h-5 w-px bg-brand-border" />

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={removeLogo}
                      leftIcon={<X size={13} />}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove Logo
                    </Button>
                  </>
                )}
              </div>

              <p className="text-xs text-brand-text-secondary">
                Optional. PNG, JPG, SVG or WebP. Maximum size: 2 MB.
              </p>

              {logoError && <p className="text-xs text-red-600">{logoError}</p>}
            </div>
          </div>
        </FormSection>
        <CustomerInformationCard
          values={{
            customerName: form.customerName,
            entityType: form.entityType,
            companyEmail: form.companyEmail,
            category: form.category,
          }}
          errors={errors}
          onChange={handleChange}
        />

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

        <PrimaryContactCard
          values={{
            contactPerson: form.contactPerson,
            department: form.department,
            email: form.email,
            phone: form.phone,
            alternatePhone: form.alternatePhone,
            position: form.position,
            role: form.role,
            preferredChannel: form.preferredChannel,
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

        <div className="flex justify-between pb-10">
          {canEdit && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                leftIcon={<X size={14} />}
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                loading={
                  updateCustomer.isPending || uploadCustomerLogo.isPending
                }
                onClick={updateCustomerInfo}
                disabled={
                  updateCustomer.isPending || uploadCustomerLogo.isPending
                }
                leftIcon={<CheckCircle2 size={15} />}
              >
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
