"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Download, X, FileDown, Plus } from "lucide-react";
import MonthPickerModal from "@/components/ui/MonthPickerModal";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSelect from "@/components/forms/FormSelect";
import DataTable from "@/components/data-table/data-table";
import { createPaySlipColumns } from "../_components/columns";
import { type PaySlip } from "../_components/_data";
import { useToast } from "@/hooks/useToast";
import { usePayslips, useGeneratePayslips, usePayslipPeriods } from "@/lib/modules/payslips/hooks";
import loansApi from "@/lib/modules/loans/api";
import payslipsApi from "@/lib/modules/payslips/api";
import { buildPayslipDoc, generatePayslipPdf } from "@/lib/pdf/payslip.pdf";
import { useEmployees } from "@/lib/modules/employees/hooks";
import type { EmployeeListItem } from "@/lib/modules/employees/types";

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

// Build a preview payslip from a real employee record (values from HR salary setup).
// `loanOverride` (from the backend loan projection) takes precedence over the legacy
// loan_repayment field, matching how generation computes the deduction.
function computeSlip(emp: EmployeeListItem, period: string, loanOverride?: number): PaySlip {
  const num = (v: string | null | undefined) => Number(v ?? 0);
  const basic = num(emp.basic_salary), housing = num(emp.housing_allowance);
  const transport = num(emp.transport_allowance), meal = num(emp.meal_allowance);
  const paye = num(emp.paye), pension = num(emp.pension), nhf = num(emp.nhf);
  const loan = loanOverride !== undefined ? loanOverride : num(emp.loan_repayment);
  return {
    id: emp.id, // employee id — the selection key + the employee_id we generate for
    employee: `${emp.user?.first_name ?? ""} ${emp.user?.last_name ?? ""}`.trim() || emp.employee_no,
    empId: emp.employee_no,
    department: emp.department ?? "—",
    period,
    basic, housing, transport, meal, paye, pension, nhf, loan,
    net: basic + housing + transport + meal - paye - pension - nhf - loan,
  };
}

// ── PDF generation ────────────────────────────────────────────────────────────

