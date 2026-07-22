"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import CustomerInformationCard from "@/lib/modules/crm/components/CustomerInformationCard";
import BusinessInformationCard from "@/lib/modules/crm/components/BusinessInformationCard";
import PrimaryContactCard from "@/lib/modules/crm/components/PrimaryContactCard";
import AddressInformationCard from "@/lib/modules/crm/components/AddressInformationCard";
import CommercialInformationCard from "@/lib/modules/crm/components/CommercialInformationCard";
import InternalNotesCard from "@/lib/modules/crm/components/InternalNotesCard";
import CustomerAttachmentsCard from "@/lib/modules/crm/components/CustomerAttachmentsCard";
import { BackButton } from "@/components/ui/BackButton";
import RequesterDetailsSection from "@/lib/modules/crm/components/RequesterDetailsSection";
import { useToast } from "@/hooks/useToast";

export default function NewCustomerPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    customerName: "",
    entityType: "company",
    category: "",
    companyEmail: "",
    rcNumber: "",
    tin: "",
    vatNumber: "",
    industry: "",

    contactPerson: "",
    department: "",
    email: "",
    phone: "",
    alternatePhone: "",

    country: "Nigeria",
    state: "",
    city: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",

    preferredProducts: [] as string[],
    supplyMethod: "",
    estimatedMonthlyDemand: "",
    attachments: {
      cacCertificate: null as File | null,
      tinCertificate: null as File | null,
      vatCertificate: null as File | null,
      businessLogo: null as File | null,
      otherDocuments: [] as File[],
    },
    internalNotes: "",
  });
  const toast = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(
    field: string,
    value:
      | string
      | string[]
      | File
      | File[]
      | null
      | {
          cacCertificate: File | null;
          tinCertificate: File | null;
          vatCertificate: File | null;
          businessLogo: File | null;
          otherDocuments: File[];
        },
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

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!form.customerName.trim())
      nextErrors.customerName = "Customer name is required.";
    if (!form.companyEmail.trim())
      nextErrors.companyEmail = "Company email is required.";
    if (!form.category) nextErrors.category = "Customer category is required.";

    if (!form.contactPerson.trim())
      nextErrors.contactPerson = "Contact person is required.";

    if (!form.email.trim()) nextErrors.email = "Email is required.";

    if (!form.phone.trim()) nextErrors.phone = "Phone number is required.";

    if (!form.country.trim()) nextErrors.country = "Country is required.";

    if (!form.state.trim()) nextErrors.state = "State is required.";

    if (!form.city.trim()) nextErrors.city = "City is required.";

    if (!form.addressLine1.trim())
      nextErrors.addressLine1 = "Address is required.";

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function saveDraft() {
    console.log({
      ...form,
      status: "draft",
    });

    toast.success("Customer information has been saved as a draft.");

    setTimeout(() => {
      router.push("/crm/customers");
    }, 1000);
  }

  function submitCustomer() {
    if (!validate()) return;

    console.log({
      ...form,
      status: "submitted",
    });

    toast.success("Customer information has been submitted successfully.");

    setTimeout(() => {
      router.push("/crm/customers");
    }, 1000);
  }

  return (
    <AppLayout pageTitle="New Customer">
      <BackButton href="/crm/customers" label="Back to Customer Onboarding" />
      <PageHeader
        title="New Customer"
        description="Register a new customer for review and activation."
      />

      <div className="space-y-6">
        {/* <RequesterDetailsSection
          requester={{
            name: "Magdalene Princess",
            department: "Commercial",
            role: "Sales Executive",
            requestDate: "2026-07-13",
          }}
        /> */}
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
        {/* <CustomerAttachmentsCard
          values={form.attachments}
          onChange={(attachments) => handleChange("attachments", attachments)}
        /> */}

        <InternalNotesCard
          value={form.internalNotes}
          onChange={(value) => handleChange("internalNotes", value)}
        />

        <div className="flex justify-start gap-3 pb-10">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>

          <Button variant="secondary" onClick={saveDraft}>
            Save Draft
          </Button>

          <Button onClick={submitCustomer}>Submit</Button>
        </div>
      </div>
    </AppLayout>
  );
}
