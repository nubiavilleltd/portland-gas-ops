"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Plus, CalendarDays, Paperclip, ExternalLink, Trash2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormTextarea from "@/components/forms/FormTextarea";
import SelectInput from "@/components/forms/SelectInput";
import DataTable from "@/components/ui/DataTable";
import { leaveRequestColumns } from "../_components/columns";
import { useCreateLeaveRequest, useLeaveRequests, useLeaveRequest, useCurrentEmployee } from "@/lib/modules/leave-requests/hooks";
import { useMyApprovals } from "@/lib/modules/workflow/queries";
import { useLeaveTypes } from "@/lib/modules/leave-types/hooks";
import { useMyLeaveBalances, useEmployeeLeaveBalances } from "@/lib/modules/leave-balances/hooks";
import { useEmployees } from "@/lib/modules/employees/hooks";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuthStore } from "@/store/authStore";
import leaveRequestsApi from "@/lib/modules/leave-requests/api";
import {
  LEAVE_TYPE_OPTIONS,
  LEAVE_TYPES,
  genHRRef,
  SEED_EMPLOYEES,
  calcLeaveBalance,
} from "../_components/_data";

const YEAR = new Date().getFullYear();

const TODAY = new Date().toISOString().split("T")[0];

const REQUEST_TYPE_OPTIONS = [
  { value: "self",   label: "Self"   },
  { value: "others", label: "Others" },
];

const STATUS_OPTIONS = [
  { value: "pending",     label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "returned",    label: "Returned" },
  { value: "approved",    label: "Approved" },
  { value: "denied",      label: "Denied" },
  { value: "draft",       label: "Draft" },
];

