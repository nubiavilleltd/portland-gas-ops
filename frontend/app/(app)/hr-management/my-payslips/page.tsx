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
    const gross = s.basic + s.housing + s.transport + s.meal;
    const ded   = s.paye  + s.pension + s.nhf       + s.loan;
    return (
      <AppLayout pageTitle="Pay Slip">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
        >
          <ArrowLeft size={16} /> Back to My Pay Slips
        </button>

        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden max-w-3xl">
          <div className="p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-brand-text-primary">Pay Slip — {s.period}</h2>
                <p className="text-sm text-brand-text-secondary mt-1">
                  {s.employee} · {s.empId} · {s.department}
                </p>
              </div>
              <Button
                variant="outline"
                leftIcon={<Download size={13} />}
                className="text-xs shrink-0"
                onClick={() => downloadSinglePdf(s)}
              >
                Download PDF
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="border border-brand-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 font-bold text-sm text-white bg-emerald-600">Earnings</div>
                <table className="w-full text-sm">
                  <tbody>
                    {([["Basic Salary", s.basic], ["Housing Allowance", s.housing], ["Transport Allowance", s.transport], ["Meal Allowance", s.meal]] as [string, number][]).map(([label, value]) => (
                      <tr key={label} className="border-t border-brand-border">
                        <td className="px-5 py-2.5 text-brand-text-secondary">{label}</td>
                        <td className="px-5 py-2.5 text-right font-semibold">{fmt(value)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-brand-border bg-gray-50">
                      <td className="px-5 py-2.5 font-bold">Total Earnings</td>
                      <td className="px-5 py-2.5 text-right font-bold">{fmt(gross)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border border-brand-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 font-bold text-sm text-white bg-red-500">Deductions</div>
                <table className="w-full text-sm">
                  <tbody>
                    {([["PAYE Tax", s.paye], ["Pension", s.pension], ["NHF", s.nhf], ["Loan Repayment", s.loan]] as [string, number][]).map(([label, value]) => (
                      <tr key={label} className="border-t border-brand-border">
                        <td className="px-5 py-2.5 text-brand-text-secondary">{label}</td>
                        <td className="px-5 py-2.5 text-right font-semibold">{fmt(value)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-brand-border bg-gray-50">
                      <td className="px-5 py-2.5 font-bold">Total Deductions</td>
                      <td className="px-5 py-2.5 text-right font-bold text-red-600">{fmt(ded)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 p-5 rounded-xl border-2 border-brand-purple bg-brand-purple-faint">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-brand-text-primary">Net Pay</span>
                <span className="text-2xl font-bold text-brand-purple">{fmt(s.net)}</span>
              </div>
            </div>
          </div>
        </div>
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