async function downloadSlipsAsZip(slips: PaySlip[], period: string) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const slip of slips) {
    const doc = await buildPayslipDoc(slip);
    const blob = doc.output("arraybuffer");
    const safeName = slip.employee.replace(/\s+/g, "_");
    zip.file(`${safeName}_${period.replace(/\s+/g, "_")}.pdf`, blob);
  }
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${period.replace(/\s+/g, "_")}_Payslips.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadSinglePdf(slip: PaySlip) {
  await generatePayslipPdf(slip);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PaySlipsPage() {
  const toast = useToast();
  const [filterPeriod, setFilterPeriod] = useState("");
  const [selected, setSelected] = useState<PaySlip | null>(null);
  const [zipping, setZipping] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // ── Generate-preview state ────────────────────────────────────────────────
  const [preview, setPreview] = useState<PaySlip[] | null>(null);
  const [previewPeriod, setPreviewPeriod] = useState<string>("");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [generatedIds, setGeneratedIds] = useState<Set<string>>(new Set()); // preview rows that already have a slip this period

  const { data: periods = [] } = usePayslipPeriods();
  const { data: employees = [] } = useEmployees({ limit: 200 });
  const generateMut = useGeneratePayslips();

  // Show the chosen period, or default to the most recent generated one.
  const effectivePeriod = filterPeriod || periods[0] || "";
  const { data: slips = [], isLoading } = usePayslips(effectivePeriod ? { period: effectivePeriod } : {});

  const filtered = slips as PaySlip[];
  const columns  = useMemo(() => createPaySlipColumns(setSelected, async (slip) => {
    await downloadSinglePdf(slip);
    toast.success(`Payslip downloaded for ${slip.employee}`);
  }), [toast]);

  // Filter options — only periods that actually have payslips.
  const filterOptions = useMemo(() => {
    const list = effectivePeriod && !periods.includes(effectivePeriod) ? [...periods, effectivePeriod] : periods;
    return list.map((p) => ({ value: p, label: p }));
  }, [periods, effectivePeriod]);

  function openMonthPicker() {
    setShowMonthPicker(true);
  }

  async function startPreview(period: string) {
    const year = Number(period.split(" ").pop());
    const salaried = employees.filter((e) => e.basic_salary != null && Number(e.basic_salary) > 0);
    // Structured-loan projection (employee_id -> deduction) — takes precedence over the
    // legacy loan_repayment field so the preview matches what generation will write.
    let loanMap: Record<string, number> = {};
    try {
      loanMap = await loansApi.preview(period, year);
    } catch {
      // preview endpoint unavailable — fall back to legacy loan_repayment values
    }
    // Employees who already have a payslip for this period — matched by employee code.
    let existingCodes = new Set<string>();
    try {
      existingCodes = new Set((await payslipsApi.list({ period })).map((s) => s.empId));
    } catch {
      // couldn't fetch — treat none as already generated
    }
    const previewed = salaried.map((e) => computeSlip(e, period, loanMap[e.id]));
    const already = new Set(previewed.filter((s) => existingCodes.has(s.empId)).map((s) => s.id));
    setGeneratedIds(already);
    // Default-select only employees who don't yet have a slip — generate the missing ones.
    setCheckedIds(new Set(previewed.filter((s) => !already.has(s.id)).map((s) => s.id)));
    setPreviewPeriod(period);
    setPreview(previewed);
  }

  function handleMonthConfirm(period: string) {
    setShowMonthPicker(false);
    void startPreview(period);
  }

  function cancelGenerate() {
    setPreview(null);
    setPreviewPeriod("");
    setCheckedIds(new Set());
    setGeneratedIds(new Set());
  }

  function toggleAll(on: boolean) {
    setCheckedIds(on ? new Set(preview!.map((s) => s.id)) : new Set());
  }

  function toggleOne(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function confirmGenerate() {
    const employee_ids = [...checkedIds];
    if (employee_ids.length === 0) return;
    const year = Number(previewPeriod.split(" ").pop());
    try {
      const created = await generateMut.mutateAsync({ period: previewPeriod, year, employee_ids });
      setFilterPeriod(previewPeriod);
      setPreview(null);
      setPreviewPeriod("");
      setCheckedIds(new Set());
      toast.success(`${created.length} payslip${created.length !== 1 ? "s" : ""} generated for ${previewPeriod}`);
    } catch (err) {
      toast.error(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to generate payslips"
      );
    }
  }

  async function handleDownloadZip() {
    setZipping(true);
    try {
      await downloadSlipsAsZip(filtered, filterPeriod);
      toast.success(`${filtered.length} payslips downloaded as ZIP`);
    } catch {
      toast.error("Failed to download payslips");
    } finally {
      setZipping(false);
    }
  }

  // ── Pay-slip detail view ──────────────────────────────────────────────────
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
          <ArrowLeft size={16} /> Back to Pay Slips
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
                onClick={async () => { await downloadSinglePdf(s); toast.success(`Payslip downloaded for ${s.employee}`); }}
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

  // ── List view ─────────────────────────────────────────────────────────────
  const allChecked  = preview !== null && checkedIds.size === preview.length;
  const someChecked = checkedIds.size > 0 && !allChecked;

  return (
    <AppLayout pageTitle="Pay Slip Management">
      {/* Month picker modal */}
      {showMonthPicker && (
        <MonthPickerModal
          title="Select Payroll Period"
          description="Choose the month to generate payslips for"
          confirmLabel="Generate"
          onConfirm={(sel) => handleMonthConfirm(sel.label)}
          onCancel={() => setShowMonthPicker(false)}
        />
      )}

      {/* ── Header ── */}
      <div className="mb-6">
        <PageHeader
          title="Pay Slip Management"
          description="Generate, manage, and download employee pay slips"
          action={
            <Button leftIcon={<Plus size={16} />} onClick={openMonthPicker}>
              Generate Payslip
            </Button>
          }
        />
      </div>

      {/* ── Generate preview (select employees) ── */}
      {preview && (
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden mb-6 shadow-sm">
          <div className="px-5 py-4 border-b border-brand-border bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-text-primary">
                Payslip Preview — <span className="text-brand-purple">{previewPeriod}</span>
              </p>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Values auto-filled from employee records. Employees who already have a slip this month are
                unticked — tick them to regenerate.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={confirmGenerate}
                loading={generateMut.isPending}
                disabled={checkedIds.size === 0}
                rightIcon={
                  <span className="bg-white/20 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {checkedIds.size}
                  </span>
                }
              >
                Confirm &amp; Generate
              </Button>
              <Button variant="outline" onClick={cancelGenerate} leftIcon={<X size={14} />}>
                Cancel
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-brand-border bg-gray-50 text-left">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked; }}
                      onChange={(e) => toggleAll(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 accent-brand-purple cursor-pointer"
                    />
                  </th>
                  {["Employee", "Dept", "Basic Salary", "Housing", "Transport", "Meal", "PAYE", "Pension", "NHF", "Loan", "Net Pay"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((slip) => {
                  const isChecked = checkedIds.has(slip.id);
                  return (
                    <tr
                      key={slip.id}
                      onClick={() => toggleOne(slip.id)}
                      className={`border-t border-brand-border cursor-pointer transition-colors ${
                        isChecked ? "bg-brand-purple-faint/40" : "hover:bg-gray-50/60"
                      }`}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(slip.id)}
                          className="h-4 w-4 rounded border-gray-300 accent-brand-purple cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-brand-text-primary whitespace-nowrap">{slip.employee}</p>
                          {generatedIds.has(slip.id) && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                              Already generated
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-brand-text-secondary">{slip.empId}</p>
                      </td>
                      <td className="px-4 py-3 text-brand-text-secondary whitespace-nowrap">{slip.department}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmt(slip.basic)}</td>
                      <td className="px-4 py-3 text-brand-text-secondary whitespace-nowrap">{fmt(slip.housing)}</td>
                      <td className="px-4 py-3 text-brand-text-secondary whitespace-nowrap">{fmt(slip.transport)}</td>
                      <td className="px-4 py-3 text-brand-text-secondary whitespace-nowrap">{fmt(slip.meal)}</td>
                      <td className="px-4 py-3 text-red-500 whitespace-nowrap">{fmt(slip.paye)}</td>
                      <td className="px-4 py-3 text-red-500 whitespace-nowrap">{fmt(slip.pension)}</td>
                      <td className="px-4 py-3 text-red-500 whitespace-nowrap">{fmt(slip.nhf)}</td>
                      <td className="px-4 py-3 text-red-500 whitespace-nowrap">{fmt(slip.loan)}</td>
                      <td className="px-4 py-3 font-bold text-brand-purple whitespace-nowrap">{fmt(slip.net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-brand-border bg-gray-50 flex items-center justify-between text-xs text-brand-text-secondary">
            <span>{checkedIds.size} of {preview.length} employees selected</span>
            <button
              onClick={() => toggleAll(checkedIds.size < preview.length)}
              className="text-brand-purple font-medium hover:underline"
            >
              {checkedIds.size < preview.length ? "Select all" : "Deselect all"}
            </button>
          </div>
        </div>
      )}

      {/* ── Payslips table (hidden while previewing) ── */}
      {!preview && (
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          hideStatusFilter
          emptyMessage={effectivePeriod ? `No pay slips for ${effectivePeriod}` : "No pay slips yet"}
          emptyDescription="Select a period and click Generate Payslip"
          toolbarExtra={
            <div className="flex items-center gap-2 shrink-0">
              {filterOptions.length > 0 && (
                <div className="w-44">
                  <FormSelect
                    id="period-filter"
                    options={filterOptions}
                    value={effectivePeriod}
                    onValueChange={setFilterPeriod}
                  />
                </div>
              )}
              {filtered.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleDownloadZip}
                  disabled={zipping}
                  leftIcon={<FileDown size={15} />}
                  className="shrink-0 whitespace-nowrap"
                >
                  {zipping ? "Zipping…" : "Download ZIP"}
                </Button>
              )}
            </div>
          }
        />
      )}
    </AppLayout>
  );
}
