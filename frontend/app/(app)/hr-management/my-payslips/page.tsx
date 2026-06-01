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

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

async function buildSlipPdf(s: PaySlip) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const W = 210;
  const L = 20;
  const R = W - 20;
  const col2 = 130;
  const naira = (n: number) => `NGN ${n.toLocaleString("en-NG")}`;

  doc.setFillColor(88, 28, 135);
  doc.rect(0, 0, W, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("PORTLAND GAS OPERATIONS", L, 8);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("PAY SLIP", L, 14);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);

  let y = 28;
  const field = (label: string, value: string, x: number, cy: number) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(label, x, cy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(value, x, cy + 5);
  };

  field("EMPLOYEE", s.employee, L, y);
  field("EMPLOYEE ID", s.empId, col2, y);
  y += 14;
  field("DEPARTMENT", s.department, L, y);
  field("PAY PERIOD", s.period, col2, y);
  y += 10;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(L, y, R, y);
  y += 8;

  const gross = s.basic + s.housing + s.transport + s.meal;
  const ded   = s.paye  + s.pension + s.nhf       + s.loan;

  const sectionHeader = (title: string, r: number, g: number, b: number, cy: number) => {
    doc.setFillColor(r, g, b);
    doc.roundedRect(L, cy, R - L, 7, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(title, L + 3, cy + 4.8);
    return cy + 10;
  };

  const row = (label: string, value: number, cy: number, bold = false, vr = 30, vg = 30, vb = 30) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(bold ? 30 : 70, bold ? 30 : 70, bold ? 30 : 70);
    doc.text(label, L + 3, cy);
    doc.setTextColor(vr, vg, vb);
    doc.text(naira(value), R, cy, { align: "right" });
    doc.setTextColor(30, 30, 30);
    if (bold) {
      doc.setDrawColor(200, 200, 200);
      doc.line(L, cy - 5.5, R, cy - 5.5);
    }
    return cy + 6.5;
  };

  y = sectionHeader("EARNINGS", 5, 150, 105, y);
  y = row("Basic Salary", s.basic, y);
  y = row("Housing Allowance", s.housing, y);
  y = row("Transport Allowance", s.transport, y);
  y = row("Meal Allowance", s.meal, y);
  y += 1;
  y = row("Total Earnings", gross, y, true);
  y += 6;

  y = sectionHeader("DEDUCTIONS", 220, 38, 38, y);
  y = row("PAYE Tax", s.paye, y, false, 180, 30, 30);
  y = row("Pension", s.pension, y, false, 180, 30, 30);
  y = row("NHF", s.nhf, y, false, 180, 30, 30);
  y = row("Loan Repayment", s.loan, y, false, 180, 30, 30);
  y += 1;
  y = row("Total Deductions", ded, y, true);
  y += 8;

  doc.setFillColor(245, 240, 255);
  doc.setDrawColor(88, 28, 135);
  doc.setLineWidth(0.5);
  doc.roundedRect(L, y, R - L, 14, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text("NET PAY", L + 4, y + 9);
  doc.setTextColor(88, 28, 135);
  doc.text(naira(s.net), R - 4, y + 9, { align: "right" });
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  const today = new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  doc.text(`Generated on ${today}  ·  Portland Gas Operations`, L, y);

  return doc;
}

async function downloadSinglePdf(slip: PaySlip) {
  const doc = await buildSlipPdf(slip);
  doc.save(`${slip.employee.replace(/\s+/g, "_")}_${slip.period.replace(/\s+/g, "_")}.pdf`);
}

export default function MyPaySlipsPage() {
  const { user } = useCurrentUser();
  const [slips] = useState<PaySlip[]>(SEED_PAYSLIPS);
  const [filterPeriod, setFilterPeriod] = useState("April 2026");
  const [selected, setSelected] = useState<PaySlip | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use the current user's name if available, otherwise default to Joseph Chika for demo
  const currentUserName = user?.name || "Joseph Chika";
  const userSlips = slips.filter((s) => s.employee === currentUserName);
  const filtered = userSlips.filter((s) => s.period === filterPeriod);
  const columns = useMemo(() => createPaySlipColumns(setSelected), []);

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
        emptyMessage={`No pay slips for ${filterPeriod}`}
        emptyDescription="Check back later for your pay slip"
        toolbarExtra={
          <div className="w-44">
            <FormSelect
              id="period-filter"
              options={filterOptions}
              value={filterPeriod}
              onValueChange={setFilterPeriod}
            />
          </div>
        }
      />
    </AppLayout>
  );
}
