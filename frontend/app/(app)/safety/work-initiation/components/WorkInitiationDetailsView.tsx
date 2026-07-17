"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import FormInput from "@/components/forms/FormInput";
import FormMultiSelect from "@/components/forms/FormMultiSelect";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import AuditTrail from "@/components/forms/AuditTrail";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import { useToast } from "@/hooks/useToast";
import { getWorkInitiationNextActor } from "@/lib/safety-next-actor";
import { useIncidentReports } from "@/lib/modules/safety/incidentReport";
import { safetyLocationOptions } from "@/lib/modules/safety/locations";
import {
  useWorkInitiation,
  useOperationsHodReviewWorkInitiation,
  useSupervisorReviewWorkInitiation,
  useUpdateWorkInitiation,
} from "@/lib/modules/safety/workInitiation";
import type {
  WorkInitiationCategory,
  WorkInitiationUpdate,
} from "@/lib/modules/safety/workInitiation";
import {
  useSafetyActors,
  useSafetyCurrentEmployee,
  useSafetyDepartments,
} from "@/lib/modules/safety/people";
import {
  getDateTimeAfter,
  getEarliestPlannedStartDateTime,
  MIN_SCHEDULE_DURATION_MINUTES,
} from "@/lib/modules/safety/date-rules";
import { mapWorkflowAuditTrail } from "@/lib/modules/workflow/audit";
import { useAuditTrail } from "@/lib/modules/workflow/queries";
import SafetyProcessFormSkeleton from "../../components/SafetyProcessFormSkeleton";
import SafetyAttachmentList from "../../components/SafetyAttachmentList";
import type { SafetyEmployeeProfile } from "@/lib/modules/safety/people";
import type {
  WorkAuthorizationDecision,
  WorkInitiationRequest,
  WorkInitiationRole,
} from "@/types/safety";

const toOptions = (items: string[]) => items.map((item) => ({ value: item, label: item }));
const workCategoryOptions = [
  "Routine Work",
  "Maintenance",
  "Incident/Hazard",
  "Customer Work",
  "Project Work",
  "Emergency Work",
  "Other",
];
const workCategoryValueByLabel: Record<string, WorkInitiationCategory> = {
  "Routine Work": "routine_work",
  Maintenance: "maintenance",
  "Incident/Hazard": "incident_hazard",
  "Customer Work": "customer_work",
  "Project Work": "project_work",
  "Emergency Work": "emergency_work",
  Other: "other",
};
const workTypeOptionsByCategory: Record<string, string[]> = {
  "Routine Work": [
    "Routine Bay Check",
    "Vehicle Inspection",
    "Equipment Inspection",
    "Preventive Maintenance",
    "General Engineering Work",
  ],
  Maintenance: [
    "Corrective Maintenance",
    "Gas System Repair",
    "Electrical Repair",
    "Facility Repair",
    "Equipment Servicing",
  ],
  "Incident/Hazard": [
    "Incident/Hazard Corrective Work",
    "Gas Leak Corrective Work",
    "Unsafe Condition Correction",
    "Inspection Finding",
    "Emergency Safety Repair",
  ],
  "Customer Work": [
    "CNG Conversion",
    "CNG Cylinder Work",
    "Vehicle Conversion Support",
    "Transport Preparation",
    "Customer Vehicle Inspection",
  ],
  "Project Work": [
    "Planned Project",
    "Workshop Modification",
    "Facility Upgrade",
    "Installation Work",
  ],
  "Emergency Work": [
    "Emergency Work",
    "Emergency Repair",
    "Urgent Gas System Response",
    "Critical Equipment Recovery",
  ],
  Other: ["Other"],
};
const contractorContactEmailByName: Record<string, string> = {
  "SafeWeld Engineering Ltd": "projects@safeweld.example",
  "Prime Gas Services": "operations@primegas.example",
  "Vehicle Conversion Partners": "service@vehicleconversion.example",
  "Electrical Support Contractors": "support@electricalcontractors.example",
};
const categoryOptions = toOptions(workCategoryOptions);
const locationOptions = toOptions(safetyLocationOptions);
const contractorOptions = toOptions([
  "SafeWeld Engineering Ltd",
  "Prime Gas Services",
  "Vehicle Conversion Partners",
  "Electrical Support Contractors",
]);
const yesNoOptions = toOptions(["Yes", "No"]);