const schema = z.object({
  request_type:  z.string().min(1, "Select request type"),
  employee_id:   z.string().optional(), // Optional because it's only shown when "Others" is selected
  leave_type:    z.string().min(1, "Select a leave type"),
  start_date:    z.string().min(1, "Start date is required"),
  end_date:      z.string().min(1, "End date is required"),
  reliever_id:   z.string().min(1, "Select a reliever"),
  reason:        z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type View = "list" | "form";

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (e < s) return 0;
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
}

export default function LeaveRequestsPage() {
  // useSearchParams() must sit inside a Suspense boundary or static
  // prerendering of this route fails (Next.js App Router requirement).
  return (
    <Suspense fallback={null}>
      <LeaveRequestsPageContent />
    </Suspense>
  );
}

function LeaveRequestsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useCurrentUser();
  const [view, setView] = useState<View>("list");
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [removedExistingDoc, setRemovedExistingDoc] = useState(false);

  // Edit & Resubmit mode — driven by ?edit=<reference> (from a returned request)
  const editRef = searchParams.get("edit");
  const { data: editRecord } = useLeaveRequest(editRef ?? "", !!editRef);

  const createLeaveRequest = useCreateLeaveRequest();
  const { data: leaveRequestsResponse, isLoading: isLoadingRequests } = useLeaveRequests({
    limit: 100,
    sort_by: "created_at",
    sort_order: "desc"
  });
  const items = leaveRequestsResponse?.data || [];

  // Current employee — used to scope "All" to the user's OWN requests
  const { data: currentEmployee } = useCurrentEmployee();

  // "Awaiting my approval" scope — my-approvals returns requests where the current
  // user is the assignee of the CURRENT step.
  const { data: myApprovals = [] } = useMyApprovals();
  const awaitingIds = new Set(
    myApprovals
      .filter((a) => a.request_type === "leave_request")
      .map((a) => a.request_id)
  );

  const [scope, setScope] = useState<"all" | "awaiting">("all");
  const [activeStatus, setActiveStatus] = useState<string>("");

  const visibleItems = items.filter((i) => {
    // Scope: "All" = requests I raised; "Awaiting my approval" = requests waiting on me.
    // Tolerant match: newer requests store requester_id as the employee id, while
    // older rows stored the user id (fixed on the backend going forward).
    const isMine =
      i.requesterId === currentEmployee?.id ||
      i.requesterId === currentEmployee?.user_id;
    const inScope = scope === "awaiting" ? awaitingIds.has(i.id) : isMine;
    if (!inScope) return false;
    // Status filter (Procurement-style dropdown)
    if (activeStatus && i.status !== activeStatus) return false;
    return true;
  });

  const { data: employees = [] } = useEmployees({ limit: 200 });
  const { data: leaveTypesResponse, isLoading: isLoadingLeaveTypes, error: leaveTypesError } = useLeaveTypes({ limit: 100, is_active: true });
  const leaveTypes = leaveTypesResponse?.data || [];

  // Recorded leave balances for the current year — feeds the balance strip and
  // the new-request form banner (used/remaining come from approved requests).
  const { data: leaveBalances = [] } = useMyLeaveBalances(YEAR);
  const balanceByType = new Map(leaveBalances.map((b) => [Number(b.leave_type_id), b]));

  console.log("Leave Types Debug:", { leaveTypes, isLoadingLeaveTypes, leaveTypesError, leaveTypesResponse, rawResponse: JSON.stringify(leaveTypesResponse) });

  // Get current user's employee record
  const currentUserEmployee = employees.find((e) => e.user?.id === currentUser?.id);

  // Convert real leave types to form options (use ID as value)
  const realLeaveTypeOptions = leaveTypes.map((lt) => ({
    value: String(lt.id),
    label: lt.leave_type_name,
  }));

  // Convert real employees to form options
  const realEmployeeOptions = employees.map((e) => ({
    value: e.id,
    label: `${e.user?.first_name || ""} ${e.user?.last_name || ""} — ${e.job_title || ""}`,
  }));

  // Reliever options (all employees except self)
  const relieverOptions = employees
    .filter((e) => e.id !== currentUserEmployee?.id) // Exclude current user
    .map((e) => ({
      value: e.id,
      label: `${e.user?.first_name || ""} ${e.user?.last_name || ""} — ${e.job_title || ""}`,
    }));

  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const { formState: { errors, isSubmitting } } = form;

  // When arriving via ?edit=<ref>, load the returned request into the form
  useEffect(() => {
    if (editRef && editRecord) {
      form.reset({
        request_type: editRecord.request_type || "self",
        employee_id: editRecord.employee_id,
        leave_type: String(editRecord.leave_type_id),
        start_date: editRecord.start_date,
        end_date: editRecord.end_date,
        reliever_id: editRecord.reliever_id || "",
        reason: editRecord.reason || "",
      });
      setRemovedExistingDoc(false);
      setView("form");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editRef, editRecord?.id]);

  const watchRequestType = form.watch("request_type");
  const watchStart       = form.watch("start_date");
  const watchEnd         = form.watch("end_date");
  const watchLeaveType   = form.watch("leave_type");

  // Keep the range valid: if a newly picked start date is after the current end
  // date, clear the end date so the user re-selects it.
  useEffect(() => {
    if (watchStart && watchEnd && watchEnd < watchStart) {
      form.setValue("end_date", "", { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchStart]);

  const isOthers = watchRequestType === "others";

  // When raising "for others", the leave counts against the SELECTED employee,
  // so the banner + exceeds-balance guard use THEIR balance (not the requester's).
  const watchEmployeeId = form.watch("employee_id");
  const selectedEmployee = isOthers ? employees.find((e) => e.id === watchEmployeeId) : undefined;
  const balanceOwnerName = selectedEmployee?.user
    ? `${selectedEmployee.user.first_name ?? ""} ${selectedEmployee.user.last_name ?? ""}`.trim()
    : "";
  const { data: otherBalances = [] } = useEmployeeLeaveBalances(
    isOthers ? (watchEmployeeId || undefined) : undefined,
    YEAR,
  );
  // self -> requester's balances; others -> the target's (empty until picked).
  const formBalances = !isOthers ? leaveBalances : watchEmployeeId ? otherBalances : [];
  const formBalanceByType = new Map(formBalances.map((b) => [Number(b.leave_type_id), b]));

  // For balance calc, look up the leave type by ID and use its entitlement
  const selectedLeaveType = watchLeaveType
    ? leaveTypes.find((lt) => String(lt.id) === watchLeaveType)
    : null;

  const leaveTypeName = selectedLeaveType?.leave_type_name;
  const balanceHeading = isOthers
    ? (balanceOwnerName ? `${balanceOwnerName}'s ${leaveTypeName} Balance` : `${leaveTypeName} Balance`)
    : `Your ${leaveTypeName} Balance`;
  const balancePossessive = isOthers
    ? (balanceOwnerName ? `${balanceOwnerName}'s` : "the")
    : "your";

  // Real balance for the selected leave type, for the person the leave is FOR.
  // Falls back to full entitlement when they haven't drawn on this type this year.
  const activeBal = selectedLeaveType ? (() => {
    const bal = formBalanceByType.get(Number(selectedLeaveType.id));
    return {
      entitlement: bal?.entitlement ?? selectedLeaveType.entitlement_days,
      used: bal?.used ?? 0,
      remaining: Math.max(0, bal?.remaining ?? selectedLeaveType.entitlement_days),
    };
  })() : null;

  const days = calcDays(watchStart, watchEnd);
  const exceedsBalance = days > 0 && activeBal !== null && days > activeBal.remaining;

  async function onSubmit(data: FormData) {
    try {
      const employeeId = isOthers ? data.employee_id : currentUserEmployee?.id;
      const reliever_id = data.reliever_id;

      if (!employeeId || !reliever_id) {
        toast.error("Employee and reliever are required");
        return;
      }

      // Call the real API to create leave request
      // Convert dates to ISO format (YYYY-MM-DD)
      const startDateObj = new Date(data.start_date);
      const endDateObj = new Date(data.end_date);
      const startDateISO = startDateObj.toISOString().split('T')[0];
      const endDateISO = endDateObj.toISOString().split('T')[0];

      const leaveTypeId = parseInt(data.leave_type, 10);
      console.log("Leave type ID parsed:", { raw: data.leave_type, parsed: leaveTypeId });

      // ── EDIT & RESUBMIT (returned request) ────────────────────────────────
      if (editRef) {
        const updated = await leaveRequestsApi.resubmit(editRef, {
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          reliever_id: reliever_id,
          start_date: startDateISO,
          end_date: endDateISO,
          request_type: data.request_type,
          reason: data.reason,
        });

        // Upload any newly attached files to the existing request
        if (supportingFiles.length > 0 && updated?.id) {
          for (const file of supportingFiles) {
            try {
              await leaveRequestsApi.uploadDocument(updated.id, file);
            } catch {
              toast.warning(`Could not upload ${file.name}. Your request was still resubmitted.`);
            }
          }
        }

        toast.success("Request resubmitted for approval!");
        form.reset();
        setSupportingFiles([]);
        router.replace("/hr-management/leave-requests");
        setView("list");
        return;
      }

      // Create leave request first
      const leaveRequest = await createLeaveRequest.mutateAsync({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        reliever_id: reliever_id,
        start_date: startDateISO,
        end_date: endDateISO,
        request_type: data.request_type,
        reason: data.reason,
      });

      // Upload supporting files if any
      if (supportingFiles.length > 0 && leaveRequest?.id) {
        console.log("Uploading files:", supportingFiles.length, supportingFiles);
        for (const file of supportingFiles) {
          try {
            console.log("Uploading file:", {
              name: file.name,
              size: file.size,
              type: file.type,
              leaveRequestId: leaveRequest.id,
            });
            const result = await leaveRequestsApi.uploadDocument(leaveRequest.id, file);
            console.log("File uploaded successfully:", result);
          } catch (uploadError: unknown) {
            console.error("File upload failed:", uploadError);
            let errorMessage = "Unknown error";
            if (uploadError instanceof Error) {
              errorMessage = uploadError.message;
            } else if (typeof uploadError === "object" && uploadError !== null) {
              const err = uploadError as Record<string, unknown>;
              if (err.response && typeof err.response === "object") {
                const resp = err.response as Record<string, unknown>;
                errorMessage = resp.data ? String(resp.data) : String(resp);
              }
            }
            toast.warning(`Could not upload ${file.name}: ${errorMessage}. Your leave request was saved.`);
          }
        }
      }

      // Submit leave request for approval via workflow engine
      if (leaveRequest?.id) {
        try {
          console.log("Submitting leave request for approval:", leaveRequest.id);
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/hr/leave-requests/${leaveRequest.id}/submit-for-approval`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${useAuthStore.getState().accessToken}`,
              },
              credentials: "include",
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Submission failed with status ${response.status}`);
          }

          const submissionResult = await response.json();
          console.log("Leave request submitted for approval:", submissionResult);
          toast.success("Leave request submitted for approval!");
        } catch (submissionError: unknown) {
          console.error("Workflow submission error:", submissionError);
          let errorMessage = "Unknown error";
          if (submissionError instanceof Error) {
            errorMessage = submissionError.message;
          }
          toast.error(`Could not submit for approval: ${errorMessage}`);
          return;
        }
      }

      form.reset();
      setSupportingFiles([]);
      setView("list");
    } catch (error: unknown) {
      let message = "Failed to submit leave request";
      console.error("Submission error:", error);
      if (error instanceof Error) {
        message = error.message;
        // Log the full error for debugging
        if ('response' in error) {
          const axiosError = error as { response?: { data?: unknown } };
          console.error("API response:", axiosError.response?.data);
        }
      }
      toast.error(message);
    }
  }

  function goBack() {
    setView("list");
    form.reset();
    setSupportingFiles([]);
    if (editRef) router.replace("/hr-management/leave-requests");
  }

  return (
    <AppLayout pageTitle={view === "form" ? "New Leave Request" : "Leave Requests"}>

      {/* ── LIST ── */}
      {view === "list" && (
        <>
          <PageHeader
            title="Leave Requests"
            description="Manage leave requests and approvals"
            action={
              <Button leftIcon={<Plus size={16} />} onClick={() => setView("form")}>
                New Request
              </Button>
            }
            className="mb-6"
          />

          {/* My Leave Balance strip */}
          {leaveTypes.length > 0 && (
          <div className="mb-5 bg-brand-card border border-brand-border rounded-2xl px-4 py-3 overflow-hidden">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-3">
              My Leave Balance — {YEAR}
            </p>
            <div className="flex gap-3">
              {leaveTypes.map((lt) => {
                const bal = balanceByType.get(Number(lt.id));
                const entitlement = bal?.entitlement ?? lt.entitlement_days;
                const remaining = Math.max(0, bal?.remaining ?? lt.entitlement_days);
                return (
                <section key={lt.id} className="rounded-xl border border-brand-border bg-white p-3 flex-shrink-0 min-w-[130px]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-brand-text-secondary leading-tight">{lt.leave_type_name}</p>
                      <p className="mt-1 text-xl font-bold text-brand-text-primary">{remaining}</p>
                    </div>
                    <span className="rounded-lg p-1.5 ring-1 bg-purple-50 text-purple-700 ring-purple-100 shrink-0">
                      <CalendarDays size={16} />
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-brand-text-secondary">
                    {remaining}/{entitlement} days left
                  </p>
                </section>
                );
              })}
            </div>
          </div>
          )}

          {/* Scope filter pills */}
          <div className="mb-3 flex flex-wrap gap-2">
            {([
              { value: "all",      label: "All" },
              { value: "awaiting", label: "Awaiting my approval", count: awaitingIds.size },
            ] as const).map((pill) => (
              <button
                key={pill.value}
                type="button"
                onClick={() => setScope(pill.value)}
                className={
                  scope === pill.value
                    ? "rounded-lg bg-brand-purple px-3 py-1.5 text-sm font-medium text-white"
                    : "rounded-lg border border-brand-border bg-white px-3 py-1.5 text-sm font-medium text-brand-text-secondary hover:bg-gray-50"
                }
              >
                {pill.label}
                {"count" in pill && pill.count > 0 ? (
                  <span
                    className={
                      scope === pill.value
                        ? "ml-2 rounded-full bg-white/25 px-1.5 py-0.5 text-xs"
                        : "ml-2 rounded-full bg-brand-purple/10 px-1.5 py-0.5 text-xs text-brand-purple"
                    }
                  >
                    {pill.count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="w-full overflow-hidden">
            <DataTable
              columns={leaveRequestColumns}
              data={visibleItems}
              isLoading={isLoadingRequests}
              rowHref={(row) => `/hr-management/leave-requests/${row.id}`}
              toolbarActions={
                <div className="w-52 shrink-0">
                  <SelectInput
                    placeholder="All Statuses"
                    sortOptions={false}
                    value={activeStatus}
                    onValueChange={(v) => setActiveStatus(v)}
                    options={STATUS_OPTIONS}
                  />
                </div>
              }
              emptyMessage="No leave requests yet"
              emptyDescription="Submit your first leave request to get started"
            />
          </div>
        </>
      )}

      {/* ── FORM ── */}
      {view === "form" && (
        <>
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
          >
            <ArrowLeft size={16} /> Back to Leave Requests
          </button>
          <PageHeader
            title={editRef ? `Edit & Resubmit — ${editRef}` : "New Leave Request"}
            description={editRef ? "Update the request and resubmit for approval" : "Submit a leave request for approval"}
            className="mb-6"
          />

          <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto w-full space-y-5">

            {/* ── Requester Details (fixed, like invoice) ── */}
            <FormSection title="Requester Details" description="Your employee information for this leave request.">
              <div className="grid gap-4 md:grid-cols-2">
                <FormInput
                  label="Requester Name"
                  value={currentUserEmployee ? `${currentUserEmployee.user?.first_name || ""} ${currentUserEmployee.user?.last_name || ""}`.trim() : ""}
                  disabled
                />
                <FormInput
                  label="Department"
                  value={currentUserEmployee?.department || ""}
                  disabled
                />
                <FormInput
                  label="Job Title / Role"
                  value={currentUserEmployee?.job_title || ""}
                  disabled
                />
                <FormDatePicker label="Request Date" value={TODAY} disabled />
              </div>
            </FormSection>

            {/* ── Leave Details ── */}
            <FormSection title="Leave Details" description="Details about the leave being requested.">
              <div className="grid gap-4 md:grid-cols-2">

                {/* Leave Type | Request Type — side by side */}
                <FormSelect
                  label="Leave Type"
                  required
                  options={realLeaveTypeOptions}
                  sortOptions={false}
                  placeholder="Select leave type"
                  error={errors.leave_type?.message}
                  {...form.register("leave_type")}
                  value={watchLeaveType ?? ""}
                />
                <FormSelect
                  label="Raise For"
                  required
                  options={REQUEST_TYPE_OPTIONS}
                  sortOptions={false}
                  placeholder="Select Raise For"
                  error={errors.request_type?.message}
                  {...form.register("request_type")}
                  value={watchRequestType ?? ""}
                />

                {/* Balance banner — updates when leave type (and employee for others) is selected */}
                {activeBal && (
                  <div className="md:col-span-2 rounded-xl border border-brand-purple bg-white px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-brand-text-secondary uppercase tracking-wide">
                        {balanceHeading}
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-bold text-brand-purple">
                          {activeBal.remaining}
                        </span>
                        <span className="text-sm text-brand-text-secondary">
                          of {activeBal.entitlement} days remaining · {activeBal.used} used
                        </span>
                      </div>
                    </div>
                    <div className="w-28 shrink-0">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                        <div
                          className="h-full rounded-full bg-brand-purple"
                          style={{
                            width: `${activeBal.entitlement > 0 ? Math.min(100, (activeBal.remaining / activeBal.entitlement) * 100) : 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Employee fields — only when Others */}
                {isOthers && (
                  <FormSelect
                    label="Employee Name"
                    required
                    options={realEmployeeOptions}
                    sortOptions={false}
                    placeholder="Select employee"
                    error={errors.employee_id?.message}
                    {...form.register("employee_id")}
                    value={form.watch("employee_id") ?? ""}
                  />
                )}

                {/* Dates */}
                <FormDatePicker
                  label="Start Date"
                  required
                  min={TODAY}
                  error={errors.start_date?.message}
                  {...form.register("start_date")}
                  value={watchStart ?? ""}
                />
                <FormDatePicker
                  label="End Date"
                  required
                  min={watchStart || TODAY}
                  error={errors.end_date?.message}
                  {...form.register("end_date")}
                  value={watchEnd ?? ""}
                />

                {/* Number of Days — after End Date */}
                <div className="flex flex-col gap-1.5">
                  <FormInput
                    label="Number of Days"
                    value={days > 0 ? String(days) : ""}
                    disabled
                    placeholder="Auto-calculated"
                  />
                  {exceedsBalance && activeBal && (
                    <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      Requested {days} day{days !== 1 ? "s" : ""} exceeds {balancePossessive} available balance of {activeBal.remaining} day{activeBal.remaining !== 1 ? "s" : ""} for {leaveTypeName}.
                    </p>
                  )}
                </div>

                <FormSelect
                  label="Reliever"
                  required
                  options={relieverOptions}
                  sortOptions={false}
                  placeholder="Select reliever"
                  error={errors.reliever_id?.message}
                  {...form.register("reliever_id")}
                  value={form.watch("reliever_id") ?? ""}
                />
                {/* Existing document (edit mode) — kept unless removed */}
                {editRef && editRecord?.document && !removedExistingDoc && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-brand-text-primary mb-2">Current Document</p>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-brand-border bg-gray-50">
                      <Paperclip size={14} className="text-brand-text-secondary shrink-0" />
                      <span className="text-sm text-brand-text-primary truncate flex-1">
                        {editRecord.document.name}
                      </span>
                      {editRecord.document.file_path && (
                        <a
                          href={editRecord.document.file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-text-secondary hover:text-brand-purple shrink-0"
                          title="View document"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setRemovedExistingDoc(true)}
                        className="text-red-500 hover:text-red-700 shrink-0"
                        title="Remove document"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <FileDropzone
                    label={editRef && editRecord?.document && !removedExistingDoc ? "Replace / Add Document" : "Supporting Document"}
                    value={supportingFiles}
                    onChange={setSupportingFiles}
                    accept="image/*,.pdf,.doc,.docx"
                    maxFiles={5}
                    hint="Medical certificate, approval letter (optional)"
                  />
                </div>
                <div className="md:col-span-2">
                  <FormTextarea
                    label="Reason / Notes"
                    placeholder="Brief reason for this leave request…"
                    rows={4}
                    {...form.register("reason")}
                  />
                </div>
              </div>
            </FormSection>

            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={isSubmitting} loadingText="Submitting..." disabled={exceedsBalance}>
                {editRef ? "Resubmit for Approval" : "Submit for Approval"}
              </Button>
            </div>
          </form>
        </>
      )}

      {/* ── SUBMITTED ── */}
    </AppLayout>
  );
}

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-brand-border bg-white shadow-sm">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
        {description && (
          <p className="text-sm text-brand-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 pt-5 pb-6">
        {children}
      </div>
    </section>
  );
}
