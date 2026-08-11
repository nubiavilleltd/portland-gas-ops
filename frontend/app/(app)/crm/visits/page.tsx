"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { Plus } from "lucide-react";

import VisitsTable from "@/lib/modules/crm/components/VisitsTable";
import { useCustomerVisits } from "@/lib/modules/crm";

export default function CustomerVisitsPage() {
  const { data: visits = [], isLoading, isError } = useCustomerVisits();
  console.log(visits, "visits from db");
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

      <VisitsTable visits={visits} isLoading={isLoading} />
    </AppLayout>
  );
}
