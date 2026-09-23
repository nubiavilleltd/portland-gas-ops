"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FinanceOverview from "../../finance/_components/FinanceOverview";

/**
 * Finance oversight. The links through to the full invoice and cash
 * requisition registers live in the overview itself, so there is no separate
 * shortcut grid to keep in step.
 */
export default function AdminFinanceDashboardPage() {
  return (
    <AppLayout pageTitle="Finance Dashboard">
      <PageHeader
        title="Finance Dashboard"
        description="Payment status, who has been paid, and what is waiting on an approver"
        className="mb-6"
      />

      <FinanceOverview />
    </AppLayout>
  );
}