type WorkInitiationEditValues = {
  title: string;
  workCategory: string;
  otherWorkCategory: string;
  relatedIncidentHazardId: string;
  workType: string[];
  location: string;
  exactWorkArea: string;
  workDescription: string;
  reasonForWork: string;
  assignedDepartment: string;
  assignedSupervisorId: string;
  assignedWorkerIds: string[];
  contractorsNeeded: string;
  selectedContractor: string;
  contractorContactEmail: string;
  plannedStartDateTime: string;
  plannedEndDateTime: string;
  materialsRequired: string;
};

const workInitiationRoles: { value: WorkInitiationRole; label: string }[] = [
  { value: "requester", label: "Requester" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operations_hod", label: "Operations HOD" },
];

export default function WorkInitiationDetailsView({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const requestQuery = useWorkInitiation(requestId);
  const supervisorReviewMutation = useSupervisorReviewWorkInitiation();
  const operationsHodReviewMutation = useOperationsHodReviewWorkInitiation();
  const updateWorkInitiationMutation = useUpdateWorkInitiation(requestId);
  const auditTrailQuery = useAuditTrail("work_initiation", requestId);
  const workflowAuditTrail = mapWorkflowAuditTrail(auditTrailQuery.data ?? []);
  const request = requestQuery.data;
  const currentEmployeeQuery = useSafetyCurrentEmployee();
  const currentEmployee = currentEmployeeQuery.data;
  const [editValuesById, setEditValuesById] = useState<
    Record<string, WorkInitiationEditValues>
  >({});
  const editValues = request
    ? editValuesById[request.id] ?? buildInitialEditValues(request)
    : null;
  const recommendedIncidentsQuery = useIncidentReports({ status: "recommended" });
  const incidentHazardRequestOptions = (recommendedIncidentsQuery.data ?? [])
    .filter((report) => report.status === "recommended")
    .map((report) => ({
      value: report.id,
      label: report.reference
        ? `${report.reference} - ${report.title || report.reportType}`
        : report.title || report.reportType,
      description: `${report.reporter.name} | ${report.reporter.reportDate}`,
    }));
  const [supervisorComment, setSupervisorComment] = useState("");
  const [operationsHodComment, setOperationsHodComment] = useState("");
  const [requesterAttachments, setRequesterAttachments] = useState<File[]>([]);
  const [retainedRequesterAttachmentIds, setRetainedRequesterAttachmentIds] =
    useState<string[]>([]);
  const departmentsQuery = useSafetyDepartments();
  const departmentOptions = useMemo(
    () =>
      (departmentsQuery.data ?? []).map((department) => ({
        value: department.value,
        label: department.label,
      })),
    [departmentsQuery.data],
  );
  const departmentEmployeesQuery = useSafetyActors(
    editValues?.assignedDepartment
      ? { department: editValues.assignedDepartment }
      : undefined,
    { enabled: Boolean(editValues?.assignedDepartment) },
  );
  const employeeOptions = useMemo(
    () =>
      (departmentEmployeesQuery.data ?? []).map((actor) => ({
        value: actor.id,
        label: `${actor.name}${actor.job_title ? ` - ${actor.job_title}` : ""}`,
      })),
    [departmentEmployeesQuery.data],
  );

  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!request) return;
    setRequesterAttachments([]);
    setRetainedRequesterAttachmentIds(
      request.attachments
        .map((attachment) => attachment.id)
        .filter((id): id is string => Boolean(id)),
    );
  }, [request?.id, request?.attachments]);
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

  if (requestQuery.isLoading || currentEmployeeQuery.isLoading) {
    return <SafetyProcessFormSkeleton sections={4} />;
  }

  if (!request || requestQuery.isError) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-6">
        <p className="text-sm text-brand-text-secondary">Work initiation request not found.</p>
      </div>
    );
  }

  const isRequester = Boolean(
    request.requesterId &&
      currentEmployee?.id &&
      request.requesterId === currentEmployee.id,
  );

  const isAssignedSupervisor = Boolean(
    request.assignment.assignedSupervisorId &&
      currentEmployee?.id &&
      request.assignment.assignedSupervisorId === currentEmployee.id,
  );
  const isOperationsHod = isOperationsHodEmployee(currentEmployee);
  const hasDirectWorkInitiationAccess =
    isRequester || isAssignedSupervisor || isOperationsHod;
  const currentRole = getWorkInitiationAccessRole({
    isRequester,
    isAssignedSupervisor,
    isOperationsHod,
  });

  const canRequesterEdit =
    isRequester && (request.status === "draft" || request.status === "returned");
  const canSupervisorReview = isAssignedSupervisor && request.status === "submitted";
  const canOperationsHodReview =
    isOperationsHod && request.status === "pending";

  function setEditValues(
    action: React.SetStateAction<WorkInitiationEditValues | null>,
  ) {
    if (!request) return;
    setEditValuesById((current) => {
      const previous = current[request.id] ?? buildInitialEditValues(request);
      const next =
        typeof action === "function"
          ? action(previous)
          : action;

      if (!next) return current;
      return {
        ...current,
        [request.id]: next,
      };
    });
  }

  

  async function submitRequest() {
    if (!request) return;
    if (!editValues) return;
    if (updateWorkInitiationMutation.isPending) return;
    const validationMessage = validateReturnedWorkInitiationEdit(editValues);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    try {
      await updateWorkInitiationMutation.mutateAsync(
        {
          payload: {
            ...buildWorkInitiationUpdatePayload(editValues),
            retained_attachment_ids: retainedRequesterAttachmentIds,
          },
          attachments: requesterAttachments,
        },
      );
      toast.success("Work initiation submitted.");
      routeBackToWorkInitiationRequests(router);
    } catch (error) {
      console.error("Failed to submit work initiation", error);
      toast.error("Unable to submit work initiation.");
    }
  }

  async function supervisorReview(decision: WorkAuthorizationDecision) {
    if (!request) return;
    if (supervisorReviewMutation.isPending) return;
    if ((decision === "Return" || decision === "Deny") && !supervisorComment.trim()) {
      toast.error("Add a supervisor comment before returning or denying.");
      return;
    }

    try {
      await supervisorReviewMutation.mutateAsync({
        id: request.id,
        payload: {
          decision: toBackendDecision(decision),
          comment: supervisorComment || null,
        },
      });

      showDecisionToast(toast, "Work initiation", decision, "Supervisor");
      routeBackToWorkInitiationRequests(router);
    } catch (error) {
      console.error("Failed to submit supervisor review", error);
      toast.error("Unable to submit supervisor review.");
    }
  }

  async function operationsHodReview(decision: WorkAuthorizationDecision) {
    if (!request) return;
    if (operationsHodReviewMutation.isPending) return;
    if ((decision === "Return" || decision === "Deny") && !operationsHodComment.trim()) {
      toast.error("Add an Operations HOD comment before returning or denying.");
      return;
    }

    try {
      await operationsHodReviewMutation.mutateAsync({
        id: request.id,
        payload: {
          decision: toBackendDecision(decision),
          comment: operationsHodComment || null,
        },
      });

      showDecisionToast(toast, "Work initiation", decision, "Operations HOD");
      routeBackToWorkInitiationRequests(router);
    } catch (error) {
      console.error("Failed to submit Operations HOD review", error);
      toast.error("Unable to submit Operations HOD review.");
    }
  }

  function toBackendDecision(decision: WorkAuthorizationDecision) {
    if (decision === "Approve") return "approve";
    if (decision === "Return") return "return";
    return "deny";
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => router.push("/safety/work-initiation")}
        className="flex items-center gap-2 text-sm text-brand-text-secondary transition-colors hover:text-brand-text-primary"
      >
        <ArrowLeft size={14} />
        Back to Work Initiation
      </button>

      <RoleBasedRecordHeader
        id={request.reference ?? "Reference pending"}
        currentRole={currentRole}
        onRoleChange={() => undefined}
        roleLabel={
          hasDirectWorkInitiationAccess
            ? getWorkInitiationRoleLabel(currentRole)
            : "Viewer"
        }
        roles={workInitiationRoles}
        recordLabel="Work Initiation"
        title={request.title}
        status={<ApprovalBadge status={request.status} />}
        nextActor={getWorkInitiationNextActor(request)}
        nextApproverName={request.nextApproverName}
        nextApproverRole={request.nextApproverRole}
        showRoleSwitcher={false}
      />

      <StatusNote request={request} currentRole={currentRole} />
      <RequesterDetails request={request} />
      <WorkDetails
        request={request}
        editable={canRequesterEdit}
        values={editValues ?? buildInitialEditValues(request)}
        onValuesChange={setEditValues}
        incidentHazardRequestOptions={incidentHazardRequestOptions}
        retainedAttachmentIds={retainedRequesterAttachmentIds}
        onRetainedAttachmentIdsChange={setRetainedRequesterAttachmentIds}
        newAttachments={requesterAttachments}
        onNewAttachmentsChange={setRequesterAttachments}
      />
      {/* <AssetDetails request={request} editable={canRequesterEdit} /> */}
      <AssignmentPlanning
        request={request}
        editable={canRequesterEdit}
        values={editValues ?? buildInitialEditValues(request)}
        onValuesChange={setEditValues}
        departmentOptions={departmentOptions}
        employeeOptions={employeeOptions}
        employeesLoading={departmentEmployeesQuery.isLoading}
      />

      {canRequesterEdit ? (
        <div className="flex justify-end">
          <Button
            type="button"
            loading={updateWorkInitiationMutation.isPending}
            loadingText="Submitting..."
            onClick={submitRequest}
          >
            Submit Work Initiation
          </Button>
        </div>
      ) : null}

      {canSupervisorReview ? (
        <ApprovalPanel
          title="Supervisor Review"
          description="Review the requested work before it proceeds to Operations HOD."
          commentLabel="Supervisor Comment"
          commentPlaceholder="Add supervisor review notes"
          commentValue={supervisorComment}
          onCommentChange={setSupervisorComment}
          onApprove={() => supervisorReview("Approve")}
          onReturn={() => supervisorReview("Return")}
          onReject={() => supervisorReview("Deny")}
          rejectLabel="Deny"
          disabled={supervisorReviewMutation.isPending}
          returnDisabled={!supervisorComment.trim()}
          rejectDisabled={!supervisorComment.trim()}
          extraFields={
            !supervisorComment.trim() ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Add a supervisor comment before returning or denying this request.
              </p>
            ) : null
          }
        />
      ) : request.supervisorApproval ? (
        <ApprovalResult
          title="Supervisor Review Result"
          approver={request.supervisorApproval.approver}
          decision={request.supervisorApproval.decision}
          dateTime={request.supervisorApproval.dateTime}
          comment={request.supervisorApproval.comment}
        />
      ) : null}

      {canOperationsHodReview ? (
        <ApprovalPanel
          title="Operations HOD Review"
          description="Record the operational approval decision for this work."
          commentLabel="Operations HOD Comment"
          commentPlaceholder="Add operational approval notes"
          commentValue={operationsHodComment}
          onCommentChange={setOperationsHodComment}
          onApprove={() => operationsHodReview("Approve")}
          onReturn={() => operationsHodReview("Return")}
          onReject={() => operationsHodReview("Deny")}
          rejectLabel="Deny"
          disabled={operationsHodReviewMutation.isPending}
          returnDisabled={!operationsHodComment.trim()}
          rejectDisabled={!operationsHodComment.trim()}
          extraFields={
            !operationsHodComment.trim() ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Add an Operations HOD comment before returning or denying this request.
              </p>
            ) : null
          }
        />
      ) : request.operationalReview ? (
        <ReviewResult request={request} />
      ) : null}

      {request.status !== "draft" ? <AuditTrail items={workflowAuditTrail} /> : null}
    </div>
  );
}

