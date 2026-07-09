"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, FileText, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import Button from "@/components/ui/Button";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import AuditTrail from "@/components/forms/AuditTrail";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import { useToast } from "@/hooks/useToast";
import {
  safetyChecklistsApi,
  useActiveSafetyChecklist,
  useSafetyChecklistResponses,
} from "@/lib/modules/safety/checklists";
import type {
  SafetyChecklistAnswerCreate,
  SafetyChecklistResponse,
  SafetyChecklistTemplate,
} from "@/lib/modules/safety/checklists";
import {
  incidentReportsApi,
  useCloseIncident,
  useIncidentReport,
  useResolveIncidentWithCloseout,
  type IncidentHseDecision,
  type IncidentHseReviewCreate,
  type IncidentReportType,
  type IncidentSeverityEstimate,
} from "@/lib/modules/safety/incidentReport";
import { getTodayDateInputValue } from "@/lib/modules/safety/date-rules";
import {
  useSafetyActors,
  useSafetyDepartments,
} from "@/lib/modules/safety/people";
import SafetyProcessFormSkeleton from "./SafetyProcessFormSkeleton";
import SafetyChoiceTable from "./SafetyChoiceTable";
import {
  incidentSeverityOptions,
  reportTypeOptions,
} from "@/lib/modules/safety/incidentReport/constants";
import { getIncidentHazardNextActor } from "@/lib/safety-next-actor";
import { useMyEmployee } from "@/lib/modules/employees/hooks";
import { useWorkCloseouts } from "@/lib/modules/safety/workCloseout";
import type {
  IncidentHazardAttachment,
  IncidentHazardHseReview,
  IncidentHazardReport,
  IncidentHazardRole,
} from "@/types/safety";

const toOptions = (items: string[]) =>
  items.map((item) => ({ value: item, label: item }));
const yesNoOptions = toOptions(["Yes", "No"]);
const reportTypeByLabel: Record<string, IncidentReportType> = {
  Incident: "incident",
  Hazard: "hazard",
  "Near Miss": "near_miss",
  "Unsafe Act": "unsafe_act",
  "Unsafe Condition": "unsafe_condition",
  "Environmental Concern": "environmental_concern",
};
const severityByLabel: Record<string, IncidentSeverityEstimate> = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical",
};
const incidentHazardRoles: { value: IncidentHazardRole; label: string }[] = [
  { value: "reporter", label: "Reporter" },
  { value: "hse", label: "HSE Inspector" },
  { value: "action_owner", label: "Action Owner" },
];

