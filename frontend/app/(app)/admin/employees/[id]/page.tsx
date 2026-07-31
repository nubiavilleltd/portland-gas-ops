"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, PlusCircle, Eye, Download, Trash2, FileText, XCircle, Wallet, Calendar, ChevronRight, ChevronDown } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormFileUpload from "@/components/forms/FormFileUpload";
import Button from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils/format-number";
import {
  CATEGORY_OPTIONS,
  GRADE_OPTIONS,
  fmtDate,
} from "../../_components/_data";
import { useEmployeeLeaveBalances } from "@/lib/modules/leave-balances/hooks";
import { useLeaveTypes } from "@/lib/modules/leave-types/hooks";
import { useDepartments } from "@/lib/modules/setups";
import {
  useEmployee,
  useUpdateEmployee,
  useEmployees,
  useEmployeeDocuments,
  useUploadEmployeeDocument,
  useDeleteEmployeeDocument,
} from "@/lib/modules/employees/hooks";
import type { EmploymentType } from "@/lib/modules/employees/types";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import { useToast } from "@/hooks/useToast";
import {
  useEmployeeLoans,
  useCreateLoan,
  useUpdateLoan,
  useDeleteLoan,
  useLoanCharges,
} from "@/lib/modules/loans/hooks";
import type { LoanMode, LoanStatus, LoanCreatePayload, Loan } from "@/lib/modules/loans/types";
import MonthPickerModal from "@/components/ui/MonthPickerModal";

const YEAR = new Date().getFullYear();

function calcDeductions(basic = 0, housing = 0, transport = 0, meal = 0) {
  const pension = Math.round(0.08 * (basic + housing + transport));
  const nhf     = Math.round(0.025 * basic);
  const annualGross   = (basic + housing + transport + meal) * 12;
  const annualPension = pension * 12;
  const annualNhf     = nhf * 12;
  const cra = Math.max(200_000, 0.01 * annualGross) + 0.2 * annualGross;
  const taxable = Math.max(0, annualGross - annualPension - annualNhf - cra);
  const bands: [number, number][] = [
    [300_000,   0.07],
    [300_000,   0.11],
    [500_000,   0.15],
    [500_000,   0.19],
    [1_600_000, 0.21],
    [Infinity,  0.24],
  ];
  let rem = taxable, annualTax = 0;
  for (const [cap, rate] of bands) {
    const slice = Math.min(rem, cap);
    annualTax += slice * rate;
    rem -= slice;
    if (rem <= 0) break;
  }
  return { pension, nhf, paye: Math.round(annualTax / 12) };
}

function BalanceCard({
  type,
  used,
  entitlement,
  uncapped = false,
}: { type: string; used: number; entitlement: number; uncapped?: boolean }) {
  const remaining = Math.max(0, entitlement - used);
  const pct = entitlement > 0 ? Math.min(100, (remaining / entitlement) * 100) : 100;
  const barColor  = pct <= 20 ? "bg-red-500"  : pct <= 50 ? "bg-amber-500" : "bg-brand-purple";
  const textColor = pct <= 20 ? "text-red-600" : pct <= 50 ? "text-amber-600" : "text-brand-text-primary";
  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col">
      <p className="text-xs font-semibold text-brand-text-secondary line-clamp-2 h-7">{type}</p>
      {/* An uncapped type has no ceiling, so counting down from one would be a lie. */}
      {uncapped ? (
        <>
          <p className="text-2xl font-bold mt-1 text-brand-purple">No cap</p>
          <p className="text-xs text-brand-text-secondary flex-grow">no entitlement limit</p>
        </>
      ) : (
        <>
          <p className={`text-2xl font-bold mt-1 ${textColor}`}>{remaining}</p>
          <p className="text-xs text-brand-text-secondary flex-grow">of {entitlement} days remaining</p>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
        </>
      )}
      <p className="text-xs text-brand-text-secondary mt-1.5">{used} days used</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
      </div>
      <div className="px-6 pt-5 pb-6">{children}</div>
    </div>
  );
}