function RequesterDetails({ request }: { request: WorkInitiationRequest }) {
  return (
    <FormSection title="Requester Details" description="Employee information for the person who initiated this work.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Requester Name" value={request.requester.name} disabled />
        <FormInput label="Department" value={request.requester.department} disabled />
        <FormInput label="Job Title / Role" value={request.requester.role} disabled />
        <FormInput label="Request Date" value={request.requester.requestDate} disabled />
      </div>
    </FormSection>
  );
}

function WorkDetails({
  request,
  editable,
  values,
  onValuesChange,
  incidentHazardRequestOptions,
  retainedAttachmentIds,
  onRetainedAttachmentIdsChange,
  newAttachments,
  onNewAttachmentsChange,
}: {
  request: WorkInitiationRequest;
  editable: boolean;
  values: WorkInitiationEditValues;
  onValuesChange: React.Dispatch<
    React.SetStateAction<WorkInitiationEditValues | null>
  >;
  incidentHazardRequestOptions: { value: string; label: string }[];
  retainedAttachmentIds: string[];
  onRetainedAttachmentIdsChange: (ids: string[]) => void;
  newAttachments: File[];
  onNewAttachmentsChange: (files: File[]) => void;
}) {
  const workTypeOptions = toOptions(
    values.workCategory ? workTypeOptionsByCategory[values.workCategory] ?? [] : [],
  );
  const visibleAttachments = editable
    ? request.attachments.filter(
        (attachment) =>
          !attachment.id || retainedAttachmentIds.includes(attachment.id),
      )
    : request.attachments;

  function handleWorkCategoryChange(nextCategory: string) {
    onValuesChange((current) =>
      current
        ? {
            ...current,
            workCategory: nextCategory,
            otherWorkCategory:
              nextCategory === "Other" ? current.otherWorkCategory : "",
            relatedIncidentHazardId:
              nextCategory === "Incident/Hazard"
                ? current.relatedIncidentHazardId
                : "",
            workType: [],
          }
        : current,
    );
  }

  return (
    <FormSection title="Work Details" description="Requested work scope, purpose, location, and supporting evidence.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Work Title"
          value={values.title}
          disabled={!editable}
          onChange={(event) =>
            onValuesChange((current) =>
              current ? { ...current, title: event.target.value } : current,
            )
          }
        />
        {editable ? (
          <FormSelect
            label="Work Category"
            options={categoryOptions}
            value={values.workCategory}
            onValueChange={handleWorkCategoryChange}
            placeholder="Select work category"
          />
        ) : (
          <FormInput
            label="Work Category"
            value={formatWorkCategory(request)}
            disabled
          />
        )}
        {editable && values.workCategory === "Other" ? (
          <FormInput
            label="Specify Work Category"
            required
            maxLength={255}
            placeholder="Enter the work category"
            value={values.otherWorkCategory}
            onChange={(event) =>
              onValuesChange((current) =>
                current
                  ? { ...current, otherWorkCategory: event.target.value }
                  : current,
              )
            }
          />
        ) : null}
        {values.workCategory === "Incident/Hazard" ? (
          editable ? (
            <FormSelect
              label="Related Incident/Hazard Request"
              searchable
              options={incidentHazardRequestOptions}
              value={values.relatedIncidentHazardId}
              onValueChange={(value) =>
                onValuesChange((current) =>
                  current
                    ? { ...current, relatedIncidentHazardId: value }
                    : current,
                )
              }
              placeholder="Select related incident or hazard"
              dropdownClassName="md:min-w-[34rem]"
            />
          ) : (
            <FormInput
              label="Related Incident/Hazard Request"
              value={request.relatedIncidentHazardId}
              disabled
            />
          )
        ) : null}
        {editable ? (
          <FormMultiSelect
            label="Work Type"
            searchable
            creatable
            options={workTypeOptions}
            value={values.workType}
            onValueChange={(value) =>
              onValuesChange((current) =>
                current ? { ...current, workType: value } : current,
              )
            }
            placeholder={values.workCategory ? "Select or add work type" : "Select work category first"}
            disabled={!values.workCategory}
          />
        ) : (
          <FormInput label="Work Type" value={request.workType.join(", ")} disabled />
        )}
        <FormMultiSelect
          label="Location"
          value={values.location ? [values.location] : []}
          onValueChange={(value) =>
            onValuesChange((current) =>
              current ? { ...current, location: value[0] ?? "" } : current,
            )
          }
          disabled={!editable}
          searchable
          creatable
          options={locationOptions}
          placeholder="Select or add location"
        />
        <FormTextarea
          label="Exact Work Area"
          value={values.exactWorkArea}
          disabled={!editable}
          onChange={(event) =>
            onValuesChange((current) =>
              current
                ? { ...current, exactWorkArea: event.target.value }
                : current,
            )
          }
        />
        <FormTextarea
          label="Work Description"
          value={values.workDescription}
          disabled={!editable}
          onChange={(event) =>
            onValuesChange((current) =>
              current
                ? { ...current, workDescription: event.target.value }
                : current,
            )
          }
        />
        <FormTextarea
          label="Reason for Work"
          value={values.reasonForWork}
          disabled={!editable}
          onChange={(event) =>
            onValuesChange((current) =>
              current
                ? { ...current, reasonForWork: event.target.value }
                : current,
            )
          }
        />
      </div>
      <div className="mt-4">
        <SafetyAttachmentList
          attachments={visibleAttachments}
          onRemove={
            editable
              ? (attachmentId) =>
                  onRetainedAttachmentIdsChange(
                    retainedAttachmentIds.filter((id) => id !== attachmentId),
                  )
              : undefined
          }
        />
        {editable ? (
          <div className="mt-4">
            <FileDropzone
              label="Supporting Images/Documents"
              value={newAttachments}
              onChange={onNewAttachmentsChange}
              accept="image/*,.pdf,.doc,.docx"
              maxFiles={10}
              hint="These files will be uploaded when the returned request is resubmitted."
            />
          </div>
        ) : null}
      </div>
    </FormSection>
  );
}

