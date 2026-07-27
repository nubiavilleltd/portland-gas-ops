"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FormSection from "@/components/ui/FormSection";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import FormSelect from "@/components/forms/FormSelect";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import { BackButton } from "@/components/ui/BackButton";
import { useIntranetSpotlightAdmin } from "@/lib/modules/intranet/queries";
import { useCreateSpotlight, useUpdateSpotlight } from "@/lib/modules/intranet/mutations";
import { useToast } from "@/hooks/useToast";
import { useEmployees } from "@/lib/modules/employees/hooks";

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
  const { data: all = [], isLoading } = useIntranetSpotlightAdmin();
  const { data: employeeList = [] }   = useEmployees();

  const EMPLOYEES: PickedEmployee[] = employeeList.map((e) => ({
    id:         e.id,
    name:       `${e.user?.first_name ?? ""} ${e.user?.last_name ?? ""}`.trim(),
    role:       e.job_title ?? "",
    department: e.department ?? "",
    avatar_url: e.user?.profile_picture_url ?? undefined,
  }));
  const toast = useToast();

  // The current EOM = most recent entry with category employee_of_month
  const eomEntries = all.filter((e) => e.category === "employee_of_month");
  const existing   = eomEntries[0] ?? null;

  const createMutation = useCreateSpotlight();
  const updateMutation = useUpdateSpotlight(existing?.id ?? 0);

  const [employee,    setEmployee]    = useState<PickedEmployee | null>(null);
  const [title,       setTitle]       = useState("");
  const [message,     setMessage]     = useState("");
  const [month,       setMonth]       = useState(String(new Date().getMonth() + 1));
  const [year,        setYear]        = useState(String(new Date().getFullYear()));
  const [isPublished, setIsPublished] = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [initialised, setInitialised] = useState(false);

  // Pre-populate from existing entry once loaded
  useEffect(() => {
    if (initialised || isLoading) return;
    setInitialised(true);
    if (!existing) return;

    setTitle(existing.title ?? "");
    setMessage(existing.message ?? "");
    setMonth(String(existing.month ?? new Date().getMonth() + 1));
    setYear(String(existing.year ?? new Date().getFullYear()));
    setIsPublished(existing.is_published);
    if (existing.employee_name) {
      const found = EMPLOYEES.find((e) => e.name === existing.employee_name);
      setEmployee(
        found ?? {
          id: existing.employee_id ?? "0",
          name: existing.employee_name,
          role: existing.employee_role ?? "",
          department: existing.employee_dept ?? "",
          avatar_url: existing.avatar_url ?? undefined,
        }
      );
    }
  }, [isLoading, initialised, existing]);

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
    const payload = {
      employee_id:   employee!.id,
      employee_name: employee!.name,
      employee_role: employee!.role ?? null,
      employee_dept: employee!.department ?? null,
      avatar_url:    employee!.avatar_url ?? null,
      title,
      message,
      category:      "employee_of_month" as const,
      month:         Number(month),
      year:          Number(year),
      tag:           "Employee of the Month",
      tag_color:     "#7234BD",
      tag_bg:        "#F3EEFF",
      is_published:  isPublished,
    };
    try {
      if (existing) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      toast.success("Employee of the Month saved.");
    } catch {
      toast.error("Failed to save.");
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <AppLayout pageTitle="Employee of the Month">
        <div className="h-6 w-24 rounded bg-gray-200 animate-pulse mb-6" />
        <div className="h-7 w-56 rounded bg-gray-200 animate-pulse mb-1" />
        <div className="h-4 w-80 rounded bg-gray-100 animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form skeleton */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-3">
              <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
              <div className="h-10 w-full rounded-lg bg-gray-100 animate-pulse mt-2" />
            </div>
            <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4">
              <div className="h-4 w-36 rounded bg-gray-200 animate-pulse" />
              <div className="h-10 w-full rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-24 w-full rounded-lg bg-gray-100 animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
                <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              </div>
              <div className="h-4 w-40 rounded bg-gray-100 animate-pulse" />
            </div>
            <div className="flex justify-end">
              <div className="h-9 w-28 rounded-lg bg-gray-200 animate-pulse" />
            </div>
          </div>
          {/* Preview skeleton */}
          <div className="lg:col-span-1">
            <div className="h-3 w-16 rounded bg-gray-200 animate-pulse mb-3" />
            <div className="rounded-xl border border-brand-border bg-white p-5 space-y-3">
              <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                <div className="h-3 w-48 rounded bg-gray-100 animate-pulse" />
              </div>
              <div className="h-5 w-36 rounded-full bg-gray-100 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-5/6 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-4/6 rounded bg-gray-100 animate-pulse" />
              </div>
              <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
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
