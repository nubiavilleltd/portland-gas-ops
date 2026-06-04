"use client";

import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";

import type { CreateCustomerFormData } from "@/lib/modules/customers/schemas/customer.schema";
import { CustomersService } from "@/lib/modules/customers/services/customers.service";
import { CUSTOMER_ROUTES } from "@/lib/modules/customers/constants/routes";
import CustomerForm from "@/lib/modules/customers/components/CustomerForm";
import FormSection from "@/components/ui/FormSection";
import { BackButton } from "@/components/ui/BackButton";
import { toast } from "sonner";

export default function NewCustomerPage() {
  const router = useRouter();

  async function handleSubmit(data: CreateCustomerFormData) {
    await CustomersService.createCustomer(data);
    toast.success("Customer created successfully")
    router.push(`/admin${CUSTOMER_ROUTES.list()}`);
  }

  return (
    <AppLayout pageTitle="New Customer">

      <BackButton
        href={`/admin${CUSTOMER_ROUTES.list()}`}
        label="Back to Customers"
      />
      <PageHeader
        title="New Customer"
        description="Add a new customer to the system."
        className="mb-6"
      />

      <FormSection
        title="Customer Information"
        description="Enter customer details and contact information"
      >
        <CustomerForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitLabel="Create Customer"
          submitLoadingLabel="Creating…"
        />
      </FormSection>
    </AppLayout>
  );
}