// function AssetDetails({ request, editable }: { request: WorkInitiationRequest; editable: boolean }) {
//   const details = request.assetDetails;
//   return (
//     <FormSection title="Asset / Vehicle / Equipment Details">
//       <div className="grid gap-4 md:grid-cols-2">
//         <FormToggleGroup label="Asset/Vehicle/Equipment Involved?" options={yesNoOptions} value={details.assetInvolved ? "Yes" : "No"} disabled={!editable} />
//         {details.assetInvolved ? (
//           <>
//             <FormInput label="Asset Type" defaultValue={details.assetType} disabled={!editable} />
//             <FormInput label="Asset Reference / ID" defaultValue={details.assetReference} disabled={!editable} />
//             {details.assetType === "Vehicle" ? <FormInput label="Vehicle Plate Number" defaultValue={details.vehiclePlateNumber} disabled={!editable} /> : null}
//             <FormInput label="VIN / Chassis Number" defaultValue={details.vin} disabled={!editable} />
//             <FormInput label="Client / Company" defaultValue={details.clientCompany} disabled={!editable} />
//           </>
//         ) : null}
//       </div>
//     </FormSection>
//   );
// }

function AssignmentPlanning({
  request,
  editable,
  values,
  onValuesChange,
  departmentOptions,
  employeeOptions,
  employeesLoading,
}: {
  request: WorkInitiationRequest;
  editable: boolean;
  values: WorkInitiationEditValues;
  onValuesChange: React.Dispatch<
    React.SetStateAction<WorkInitiationEditValues | null>
  >;
  departmentOptions: { value: string; label: string }[];
  employeeOptions: { value: string; label: string }[];
  employeesLoading: boolean;
}) {
  const assignment = request.assignment;
  return (
    <FormSection title="Assignment & Planning" description="Assigned team, workers, contractor, and planned schedule.">
      <div className="grid gap-4 md:grid-cols-2">
        {editable ? (
          <FormSelect
            label="Assigned Department / Team"
            options={departmentOptions}
            value={values.assignedDepartment}
            placeholder="Select department or team"
            onValueChange={(value) =>
              onValuesChange((current) =>
                current
                  ? {
                      ...current,
                      assignedDepartment: value,
                      assignedSupervisorId: "",
                      assignedWorkerIds: [],
                    }
                  : current,
              )
            }
          />
        ) : (
          <FormInput
            label="Assigned Department / Team"
            value={assignment.assignedDepartment}
            disabled
          />
        )}
        {editable ? (
          <FormSelect
            label="Assigned Supervisor"
            searchable
            options={employeeOptions}
            value={values.assignedSupervisorId}
            onValueChange={(value) =>
              onValuesChange((current) =>
                current
                  ? { ...current, assignedSupervisorId: value }
                  : current,
              )
            }
            placeholder={
              !values.assignedDepartment
                ? "Select a department first"
                : employeesLoading
                  ? "Loading employees..."
                  : "Select supervisor"
            }
            disabled={!values.assignedDepartment || employeesLoading}
          />
        ) : (
          <FormInput
            label="Assigned Supervisor"
            value={assignment.assignedSupervisor}
            disabled
          />
        )}
        <FormMultiSelect
          label="Assigned Workers"
          options={editable ? employeeOptions : toOptions(assignment.assignedWorkers)}
          value={editable ? values.assignedWorkerIds : assignment.assignedWorkers}
          onValueChange={(value) =>
            onValuesChange((current) =>
              current ? { ...current, assignedWorkerIds: value } : current,
            )
          }
          disabled={!editable || !values.assignedDepartment || employeesLoading}
          searchable
          placeholder={
            !values.assignedDepartment
              ? "Select a department first"
              : employeesLoading
                ? "Loading employees..."
                : "Select workers"
          }
        />
        <FormSelect
          label="Contractors Needed?"
          options={yesNoOptions}
          value={values.contractorsNeeded}
          onValueChange={(value) =>
            onValuesChange((current) =>
              current
                ? {
                    ...current,
                    contractorsNeeded: value,
                    selectedContractor:
                      value === "Yes" ? current.selectedContractor : "",
                    contractorContactEmail:
                      value === "Yes" ? current.contractorContactEmail : "",
                  }
                : current,
            )
          }
          disabled={!editable}
        />
        {values.contractorsNeeded === "Yes" ? (
          <>
            <FormSelect
              label="Selected Contractor"
              options={contractorOptions}
              value={values.selectedContractor}
              onValueChange={(value) =>
                onValuesChange((current) =>
                  current
                    ? {
                        ...current,
                        selectedContractor: value,
                        contractorContactEmail:
                          contractorContactEmailByName[value] ??
                          current.contractorContactEmail,
                      }
                    : current,
                )
              }
              searchable
              creatable
              placeholder="Select contractor"
              disabled={!editable}
            />
            <FormInput
              label="Contractor Contact Email"
              type="email"
              value={values.contractorContactEmail}
              onChange={(event) =>
                onValuesChange((current) =>
                  current
                    ? {
                        ...current,
                        contractorContactEmail: event.target.value,
                      }
                    : current,
                )
              }
              disabled={!editable}
            />
          </>
        ) : null}
        <FormDateTimeInput
          label="Planned Start Date/Time"
          value={values.plannedStartDateTime}
          min={editable ? getEarliestPlannedStartDateTime() : undefined}
          disabled={!editable}
          onValueChange={(value) =>
            onValuesChange((current) =>
              current
                ? { ...current, plannedStartDateTime: value }
                : current,
            )
          }
        />
        <FormDateTimeInput
          label="Planned End Date/Time"
          value={values.plannedEndDateTime}
          min={
            editable && values.plannedStartDateTime
              ? getDateTimeAfter(values.plannedStartDateTime, MIN_SCHEDULE_DURATION_MINUTES)
              : undefined
          }
          disabled={!editable}
          onValueChange={(value) =>
            onValuesChange((current) =>
              current
                ? { ...current, plannedEndDateTime: value }
                : current,
            )
          }
        />
        <FormTextarea
          label="Materials / Parts Required"
          value={values.materialsRequired}
          disabled={!editable}
          className="md:col-span-2"
          onChange={(event) =>
            onValuesChange((current) =>
              current
                ? { ...current, materialsRequired: event.target.value }
                : current,
            )
          }
        />
      </div>
    </FormSection>
  );
}