export default function IncidentHazardDetailsView({
  reportId,
}: {
  reportId: string;
  initialRole?: IncidentHazardRole;
}) {
  const router = useRouter();
  const toast = useToast();
  const reportQuery = useIncidentReport(reportId);
  const report = reportQuery.data;
  const myEmployeeQuery = useMyEmployee();
  const impactResponsesQuery = useSafetyChecklistResponses(
    "incident_report",
    reportId,
  );
  const workCloseoutsQuery = useWorkCloseouts({ limit: 100 });
  const completedWork = useMemo(
    () =>
      (workCloseoutsQuery.data ?? []).find(
        (request) =>
          request.workAuthorization.relatedIncidentHazardId === report?.id &&
          (request.status === "approved" || request.status === "acknowledged"),
      ) ?? null,
    [report?.id, workCloseoutsQuery.data],
  );
  const resolveIncident = useResolveIncidentWithCloseout(reportId);
  const closeIncidentMutation = useCloseIncident(reportId);
  const [hseComment, setHseComment] = useState("");
  const [confirmedReportType, setConfirmedReportType] = useState("");
  const [confirmedSeverity, setConfirmedSeverity] = useState("");
  const [hseFindings, setHseFindings] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [correctiveActionRequired, setCorrectiveActionRequired] = useState("");
  const [correctiveActionDetails, setCorrectiveActionDetails] = useState("");
  const [assignedDepartment, setAssignedDepartment] = useState("");
  const [actionOwner, setActionOwner] = useState("");
  const [targetCompletionDate, setTargetCompletionDate] = useState("");
  const [hseChecklistAnswers, setHseChecklistAnswers] = useState<
    Record<string, string>
  >({});
  const [isSavingHseReview, setIsSavingHseReview] = useState(false);
  const hseReviewChecklist = useActiveSafetyChecklist(
    "incident_hse_review",
    "hse_review",
  );
  const departmentsQuery = useSafetyDepartments();
  const departmentOptions = useMemo(
    () =>
      (departmentsQuery.data ?? []).map((department) => ({
        value: department.value,
        label: department.label,
      })),
    [departmentsQuery.data],
  );
  const actionOwnerQuery = useSafetyActors(
    assignedDepartment ? { department: assignedDepartment } : undefined,
    { enabled: Boolean(assignedDepartment) },
  );
  const actionOwnerOptions = useMemo(
    () =>
      (actionOwnerQuery.data ?? []).map((actor) => ({
        value: actor.id,
        label: `${actor.name}${actor.job_title ? ` - ${actor.job_title}` : ""}`,
      })),
    [actionOwnerQuery.data],
  );
  const isAssignedActionOwner = Boolean(
    report?.hseReview?.actionOwnerId &&
    myEmployeeQuery.data?.id &&
    report.hseReview.actionOwnerId === myEmployeeQuery.data.id,
  );
  const isHseEmployee = isHseDepartment(myEmployeeQuery.data?.department);
  const isActionOwnerContext =
    isAssignedActionOwner &&
    Boolean(
      report?.status === "recommended" ||
        report?.status === "resolved" ||
        report?.status === "closed",
    );
  const currentRole: IncidentHazardRole = isHseEmployee
    ? "hse"
    : isActionOwnerContext
      ? "action_owner"
      : "reporter";
  const canActAsActionOwner =
    isAssignedActionOwner && report?.status === "recommended";

  const permissions = useMemo(() => {
    const isDraft = report?.status === "draft";
    const isSubmitted = report?.status === "submitted";
    const isRecommended = report?.status === "recommended";
    const isResolved = report?.status === "resolved";
    const isClosed = report?.status === "closed";
    return {
      canReporterEdit: false,
      canHseReview: isHseEmployee && isSubmitted,
      canActionOwnerResolve:
        isRecommended && isAssignedActionOwner && Boolean(completedWork),
      canHseClose: isHseEmployee && isResolved,
      showActionOwnerSection:
        Boolean(isRecommended || isResolved || isClosed) &&
        Boolean(isHseEmployee || isAssignedActionOwner),
      showHseReview: Boolean(
        (isHseEmployee && (isSubmitted || Boolean(report?.hseReview))) ||
          (isAssignedActionOwner && Boolean(report?.hseReview)),
      ),
      showAuditTrail: Boolean(!isDraft),
    };
  }, [
    completedWork,
    isHseEmployee,
    isAssignedActionOwner,
    report?.hseReview,
    report?.status,
  ]);

  if (reportQuery.isLoading || myEmployeeQuery.isLoading) {
    return <SafetyProcessFormSkeleton sections={4} />;
  }

  if (!report || reportQuery.isError) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-6">
        <p className="text-sm text-brand-text-secondary">
          Incident/hazard report not found.
        </p>
      </div>
    );
  }
  if (permissions.canHseReview && hseReviewChecklist.isLoading) {
    return <SafetyProcessFormSkeleton sections={6} />;
  }
  async function recommendToDepartment() {
    await saveHseReview("recommended");
  }

  async function resolveRecommendedIncident() {
    if (!completedWork) {
      toast.error("No approved linked work close-out is available for this incident.");
      return;
    }

    try {
      await resolveIncident.mutateAsync({
        work_closeout_id: completedWork.id,
      });
      await reportQuery.refetch();
      toast.success("Incident marked resolved.");
    } catch (error) {
      console.error("Failed to resolve incident", error);
      toast.error(getApiErrorMessage(error, "Incident could not be resolved."));
    }
  }

  async function closeIncident() {
    try {
      await closeIncidentMutation.mutateAsync();
      await reportQuery.refetch();
      toast.success("Incident closed by HSE.");
    } catch (error) {
      console.error("Failed to close incident", error);
      toast.error(getApiErrorMessage(error, "Incident could not be closed."));
    }
  }

  async function hseFinalDecision(decision: "Resolved" | "Not Resolved") {
    await saveHseReview(decision === "Resolved" ? "resolved" : "not_resolved");
  }

  function handleAssignedDepartmentChange(nextDepartment: string) {
    setAssignedDepartment(nextDepartment);
    setActionOwner("");
  }

  async function saveHseReview(decision: IncidentHseDecision) {
    if (!report) return;

    const validationMessage = validateHseReview(decision);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const payload: IncidentHseReviewCreate = {
      confirmed_report_type: toIncidentReportType(
        confirmedReportType || report.reportType,
      ),
      confirmed_severity: toIncidentSeverity(
        confirmedSeverity || report.severityEstimate || "Medium",
      ),
      findings: hseFindings,
      root_cause: emptyToNull(rootCause),
      corrective_action_required: correctiveActionRequired === "Yes",
      corrective_action_details:
        correctiveActionRequired === "Yes"
          ? emptyToNull(correctiveActionDetails)
          : null,
      action_owner_id:
        correctiveActionRequired === "Yes" ? emptyToNull(actionOwner) : null,
      assigned_department:
        correctiveActionRequired === "Yes"
          ? emptyToNull(assignedDepartment)
          : null,
      target_completion_date:
        correctiveActionRequired === "Yes"
          ? emptyToNull(targetCompletionDate)
          : null,
      decision,
      comment: emptyToNull(hseComment),
    };

    try {
      setIsSavingHseReview(true);
      const review = await incidentReportsApi.createHseReview(
        report.id,
        payload,
      );
      const checklistAnswers = buildHseChecklistAnswers(
        hseReviewChecklist.data,
        hseChecklistAnswers,
        correctiveActionRequired,
        rootCause,
        targetCompletionDate,
      );

      if (checklistAnswers.length > 0) {
        await safetyChecklistsApi.createResponses({
          parent_type: "incident_hse_review",
          parent_id: review.id,
          answers: checklistAnswers,
        });
      }

      await reportQuery.refetch();
      toast.success(
        decision === "recommended"
          ? "Corrective action recommended to action owner."
          : decision === "resolved"
            ? "Incident resolved by HSE."
            : "Incident marked not resolved.",
      );
    } catch (error) {
      console.error("Failed to save HSE review", error);
      toast.error(getApiErrorMessage(error, "HSE review could not be saved."));
    } finally {
      setIsSavingHseReview(false);
    }
  }

  function validateHseReview(decision: IncidentHseDecision) {
    if (!report) return "Incident report is not available.";
    if (!confirmedReportType && !report.reportType)
      return "Select confirmed report type.";
    if (!confirmedSeverity && !report.severityEstimate)
      return "Select confirmed severity.";
    if (hseFindings.trim().length < 3) return "Add HSE findings.";
    if (!correctiveActionRequired)
      return "Select whether corrective action is required.";
    if (decision === "recommended") {
      if (correctiveActionRequired !== "Yes")
        return "Corrective action must be required before recommendation.";
      if (!correctiveActionDetails.trim())
        return "Describe corrective action details.";
      if (!assignedDepartment) return "Select assigned department.";
      if (!actionOwner) return "Select action owner.";
      if (!targetCompletionDate) return "Select target completion date.";
    }
    if (
      decision !== "recommended" &&
      correctiveActionRequired === "Yes"
    ) {
      return "Use recommendation when corrective action is required.";
    }
    if (hseReviewChecklist.data) {
      const missing = hseReviewChecklist.data.items.some((item) => {
        if (!item.is_required) return false;
        if (item.input_type === "boolean") {
          if (item.item_key === "corrective_action_required")
            return !correctiveActionRequired;
          return !hseChecklistAnswers[item.item_key];
        }
        if (item.input_type === "text" && item.item_key === "root_cause") {
          return false;
        }
        if (
          item.input_type === "date" &&
          item.item_key === "target_completion_date"
        ) {
          return false;
        }
        return false;
      });
      if (missing) return "Complete the required HSE review checks.";
    }
    return "";
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => router.push("/safety/incidents")}
        className="flex items-center gap-2 text-sm text-brand-text-secondary transition-colors hover:text-brand-text-primary"
      >
        <ArrowLeft size={14} />
        Back to Incident & Hazard Reports
      </button>

      <RoleBasedRecordHeader
        id={report.reference ?? "Reference pending"}
        currentRole={currentRole}
        onRoleChange={() => undefined}
        roleLabel={getIncidentHazardRoleLabel(currentRole)}
        roles={incidentHazardRoles}
        status={<ApprovalBadge status={report.status} />}
        nextActor={getIncidentHazardNextActor(report)}
        switcherDescription="Switch roles to preview reporter, HSE, and assigned action-owner views."
        showRoleSwitcher={false}
      />

      <StatusNote report={report} currentRole={currentRole} />
      <ReporterDetails report={report} />
      <ReportDetails report={report} editable={permissions.canReporterEdit} />
      <IncidentDetails
        report={report}
        editable={permissions.canReporterEdit}
        checklistResponses={impactResponsesQuery.data ?? []}
      />
      <EvidenceSection report={report} />

      {permissions.showHseReview ? (
        permissions.canHseReview ? (
          <HseReviewAction
            comment={hseComment}
            onCommentChange={setHseComment}
            confirmedReportType={confirmedReportType}
            onConfirmedReportTypeChange={setConfirmedReportType}
            confirmedSeverity={confirmedSeverity}
            onConfirmedSeverityChange={setConfirmedSeverity}
            findings={hseFindings}
            onFindingsChange={setHseFindings}
            rootCause={rootCause}
            onRootCauseChange={setRootCause}
            correctiveActionRequired={correctiveActionRequired}
            onCorrectiveActionRequiredChange={setCorrectiveActionRequired}
            correctiveActionDetails={correctiveActionDetails}
            onCorrectiveActionDetailsChange={setCorrectiveActionDetails}
            assignedDepartment={assignedDepartment}
            onAssignedDepartmentChange={handleAssignedDepartmentChange}
            departmentOptions={departmentOptions}
            departmentLoading={departmentsQuery.isLoading}
            actionOwner={actionOwner}
            onActionOwnerChange={setActionOwner}
            actionOwnerOptions={actionOwnerOptions}
            actionOwnerLoading={Boolean(assignedDepartment) && actionOwnerQuery.isLoading}
            targetCompletionDate={targetCompletionDate}
            onTargetCompletionDateChange={setTargetCompletionDate}
            checklistAnswers={hseChecklistAnswers}
            onChecklistAnswersChange={setHseChecklistAnswers}
            onForward={recommendToDepartment}
            onDecision={hseFinalDecision}
            checklist={hseReviewChecklist.data}
            checklistError={hseReviewChecklist.isError}
            isSaving={isSavingHseReview}
          />
        ) : report.hseReview ? (
          <HseReviewResult review={report.hseReview} />
        ) : null
      ) : null}

      {permissions.showActionOwnerSection ? (
        report.hseReview?.correctiveActionRequired ? (
          <CorrectiveWorkResolution
            report={report}
            completedWorkReference={
              completedWork
                ? `${completedWork.reference ?? "Reference pending"} - ${completedWork.title} | ${completedWork.requester.name} | ${completedWork.requester.requestDate}`
                : report.resolutionWorkCompletionId
                  ? "Linked work completion"
                  : ""
            }
            canResolve={permissions.canActionOwnerResolve}
            canCreateLinkedWork={canActAsActionOwner}
            onResolve={resolveRecommendedIncident}
            isResolving={resolveIncident.isPending}
          />
        ) : null
      ) : null}

      {permissions.canHseClose ? (
        <HseClosureAction
          report={report}
          onClose={closeIncident}
          isClosing={closeIncidentMutation.isPending}
        />
      ) : null}

      {permissions.showAuditTrail ? (
        <AuditTrail
          items={report.auditTrail}
          description="Recorded workflow actions and comments for this report."
        />
      ) : null}
    </div>
  );
}

