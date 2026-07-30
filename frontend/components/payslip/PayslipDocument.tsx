"use client";

import { COMPANY_INFO } from "@/config/company.config";
import type { PayslipPdfInput } from "@/lib/pdf/payslip.pdf";

// Matches the PDF's fmtCurrency: en-NG grouping, 2 decimals, no symbol.
const money = (n: number) =>
  new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-brand-text-secondary">{label}</p>
      <p className="text-sm font-semibold text-brand-text-primary mt-1 break-words">{value || "—"}</p>
    </div>
  );
}

function AmountTable({
  title,
  rows,
  totalLabel,
  totalValue,
}: {
  title: string;
  rows: { label: string; value: number }[];
  totalLabel: string;
  totalValue: number;
}) {
  return (
    <div className="border border-brand-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-4 py-2.5 text-xs font-bold text-gray-600">{title}</th>
            <th className="px-4 py-2.5 text-xs font-bold text-gray-600 text-right">Amount (NGN)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.label} className={i % 2 === 1 ? "bg-gray-50/70" : ""}>
              <td className="px-4 py-2.5 text-brand-text-primary border-t border-brand-border">{r.label}</td>
              <td className="px-4 py-2.5 text-right text-brand-text-primary border-t border-brand-border tabular-nums">
                {money(r.value)}
              </td>
            </tr>
          ))}
          <tr className="bg-brand-purple-faint">
            <td className="px-4 py-2.5 font-bold text-brand-purple">{totalLabel}</td>
            <td className="px-4 py-2.5 text-right font-bold text-brand-purple tabular-nums">NGN {money(totalValue)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * On-screen payslip rendered to mirror the branded PDF (lib/pdf/payslip.pdf.ts):
 * logo + company header, "PAY SLIP" title, info grid, earnings/deductions tables
 * with purple totals, optional loan context, and the Net Pay highlight.
 */
export default function PayslipDocument({ slip }: { slip: PayslipPdfInput }) {
  const gross = slip.basic + slip.housing + slip.transport + slip.meal;
  const ded = slip.paye + slip.pension + slip.nhf + slip.loan;

  return (
    <div className="mx-auto w-full max-w-205 bg-white border border-brand-border rounded-2xl shadow-sm p-7 md:p-10">
      {/* Header — logo + company details */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={COMPANY_INFO.logoPath} alt={COMPANY_INFO.name} className="h-12 w-auto object-contain" />
          <p className="text-[11px] text-brand-text-secondary mt-2">{COMPANY_INFO.tagline}</p>
        </div>
        <div className="text-left sm:text-right text-[11px] text-brand-text-secondary leading-relaxed">
          <p>{COMPANY_INFO.address}</p>
          <p>Tel: {COMPANY_INFO.phone}&nbsp; | &nbsp;{COMPANY_INFO.email}</p>
          <p>{COMPANY_INFO.website}</p>
        </div>
      </div>

      {/* Title */}
      <div className="pt-6 pb-4 border-b border-brand-border">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-purple">PAY SLIP</h1>
        <p className="text-xs text-brand-text-secondary mt-1">
          {slip.employee}&nbsp; | &nbsp;{slip.empId}&nbsp; | &nbsp;{slip.period}
        </p>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-y-5 gap-x-6 py-6 border-b border-brand-border">
        <Field label="Employee" value={slip.employee} />
        <Field label="Employee ID" value={slip.empId} />
        <Field label="Department" value={slip.department} />
        <Field label="Pay Period" value={slip.period} />
      </div>

      {/* Earnings / Deductions */}
      <div className="pt-6 space-y-6">
        <AmountTable
          title="Earnings"
          totalLabel="Total Earnings"
          totalValue={gross}
          rows={[
            { label: "Basic Salary", value: slip.basic },
            { label: "Housing Allowance", value: slip.housing },
            { label: "Transport Allowance", value: slip.transport },
            { label: "Meal Allowance", value: slip.meal },
          ]}
        />
        <AmountTable
          title="Deductions"
          totalLabel="Total Deductions"
          totalValue={ded}
          rows={[
            { label: "PAYE Tax", value: slip.paye },
            { label: "Pension", value: slip.pension },
            { label: "NHF", value: slip.nhf },
            { label: "Loan Repayment", value: slip.loan },
          ]}
        />
      </div>

      {/* Loan context — only when a structured loan was deducted */}
      {slip.loan_description && slip.loan > 0 && (
        <div className="pt-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-text-secondary">Loan</p>
          <p className="text-sm font-semibold text-brand-text-primary mt-1">{slip.loan_description}</p>
          {slip.loan_total != null && slip.loan_outstanding != null && (
            <p className="text-xs text-brand-text-secondary mt-0.5">
              Outstanding after this payment: NGN {money(slip.loan_outstanding)} of NGN {money(slip.loan_total)} total
            </p>
          )}
        </div>
      )}

      {/* Net pay */}
      <div className="pt-6">
        <div className="flex items-center justify-between rounded-lg bg-brand-purple-faint px-5 py-4">
          <span className="text-base font-extrabold uppercase tracking-wide text-brand-purple">Net Pay</span>
          <span className="text-2xl font-extrabold text-brand-purple tabular-nums">NGN {money(slip.net)}</span>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-brand-text-secondary mt-8 pt-4 border-t border-brand-border">
        This is a computer-generated payslip. Portland Gas Limited — Internal Operations Platform.
      </p>
    </div>
  );
}