function ReviewResult({ request }: { request: WorkInitiationRequest }) {
  const review = request.operationalReview;
  if (!review) return null;
  return (
    <FormSection title="Operations HOD Review Result" description="Recorded Operations HOD decision and comments.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Reviewer" value={review.reviewer} disabled />
        <FormInput label="Review Decision" value={review.decision} disabled />
        <FormInput label="Review Date/Time" value={review.dateTime} disabled />
        <FormTextarea label="Review Comment" value={review.comment} disabled />
      </div>
    </FormSection>
  );
}

function ApprovalResult({
  title,
  approver,
  decision,
  dateTime,
  comment,
}: {
  title: string;
  approver: string;
  decision: WorkAuthorizationDecision;
  dateTime: string;
  comment: string;
}) {
  return (
    <FormSection title={title} description="Recorded supervisor decision and comments for this work request.">
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput label="Approver" value={approver} disabled />
        <FormInput label="Decision" value={decision} disabled />
        <FormInput label="Review Date/Time" value={dateTime} disabled />
        <FormTextarea label="Comment" value={comment} disabled />
      </div>
    </FormSection>
  );
}

function StatusNote({ request, currentRole }: { request: WorkInitiationRequest; currentRole: WorkInitiationRole }) {
  let note = "";
  if (request.status === "submitted") note = currentRole === "supervisor" ? "This request is waiting for your review as supervisor." : "Waiting for supervisor approval.";
  if (request.status === "pending") note = currentRole === "operations_hod" ? "Supervisor approved. This request is waiting for your Operations HOD review." : "Supervisor approved. Waiting for Operations HOD approval.";
  if (request.status === "approved") note = "Work approved by Operations HOD. Its assigned team is eligible for Work Authorization.";
  if (request.status === "returned") note = currentRole === "requester" ? "This request was returned. Update and resubmit." : "This request was returned to the requester.";
  if (request.status === "denied") note = "This work initiation request has been denied and closed.";
  if (!note) return null;
  return <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{note}</div>;
}

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-visible rounded-2xl border border-brand-border bg-white">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
        <h3 className="text-base font-semibold text-brand-text-primary">{title}</h3>
        {description ? <p className="mt-1 text-sm text-brand-text-secondary">{description}</p> : null}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function getWorkInitiationAccessRole({
  isRequester,
  isAssignedSupervisor,
  isOperationsHod,
}: {
  isRequester: boolean;
  isAssignedSupervisor: boolean;
  isOperationsHod: boolean;
}): WorkInitiationRole {
  if (isAssignedSupervisor) return "supervisor";
  if (isOperationsHod) return "operations_hod";
  if (isRequester) return "requester";

  return "requester";
}