function ReporterDetails({ report }: { report: IncidentHazardReport }) {
  return (
    <FormSection
      title="Reporter Details"
      description="Employee information for the person who raised this report."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Reporter Name"
          value={report.reporter.name}
          disabled
        />
        <FormInput
          label="Department"
          value={report.reporter.department}
          disabled
        />
        <FormInput
          label="Job Title / Role"
          value={report.reporter.role}
          disabled
        />
        <FormInput
          label="Report Date"
          value={report.reporter.reportDate}
          disabled
        />
      </div>
    </FormSection>
  );
}

function ReportDetails({
  report,
  editable,
}: {
  report: IncidentHazardReport;
  editable: boolean;
}) {
  return (
    <FormSection
      title="Report Details"
      description="Basic information about the reported incident or hazard."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Report Reference"
          value={report.reference ?? "Reference pending"}
          disabled
        />
        <FormInput
          label="Report Title"
          defaultValue={report.title}
          disabled={!editable}
        />
        <FormInput
          label="Report Type"
          defaultValue={report.reportType}
          disabled={!editable}
        />
        <FormInput
          label="Location"
          defaultValue={report.location}
          disabled={!editable}
        />
        <FormInput
          label="Date/Time Observed"
          defaultValue={report.dateTimeObserved}
          disabled={!editable}
        />
        <FormInput
          label="Related Work Authorization"
          defaultValue={report.relatedWorkAuthorization}
          disabled={!editable}
        />
      </div>
    </FormSection>
  );
}

