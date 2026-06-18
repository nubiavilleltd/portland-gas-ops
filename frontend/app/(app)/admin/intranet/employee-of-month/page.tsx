"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FormSection from "@/components/ui/FormSection";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import { useToast } from "@/hooks/useToast";
import FormTextarea from "@/components/forms/FormTextarea";
import FormSelect from "@/components/forms/FormSelect";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import { BackButton } from "@/components/ui/BackButton";
import { useEmployeeOfMonth } from "@/lib/modules/intranet/hooks/useIntranetSpotlight";
import { EMPLOYEE_STORE } from "@/app/(app)/admin/_components/_data";

const EMPLOYEES: PickedEmployee[] = EMPLOYEE_STORE.map((e) => ({
  id: e.id,
  name: `${e.firstName} ${e.lastName}`,
  role: e.title,
  department: e.department,
  avatar_url: `https://i.pravatar.cc/150?img=${10 + Number(e.id)}`,
}));

const MONTH_OPTIONS = [
  { value: "1",  label: "January"   },
  { value: "2",  label: "February"  },
  { value: "3",  label: "March"     },
  { value: "4",  label: "April"     },
  { value: "5",  label: "May"       },
  { value: "6",  label: "June"      },
  { value: "7",  label: "July"      },
  { value: "8",  label: "August"    },
  { value: "9",  label: "September" },
  { value: "10", label: "October"   },
  { value: "11", label: "November"  },
  { value: "12", label: "December"  },
];

export default function EmployeeOfMonthPage() {
  const { eom, update } = useEmployeeOfMonth();

  const initialEmp: PickedEmployee | null = eom.employee_name
    ? EMPLOYEES.find((e) => e.name === eom.employee_name) ?? {
        id: "0",
        name: eom.employee_name,
        role: eom.employee_role,
        department: eom.employee_dept,
        avatar_url: eom.avatar_url,
      }
    : null;

  const [employee,    setEmployee]    = useState<PickedEmployee | null>(initialEmp);
  const [title,       setTitle]       = useState(eom.title);
  const [message,     setMessage]     = useState(eom.message);
  const [month,       setMonth]       = useState(String(eom.month ?? new Date().getMonth() + 1));
  const [year,        setYear]        = useState(String(eom.year ?? new Date().getFullYear()));
  const [isPublished, setIsPublished] = useState(eom.is_published);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);
  const toast = useToast();

  const monthLabel = MONTH_OPTIONS.find((m) => m.value === month)?.label ?? "";
  const preview = {
    name:    employee?.name    ?? "—",
    role:    employee?.role    ?? "—",
    dept:    employee?.department ?? "—",
    avatar:  employee?.avatar_url ?? "",
    message: message || "Recognition message will appear here…",
    period:  `${monthLabel} ${year}`,
  };

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!employee)            e.employee = "Please select an employee";
    if (!title.trim())        e.title    = "Headline is required";
    if (!message.trim())      e.message  = "Recognition message is required";
    if (!year || isNaN(Number(year))) e.year = "Valid year is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    update({
      employee_id:   Number(employee!.id),
      employee_name: employee!.name,
      employee_role: employee!.role,
      employee_dept: employee!.department,
      avatar_url:    employee!.avatar_url,
      title,
      message,
      month:         Number(month),
      year:          Number(year),
      is_published:  isPublished,
    });
    setSaving(false);
    toast.success("Employee of the Month saved.");
  }

  return (
    <AppLayout pageTitle="Employee of the Month">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader
        title="Employee of the Month"
        description="Update the featured employee shown on the intranet homepage"
        className="mb-6"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <FormSection title="Select Employee">
            <EmployeePicker
              employees={EMPLOYEES}
              value={employee}
              onChange={(emp) => {
                setEmployee(emp);
                if (emp) setErrors((prev) => ({ ...prev, employee: "" }));
              }}
              label="Employee"
              required
              error={errors.employee}
              placeholder="Search by name or department…"
            />
          </FormSection>

          <FormSection title="Feature Details">
            <div className="space-y-4">
              <FormInput
                label="Headline"
                required
                placeholder="e.g. Employee of the Month — June 2026"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }}
                error={errors.title}
              />
              <FormTextarea
                label="Recognition Message"
                required
                placeholder="Describe what this employee achieved and why they're being recognised…"
                value={message}
                onChange={(e) => { setMessage(e.target.value); setErrors((p) => ({ ...p, message: "" })); }}
                rows={4}
                error={errors.message}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Month"
                  required
                  options={MONTH_OPTIONS}
                  value={month}
                  onValueChange={setMonth}
                />
                <FormInput
                  label="Year"
                  required
                  type="number"
                  placeholder="2026"
                  value={year}
                  onChange={(e) => { setYear(e.target.value); setErrors((p) => ({ ...p, year: "" })); }}
                  error={errors.year}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 accent-brand-purple"
                />
                <span className="text-sm text-brand-text-primary">Show on intranet</span>
              </label>
            </div>
          </FormSection>

          {/* Save at the bottom */}
          <div className="flex items-center justify-end pt-2">
            <Button onClick={handleSave} loading={saving} loadingText="Saving…">
              Save Changes
            </Button>
          </div>
        </div>

        {/* Preview card */}
        <div className="lg:col-span-1">
          <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-3">Preview</p>
          <div className="rounded-xl border border-brand-border bg-white p-5 space-y-3">
            {preview.avatar ? (
              <img src={preview.avatar} alt={preview.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple text-xl font-bold">
                {preview.name?.[0] ?? "?"}
              </div>
            )}
            <div>
              <p className="font-semibold text-brand-text-primary">{preview.name}</p>
              <p className="text-xs text-brand-text-secondary">{preview.role} · {preview.dept}</p>
            </div>
            <div
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "#F3EEFF", color: "#7234BD" }}
            >
              Employee of the Month
            </div>
            <p className="text-sm text-brand-text-secondary leading-relaxed line-clamp-4">&ldquo;{preview.message}&rdquo;</p>
            <p className="text-xs text-brand-text-secondary">{preview.period}</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