function buildInitialEditValues(
  request: WorkInitiationRequest,
): WorkInitiationEditValues {
  return {
    title: request.title,
    workCategory: request.workCategory,
    otherWorkCategory: request.otherWorkCategory ?? "",
    relatedIncidentHazardId: request.relatedIncidentHazardId,
    workType: request.workType,
    location: request.location,
    exactWorkArea: request.exactWorkArea,
    workDescription: request.workDescription,
    reasonForWork: request.reasonForWork,
    assignedDepartment: request.assignment.assignedDepartment,
    assignedSupervisorId: request.assignment.assignedSupervisorId ?? "",
    assignedWorkerIds: request.assignment.assignedWorkerIds ?? [],
    contractorsNeeded: request.assignment.contractorsNeeded ? "Yes" : "No",
    selectedContractor: request.assignment.selectedContractor,
    contractorContactEmail: request.assignment.contractorContactEmail,
    plannedStartDateTime: toDateTimeInputValue(
      request.assignment.plannedStartDateTimeRaw,
    ),
    plannedEndDateTime: toDateTimeInputValue(
      request.assignment.plannedEndDateTimeRaw,
    ),
    materialsRequired: request.assignment.materialsRequired,
  };
}

function buildWorkInitiationUpdatePayload(
  values: WorkInitiationEditValues,
): WorkInitiationUpdate {
  const workCategory =
    workCategoryValueByLabel[values.workCategory] ?? "other";

  return {
    title: values.title,
    work_category: workCategory,
    other_work_category:
      workCategory === "other" ? values.otherWorkCategory.trim() || null : null,
    related_incident_report_id:
      workCategory === "incident_hazard"
        ? values.relatedIncidentHazardId || null
        : null,
    work_type: values.workType,
    location: values.location,
    exact_work_area: values.exactWorkArea || null,
    work_description: values.workDescription,
    reason_for_work: values.reasonForWork,
    assigned_department: values.assignedDepartment,
    assigned_supervisor_id: values.assignedSupervisorId,
    assigned_worker_ids: values.assignedWorkerIds,
    contractors_needed: values.contractorsNeeded === "Yes",
    selected_contractor_name: values.contractorsNeeded === "Yes"
      ? values.selectedContractor || null
      : null,
    contractor_contact_email: values.contractorsNeeded === "Yes"
      ? values.contractorContactEmail || null
      : null,
    planned_start_at: toApiDateTime(values.plannedStartDateTime),
    planned_end_at: toApiDateTime(values.plannedEndDateTime),
    materials_required: values.materialsRequired || null,
  };
}