function IncidentDetails({
  report,
  editable,
  checklistResponses,
}: {
  report: IncidentHazardReport;
  editable: boolean;
  checklistResponses: SafetyChecklistResponse[];
}) {
  const checklistRows = buildIncidentImpactRows(report, checklistResponses);

  return (
    <FormSection
      title="Incident / Hazard Details"
      description="Observed impact, risk level, and immediate actions recorded."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormTextarea
          label="Description"
          defaultValue={report.description}
          disabled={!editable}
          className="md:col-span-2"
        />
        <FormInput
          label="Severity Estimate"
          defaultValue={report.severityEstimate}
          disabled={!editable}
        />
        <div className="md:col-span-2">
          <SafetyChoiceTable
            options={yesNoOptions}
            disabled={!editable}
            rows={checklistRows}
          />
        </div>
        <FormTextarea
          label="Immediate Action Taken"
          defaultValue={report.immediateActionTaken}
          disabled={!editable}
          className="md:col-span-2"
        />
        <FormTextarea
          label="People Involved / Witnesses"
          defaultValue={report.peopleInvolved}
          disabled={!editable}
        />
        <FormTextarea
          label="Additional Notes"
          defaultValue={report.additionalNotes}
          disabled={!editable}
        />
      </div>
    </FormSection>
  );
}

