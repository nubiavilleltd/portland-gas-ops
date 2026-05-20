"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Eye } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { SEED_PAYSLIPS, PAYROLL_PERIODS, type PaySlip } from "../_components/_data";

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export default function PaySlipsPage() {
  const [slips] = useState<PaySlip[]>(SEED_PAYSLIPS);
  const [period, setPeriod] = useState("April 2026");
  const [selected, setSelected] = useState<PaySlip | null>(null);

  const filtered = slips.filter((s) => s.period === period);

  // ── Pay slip detail ───────────────────────────────────────────────────────
  if (selected) {
    const s = selected;
    const gross = s.basic + s.housing + s.transport + s.meal;
    const ded = s.paye + s.pension + s.nhf + s.loan;

    return (
      <AppLayout pageTitle="Pay Slip">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
        >
          <ArrowLeft size={16} /> Back to Pay Slips
        </button>

        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden max-w-3xl">
          <div className="h-1.5 w-full bg-linear-to-r from-brand-purple to-brand-purple-light" />
          <div className="p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-brand-text-primary">Pay Slip — {s.period}</h2>
                <p className="text-sm text-brand-text-secondary mt-1">
                  {s.employee} · {s.empId} · {s.department}
                </p>
              </div>
              <Button variant="outline" className="flex items-center gap-1.5 text-xs shrink-0">
                <Download size={13} /> Download PDF
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Earnings */}
              <div className="border border-brand-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 font-bold text-sm text-white bg-emerald-600">Earnings</div>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Basic Salary",       s.basic],
                      ["Housing Allowance",  s.housing],
                      ["Transport Allowance",s.transport],
                      ["Meal Allowance",     s.meal],
                    ].map(([label, value]) => (
                      <tr key={String(label)} className="border-t border-brand-border">
                        <td className="px-5 py-2.5 text-brand-text-secondary">{label}</td>
                        <td className="px-5 py-2.5 text-right font-semibold text-brand-text-primary">{fmt(Number(value))}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-brand-border bg-gray-50">
                      <td className="px-5 py-2.5 font-bold text-brand-text-primary">Total Earnings</td>
                      <td className="px-5 py-2.5 text-right font-bold text-brand-text-primary">{fmt(gross)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions */}
              <div className="border border-brand-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 font-bold text-sm text-white bg-red-500">Deductions</div>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["PAYE Tax",       s.paye],
                      ["Pension",        s.pension],
                      ["NHF",            s.nhf],
                      ["Loan Repayment", s.loan],
                    ].map(([label, value]) => (
                      <tr key={String(label)} className="border-t border-brand-border">
                        <td className="px-5 py-2.5 text-brand-text-secondary">{label}</td>
                        <td className="px-5 py-2.5 text-right font-semibold text-brand-text-primary">{fmt(Number(value))}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-brand-border bg-gray-50">
                      <td className="px-5 py-2.5 font-bold text-brand-text-primary">Total Deductions</td>
                      <td className="px-5 py-2.5 text-right font-bold text-red-600">{fmt(ded)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net pay */}
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

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <AppLayout pageTitle="Pay Slips">
      <Link href="/hr-management" className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
        <ArrowLeft size={16} /> Back to HR Management
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader title="Pay Slips" description="View and download monthly pay slips" />
        <select
          className="rounded-xl border border-brand-border bg-brand-card px-3 py-2.5 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple-mid transition w-full sm:w-48 appearance-none"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {PAYROLL_PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[660px]">
            <thead>
              <tr className="border-b border-brand-border bg-gray-50/60 text-left">
                {["Employee", "Employee ID", "Department", "Period", "Basic", "Net Pay", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-brand-border hover:bg-gray-50/50 transition cursor-pointer"
                  onClick={() => setSelected(s)}
                >
                  <td className="px-5 py-3 font-medium text-brand-text-primary">{s.employee}</td>
                  <td className="px-5 py-3 font-mono text-xs text-brand-text-secondary">{s.empId}</td>
                  <td className="px-5 py-3 text-brand-text-secondary">{s.department}</td>
                  <td className="px-5 py-3 text-brand-text-secondary">{s.period}</td>
                  <td className="px-5 py-3 font-semibold text-brand-text-primary">{fmt(s.basic)}</td>
                  <td className="px-5 py-3 font-bold text-brand-purple">{fmt(s.net)}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(s); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-brand-text-secondary hover:bg-gray-200 transition"
                    >
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-brand-text-secondary text-sm">
                    No pay slips for {period}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
