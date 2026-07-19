"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import LeaveBalancesTable from "@/components/hr/LeaveBalancesTable";

const YEAR = new Date().getFullYear();

export default function LeaveBalancesPage() {
  return (
    <AppLayout pageTitle="Leave Balances">
      <PageHeader
        title="Leave Balances"
        description={`Leave entitlement and usage — ${YEAR}`}
        className="mb-6"
      />
      <LeaveBalancesTable rowHref={(row) => `/hr-management/employees/${row.id}`} />
    </AppLayout>
  );
}