function EvidenceSection({ report }: { report: IncidentHazardReport }) {
  return (
    <FormSection
      title="Evidence / Attachments"
      description="Supporting photos, videos, or documents for this report."
    >
      <AttachmentList attachments={report.attachments} />
    </FormSection>
  );
}

function HseReviewAction({
  comment,
  onCommentChange,
  confirmedReportType,
  onConfirmedReportTypeChange,
  confirmedSeverity,
  onConfirmedSeverityChange,
  findings,
  onFindingsChange,
  rootCause,
  onRootCauseChange,
  correctiveActionRequired,
  onCorrectiveActionRequiredChange,
  correctiveActionDetails,
  onCorrectiveActionDetailsChange,
  assignedDepartment,
  onAssignedDepartmentChange,
  departmentOptions,
  departmentLoading,
  actionOwner,
  onActionOwnerChange,
  actionOwnerOptions,
  actionOwnerLoading,
  targetCompletionDate,
  onTargetCompletionDateChange,
  checklistAnswers,
  onChecklistAnswersChange,
  onForward,
  onDecision,
  checklist,
  checklistError,
  isSaving,
}: {
  comment: string;
  onCommentChange: (comment: string) => void;
  confirmedReportType: string;
  onConfirmedReportTypeChange: (value: string) => void;
  confirmedSeverity: string;
  onConfirmedSeverityChange: (value: string) => void;
  findings: string;
  onFindingsChange: (value: string) => void;
  rootCause: string;
  onRootCauseChange: (value: string) => void;
  correctiveActionRequired: string;
  onCorrectiveActionRequiredChange: (value: string) => void;
  correctiveActionDetails: string;
  onCorrectiveActionDetailsChange: (value: string) => void;
  assignedDepartment: string;
  onAssignedDepartmentChange: (value: string) => void;
  departmentOptions: { value: string; label: string }[];
  departmentLoading: boolean;
  actionOwner: string;
  onActionOwnerChange: (value: string) => void;
  actionOwnerOptions: { value: string; label: string }[];
  actionOwnerLoading: boolean;
  targetCompletionDate: string;
  onTargetCompletionDateChange: (value: string) => void;
  checklistAnswers: Record<string, string>;
  onChecklistAnswersChange: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  onForward: () => void;
  onDecision: (decision: "Resolved" | "Not Resolved") => void;
  checklist?: SafetyChecklistTemplate;
  checklistError: boolean;
  isSaving: boolean;
}) {
  const requiresCorrectiveWork = correctiveActionRequired === "Yes";
  const canRecommendCorrectiveWork =
    requiresCorrectiveWork &&
    Boolean(
      assignedDepartment &&
      actionOwner &&
      correctiveActionDetails.trim() &&
      targetCompletionDate,
    );
  const canResolveWithoutCorrectiveWork = correctiveActionRequired === "No";
  const canDenyWithoutCorrectiveWork =
    canResolveWithoutCorrectiveWork && Boolean(comment.trim());

  return (
    <ApprovalPanel
      title="HSE Review & Corrective Action"
      description="Assess the report and determine whether corrective work is required."
      commentLabel="HSE Comment"
      commentPlaceholder="Add HSE comment"
      commentValue={comment}
      onCommentChange={onCommentChange}
      showReturn={false}
      showReject={!requiresCorrectiveWork}
      showApprove={!requiresCorrectiveWork}
      approveDisabled={!canResolveWithoutCorrectiveWork || isSaving}
      rejectDisabled={!canDenyWithoutCorrectiveWork || isSaving}
      rejectLabel="Deny"
      onApprove={() => onDecision("Resolved")}
      onReject={() => onDecision("Not Resolved")}
      extraActions={
        requiresCorrectiveWork
          ? [
              {
                key: "recommend",
                label: "Recommend Corrective Action",
                variant: "approve",
                disabled: !canRecommendCorrectiveWork || isSaving,
                onClick: onForward,
              },
            ]
          : []
      }
      extraFields={
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="HSE Inspector" value="Samuel Bassey" disabled />
            <FormSelect
              label="Confirmed Report Type"
              required
              options={toOptions(reportTypeOptions)}
              placeholder="Select confirmed report type"
              value={confirmedReportType}
              onValueChange={onConfirmedReportTypeChange}
            />
            <FormSelect
              label="Confirmed Severity"
              required
              options={toOptions(incidentSeverityOptions)}
              placeholder="Select confirmed severity"
              value={confirmedSeverity}
              onValueChange={onConfirmedSeverityChange}
            />
            <FormTextarea
              label="HSE Findings"
              required
              placeholder="Add HSE findings"
              value={findings}
              onChange={(event) => onFindingsChange(event.target.value)}
            />
            {/* <FormTextarea label="Root Cause / Likely Cause" placeholder="Optional" /> */}
            <div className="md:col-span-2">
              {checklistError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  HSE review checklist template is not available.
                </p>
              ) : null}
              {checklist ? (
                <SafetyChoiceTable
                  options={yesNoOptions}
                  rows={checklist.items
                    .filter((item) => item.input_type === "boolean")
                    .map((item) => ({
                      label: item.label,
                      required: item.is_required,
                      value:
                        item.item_key === "corrective_action_required"
                          ? correctiveActionRequired
                          : (checklistAnswers[item.item_key] ?? ""),
                      onValueChange:
                        item.item_key === "corrective_action_required"
                          ? onCorrectiveActionRequiredChange
                          : (value) =>
                              onChecklistAnswersChange((current) => ({
                                ...current,
                                [item.item_key]: value,
                              })),
                    }))}
                />
              ) : null}
            </div>
            {correctiveActionRequired === "Yes" ? (
              <>
                <FormTextarea
                  label="Corrective Action Details"
                  required
                  placeholder="Describe corrective action"
                  value={correctiveActionDetails}
                  onChange={(event) =>
                    onCorrectiveActionDetailsChange(event.target.value)
                  }
                />
                <FormSelect
                  label="Assigned Department"
                  required
                  searchable
                  options={departmentOptions}
                  placeholder={
                    departmentLoading
                      ? "Loading departments..."
                      : "Select department"
                  }
                  value={assignedDepartment}
                  onValueChange={onAssignedDepartmentChange}
                />
                <FormSelect
                  label="Action Owner"
                  required
                  searchable
                  options={actionOwnerOptions}
                  placeholder={
                    !assignedDepartment
                      ? "Select a department first"
                      : actionOwnerLoading
                      ? "Loading action owners..."
                      : "Select action owner"
                  }
                  value={actionOwner}
                  onValueChange={onActionOwnerChange}
                  disabled={!assignedDepartment || actionOwnerLoading}
                />
                <FormDatePicker
                  label="Target Completion Date"
                  required
                  min={getTodayDateInputValue()}
                  value={targetCompletionDate}
                  onValueChange={onTargetCompletionDateChange}
                />
              </>
            ) : null}
            {checklist?.items
              .filter((item) => item.input_type === "text")
              .map((item) => (
                <FormTextarea
                  key={item.id}
                  label={item.label}
                  required={item.is_required}
                  placeholder="Add review note"
                  value={item.item_key === "root_cause" ? rootCause : ""}
                  onChange={(event) => {
                    if (item.item_key === "root_cause") {
                      onRootCauseChange(event.target.value);
                    }
                  }}
                />
              ))}
            <FormInput
              label="HSE Review Date/Time"
              value="2026-05-18 10:00 AM"
              disabled
            />
          </div>
          {correctiveActionRequired === "Yes" ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Approval is disabled because corrective action is required.
            </p>
          ) : null}
          {correctiveActionRequired === "No" && !comment.trim() ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Add an HSE comment before denying this report.
            </p>
          ) : null}
        </div>
      }
    />
  );
}

