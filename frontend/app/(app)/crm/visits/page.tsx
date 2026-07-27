"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import { Plus } from "lucide-react";

import VisitsTable from "@/lib/modules/crm/components/VisitsTable";
import { useCustomerVisits } from "@/lib/modules/crm";

export default function CustomerVisitsPage() {
  const { data: visits = [], isLoading, isError } = useCustomerVisits();

  if (isLoading) {
    return (
      <AppLayout pageTitle="Customer Visits">
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout pageTitle="Customer Visits">
        <div className="py-20 text-center text-brand-text-secondary">
          Failed to load customer visits.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Customer Visits">
      <PageHeader
        title="Customer Visits"
        description="Schedule and manage customer visits."
        action={
          <Button href="/crm/visits/new" leftIcon={<Plus size={18} />}>
            Schedule Visit
          </Button>
        }
      />

      <VisitsTable visits={visits} />
    </AppLayout>
  );
}
