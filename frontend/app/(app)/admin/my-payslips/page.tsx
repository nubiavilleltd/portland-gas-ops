"use client";

import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, Download } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSelect from "@/components/forms/FormSelect";
import DataTable from "@/components/data-table/data-table";
import { createPaySlipColumns } from "../_components/columns";
import { SEED_PAYSLIPS, PAYROLL_PERIODS, type PaySlip } from "../_components/_data";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { generatePayslipPdf } from "@/lib/pdf/payslip.pdf";
import PayslipDocument from "@/components/payslip/PayslipDocument";

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

async function downloadSinglePdf(slip: PaySlip) {
  await generatePayslipPdf(slip);
}

export default function MyPaySlipsPage() {
  const { user } = useCurrentUser();
  const [slips] = useState<PaySlip[]>(SEED_PAYSLIPS);
  const [filterPeriod, setFilterPeriod] = useState<string | null>(null);
  const [selected, setSelected] = useState<PaySlip | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use the current user's name if available, otherwise default to Joseph Chika for demo
  const currentUserName = user?.name || "Joseph Chika";
  const userSlips = slips.filter((s) => s.employee === currentUserName);
  const filtered = filterPeriod ? userSlips.filter((s) => s.period === filterPeriod) : userSlips;
  const columns = useMemo(() => createPaySlipColumns(setSelected, downloadSinglePdf), []);

  const filterOptions = useMemo(() => {
    const known = new Set(PAYROLL_PERIODS as readonly string[]);
    const extra = [...new Set(userSlips.map((s) => s.period).filter((p) => !known.has(p)))];
    const all = [...PAYROLL_PERIODS, ...extra];
    return all.map((p) => ({ value: p, label: p }));
  }, [userSlips]);

  if (!mounted) {
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