function HseReviewResult({ review }: { review: IncidentHazardHseReview }) {
  return (
    <FormSection
      title="HSE Review & Corrective Action"
      description="Recorded HSE findings and corrective action outcome."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="HSE Inspector" value={review.inspector} disabled />
        <FormInput
          label="Confirmed Report Type"
          value={review.confirmedReportType}
          disabled
        />
        <FormInput
          label="Confirmed Severity"
          value={review.confirmedSeverity}
          disabled
        />
        <FormTextarea label="HSE Findings" value={review.findings} disabled />
        {/* <FormTextarea label="Root Cause / Likely Cause" value={review.rootCause} disabled /> */}
        <div className="md:col-span-2">
          <SafetyChoiceTable
            options={yesNoOptions}
            disabled
            rows={[
              {
                label: "Corrective Action Required?",
                value: nullableBooleanToYesNo(review.correctiveActionRequired),
              },
            ]}
          />
        </div>
        {review.correctiveActionRequired ? (
          <>
            <FormTextarea
              label="Corrective Action Details"
              value={review.correctiveActionDetails}
              disabled
            />
            <FormInput
              label="Assigned Department"
              value={review.assignedDepartment}
              disabled
            />
            <FormInput
              label="Action Owner"
              value={review.actionOwner}
              disabled
            />
            <FormInput
              label="Target Completion Date"
              value={review.targetCompletionDate}
              disabled
            />
          </>
        ) : null}
        <FormInput
          label="HSE Resolution"
          value={review.decision || "Pending final HSE resolution"}
          disabled
        />
        <FormTextarea label="HSE Comment" value={review.comment} disabled />
        <FormInput
          label="HSE Review Date/Time"
          value={review.reviewDateTime}
          disabled
        />
      </div>
    </FormSection>
  );
}

