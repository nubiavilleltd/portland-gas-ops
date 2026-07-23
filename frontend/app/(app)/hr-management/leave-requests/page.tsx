"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
import { useQueryClient } from "@tanstack/react-query";
import { useApproverPicker } from "@/lib/modules/workflow/useApproverPicker";
import WorkflowApproversSection from "@/components/ui/WorkflowApproversSection";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import { useLeaveTypes } from "@/lib/modules/leave-types/hooks";
import { useMyLeaveBalances, useEmployeeLeaveBalances } from "@/lib/modules/leave-balances/hooks";
import { useEmployees } from "@/lib/modules/employees/hooks";
import { useCurrentUser } from "@/hooks/useCurrentUser";
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
  end_date:      z.string().optional(),  // required only for non-open-ended types (checked in onSubmit)
  // The reliever is chosen via the workflow Approvers section (requester_pick step),
  // not a bespoke field — see useApproverPicker below.
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

  // Workflow-driven approver picks (the Reliever is the requester_pick step).
  // Reads the active leave_request workflow, so reordering or adding pick
  // steps in the admin UI is picked up here without a code change.
  const approverPicker = useApproverPicker("leave_request", editRecord?.id);

  const queryClient = useQueryClient();
  const createLeaveRequest = useCreateLeaveRequest();
  // Holds the draft created this attempt. If submit-for-approval fails, we keep
  // it so a retry reuses the same draft instead of creating a duplicate.
  const draftIdRef = useRef<string | null>(null);
  const { data: leaveRequestsResponse, isLoading: isLoadingRequests } = useLeaveRequests({
    limit: 100,
    sort_by: "created_at",
    sort_order: "desc"
  });
  const items = leaveRequestsResponse?.data || [];

  // Current employee — the list shows the user's OWN requests. Requests awaiting
  // the user's approval live in the sidebar "My Approvals" section.
  const { data: currentEmployee } = useCurrentEmployee();

  const [activeStatus, setActiveStatus] = useState<string>("");

  const visibleItems = items.filter((i) => {
    // Only the requests I raised. Tolerant match: newer requests store
    // requester_id as the employee id, older rows stored the user id.
    const isMine =
      i.requesterId === currentEmployee?.id ||
      i.requesterId === currentEmployee?.user_id;
    if (!isMine) return false;
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

  // Employees for the "raise for others" picker — same shape the approver
  // pickers use, so both fields look and behave identically.
  const employeePickerList: PickedEmployee[] = employees.map((e) => ({
    id:         e.id,
    name:       [e.user?.first_name, e.user?.last_name].filter(Boolean).join(" ") || "Unknown",
    role:       e.job_title ?? e.user?.role ?? "",
    department: e.department ?? "",
    avatar_url: e.user?.profile_picture_url,
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

  // Derive the picker's selection from the form field so resubmit pre-fill
  // (form.reset) flows through without a second piece of state to keep in sync.
  const pickedEmployee =
    employeePickerList.find((e) => e.id === form.watch("employee_id")) ?? null;

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

  // Per-type behaviour: uncapped types never block on balance; open-ended
  // types (e.g. Sick Leave) don't require an End Date.
  const isUncapped = selectedLeaveType?.is_uncapped ?? false;
  const isOpenEnded = selectedLeaveType?.open_ended ?? false;

  const days = calcDays(watchStart ?? "", watchEnd ?? "");
  const exceedsBalance = !isUncapped && days > 0 && activeBal !== null && days > activeBal.remaining;

  async function onSubmit(data: FormData) {
    try {
      const employeeId = isOthers ? data.employee_id : currentUserEmployee?.id;

      if (!employeeId) {
        toast.error("Employee is required");
        return;
      }

      // Every requester_pick step on the workflow must have an approver chosen
      const picksError = approverPicker.validate();
      if (picksError) {
        toast.error(picksError);
        return;
      }

      // End Date is required unless this is an open-ended type (e.g. Sick Leave).
      if (!isOpenEnded && !data.end_date) {
        toast.error("End date is required for this leave type");
        return;
      }

      // Convert dates to ISO (YYYY-MM-DD). End date is optional for open-ended.
      const startDateISO = new Date(data.start_date).toISOString().split('T')[0];
      const endDateISO = data.end_date
        ? new Date(data.end_date).toISOString().split('T')[0]
        : undefined;

      const leaveTypeId = parseInt(data.leave_type, 10);
      console.log("Leave type ID parsed:", { raw: data.leave_type, parsed: leaveTypeId });

      // ── EDIT & RESUBMIT (returned request) ────────────────────────────────
      if (editRef) {
        const updated = await leaveRequestsApi.resubmit(editRef, {
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          start_date: startDateISO,
          end_date: endDateISO,
          request_type: data.request_type,
          reason: data.reason,
          picked_approvers: approverPicker.picksPayload,
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

        queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
        toast.success("Request resubmitted for approval!");
        form.reset();
        setSupportingFiles([]);
        router.replace("/hr-management/leave-requests");
        setView("list");
        return;
      }

      // Create the draft — but if a previous attempt already created one and
      // only the submit step failed, reuse it so we don't pile up duplicates.
      let leaveRequest: { id: string };
      if (draftIdRef.current) {
        leaveRequest = { id: draftIdRef.current };
      } else {
        const created = await createLeaveRequest.mutateAsync({
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          start_date: startDateISO,
          end_date: endDateISO,
          request_type: data.request_type,
          reason: data.reason,
          picked_approvers: approverPicker.picksPayload,
        });
        draftIdRef.current = created.id;
        leaveRequest = { id: created.id };
      }

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

      // Submit for approval via the workflow engine — through the shared axios
      // client (raw fetch here failed with "Failed to fetch" in production).
      if (leaveRequest?.id) {
        try {
          await leaveRequestsApi.submitForApproval(
            leaveRequest.id,
            approverPicker.picksPayload,
          );
          draftIdRef.current = null; // fully submitted — next request is fresh
          // Refetch AFTER the workflow starts so the list shows the Next Actor now.
          queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
          toast.success("Leave request submitted for approval!");
        } catch (submissionError: unknown) {
          // Keep draftIdRef so a retry reuses this draft instead of duplicating.
          const detail =
            (submissionError as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          const msg = detail || (submissionError instanceof Error ? submissionError.message : "Unknown error");
          toast.error(`Could not submit for approval: ${msg}`);
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
    draftIdRef.current = null; // abandon any half-created draft
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
              <Button leftIcon={<Plus size={16} />} onClick={() => { draftIdRef.current = null; setView("form"); }}>
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
                        {isUncapped ? (
                          <span className="text-sm text-brand-text-secondary">
                            <span className="font-bold text-brand-purple">No cap</span> · {activeBal.used} used
                          </span>
                        ) : (
                          <>
                            <span className="text-sm font-bold text-brand-purple">
                              {activeBal.remaining}
                            </span>
                            <span className="text-sm text-brand-text-secondary">
                              of {activeBal.entitlement} days remaining · {activeBal.used} used
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {!isUncapped && (
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
                    )}
                  </div>
                )}

                {/* Employee fields — only when Others */}
                {isOthers && (
                  <EmployeePicker
                    label="Employee Name"
                    required
                    employees={employeePickerList}
                    placeholder="Search all employees..."
                    error={errors.employee_id?.message}
                    value={pickedEmployee}
                    onChange={(emp) =>
                      form.setValue("employee_id", emp?.id ?? "", { shouldValidate: true })
                    }
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
                  label={isOpenEnded ? "Expected Return (optional)" : "End Date"}
                  required={!isOpenEnded}
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

            {/* Workflow approvers (Reliever) — renders nothing if the workflow
                has no requester_pick steps. */}
            <WorkflowApproversSection {...approverPicker} />

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
