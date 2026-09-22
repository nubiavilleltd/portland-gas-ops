"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import SelectInput from "@/components/forms/SelectInput";
import { cashRequisitionColumns } from "@/components/data-table/columns";
import { useCashRequisitions } from "@/lib/modules/cash-requisitions/hooks";

/**
 * Admin oversight of every cash requisition raised on the system.
 *
 * Deliberately different from /finance/cash-requisitions, which filters to the
 * requests the signed-in user raised. This one filters nothing. Read-only:
 * raising a requisition still happens in the user-facing module.
 */

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "returned", label: "Returned" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Rejected" },
];

export default function AdminCashRequisitionsPage() {
  const { data: response, isLoading } = useCashRequisitions({
    limit: 200,
    sort_by: "created_at",
    sort_order: "desc",
  });
  const [activeStatus, setActiveStatus] = useState("");
  const [currency, setCurrency] = useState("");

  const allItems = useMemo(() => response?.data ?? [], [response]);

  const currencyOptions = useMemo(
    () =>
      Array.from(new Set(allItems.map((i) => i.currency).filter(Boolean)))
        .sort()
        .map((c) => ({ value: c as string, label: c as string })),
    [allItems],
  );

  const visibleItems = useMemo(
    () =>
      allItems.filter((i) => {
        if (activeStatus && i.status !== activeStatus) return false;
        if (currency && i.currency !== currency) return false;
        return true;
      }),
    [allItems, activeStatus, currency],
  );

  return (
    <AppLayout pageTitle="All Cash Requisitions">
      <Link
        href="/admin/finance"
        className="inline-flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-purple mb-4"
      >
        <ArrowLeft size={15} />
        Finance Dashboard
      </Link>

      <PageHeader
        title="All Cash Requisitions"
        description={`Every cash requisition raised on the system${
          allItems.length ? ` · ${allItems.length} total` : ""
        }`}
        className="mb-6"
      />

      <div className="w-full overflow-hidden">
        <DataTable
          columns={cashRequisitionColumns}
          data={visibleItems}
          isLoading={isLoading}
          rowHref={(row) => `/finance/cash-requisitions/${row.id}`}
          toolbarActions={
            <div className="flex gap-2 shrink-0">
              {currencyOptions.length > 1 && (
                <div className="w-36">
                  <SelectInput
                    placeholder="All Currencies"
                    sortOptions={false}
                    value={currency}
                    onValueChange={setCurrency}
                    options={currencyOptions}
                  />
                </div>
              )}
              <div className="w-52">
                <SelectInput
                  placeholder="All Statuses"
                  sortOptions={false}
                  value={activeStatus}
                  onValueChange={setActiveStatus}
                  options={STATUS_OPTIONS}
                />
              </div>
            </div>
          }
          emptyMessage="No cash requisitions raised yet"
        />
      </div>
    </AppLayout>
  );
}