function validateReturnedWorkInitiationEdit(values: WorkInitiationEditValues) {
  if (values.workDescription.trim().length < 5) {
    return "Work description must be at least 5 characters.";
  }

  if (values.workCategory === "Other" && !values.otherWorkCategory.trim()) {
    return "Specify the work category.";
  }

  const now = new Date();
  const minimumStartTime = new Date(now.getTime() + 10 * 60 * 1000);
  const plannedStart = new Date(values.plannedStartDateTime);
  const plannedEnd = new Date(values.plannedEndDateTime);

  if (!values.plannedStartDateTime) {
    return "Select planned start date/time.";
  }
  if (!values.plannedEndDateTime) {
    return "Select planned end date/time.";
  }
  if (Number.isNaN(plannedStart.getTime())) {
    return "Select a valid planned start date/time.";
  }
  if (Number.isNaN(plannedEnd.getTime())) {
    return "Select a valid planned end date/time.";
  }
  if (plannedStart < minimumStartTime) {
    return "Planned start date/time must be at least 10 minutes from now.";
  }
  if (plannedEnd < now) {
    return "Planned end date/time cannot be in the past.";
  }
  const minimumEndTime = new Date(
    plannedStart.getTime() + MIN_SCHEDULE_DURATION_MINUTES * 60 * 1000,
  );
  if (plannedEnd < minimumEndTime) {
    return `Planned end date/time must be at least ${MIN_SCHEDULE_DURATION_MINUTES} minutes after planned start date/time.`;
  }

  return null;
}

