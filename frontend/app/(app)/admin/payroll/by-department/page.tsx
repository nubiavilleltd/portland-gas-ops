"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import SelectInput from "@/components/forms/SelectInput";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { KpiCard, type KpiCardVariant } from "@/lib/modules/orders/components/KpiCard";
import { formatCurrency } from "@/lib/utils";
import {
  usePayrollByDepartment,
  type DepartmentCost,
} from "@/lib/modules/finance/payroll-by-department";

/**
 * Payroll cost per department for one period.
 *
 * Payroll is recorded in a single currency, so unlike the finance dashboard
 * these figures can legitimately be totalled.
 */

const DEPTS_PER_PAGE = 10;
const ALL_PERIODS = "__all__";

/** Card with the label, value and an explanatory line beneath. */
function Kpi({
  label,
  value,
  sub,
  variant,
}: {
  label: string;
  value: string;
  sub?: string;
  variant: KpiCardVariant;
}) {
  return (
    <div className="[&>div]:h-full">
      <KpiCard label={label} value={value} variant={variant} />
      {sub && <p className="text-xs text-brand-text-secondary mt-1.5 px-1">{sub}</p>}
    </div>
  );
}

export default function PayrollByDepartmentPage() {
  const [selected, setSelected] = useState<{ period: string; year: number } | null>(null);
  // Opens on the whole book — a single recent period can be one payslip, which
  // reads as if the company barely has a payroll.
  const [allPeriods, setAllPeriods] = useState(true);
  const { data, isLoading, isFetching } = usePayrollByDepartment(
    selected?.period,
    selected?.year,
    allPeriods,
  );
  const [openDept, setOpenDept] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState("");
  const [page, setPage] = useState(1);

  if (isLoading && !data) {
    return (
      <AppLayout pageTitle="Payroll by Department">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-brand-border rounded-2xl p-5 animate-pulse">
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-7 w-32 bg-gray-100 rounded mt-3" />
            </div>
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!data || data.periods.length === 0) {
    return (
      <AppLayout pageTitle="Payroll by Department">
        <PageHeader title="Payroll by Department" className="mb-6" />
        <div className="rounded-2xl border border-brand-border bg-white p-6">
          <p className="text-sm text-brand-text-secondary">
            No payroll has been run yet, so there is nothing to break down.
          </p>
        </div>
      </AppLayout>
    );
  }

  const { departments, employees } = data;

  const visibleDepartments = deptFilter
    ? departments.filter((d) => d.department === deptFilter)
    : departments;

  const sum = (pick: (d: DepartmentCost) => number) =>
    visibleDepartments.reduce((acc, d) => acc + pick(d), 0);

  const totals = {
    staff: sum((d) => d.staff),
    gross: sum((d) => d.gross),
    deductions: sum((d) => d.deductions),
    paye: sum((d) => d.paye),
    pension: sum((d) => d.pension),
    nhf: sum((d) => d.nhf),
    loan: sum((d) => d.loan),
    net: sum((d) => d.net),
    departments: visibleDepartments.length,
  };
  const totalPages = Math.ceil(visibleDepartments.length / DEPTS_PER_PAGE);
  const safePage = Math.min(page, Math.max(totalPages, 1));
  const pagedDepartments = visibleDepartments.slice(
    (safePage - 1) * DEPTS_PER_PAGE,
    safePage * DEPTS_PER_PAGE,
  );

  const payrollNet = departments.reduce((acc, d) => acc + d.net, 0);
  const shareOfPayroll = payrollNet ? (totals.net / payrollNet) * 100 : 0;

  return (
    <AppLayout pageTitle="Payroll by Department">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-purple mb-4"
      >
        <ArrowLeft size={15} />
        Admin
      </Link>

      <PageHeader
        title="Payroll by Department"
        description={
          data.all_periods
            ? "What payroll costs each department, across every period on record"
            : "What payroll costs each department, for the selected period"
        }
        className="mb-6"
      />

      {/* Dropdowns rather than chips — payroll accumulates a period every month,
          and the department list grows with the org. */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="w-60">
          <SelectInput
            label="Department"
            placeholder="All departments"
            sortOptions={false}
            value={deptFilter}
            onValueChange={(v) => {
              setDeptFilter(v);
              setOpenDept(null);
              setPage(1);
            }}
            options={data.all_departments.map((name) => {
              const inPeriod = departments.find((d) => d.department === name);
              return {
                value: name,
                label: inPeriod ? `${name} · ${inPeriod.staff}` : `${name} · 0`,
              };
            })}
          />
        </div>
        <div className="w-60">
          <SelectInput
            label="Period"
            sortOptions={false}
            value={data.all_periods ? ALL_PERIODS : `${data.period}|${data.year}`}
            onValueChange={(v) => {
              if (v === ALL_PERIODS) {
                setAllPeriods(true);
                setSelected(null);
              } else {
                const [period, year] = v.split("|");
                setAllPeriods(false);
                setSelected({ period, year: Number(year) });
              }
              setOpenDept(null);
              setPage(1);
            }}
            options={[
              {
                value: ALL_PERIODS,
                label: `All periods · ${data.periods.reduce((a, p) => a + p.payslips, 0)} payslips`,
              },
              ...data.periods.map((p) => ({
                value: `${p.period}|${p.year}`,
                label: `${p.period} · ${p.payslips} payslip${p.payslips === 1 ? "" : "s"}`,
              })),
            ]}
          />
        </div>
        {deptFilter && (
          <button
            type="button"
            onClick={() => setDeptFilter("")}
            className="h-10 px-3 text-sm text-brand-text-secondary hover:text-brand-purple"
          >
            Clear
          </button>
        )}
        {isFetching && (
          <span className="h-10 inline-flex items-center gap-2 text-sm text-brand-text-secondary">
            <LoadingSpinner size="sm" />
            Updating…
          </span>
        )}
      </div>

      <div
        className={`transition-opacity ${isFetching ? "opacity-50 pointer-events-none" : ""}`}
      >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <Kpi
          label="Total payroll cost"
          value={formatCurrency(totals.gross)}
          sub="Gross, before deductions"
          variant="primary"
        />
        <Kpi
          label="Net paid"
          value={formatCurrency(totals.net)}
          sub="After all deductions"
          variant="success"
        />
        <Kpi
          label="Deductions"
          value={formatCurrency(totals.deductions)}
          sub={`PAYE ${formatCurrency(totals.paye)} · Pension ${formatCurrency(totals.pension)}`}
          variant="warning"
        />
        <Kpi
          label="Staff on payroll"
          value={String(totals.staff)}
          sub={
            deptFilter
              ? `${deptFilter} · ${shareOfPayroll.toFixed(1)}% of payroll`
              : `Across ${totals.departments} department${totals.departments === 1 ? "" : "s"}`
          }
          variant="info"
        />
      </div>

      <section className="rounded-2xl border border-brand-border bg-white overflow-hidden">
        <header className="px-5 py-4 border-b border-brand-border">
          <h3 className="text-sm font-semibold text-brand-text-primary">
            Cost by department
          </h3>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Ranked by net cost. Select a department to see the people behind the figure.
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-brand-text-secondary border-b border-brand-border">
                <th className="text-left font-medium px-5 py-2.5">Department</th>
                <th className="text-right font-medium px-3 py-2.5">Staff</th>
                <th className="text-right font-medium px-3 py-2.5">Gross</th>
                <th className="text-right font-medium px-3 py-2.5">PAYE</th>
                <th className="text-right font-medium px-3 py-2.5">Pension</th>
                <th className="text-right font-medium px-3 py-2.5">Other</th>
                <th className="text-right font-medium px-3 py-2.5">Net</th>
                <th className="text-right font-medium px-5 py-2.5">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {pagedDepartments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-sm text-brand-text-secondary">
                    {deptFilter
                      ? `${deptFilter} has no payroll recorded for this period.`
                      : "No payroll recorded for this period."}
                  </td>
                </tr>
              )}
              {pagedDepartments.map((d: DepartmentCost) => {
                const open = openDept === d.department;
                const people = employees.filter((e) => e.department === d.department);
                return (
                  <Fragment key={d.department}>
                    <tr
                      onClick={() => setOpenDept(open ? null : d.department)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-brand-text-primary">
                        <span className="inline-flex items-center gap-1.5">
                          <ChevronDown
                            size={14}
                            className={`text-brand-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
                          />
                          {d.department}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{d.staff}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(d.gross)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(d.paye)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(d.pension)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {formatCurrency(d.nhf + d.loan)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold">
                        {formatCurrency(d.net)}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-brand-text-secondary">
                        {d.share_of_net}%
                      </td>
                    </tr>
                    {open &&
                      people.map((e) => (
                        <tr key={e.payslip_id} className="bg-gray-50/70">
                          <td className="px-5 py-2 pl-12 text-brand-text-secondary">
                            {e.name}
                            {e.emp_code ? (
                              <span className="font-mono text-xs"> · {e.emp_code}</span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2" />
                          <td className="px-3 py-2 text-right tabular-nums text-brand-text-secondary">
                            {formatCurrency(e.gross)}
                          </td>
                          <td className="px-3 py-2" colSpan={3} />
                          <td className="px-3 py-2 text-right tabular-nums text-brand-text-secondary">
                            {formatCurrency(e.net)}
                          </td>
                          <td className="px-5 py-2" />
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot className={visibleDepartments.length === 0 ? "hidden" : undefined}>
              <tr className="border-t-2 border-brand-border font-semibold">
                <td className="px-5 py-3">Total</td>
                <td className="px-3 py-3 text-right tabular-nums">{totals.staff}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(totals.gross)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(totals.paye)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(totals.pension)}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatCurrency(totals.nhf + totals.loan)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(totals.net)}</td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {shareOfPayroll.toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 pb-4">
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>

      </div>

      <p className="text-xs text-brand-text-secondary mt-3">
        Grouped by the department recorded on each payslip when payroll ran, so
        historical periods keep reporting the same figures after a transfer.
      </p>
    </AppLayout>
  );
}
