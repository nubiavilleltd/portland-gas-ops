"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormDatePicker from "@/components/forms/FormDatePicker";
import Button from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils/format-number";
import { useToast } from "@/hooks/useToast";
import { useCreateEmployee, useEmployees } from "@/lib/modules/employees/hooks";
import type { CreateEmployeePayload, EmploymentType } from "@/lib/modules/employees/types";
import { useDepartments } from "@/lib/modules/setups";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";

// ── Options ────────────────────────────────────────────────────────────────────

const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract",  label: "Contract"  },
  { value: "Intern",    label: "Intern"    },
];

const ROLE_OPTIONS = [
  { value: "staff",       label: "Staff"       },
  { value: "admin",       label: "Admin"       },
  { value: "super_admin", label: "Super Admin" },
];

// ── Deduction auto-compute ─────────────────────────────────────────────────────

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

// ── Section wrapper ────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

type FormState = Partial<CreateEmployeePayload>;

export default function NewAccountPage() {
  const router = useRouter();
  const toast  = useToast();
  const create = useCreateEmployee();

  const [form, setForm] = useState<FormState>({ role: "staff" });
  const [pickedManager, setPickedManager] = useState<PickedEmployee | null>(null);

  const { data: departments = [] } = useDepartments();
  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const f = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));
  const fNum = (k: keyof FormState, raw: string) =>
    setForm((p) => ({ ...p, [k]: raw === "" ? undefined : Number(raw.replace(/,/g, "")) }));

  // Fetch employees for operating manager picker
  const { data: employees = [] } = useEmployees({ limit: 200 });
  const managerPickerEmployees: PickedEmployee[] = employees.map((e) => ({
    id: e.id,
    name: e.user ? `${e.user.first_name ?? ""} ${e.user.last_name ?? ""}`.trim() : e.employee_no,
    role: e.job_title ?? "—",
    department: e.department ?? "—",
    avatar_url: e.user?.profile_picture_url ?? null,
  }));

  const computed = calcDeductions(
    form.basic_salary, form.housing_allowance, form.transport_allowance, form.meal_allowance,
  );

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      toast.error("First name, last name and email are required");
      return;
    }

    const payload: CreateEmployeePayload = {
      ...form,
      first_name:           form.first_name!,
      last_name:            form.last_name!,
      email:                form.email!,
      operating_manager_id: pickedManager?.id || undefined,
      paye:    computed.paye    || undefined,
      pension: computed.pension || undefined,
      nhf:     computed.nhf     || undefined,
    };

    try {
      await create.mutateAsync(payload);
      toast.success(`Account created — setup email sent to ${form.email}`);
      router.push("/admin/accounts");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Failed to create account");
    }
  };

  return (
    <AppLayout pageTitle="Add Account">
      <Link
        href="/admin/accounts"
        className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Back to Account Management
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-brand-text-primary">Add Employee Account</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">
          Creates a system account and sends a setup email to the employee.
        </p>
      </div>

      <div className="space-y-5">
        {/* Personal Details */}
        <Section title="Personal Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="First Name" required placeholder="First name"
              value={form.first_name ?? ""}
              onChange={(e) => f("first_name", e.target.value)}
            />
            <FormInput
              label="Last Name" required placeholder="Last name"
              value={form.last_name ?? ""}
              onChange={(e) => f("last_name", e.target.value)}
            />
            <FormInput
              label="Email" required type="email" placeholder="email@portlandgas.com"
              value={form.email ?? ""}
              onChange={(e) => f("email", e.target.value)}
            />
            <FormInput
              label="Phone" placeholder="+234 800 000 0000"
              value={form.phone ?? ""}
              onChange={(e) => f("phone", e.target.value)}
            />
            <FormDatePicker
              label="Birthday"
              value={form.birthday ?? ""}
              onValueChange={(v) => f("birthday", v)}
            />
          </div>
        </Section>

        {/* System Access */}
        <Section title="System Access">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="System Role" required options={ROLE_OPTIONS} placeholder="Select role"
              value={form.role ?? "staff"}
              onValueChange={(v) => f("role", v)}
              hint="Controls what the employee can access in the system"
            />
          </div>
        </Section>

        {/* Employment Details */}
        <Section title="Employment Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Job Title" required placeholder="e.g. Software Developer"
              value={form.job_title ?? ""}
              onChange={(e) => f("job_title", e.target.value)}
            />
            <FormSelect
              label="Department" required options={deptOptions} placeholder="Select department"
              value={form.department_id ?? ""}
              onValueChange={(v) => f("department_id", v)}
            />
            <FormSelect
              label="Employment Type" options={EMPLOYMENT_TYPE_OPTIONS} placeholder="Select type"
              value={form.employment_type ?? ""}
              onValueChange={(v) => f("employment_type", v as EmploymentType)}
            />
            <FormDatePicker
              label="Hire Date"
              value={form.hire_date ?? ""}
              onValueChange={(v) => f("hire_date", v)}
            />
            <EmployeePicker
              label="Operating Manager"
              employees={managerPickerEmployees}
              value={pickedManager}
              onChange={(emp) => setPickedManager(emp)}
              placeholder="Search by name or department…"
            />
          </div>
        </Section>

        {/* Earnings */}
        <Section title="Earnings — Optional">
          <p className="text-sm text-brand-text-secondary mb-4">
            Salary details can be filled in now or updated later from the employee&apos;s profile.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Basic Salary",       key: "basic_salary"        },
              { label: "Housing Allowance",  key: "housing_allowance"   },
              { label: "Transport Allowance",key: "transport_allowance" },
              { label: "Meal Allowance",     key: "meal_allowance"      },
            ].map(({ label, key }) => (
              <FormInput
                key={key}
                label={label}
                placeholder="0.00"
                onChange={(e) => fNum(key as keyof FormState, e.target.value)}
                onBlur={(e) => {
                  const raw = e.target.value.replace(/,/g, "");
                  e.target.value = raw ? formatNumber(parseFloat(raw) || 0) : "";
                }}
              />
            ))}
          </div>
        </Section>

        {/* Deductions */}
        <Section title="Deductions — Optional">
          <p className="text-sm text-brand-text-secondary mb-4">
            Deductions details can be filled in now or updated later from the employee&apos;s profile.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="PAYE Tax"
              value={computed.paye > 0 ? formatNumber(computed.paye) : "0.00"}
              disabled
              hint="Auto-computed from earnings (PITA bands)"
            />
            <FormInput
              label="Pension"
              value={computed.pension > 0 ? formatNumber(computed.pension) : "0.00"}
              disabled
              hint="8% × (Basic + Housing + Transport)"
            />
            <FormInput
              label="NHF"
              value={computed.nhf > 0 ? formatNumber(computed.nhf) : "0.00"}
              disabled
              hint="2.5% × Basic Salary"
            />
            <FormInput
              label="Loan Repayment"
              placeholder="0.00"
              onChange={(e) => fNum("loan_repayment", e.target.value)}
              onBlur={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                e.target.value = raw ? formatNumber(parseFloat(raw) || 0) : "";
              }}
            />
          </div>
        </Section>

        <div className="flex gap-3 pb-4">
          <Button onClick={handleSubmit} loading={create.isPending}>
            Create Account & Send Setup Email
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