function formatWorkCategory(request: WorkInitiationRequest) {
  if (request.workCategory === "Other" && request.otherWorkCategory) {
    return `Other - ${request.otherWorkCategory}`;
  }

  return request.workCategory;
}

function toApiDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString();
}

function toDateTimeInputValue(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function isOperationsHodEmployee(employee?: SafetyEmployeeProfile | null) {
  const department = employee?.department?.trim().toLowerCase();
  const jobTitle = employee?.job_title?.trim() ?? "";

  return department === "operations" && jobTitle === "Process Manager";
}

function getWorkInitiationRoleLabel(role: WorkInitiationRole) {
  if (role === "operations_hod") return "Operations HOD";
  if (role === "supervisor") return "Supervisor";
  return "Requester";
}

function showDecisionToast(
  toast: ReturnType<typeof useToast>,
  recordLabel: string,
  decision: WorkAuthorizationDecision,
  actorLabel: string,
) {
  if (decision === "Approve") {
    toast.success(`${recordLabel} approved by ${actorLabel}.`);
  } else if (decision === "Return") {
    toast.info(`${recordLabel} returned to requester.`);
  } else {
    toast.error(`${recordLabel} denied by ${actorLabel}.`);
  }
}

function routeBackToWorkInitiationRequests(router: ReturnType<typeof useRouter>) {
  window.setTimeout(() => {
    router.push("/safety/work-initiation");
  }, 700);
}
