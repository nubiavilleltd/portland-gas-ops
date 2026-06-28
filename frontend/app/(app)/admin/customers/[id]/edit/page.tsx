"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";

import { useCustomerById } from "@/lib/modules/customers/hooks/useCustomers";
import type { CreateCustomerFormData } from "@/lib/modules/customers/schemas/customer.schema";
import { CustomersService } from "@/lib/modules/customers/services/customers.service";
import { CUSTOMER_ROUTES } from "@/lib/modules/customers/constants/routes";
import CustomerForm from "@/lib/modules/customers/components/CustomerForm";
import FormSection from "@/components/ui/FormSection";
import { BackButton } from "@/components/ui/BackButton";
import { toast } from "sonner";
import { useUpdateCustomer } from "@/lib/modules/customers/hooks/useCustomerMutations";

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { customer, isLoading, error } = useCustomerById(id);
  const { mutateAsync: updateCustomer } = useUpdateCustomer(id);

  if (isLoading) {
    return (
      <AppLayout pageTitle="Edit Customer">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-8 bg-gray-100 rounded-lg w-1/3" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (error || !customer) {
    return (
      <AppLayout pageTitle="Customer Not Found">
        <ErrorBanner message={error ?? "This customer could not be found."} />
        {/* <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/admin${CUSTOMER_ROUTES.list()}`)}
        >
          Back to Customers
        </Button> */}

        <BackButton
          href={CUSTOMER_ROUTES.list()}
          label="Back to Customers"
          className="mt-4"
        />
      </AppLayout>
    );
  }




async function handleSubmit(data: CreateCustomerFormData) {
  await updateCustomer(data);
}

  return (
    <AppLayout pageTitle={`Edit — ${customer.name}`}>
      {/* <button
        onClick={() => router.push(`/admin${CUSTOMER_ROUTES.detail(id)}`)}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Customer
      </button> */}

       <BackButton
          href={CUSTOMER_ROUTES.detail(id)}
          label="Back to Customer"
        />

      <PageHeader
        title={`Edit — ${customer.name}`}
        description="Update customer details."
        className="mb-6"
      />


      <FormSection
        title="Customer Information"
        description="Edit customer details and contact information"
      >
        <CustomerForm
          initial={customer}
          onSubmit={handleSubmit}
          onCancel={() => router.push(CUSTOMER_ROUTES.detail(id))}
          submitLabel="Save Changes"
          submitLoadingLabel="Saving…"
        />
      </FormSection>
    </AppLayout>
  );
}