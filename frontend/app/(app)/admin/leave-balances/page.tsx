"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import LeaveBalancesTable from "@/components/hr/LeaveBalancesTable";

export default function LeaveBalancesPage() {
  const [year, setYear] = useState(new Date().getFullYear());

  return (
    <AppLayout pageTitle="Leave Balances">
      <PageHeader
        title="Leave Balances"
        description={`Leave entitlement and usage — ${year}`}
        className="mb-6"
      />
      <LeaveBalancesTable
        rowHref={(row) => `/admin/leave-balances/${row.id}`}
        year={year}
        onYearChange={setYear}
      />
    </AppLayout>
  );
}
