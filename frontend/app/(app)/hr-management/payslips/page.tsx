"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSelect from "@/components/forms/FormSelect";
import FormInput from "@/components/forms/FormInput";
import DataTable from "@/components/data-table/data-table";
import Modal from "../_components/Modal";
import { createPaySlipColumns } from "../_components/columns";
import { SEED_PAYSLIPS, SEED_EMPLOYEES, PAYROLL_PERIODS, type PaySlip } from "../_components/_data";

const PERIOD_OPTIONS = PAYROLL_PERIODS.map((p) => ({ value: p, label: p }));
const EMPLOYEE_OPTIONS = SEED_EMPLOYEES.map((e) => ({
  value: e.id,
  label: `${e.firstName} ${e.lastName}`,
}));

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

type FormState = {
  employeeId: string;
  period: string;
  basic: string;
  housing: string;
  transport: string;
  meal: string;
  paye: string;
  pension: string;
  nhf: string;
  loan: string;
};

const EMPTY_FORM: FormState = {
  employeeId: "", period: "", basic: "", housing: "", transport: "", meal: "",
  paye: "", pension: "", nhf: "", loan: "",
};

export default function PaySlipsPage() {
  const [slips, setSlips] = useState<PaySlip[]>(SEED_PAYSLIPS);
  const [period, setPeriod] = useState("April 2026");
  const [selected, setSelected] = useState<PaySlip | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const filtered = slips.filter((s) => s.period === period);
  const columns = useMemo(() => createPaySlipColumns(setSelected), []);

  const u = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }));

  function addSlip() {
    const emp = SEED_EMPLOYEES.find((e) => e.id === form.employeeId);
    if (!emp || !form.period) return;

    const n = (v: string) => Number(v) || 0;
    const basic = n(form.basic);
    const housing = n(form.housing);
    const transport = n(form.transport);
    const meal = n(form.meal);
    const paye = n(form.paye);
    const pension = n(form.pension);
    const nhf = n(form.nhf);
    const loan = n(form.loan);
    const net = basic + housing + transport + meal - paye - pension - nhf - loan;
    const empId = `PG-${emp.id.padStart(3, "0")}`;

    setSlips((prev) => [
      {
        id: String(Date.now()),
        employee: `${emp.firstName} ${emp.lastName}`,
        empId,
        department: emp.department,
        period: form.period,
        basic, housing, transport, meal,
        paye, pension, nhf, loan,
        net,
      },
      ...prev,
    ]);
    setModal(false);
    setForm(EMPTY_FORM);
    setPeriod(form.period);
  }

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
              <div className="border border-brand-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 font-bold text-sm text-white bg-emerald-600">Earnings</div>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Basic Salary",        s.basic],
                      ["Housing Allowance",   s.housing],
                      ["Transport Allowance", s.transport],
                      ["Meal Allowance",      s.meal],
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
        <div className="w-full sm:w-48">
          <FormSelect
            id="period-filter"
            options={PERIOD_OPTIONS}
            value={period}
            onValueChange={(v) => setPeriod(v)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        hideStatusFilter
        onNewRequest={() => { setModal(true); setForm(EMPTY_FORM); }}
        newRequestLabel="New Pay Slip"
        emptyMessage={`No pay slips for ${period}`}
        emptyDescription="Try selecting a different pay period"
      />

      <Modal open={modal} title="New Pay Slip" onClose={() => setModal(false)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormSelect
            label="Employee"
            required
            options={EMPLOYEE_OPTIONS}
            placeholder="Select employee"
            value={form.employeeId}
            onValueChange={(v) => u("employeeId", v)}
          />
          <FormSelect
            label="Pay Period"
            required
            options={PERIOD_OPTIONS}
            placeholder="Select period"
            value={form.period}
            onValueChange={(v) => u("period", v)}
          />

          <p className="md:col-span-2 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide pt-2 border-t border-brand-border">
            Earnings
          </p>
          <FormInput label="Basic Salary" type="number" min={0} placeholder="0" value={form.basic} onChange={(e) => u("basic", e.target.value)} />
          <FormInput label="Housing Allowance" type="number" min={0} placeholder="0" value={form.housing} onChange={(e) => u("housing", e.target.value)} />
          <FormInput label="Transport Allowance" type="number" min={0} placeholder="0" value={form.transport} onChange={(e) => u("transport", e.target.value)} />
          <FormInput label="Meal Allowance" type="number" min={0} placeholder="0" value={form.meal} onChange={(e) => u("meal", e.target.value)} />

          <p className="md:col-span-2 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide pt-2 border-t border-brand-border">
            Deductions
          </p>
          <FormInput label="PAYE Tax" type="number" min={0} placeholder="0" value={form.paye} onChange={(e) => u("paye", e.target.value)} />
          <FormInput label="Pension" type="number" min={0} placeholder="0" value={form.pension} onChange={(e) => u("pension", e.target.value)} />
          <FormInput label="NHF" type="number" min={0} placeholder="0" value={form.nhf} onChange={(e) => u("nhf", e.target.value)} />
          <FormInput label="Loan Repayment" type="number" min={0} placeholder="0" value={form.loan} onChange={(e) => u("loan", e.target.value)} />
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-brand-border">
          <Button onClick={addSlip} disabled={!form.employeeId || !form.period}>
            Save Pay Slip
          </Button>
          <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