function CorrectiveWorkResolution({
  report,
  completedWorkReference,
  canResolve,
  canCreateLinkedWork,
  onResolve,
  isResolving,
}: {
  report: IncidentHazardReport;
  completedWorkReference: string;
  canResolve: boolean;
  canCreateLinkedWork: boolean;
  onResolve: () => void;
  isResolving: boolean;
}) {
  return (
    <FormSection
      title="Corrective Work Resolution"
      description="Track linked corrective work through completion before closure."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Assigned Department"
          value={report.hseReview?.assignedDepartment || ""}
          disabled
        />
        <FormInput
          label="Action Owner"
          value={report.hseReview?.actionOwner || ""}
          disabled
        />
        <FormInput
          label="Related Completed Work Request"
          value={
            completedWorkReference ||
            "No approved linked work completion available yet"
          }
          disabled
          className="md:col-span-2"
        />
      </div>
      {report.status === "recommended" &&
      !completedWorkReference &&
      canCreateLinkedWork ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-blue-800">
            Create and complete linked work using this incident before it can be
            marked resolved.
          </p>
          <Button
            href={`/safety/work-initiation/new?incidentId=${encodeURIComponent(report.id)}`}
            size="sm"
            variant="secondary"
            className="shrink-0 bg-white"
          >
            Create Work Initiation
          </Button>
        </div>
      ) : null}
      {canResolve ? (
        <div className="mt-4">
          <Button
            type="button"
            onClick={onResolve}
            loading={isResolving}
            loadingText="Resolving..."
          >
            Mark Incident Resolved
          </Button>
        </div>
      ) : null}
    </FormSection>
  );
}

function HseClosureAction({
  report,
  onClose,
  isClosing,
}: {
  report: IncidentHazardReport;
  onClose: () => void;
  isClosing: boolean;
}) {
  return (
    <ApprovalPanel
      title="HSE Final Closure"
      description="Verify the completed corrective work and close this report."
      showComment={false}
      showReturn={false}
      showReject={false}
      approveLabel="Close Incident"
      approveDisabled={isClosing}
      onApprove={onClose}
      extraFields={
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="HSE Inspector"
              value={report.hseReview?.inspector || "Samuel Bassey"}
              disabled
            />
            <FormInput
              label="Verified Work Completion"
              value={
                report.resolutionWorkCompletionId ||
                "No linked completion required"
              }
              disabled
            />
          </div>
          <p className="text-sm text-brand-text-secondary">
            Confirm the reported issue has been resolved and close this incident
            record.
          </p>
        </div>
      }
    />
  );
}

function nullableBooleanToYesNo(value: boolean | null) {
  if (value === null) return "";
  return value ? "Yes" : "No";
}

