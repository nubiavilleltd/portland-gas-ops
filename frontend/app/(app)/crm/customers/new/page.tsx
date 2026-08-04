"use client";

import { useState } from "react";
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
import { useCreateCustomer } from "@/lib/modules/crm";
export default function NewCustomerPage() {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState<CustomerForm>({
    customerName: "",
    entityType: "company",
    category: "retail",
    companyEmail: "",

    rcNumber: "",
    tin: "",
    vatNumber: "",
    industry: "",

    customerType: "potential",

    salesContact: "",

    referrerType: "employee",
    referrerId: "",

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

    preferredProducts: [],
    supplyMethod: "",
    estimatedMonthlyDemand: "",

    internalNotes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const createCustomer = useCreateCustomer();

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

      await createCustomer.mutateAsync(payload);

      router.push("/crm/customers");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail?.message ??
          error?.response?.data?.detail ??
          "Failed to create customer. Please try again.",
      );
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
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>

          <Button disabled={createCustomer.isPending} onClick={submitCustomer}>
            Submit
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