const LOAN_MODE_OPTIONS = [
  { value: "installment", label: "Installments — pays off a total, then stops" },
  { value: "one_off",     label: "One-off — deduct once" },
  { value: "standing",    label: "Standing — recurring, no end date" },
];
const LOAN_MODE_LABEL: Record<LoanMode, string> = {
  one_off: "One-off", installment: "Installment", standing: "Standing",
};
const LOAN_STATUS_STYLE: Record<LoanStatus, string> = {
  active:    "bg-green-50 text-green-700 border-green-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

const fmtLoanMoney = (n: number | null | undefined) =>
  n !== null && n !== undefined ? `₦${formatNumber(n)}` : "—";

function LoanRow({ loan, onCancel, onRemove, cancelPending, removePending }: {
  loan: Loan;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
  cancelPending: boolean;
  removePending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: charges = [], isLoading } = useLoanCharges(loan.id, expanded);

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex items-start gap-2 min-w-0 text-left">
          {expanded
            ? <ChevronDown size={15} className="mt-0.5 text-brand-text-secondary shrink-0" />
            : <ChevronRight size={15} className="mt-0.5 text-brand-text-secondary shrink-0" />}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-brand-text-primary truncate">
                {loan.description || LOAN_MODE_LABEL[loan.mode]}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-purple-faint text-brand-purple border border-brand-purple-mid">
                {LOAN_MODE_LABEL[loan.mode]}
              </span>
            </div>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              {fmtLoanMoney(loan.monthly_amount)}/mo
              {loan.total_amount != null && <> · total {fmtLoanMoney(loan.total_amount)}</>}
              {loan.total_amount != null && <> · outstanding <span className="font-medium text-brand-text-primary">{fmtLoanMoney(loan.outstanding)}</span></>}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize ${LOAN_STATUS_STYLE[loan.status]}`}>
            {loan.status}
          </span>
          {loan.status === "active" && (
            <button onClick={() => onCancel(loan.id)} disabled={cancelPending}
              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition disabled:opacity-50" title="Cancel loan">
              <XCircle size={15} />
            </button>
          )}
          <button onClick={() => onRemove(loan.id)} disabled={removePending}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition disabled:opacity-50" title="Delete loan">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 ml-6 rounded-lg border border-brand-border bg-gray-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-text-secondary mb-2">Repayment history</p>
          {isLoading ? (
            <p className="text-xs text-brand-text-secondary">Loading…</p>
          ) : charges.length === 0 ? (
            <p className="text-xs text-brand-text-secondary">No repayments yet.</p>
          ) : (
            <div className="space-y-1">
              {charges.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className="text-brand-text-secondary">{c.period}</span>
                  <span className="font-medium text-brand-text-primary">{fmtLoanMoney(c.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type LoanFormState = {
  mode: LoanMode; monthly: string; total: string; description: string;
  startYyyymm?: number; startLabel?: string;
};
const EMPTY_LOAN_FORM: LoanFormState = { mode: "installment", monthly: "", total: "", description: "" };

function LoansSection({ employeeId }: { employeeId: string }) {
  const { data: loans = [], isLoading } = useEmployeeLoans(employeeId);
  const createLoan = useCreateLoan(employeeId);
  const updateLoan = useUpdateLoan(employeeId);
  const deleteLoan = useDeleteLoan(employeeId);
  const toast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [form, setForm] = useState<LoanFormState>(EMPTY_LOAN_FORM);
  const uf = (k: keyof LoanFormState, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const reset = () => { setForm(EMPTY_LOAN_FORM); setShowForm(false); };

  // One active loan at a time — the current loan must finish or be cancelled first.
  const hasActive = loans.some((l) => l.status === "active");

  const submit = async () => {
    const monthly = Number(form.monthly.replace(/,/g, ""));
    if (!monthly || monthly <= 0) { toast.error("Enter a monthly amount greater than 0"); return; }
    const payload: LoanCreatePayload = {
      mode: form.mode,
      monthly_amount: monthly,
      description: form.description.trim() || undefined,
    };
    if (form.mode === "installment") {
      const total = Number(form.total.replace(/,/g, ""));
      if (!total || total < monthly) { toast.error("Enter a total amount at least equal to the monthly amount"); return; }
      payload.total_amount = total;
    }
    if (form.startYyyymm) {
      payload.start_period_yyyymm = form.startYyyymm;
    }
    try {
      await createLoan.mutateAsync(payload);
      toast.success("Loan added");
      reset();
    } catch (e) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "Failed to add loan");
    }
  };

  const cancelLoan = async (loanId: string) => {
    try { await updateLoan.mutateAsync({ loanId, payload: { status: "cancelled" } }); toast.success("Loan cancelled"); }
    catch { toast.error("Failed to cancel loan"); }
  };
  const removeLoan = async (loanId: string) => {
    try { await deleteLoan.mutateAsync(loanId); toast.success("Loan removed"); }
    catch { toast.error("Failed to remove loan"); }
  };

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
      {showMonthPicker && (
        <MonthPickerModal
          title="Select Start Month"
          description="First payroll month to deduct this loan from"
          confirmLabel="Set"
          onConfirm={(sel) => {
            setForm((p) => ({ ...p, startYyyymm: sel.year * 100 + (sel.month + 1), startLabel: sel.label }));
            setShowMonthPicker(false);
          }}
          onCancel={() => setShowMonthPicker(false)}
        />
      )}
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-brand-text-secondary" />
          <h2 className="text-base font-semibold text-brand-text-primary">Loans &amp; Deductions</h2>
        </div>
        {!showForm && (
          <button type="button" onClick={() => setShowForm(true)} disabled={hasActive}
            title={hasActive ? "Finish or cancel the active loan before adding another" : undefined}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium bg-brand-purple text-white hover:bg-brand-purple-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <PlusCircle size={13} /> Add Loan
          </button>
        )}
      </div>

      <div className="px-6 pt-5 pb-6">
        {/* Add form */}
        {showForm && (
          <div className="mb-5 rounded-xl border border-brand-border bg-gray-50 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect label="Type" options={LOAN_MODE_OPTIONS} value={form.mode}
                onValueChange={(v) => uf("mode", v)} />
              <FormInput label="Monthly Amount" placeholder="0.00" value={form.monthly}
                onChange={(e) => uf("monthly", e.target.value)}
                onBlur={(e) => { const r = e.target.value.replace(/,/g, ""); e.target.value = r ? formatNumber(parseFloat(r) || 0) : ""; }} />
              {form.mode === "installment" && (
                <FormInput label="Total to Repay" placeholder="0.00" value={form.total}
                  onChange={(e) => uf("total", e.target.value)}
                  onBlur={(e) => { const r = e.target.value.replace(/,/g, ""); e.target.value = r ? formatNumber(parseFloat(r) || 0) : ""; }}
                  hint="How many months = total ÷ monthly" />
              )}
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-1.5">Start Month (optional)</label>
                <button type="button" onClick={() => setShowMonthPicker(true)}
                  className="w-full h-10.5 px-3 rounded-lg border border-brand-border bg-white text-left text-sm flex items-center justify-between hover:border-brand-purple transition-colors">
                  <span className={form.startLabel ? "text-brand-text-primary" : "text-brand-text-secondary"}>
                    {form.startLabel || "Any month (from first run)"}
                  </span>
                  <Calendar size={15} className="text-brand-text-secondary shrink-0" />
                </button>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-brand-text-secondary">First payroll month to deduct from</p>
                  {form.startLabel && (
                    <button type="button" onClick={() => setForm((p) => ({ ...p, startYyyymm: undefined, startLabel: undefined }))}
                      className="text-xs text-brand-text-secondary hover:text-red-500">Clear</button>
                  )}
                </div>
              </div>
              <FormInput label="Description (optional)" placeholder="e.g. Salary advance"
                value={form.description} onChange={(e) => uf("description", e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} loading={createLoan.isPending}>Add Loan</Button>
              <Button variant="outline" onClick={reset}>Cancel</Button>
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
        ) : loans.length === 0 ? (
          !showForm && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Wallet size={32} className="text-brand-text-secondary mb-2 opacity-40" />
              <p className="text-sm text-brand-text-secondary">No loans or deductions.</p>
            </div>
          )
        ) : (
          <>
            {hasActive && !showForm && (
              <p className="text-xs text-brand-text-secondary mb-3">
                This employee has an active loan. Finish or cancel it before adding another.
              </p>
            )}
            <div className="divide-y divide-brand-border">
              {loans.map((loan) => (
                <LoanRow
                  key={loan.id}
                  loan={loan}
                  onCancel={cancelLoan}
                  onRemove={removeLoan}
                  cancelPending={updateLoan.isPending}
                  removePending={deleteLoan.isPending}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract",  label: "Contract"  },
  { value: "Intern",    label: "Intern"    },
];

const ACCOUNT_STATUS_OPTIONS = [
  { value: "active",      label: "Active"      },
  { value: "pending",     label: "Pending"     },
  { value: "deactivated", label: "Deactivated" },
];

type EditForm = Partial<{
  firstName: string; lastName: string; email: string; birthday: string;
  title: string; departmentId: string; category: string; grade: string; accountStatus: string;
  basicSalary: number; housingAllowance: number; transportAllowance: number;
  mealAllowance: number; loanRepayment: number;
}>;

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: emp, isLoading } = useEmployee(id);
  const update = useUpdateEmployee(id);
  // Total outstanding across the employee's active structured loans — shown as "Outstanding Amount".
  const { data: employeeLoans = [] } = useEmployeeLoans(id);
  const totalOutstanding = employeeLoans
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + (l.outstanding ?? 0), 0);
  const toast  = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [empForm, setEmpForm] = useState<EditForm>({});
  const [pickedManager, setPickedManager] = useState<PickedEmployee | null>(null);

  const { data: departments = [] } = useDepartments();
  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));

  const { data: docs = [] } = useEmployeeDocuments(id);
  const uploadDoc  = useUploadEmployeeDocument(id);
  const deleteDoc  = useDeleteEmployeeDocument(id);

  // Real per-type entitlement and usage. Each leave type carries its own
  // entitlement_days in setups, so these must come from the API rather than
  // a flat number applied across the board. Returns only ACTIVE types.
  const { data: leaveBalances = [], isLoading: isLoadingBalances } = useEmployeeLeaveBalances(id, YEAR);

  // is_uncapped isn't on the balance payload, so pull it from the leave types
  // themselves — an uncapped type has no ceiling to count down from.
  const { data: leaveTypesResponse } = useLeaveTypes({ limit: 100 });
  const uncappedTypeIds = new Set(
    (leaveTypesResponse?.data ?? []).filter((lt) => lt.is_uncapped).map((lt) => lt.id),
  );

  // Employees list for the manager picker
  const { data: allEmployees = [] } = useEmployees({ limit: 200 });
  const managerPickerEmployees: PickedEmployee[] = allEmployees
    .filter((e) => e.id !== id)
    .map((e) => ({
      id: e.id,
      name: e.user ? `${e.user.first_name ?? ""} ${e.user.last_name ?? ""}`.trim() : e.employee_no,
      role: e.job_title ?? "—",
      department: e.department ?? "—",
      avatar_url: e.user?.profile_picture_url ?? null,
    }));

  const DOC_TYPE_OPTIONS = [
    "Employment Contract", "ID / Passport Copy", "Certificates",
    "Safety Certification", "Disciplinary Record", "Other",
  ].map((t) => ({ value: t, label: t }));

  type PendingDoc = { uid: string; docType: string; file: File | null };
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);

  const addDoc       = () => setPendingDocs(p => [...p, { uid: String(Date.now()), docType: "", file: null }]);
  const removePending = (uid: string) => setPendingDocs(p => p.filter(d => d.uid !== uid));
  const setDocType   = (uid: string, v: string) => setPendingDocs(p => p.map(d => d.uid === uid ? { ...d, docType: v } : d));
  const setDocFile   = (uid: string, file: File | null) => setPendingDocs(p => p.map(d => d.uid === uid ? { ...d, file } : d));

  const ue = (k: keyof EditForm, v: string) => setEmpForm(p => ({ ...p, [k]: v }));
  const un = (k: keyof EditForm, v: string) =>
    setEmpForm(p => ({ ...p, [k]: v === "" ? undefined : Number(v.replace(/,/g, "")) }));

  const openEdit  = () => {
    if (!emp) return;
    setEmpForm({
      firstName:        emp.user?.first_name    ?? "",
      lastName:         emp.user?.last_name     ?? "",
      email:            emp.user?.email         ?? "",
      birthday:         emp.birthday            ?? "",
      title:            emp.job_title           ?? "",
      departmentId:     emp.department_id       ?? "",
      category:         emp.employment_type     ?? "",
      accountStatus:    emp.user?.account_status ?? "",
      basicSalary:      emp.basic_salary        ? Number(emp.basic_salary)        : undefined,
      housingAllowance: emp.housing_allowance   ? Number(emp.housing_allowance)   : undefined,
      transportAllowance: emp.transport_allowance ? Number(emp.transport_allowance) : undefined,
      mealAllowance:    emp.meal_allowance      ? Number(emp.meal_allowance)      : undefined,
      loanRepayment:    emp.loan_repayment      ? Number(emp.loan_repayment)      : undefined,
    });
    if (emp.operating_manager?.user) {
      const mgrUser = emp.operating_manager.user;
      const mgrName = `${mgrUser.first_name ?? ""} ${mgrUser.last_name ?? ""}`.trim();
      setPickedManager({
        id:         emp.operating_manager.id,
        name:       mgrName,
        role:       emp.operating_manager.job_title ?? "—",
        department: emp.operating_manager.department ?? "—",
        avatar_url: emp.operating_manager.user.profile_picture_url ?? null,
      });
    } else {
      setPickedManager(null);
    }
    setIsEditing(true);
  };
  const cancelEdit = () => { setIsEditing(false); setEmpForm({}); setPickedManager(null); setPendingDocs([]); };

  const computed = calcDeductions(
    empForm.basicSalary, empForm.housingAllowance,
    empForm.transportAllowance, empForm.mealAllowance,
  );

  const saveEmployee = async () => {
    // Capture pending uploads before clearing state
    const toUpload = pendingDocs.filter(d => d.file && d.docType);

    // 1. Save employee details — if this fails, stay in edit mode
    try {
      await update.mutateAsync({
        first_name:           empForm.firstName                    || undefined,
        last_name:            empForm.lastName                     || undefined,
        job_title:            empForm.title                        || undefined,
        department_id:        empForm.departmentId                 || undefined,
        employment_type:      (empForm.category as EmploymentType) || undefined,
        account_status:       empForm.accountStatus                || undefined,
        birthday:             empForm.birthday                     || undefined,
        operating_manager_id: pickedManager?.id                   ?? null,
        basic_salary:         empForm.basicSalary,
        housing_allowance:    empForm.housingAllowance,
        transport_allowance:  empForm.transportAllowance,
        meal_allowance:       empForm.mealAllowance,
        // Persist the auto-computed deductions so the saved values match the form
        // (previously only the salary was saved, leaving stale PAYE/Pension/NHF).
        paye:                 computed.paye,
        pension:              computed.pension,
        nhf:                  computed.nhf,
        loan_repayment:       empForm.loanRepayment,
      });
    } catch {
      toast.error("Failed to save changes");
      return;
    }

    // 2. Employee saved — close edit mode immediately
    setIsEditing(false);
    setEmpForm({});
    setPickedManager(null);
    setPendingDocs([]);
    toast.success("Employee updated successfully");

    // 3. Upload documents independently — errors here don't revert edit mode
    if (toUpload.length > 0) {
      try {
        await Promise.all(
          toUpload.map(d => uploadDoc.mutateAsync({ file: d.file!, docType: d.docType }))
        );
      } catch {
        toast.error("Some documents failed to upload. Try adding them again.");
      }
    }
  };

  const viewDoc     = (url: string) => window.open(url, "_blank");
  const downloadDoc = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.click();
  };

  const fmt = (v: string | null | undefined) =>
    v && Number(v) > 0 ? formatNumber(Number(v)) : "—";

  const empName = emp ? `${emp.user?.first_name ?? ""} ${emp.user?.last_name ?? ""}`.trim() : "";

  if (isLoading) {
    return (
      <AppLayout pageTitle="Employee Profile">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-gray-100 rounded" />
          <div className="h-40 bg-white border border-brand-border rounded-2xl" />
          <div className="h-40 bg-white border border-brand-border rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!emp) {
    return (
      <AppLayout pageTitle="Employee Profile">
        <Link href="/admin/employees" className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
          <ArrowLeft size={16} /> Back to Employees
        </Link>
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center max-w-lg">
          <p className="text-brand-text-primary font-semibold">Employee not found</p>
          <p className="text-brand-text-secondary text-sm mt-1">No employee found for ID <span className="font-mono">{id}</span>.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Employee Profile">
      <Link href="/admin/employees" className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5">
        <ArrowLeft size={16} /> Back to Employees
      </Link>

      <div className="space-y-5">
        {/* Header */}
        <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-brand-text-secondary">{emp.employee_no}</p>
                <h1 className="text-lg font-semibold text-brand-text-primary mt-1">
                  {isEditing
                    ? `${empForm.firstName || emp.user?.first_name} ${empForm.lastName || emp.user?.last_name}`
                    : empName}
                </h1>
                <p className="text-sm text-brand-text-secondary mt-0.5">
                  {isEditing
                    ? `${empForm.title || emp.job_title} · ${departments.find(d => d.id === empForm.departmentId)?.name || emp.department}`
                    : `${emp.job_title ?? "—"} · ${emp.department ?? "—"}`}
                </p>
              </div>
              <div className="flex items-center gap-3 self-start">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  {emp.employment_type ?? "—"}
                </span>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={openEdit}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium border border-brand-border bg-white text-brand-text-primary hover:bg-gray-50 transition-colors"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                )}
              </div>
            </div>
          </div>
          {!isEditing && (
            <div className="border-t border-brand-border px-6 py-5">
              <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wide mb-4">{`Leave Balance — ${YEAR}`}</p>
              {isLoadingBalances ? (
                <p className="text-sm text-brand-text-secondary">Loading leave balances…</p>
              ) : leaveBalances.length === 0 ? (
                <p className="text-sm text-brand-text-secondary">No active leave types configured.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                  {leaveBalances.map((b) => (
                    <BalanceCard
                      key={b.leave_type_id}
                      type={b.leave_type_name}
                      used={b.used}
                      entitlement={b.entitlement}
                      uncapped={uncappedTypeIds.has(b.leave_type_id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Personal Details */}
        <Section title="Personal Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEditing ? (
              <>
                <FormInput label="First Name" required placeholder="First name" value={empForm.firstName ?? ""} onChange={(e) => ue("firstName", e.target.value)} />
                <FormInput label="Last Name"  required placeholder="Last name"  value={empForm.lastName  ?? ""} onChange={(e) => ue("lastName",  e.target.value)} />
                <FormInput label="Email" required type="email" placeholder="email@portlandgas.com" value={empForm.email ?? ""} onChange={(e) => ue("email", e.target.value)} />
                <FormDatePicker label="Birthday" value={empForm.birthday ?? ""} onValueChange={(v) => ue("birthday", v)} />
              </>
            ) : (
              <>
                <FormInput label="First Name" value={emp.user?.first_name ?? "—"} />
                <FormInput label="Last Name"  value={emp.user?.last_name  ?? "—"} />
                <FormInput label="Email"      value={emp.user?.email      ?? "—"} />
                <FormInput label="Birthday"   value={emp.birthday ? fmtDate(emp.birthday) : "—"} />
              </>
            )}
          </div>
        </Section>

        {/* Employment Details */}
        <Section title="Employment Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEditing ? (
              <>
                <FormInput label="Job Title / Role" required placeholder="e.g. Software Developer" value={empForm.title ?? ""} onChange={(e) => ue("title", e.target.value)} />
                <FormSelect label="Department" required options={deptOptions} placeholder="Select department" value={empForm.departmentId ?? ""} onValueChange={(v) => ue("departmentId", v)} />
                <FormSelect label="Employment Type" options={EMPLOYMENT_TYPE_OPTIONS} placeholder="Select type" value={empForm.category ?? ""} onValueChange={(v) => ue("category", v)} />
                <FormSelect label="Account Status" options={ACCOUNT_STATUS_OPTIONS} placeholder="Select status" value={empForm.accountStatus ?? ""} onValueChange={(v) => ue("accountStatus", v)} />
                <EmployeePicker
                  label="Operations Manager"
                  employees={managerPickerEmployees}
                  value={pickedManager}
                  onChange={setPickedManager}
                />
              </>
            ) : (
              <>
                <FormInput label="Job Title / Role"  value={emp.job_title      ?? "—"} />
                <FormInput label="Department"         value={emp.department     ?? "—"} />
                <FormInput label="Employment Type"    value={emp.employment_type ?? "—"} />
                <FormInput label="Hire Date"          value={emp.hire_date ? fmtDate(emp.hire_date) : "—"} />
                <FormInput label="Employee No"        value={emp.employee_no} />
                <FormInput label="Account Status"     value={emp.user?.account_status ?? "—"} />
                <FormInput
                  label="Operations Manager"
                  value={emp.operating_manager?.user
                    ? `${emp.operating_manager.user.first_name ?? ""} ${emp.operating_manager.user.last_name ?? ""}`.trim()
                    : "—"}
                  disabled
                />
              </>
            )}
          </div>
        </Section>

        {/* Compensation */}
        <Section title="Compensation">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEditing ? (
              <>
                {[
                  { label: "Basic Salary",        key: "basicSalary"        },
                  { label: "Housing Allowance",    key: "housingAllowance"   },
                  { label: "Transport Allowance",  key: "transportAllowance" },
                  { label: "Meal Allowance",       key: "mealAllowance"      },
                ].map(({ label, key }) => (
                  <FormInput key={key} label={label} placeholder="0.00"
                    value={empForm[key as keyof EditForm] !== undefined ? String(empForm[key as keyof EditForm]) : ""}
                    onChange={(e) => un(key as keyof EditForm, e.target.value)}
                    onBlur={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      e.target.value = raw ? formatNumber(parseFloat(raw) || 0) : "";
                    }}
                  />
                ))}
                <FormInput label="PAYE Tax" value={computed.paye > 0 ? formatNumber(computed.paye) : "0.00"} disabled hint="Auto-computed from earnings" />
                <FormInput label="Pension"  value={computed.pension > 0 ? formatNumber(computed.pension) : "0.00"} disabled hint="8% × (Basic + Housing + Transport)" />
                <FormInput label="NHF"      value={computed.nhf > 0 ? formatNumber(computed.nhf) : "0.00"} disabled hint="2.5% × Basic Salary" />
                <FormInput label="Outstanding Amount"
                  value={totalOutstanding > 0 ? formatNumber(totalOutstanding) : "—"}
                  disabled
                  hint="Total outstanding across active loans — see Loans & Deductions below." />
              </>
            ) : (
              <>
                <FormInput label="Basic Salary"        value={fmt(emp.basic_salary)}        />
                <FormInput label="Housing Allowance"   value={fmt(emp.housing_allowance)}   />
                <FormInput label="Transport Allowance" value={fmt(emp.transport_allowance)} />
                <FormInput label="Meal Allowance"      value={fmt(emp.meal_allowance)}      />
                <FormInput label="PAYE Tax"            value={fmt(emp.paye)}    hint="Auto-computed from earnings" />
                <FormInput label="Pension"             value={fmt(emp.pension)} hint="8% × (Basic + Housing + Transport)" />
                <FormInput label="NHF"                 value={fmt(emp.nhf)}     hint="2.5% × Basic Salary" />
                <FormInput label="Outstanding Amount" value={totalOutstanding > 0 ? formatNumber(totalOutstanding) : "—"} hint="Total outstanding across active loans." />
              </>
            )}
          </div>
        </Section>

        {/* Loans & Deductions */}
        <LoansSection employeeId={id} />

        {/* Documents */}
        <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
          <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-brand-text-primary">Documents</h2>
            {isEditing && (
              <button type="button" onClick={addDoc}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium bg-brand-purple text-white hover:bg-brand-purple-dark transition-colors">
                <PlusCircle size={13} /> Add Document
              </button>
            )}
          </div>
          <div className="px-6 pt-5 pb-6">
            {docs.length === 0 && pendingDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText size={32} className="text-brand-text-secondary mb-2 opacity-40" />
                <p className="text-sm text-brand-text-secondary">No documents uploaded yet.</p>
              </div>
            ) : (
              <>
                {docs.length > 0 && (
                  <div className="divide-y divide-brand-border">
                    {docs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between py-3 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText size={16} className="text-brand-text-secondary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-brand-text-primary truncate">{doc.category ?? "Document"}</p>
                            <p className="text-xs font-mono text-brand-text-secondary truncate">{doc.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-xs text-brand-text-secondary hidden sm:block">
                            {new Date(doc.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          <div className="flex items-center gap-1">
                            {doc.file_path && (
                              <>
                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-brand-text-secondary transition" title="View" onClick={() => viewDoc(doc.file_path!)}><Eye size={14} /></button>
                                <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition" title="Download" onClick={() => downloadDoc(doc.file_path!, doc.name)}><Download size={14} /></button>
                              </>
                            )}
                            {isEditing && (
                              <button
                                onClick={() => deleteDoc.mutate(doc.id)}
                                disabled={deleteDoc.isPending}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isEditing && pendingDocs.length > 0 && (
                  <div className={`space-y-4 ${docs.length > 0 ? "mt-4 pt-4 border-t border-brand-border" : ""}`}>
                    {pendingDocs.map((doc) => (
                      <div key={doc.uid} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormSelect label="Document Type" required options={DOC_TYPE_OPTIONS} placeholder="Select type" value={doc.docType} onValueChange={(v) => setDocType(doc.uid, v)} />
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <FormFileUpload
                              label="Upload File"
                              hint="PDF, DOC, JPG — max 10 MB"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg"
                              onChange={(e) => setDocFile(doc.uid, e.target.files?.[0] ?? null)}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removePending(doc.uid)}
                            className="p-2 mt-6 rounded-lg hover:bg-red-50 text-red-500 transition shrink-0"
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3">
            <Button onClick={saveEmployee} loading={update.isPending}>Save Changes</Button>
            <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
