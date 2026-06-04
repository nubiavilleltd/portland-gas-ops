"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, X, FileDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSelect from "@/components/forms/FormSelect";
import DataTable from "@/components/data-table/data-table";
import { createPaySlipColumns } from "../_components/columns";
import { SEED_PAYSLIPS, SEED_EMPLOYEES, PAYROLL_PERIODS, type PaySlip } from "../_components/_data";
import { useToast } from "@/hooks/useToast";

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

// "2026-04" → "April 2026"
function monthInputToLabel(value: string): string {
  const [year, month] = value.split("-");
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

// "April 2026" → "2026-04"
function labelToMonthInput(label: string): string {
  const date = new Date(`1 ${label}`);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function computeSlip(emp: typeof SEED_EMPLOYEES[number], period: string): PaySlip {
  const basic     = emp.basicSalary        ?? 0;
  const housing   = emp.housingAllowance   ?? 0;
  const transport = emp.transportAllowance ?? 0;
  const meal      = emp.mealAllowance      ?? 0;
  const paye      = emp.paye              ?? 0;
  const pension   = emp.pension           ?? 0;
  const nhf       = emp.nhf              ?? 0;
  const loan      = emp.loanRepayment    ?? 0;
  return {
    id:         `gen-${emp.id}-${period.replace(/\s/g, "")}`,
    employee:   `${emp.firstName} ${emp.lastName}`,
    empId:      `PG-${emp.id.padStart(3, "0")}`,
    department: emp.department,
    period,
    basic, housing, transport, meal,
    paye, pension, nhf, loan,
    net: basic + housing + transport + meal - paye - pension - nhf - loan,
  };
}

// ── PDF generation ────────────────────────────────────────────────────────────

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

async function downloadSlipsAsZip(slips: PaySlip[], period: string) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const slip of slips) {
    const doc = await buildSlipPdf(slip);
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
  const doc = await buildSlipPdf(slip);
  doc.save(`${slip.employee.replace(/\s+/g, "_")}_${slip.period.replace(/\s+/g, "_")}.pdf`);
}

// ── Month Picker Modal ────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function MonthPickerModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (period: string) => void;
  onCancel: () => void;
}) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState<number | null>(now.getMonth()); // 0-indexed

  const selectedLabel = month !== null ? `${MONTH_FULL[month]} ${year}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-7">
          {/* header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-brand-text-primary">Select Payroll Period</h3>
              <p className="text-sm text-brand-text-secondary mt-0.5">Choose the month to generate payslips for</p>
            </div>
            <button
              onClick={onCancel}
              className="text-brand-text-secondary hover:text-brand-text-primary transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          {/* year navigation */}
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-brand-text-secondary hover:text-brand-text-primary"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-base font-bold text-brand-text-primary tracking-wide">{year}</span>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-brand-text-secondary hover:text-brand-text-primary"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* month grid — inline style forces 3-column layout regardless of Tailwind purge */}
          <div
            className="mb-6"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}
          >
            {MONTHS.map((m, i) => {
              const isSelected = month === i;
              const isCurrent  = i === now.getMonth() && year === now.getFullYear();
              return (
                <button
                  key={m}
                  onClick={() => setMonth(i)}
                  className={`
                    relative py-2.5 rounded-xl text-sm font-medium transition-all text-center
                    ${isSelected
                      ? "bg-brand-purple text-white shadow-sm"
                      : "hover:bg-brand-purple-faint text-brand-text-primary hover:text-brand-purple"
                    }
                  `}
                >
                  {m}
                  {isCurrent && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-purple" />
                  )}
                </button>
              );
            })}
          </div>

          {/* selected label */}
          <div className="h-6 mb-5 flex items-center justify-center">
            {selectedLabel ? (
              <p className="text-sm font-semibold text-brand-purple">{selectedLabel}</p>
            ) : (
              <p className="text-sm text-brand-text-secondary">No month selected</p>
            )}
          </div>

          {/* actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => selectedLabel && onConfirm(selectedLabel)}
              disabled={month === null}
              className="flex-1"
            >
              Generate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Override Confirm Modal ────────────────────────────────────────────────────

function OverrideConfirmModal({
  period,
  onConfirm,
  onCancel,
}: {
  period: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 shrink-0 mr-3 mt-0.5">
            <span className="text-amber-500 text-lg font-bold">!</span>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-brand-text-primary">Payslips Already Exist</h3>
            <p className="text-sm text-brand-text-secondary mt-1">
              Payslips for <span className="font-semibold text-brand-text-primary">{period}</span> have already been generated. Do you want to override them?
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-brand-text-secondary hover:text-brand-text-primary transition-colors p-1 rounded-lg hover:bg-gray-100 shrink-0 ml-2"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-amber-500 hover:bg-amber-600 border-amber-500">
            Yes, Override
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PaySlipsPage() {
  const toast = useToast();
  const [slips,  setSlips]  = useState<PaySlip[]>(SEED_PAYSLIPS);
  const [filterPeriod, setFilterPeriod] = useState("April 2026");
  const [selected, setSelected] = useState<PaySlip | null>(null);
  const [zipping, setZipping] = useState(false);

  // ── Generate-preview state ────────────────────────────────────────────────
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [overridePeriod, setOverridePeriod] = useState<string | null>(null);
  const [preview,    setPreview]    = useState<PaySlip[] | null>(null);
  const [previewPeriod, setPreviewPeriod] = useState<string>("");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const filtered = slips.filter((s) => s.period === filterPeriod);
  const columns  = useMemo(() => createPaySlipColumns(setSelected, async (slip) => {
    await downloadSinglePdf(slip);
    toast.success(`Payslip downloaded for ${slip.employee}`);
  }), []);

  // Filter options — unique periods only
  const filterOptions = useMemo(() => {
    const known = new Set(PAYROLL_PERIODS as readonly string[]);
    const extra = [...new Set(slips.map((s) => s.period).filter((p) => !known.has(p)))];
    const all = [...PAYROLL_PERIODS, ...extra];
    return all.map((p) => ({ value: p, label: p }));
  }, [slips]);

  function openMonthPicker() {
    setShowMonthPicker(true);
  }

  function startPreview(period: string) {
    const previewed = SEED_EMPLOYEES.map((e) => computeSlip(e, period));
    // When overriding, check all employees; otherwise only unchecked ones
    setCheckedIds(new Set(previewed.map((s) => s.id)));
    setPreviewPeriod(period);
    setPreview(previewed);
  }

  function handleMonthConfirm(period: string) {
    setShowMonthPicker(false);
    const hasExisting = slips.some((s) => s.period === period);
    if (hasExisting) {
      setOverridePeriod(period);
    } else {
      startPreview(period);
    }
  }

  function handleOverrideConfirm() {
    const period = overridePeriod!;
    setOverridePeriod(null);
    startPreview(period);
  }

  function handleOverrideCancel() {
    setOverridePeriod(null);
  }

  function cancelGenerate() {
    setPreview(null);
    setPreviewPeriod("");
    setCheckedIds(new Set());
  }

  function toggleAll(on: boolean) {
    setCheckedIds(on ? new Set(preview!.map((s) => s.id)) : new Set());
  }

  function toggleOne(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function confirmGenerate() {
    const toAdd = preview!.filter((s) => checkedIds.has(s.id));
    // Remove every employee in the preview from existing records for this period —
    // checked ones get replaced with the new slip, unchecked ones get removed entirely.
    const allPreviewEmployees = new Set(preview!.map((s) => s.employee));
    setSlips((prev) => [
      ...toAdd,
      ...prev.filter((s) => !(s.period === previewPeriod && allPreviewEmployees.has(s.employee))),
    ]);
    setFilterPeriod(previewPeriod);
    setPreview(null);
    setPreviewPeriod("");
    setCheckedIds(new Set());
    toast.success(`${toAdd.length} payslip${toAdd.length !== 1 ? "s" : ""} generated for ${previewPeriod}`);
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
  const alreadyDone = new Set(
    preview ? slips.filter((s) => s.period === previewPeriod).map((s) => s.employee) : []
  );
  const allChecked  = preview !== null && checkedIds.size === preview.length;
  const someChecked = checkedIds.size > 0 && !allChecked;

  return (
    <AppLayout pageTitle="Pay Slip Management">
      {/* Month picker modal */}
      {showMonthPicker && (
        <MonthPickerModal
          onConfirm={handleMonthConfirm}
          onCancel={() => setShowMonthPicker(false)}
        />
      )}

      {/* Override confirmation modal */}
      {overridePeriod && (
        <OverrideConfirmModal
          period={overridePeriod}
          onConfirm={handleOverrideConfirm}
          onCancel={handleOverrideCancel}
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

      {/* ── Generate preview ── */}
      {preview && (
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden mb-6 shadow-sm">
          <div className="px-5 py-4 border-b border-brand-border bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-text-primary">
                Payslip Preview — <span className="text-brand-purple">{previewPeriod}</span>
              </p>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Values auto-filled from employee records. Select employees to include then confirm.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={confirmGenerate}
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
                  {["Employee", "Dept", "Basic Salary", "Housing", "Transport", "Meal", "PAYE", "Pension", "NHF", "Loan", "Net Pay", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((slip) => {
                  const isChecked = checkedIds.has(slip.id);
                  const isDone    = alreadyDone.has(slip.employee);
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
                        <p className="font-medium text-brand-text-primary whitespace-nowrap">{slip.employee}</p>
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
                      <td className="px-4 py-3">
                        {isDone && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 whitespace-nowrap">
                            Already generated
                          </span>
                        )}
                      </td>
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

      {/* ── Confirmed payslips table (hidden while preview is open) ── */}
      {!preview && (
        <DataTable
          columns={columns}
          data={filtered}
          hideStatusFilter
          emptyMessage={`No pay slips for ${filterPeriod}`}
          emptyDescription="Select a period and click Generate Payslip"
          toolbarExtra={
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-44">
                <FormSelect
                  id="period-filter"
                  options={filterOptions}
                  value={filterPeriod}
                  onValueChange={setFilterPeriod}
                />
              </div>
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
