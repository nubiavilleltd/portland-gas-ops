"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import { BackButton } from "@/components/ui/BackButton";
import Button from "@/components/ui/Button";

import CustomerInformationCard from "@/lib/modules/crm/components/CustomerInformationCard";
import BusinessInformationCard from "@/lib/modules/crm/components/BusinessInformationCard";
import PrimaryContactCard from "@/lib/modules/crm/components/PrimaryContactCard";
import AddressInformationCard from "@/lib/modules/crm/components/AddressInformationCard";
import CommercialInformationCard from "@/lib/modules/crm/components/CommercialInformationCard";
import InternalNotesCard from "@/lib/modules/crm/components/InternalNotesCard";
import CustomerAttachmentsCard from "@/lib/modules/crm/components/CustomerAttachmentsCard";
import RequesterDetailsSection from "@/lib/modules/crm/components/RequesterDetailsSection";
import { useToast } from "@/hooks/useToast";
import { useCustomerOnboardingDetails } from "@/lib/modules/crm";

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data: customer } = useCustomerOnboardingDetails(id);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const [form, setForm] = useState<any>({
    customerName: "",
    entityType: "company",
    category: "",

    rcNumber: "",
    tin: "",
    vatNumber: "",
    industry: "",

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

    attachments: {
      cacCertificate: null,
      tinCertificate: null,
      vatCertificate: null,
      businessLogo: null,
      otherDocuments: [],
    },

    internalNotes: "",
  });

  useEffect(() => {
    if (!customer) return;

    setForm({
      customerName: customer.customer_name ?? "",
      entityType: customer.entity_type ?? "company",
      category: customer.category ?? "",

      rcNumber: customer.rc_number ?? "",
      tin: customer.tin ?? "",
      vatNumber: customer.vat_number ?? "",
      industry: customer.industry ?? "",

      contactPerson: customer.contact_person ?? "",
      department: customer.department ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      alternatePhone: customer.alternate_phone ?? "",

      country: customer.country ?? "Nigeria",
      state: customer.state ?? "",
      city: customer.city ?? "",
      addressLine1: customer.address_line1 ?? "",
      addressLine2: customer.address_line2 ?? "",
      postalCode: customer.postal_code ?? "",

      preferredProducts: customer.preferred_products ?? [],
      supplyMethod: customer.supply_method ?? "",
      estimatedMonthlyDemand: customer.estimated_monthly_demand ?? "",

      attachments: {
        cacCertificate: null,
        tinCertificate: null,
        vatCertificate: null,
        businessLogo: null,
        otherDocuments: [],
      },

      internalNotes: customer.internal_notes ?? "",
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

  function validate() {
    const error: any = {};

    if (!form.customerName) error.customerName = "Customer name is required";

    if (!form.category) error.category = "Customer category is required";

    if (!form.contactPerson) error.contactPerson = "Contact person is required";

    if (!form.email) error.email = "Email is required";

    if (!form.phone) error.phone = "Phone number is required";

    if (!form.addressLine1) error.addressLine1 = "Address is required";

    setErrors(error);

    return Object.keys(error).length === 0;
  }

  function submitForApproval() {
    if (!validate()) return;

    const payload = {
      id,
      ...form,
      action: "submit",
      status: "submitted",
    };

    console.log("UPDATE CUSTOMER", payload);

    // await updateCustomer(payload)

    toast.success(
      "Customer details have been submitted for approval successfully.",
    );

    setTimeout(() => {
      router.push("/admin/crm/onboarding");
    }, 1000);
  }
  function deactivateCustomer() {
    const payload = {
      id,
      action: "deactivate",
      status: "inactive",
    };

    console.log("DEACTIVATE CUSTOMER", payload);

    // await deactivateCustomer(payload)

    toast.success("Customer has been deactivated successfully.");

    setTimeout(() => {
      router.push("/admin/crm/onboarding");
    }, 1000);
  }

  if (!customer) return null;

  return (
    <AppLayout pageTitle="Edit Customer">
      <BackButton
        href={`/admin/crm/onboarding/${id}`}
        label="Back to Customer Details"
      />

      <div className="space-y-6">
        <RequesterDetailsSection
          requester={{
            name: customer.submitted_by,
            department: "Commercial",
            role: "Sales Executive",
            requestDate: customer.submitted_at,
          }}
        />

        <CustomerInformationCard
          values={{
            customerName: form.customerName,
            entityType: form.entityType,
            category: form.category,
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

        <CustomerAttachmentsCard
          values={form.attachments}
          onChange={(attachments) => handleChange("attachments", attachments)}
        />

        <InternalNotesCard
          value={form.internalNotes}
          onChange={(value) => handleChange("internalNotes", value)}
        />

        <div className="flex justify-between pb-10">
          <Button variant="outline" onClick={deactivateCustomer}>
            Deactivate Customer
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>

            <Button onClick={submitForApproval}>
              Save & Submit for Approval
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
