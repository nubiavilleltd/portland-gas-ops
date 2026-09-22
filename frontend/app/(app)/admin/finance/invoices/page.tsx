"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import SelectInput from "@/components/forms/SelectInput";
import { invoiceColumns } from "@/components/data-table/columns";
import { useInvoices } from "@/lib/modules/invoices-processing/hooks";

/**
 * Admin oversight of every invoice raised on the system.
 *
 * Deliberately different from /finance/invoices, which filters to the requests
 * the signed-in user raised. This one filters nothing — it is the whole book.
 * Read-only: raising an invoice still happens in the user-facing module.
 */

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "returned", label: "Returned" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
  { value: "denied", label: "Rejected" },
];

export default function AdminInvoicesPage() {
  const { data: response, isLoading } = useInvoices({ limit: 200 });
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
    <AppLayout pageTitle="All Invoice Requests">
      <Link
        href="/admin/finance"
        className="inline-flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-purple mb-4"
      >
        <ArrowLeft size={15} />
        Finance Dashboard
      </Link>

      <PageHeader
        title="All Invoice Requests"
        description={`Every invoice raised on the system${
          allItems.length ? ` · ${allItems.length} total` : ""
        }`}
        className="mb-6"
      />

      <div className="w-full overflow-hidden">
        <DataTable
          columns={invoiceColumns}
          data={visibleItems}
          isLoading={isLoading}
          rowHref={(row) => `/finance/invoices/${row.id}`}
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
          emptyMessage="No invoices raised yet"
        />
      </div>
    </AppLayout>
  );
}
