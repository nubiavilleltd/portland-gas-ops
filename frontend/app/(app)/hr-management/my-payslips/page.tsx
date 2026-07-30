"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSelect from "@/components/forms/FormSelect";
import DataTable from "@/components/data-table/data-table";
import { createPaySlipColumns } from "../_components/columns";
import { type PaySlip } from "../_components/_data";
import { useMyPayslips, useMyPayslipPeriods } from "@/lib/modules/payslips/hooks";
import { generatePayslipPdf } from "@/lib/pdf/payslip.pdf";
import PayslipDocument from "@/components/payslip/PayslipDocument";

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

async function downloadSinglePdf(slip: PaySlip) {
  await generatePayslipPdf(slip);
}

export default function MyPaySlipsPage() {
  const [filterPeriod, setFilterPeriod] = useState<string | null>(null);
  const [selected, setSelected] = useState<PaySlip | null>(null);

  // The logged-in employee's OWN payslips — scoped server-side by token.
  const { data: mySlips = [], isLoading } = useMyPayslips({
    period: filterPeriod || undefined,
  });
  const { data: periods = [] } = useMyPayslipPeriods();
  const filtered = mySlips as PaySlip[];

  const columns = useMemo(() => createPaySlipColumns(setSelected, downloadSinglePdf), []);

  const filterOptions = useMemo(
    () => periods.map((p) => ({ value: p, label: p })),
    [periods],
  );

  if (isLoading) {
    return (
      <AppLayout pageTitle="My Pay Slips">
        <PageHeader
          title="My Pay Slips"
          description="View and download your monthly pay slips"
          className="mb-6"
        />
        <div className="bg-white border border-brand-border rounded-2xl p-6 animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4" />
        </div>
      </AppLayout>
    );
  }

  if (selected) {
    const s = selected;
    return (
      <AppLayout pageTitle="Pay Slip">
        <div className="max-w-205 mx-auto flex items-center justify-between gap-3 mb-5">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors"
          >
            <ArrowLeft size={16} /> Back to My Pay Slips
          </button>
          <Button
            variant="outline"
            leftIcon={<Download size={13} />}
            className="text-xs shrink-0"
            onClick={() => downloadSinglePdf(s)}
          >
            Download PDF
          </Button>
        </div>

        <PayslipDocument slip={s} />
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="My Pay Slips">
      <PageHeader
        title="My Pay Slips"
        description="View and download your monthly pay slips"
        className="mb-6"
      />

      <DataTable
        columns={columns}
        data={filtered}
        hideStatusFilter
        emptyMessage={filterPeriod ? `No pay slips for ${filterPeriod}` : "No pay slips available"}
        emptyDescription={filterPeriod ? "Try selecting a different period" : "Check back later for your pay slip"}
        toolbarExtra={
          <div className="flex items-center gap-2">
            <div className="w-44">
              <FormSelect
                id="period-filter"
                options={[{ value: "", label: "All Months" }, ...filterOptions]}
                value={filterPeriod || ""}
                onValueChange={(val) => setFilterPeriod(val || null)}
              />
            </div>
            {filterPeriod && (
              <button
                onClick={() => setFilterPeriod(null)}
                className="text-xs px-2 py-1 text-brand-text-secondary hover:text-brand-purple transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>
        }
      />
    </AppLayout>
  );
}