function buildIncidentImpactRows(
  report: IncidentHazardReport,
  checklistResponses: SafetyChecklistResponse[],
) {
  const booleanResponses = checklistResponses
    .filter((response) => response.input_type_snapshot === "boolean")
    .sort(
      (first, second) => first.sort_order_snapshot - second.sort_order_snapshot,
    );

  if (booleanResponses.length > 0) {
    return booleanResponses.map((response) => ({
      label: response.label_snapshot,
      required: response.is_required_snapshot,
      value: nullableBooleanToYesNo(response.value_boolean ?? null),
    }));
  }

  return [
    {
      label: "Was anyone injured?",
      value: nullableBooleanToYesNo(report.anyoneInjured),
    },
    {
      label: "Was equipment/property damaged?",
      value: nullableBooleanToYesNo(report.propertyDamaged),
    },
    {
      label: "Is there gas/fire/environmental concern?",
      value: nullableBooleanToYesNo(report.gasFireEnvironmentalConcern),
    },
  ];
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toIncidentReportType(value: string): IncidentReportType {
  return reportTypeByLabel[value] ?? "other";
}

function toIncidentSeverity(value: string): IncidentSeverityEstimate {
  return severityByLabel[value] ?? "medium";
}

function buildHseChecklistAnswers(
  checklist: SafetyChecklistTemplate | undefined,
  checklistAnswers: Record<string, string>,
  correctiveActionRequired: string,
  rootCause: string,
  targetCompletionDate: string,
): SafetyChecklistAnswerCreate[] {
  if (!checklist) return [];

  return checklist.items.reduce<SafetyChecklistAnswerCreate[]>(
    (answers, item) => {
      if (item.input_type === "boolean") {
        const value =
          item.item_key === "corrective_action_required"
            ? correctiveActionRequired
            : (checklistAnswers[item.item_key] ?? "");
        if (value) {
          answers.push({
            item_id: item.id,
            value_boolean: value === "Yes",
          });
        }
        return answers;
      }

      if (item.input_type === "text" && item.item_key === "root_cause") {
        const value = emptyToNull(rootCause);
        if (value) {
          answers.push({
            item_id: item.id,
            value_text: value,
          });
        }
        return answers;
      }

      if (
        item.input_type === "date" &&
        item.item_key === "target_completion_date"
      ) {
        const value = emptyToNull(targetCompletionDate);
        if (value) {
          answers.push({
            item_id: item.id,
            value_date: value,
          });
        }
      }

      return answers;
    },
    [],
  );
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: unknown } }).response?.data;
  const detail = (data as { detail?: unknown } | undefined)?.detail;

  if (typeof detail === "string") return detail;
  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof detail.message === "string"
  ) {
    return detail.message;
  }

  return fallback;
}

function AttachmentList({
  attachments,
}: {
  attachments?: IncidentHazardAttachment[];
}) {
  const safeAttachments = attachments ?? [];

  if (safeAttachments.length === 0) {
    return <p className="text-sm text-brand-text-secondary">No attachments.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {safeAttachments.map((attachment) => (
        <AttachmentItem key={attachment.id ?? attachment.name} attachment={attachment} />
      ))}
    </div>
  );
}

function AttachmentItem({
  attachment,
}: {
  attachment: IncidentHazardAttachment;
}) {
  const content = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-brand-purple">
        {attachment.type === "image" ? (
          <ImageIcon size={18} />
        ) : (
          <FileText size={18} />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-brand-text-primary">
          {attachment.name}
        </p>
        <p className="text-xs capitalize text-brand-text-secondary">
          {attachment.type}
        </p>
      </div>
    </>
  );

  const className = "flex items-center gap-3 rounded-xl border border-brand-border bg-gray-50 p-3";

  if (!attachment.url) {
    return <div className={className}>{content}</div>;
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className={`${className} transition-colors hover:border-brand-purple/40 hover:bg-white`}
    >
      {content}
    </a>
  );
}

function StatusNote({
  report,
  currentRole,
}: {
  report: IncidentHazardReport;
  currentRole: IncidentHazardRole;
}) {
  let note = "";
  if (report.status === "submitted") {
    note =
      currentRole === "hse"
        ? "This report is waiting for your HSE review."
        : "Submitted. Waiting for HSE review.";
  } else if (report.status === "draft" && currentRole !== "reporter") {
    note = "This report is still in draft and has not been submitted.";
  } else if (report.status === "recommended") {
    note =
      currentRole === "action_owner"
        ? `Corrective work has been recommended to you in ${report.hseReview?.assignedDepartment || "the assigned department"}. Raise linked Work Initiation to continue.`
        : `Corrective action recommended to ${report.hseReview?.actionOwner || "the action owner"} in ${report.hseReview?.assignedDepartment || "the assigned department"}.`;
  } else if (report.status === "resolved") {
    note =
      currentRole === "hse"
        ? "The action owner marked this incident resolved. Verify the completed work and close it."
        : "This incident has been marked resolved and is awaiting HSE closure.";
  } else if (report.status === "closed") {
    note = "This report has been verified and closed by HSE.";
  } else if (report.status === "not_resolved") {
    note = "This report has been marked not resolved by HSE.";
  }
  if (!note) return null;
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {note}
    </div>
  );
}

function getIncidentHazardRoleLabel(role: IncidentHazardRole) {
  const labelByRole: Record<IncidentHazardRole, string> = {
    reporter: "Reporter",
    hse: "HSE Inspector",
    action_owner: "Action Owner",
  };

  return labelByRole[role];
}

function isHseDepartment(department?: string | null) {
  const normalizedDepartment = department?.trim().toLowerCase();
  return normalizedDepartment === "hse" || normalizedDepartment === "safety";
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-visible rounded-2xl border border-brand-border bg-white">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
        <h3 className="text-base font-semibold text-brand-text-primary">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm text-brand-text-secondary">
            {description}
          </p>
        ) : null}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}
