"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import { getSafetyCurrentUser, isSafetyCurrentUser } from "@/lib/safety-demo-identity";
import {
  createWorkCloseOut,
  useSafetyDemoData,
} from "@/lib/safety-demo-store";
import { formatLocalDate, formatLocalDateTime } from "@/lib/safety-demo-dates";
import type { ApprovedWorkAuthorizationOption } from "@/types/safety";
import { useToast } from "@/hooks/useToast";
import { useActiveSafetyChecklist } from "@/lib/modules/safety/checklists";
import type { SafetyChecklistItem } from "@/lib/modules/safety/checklists";
import SafetyProcessFormSkeleton from "./SafetyProcessFormSkeleton";
import SafetyChoiceTable from "./SafetyChoiceTable";

const yesNoOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const yesNoNaOptions = [...yesNoOptions, { value: "N/A", label: "N/A" }];

export default function WorkCompletionForm() {
  const router = useRouter();
  const toast = useToast();
  const [selectedWorkAuthorizationId, setSelectedWorkAuthorizationId] = useState("");
  const { workAuthorizations: storedWorkAuthorizations } = useSafetyDemoData();
  const requester = {
    ...getSafetyCurrentUser(),
    requestDate: formatLocalDate(),
  };
  const completionChecklist = useActiveSafetyChecklist("work_closeout", "completion");
  const monitoringChecklist = useActiveSafetyChecklist("work_closeout", "monitoring");
  const areaConditionChecklist = useActiveSafetyChecklist(
    "work_closeout",
    "closeout_review",
  );
  const workAuthorizations: ApprovedWorkAuthorizationOption[] = storedWorkAuthorizations
    .filter((request) => request.status === "approved" && isSafetyCurrentUser(request.requester.name))
    .map((request) => ({
      id: request.id,
      title: request.workInitiation.title,
      status: "approved",
      requester: request.requester.name,
      requestDate: request.requester.requestDate,
      department: request.requester.department,
      location: request.workInitiation.location,
      exactWorkArea: request.workInitiation.exactWorkArea,
      approvedStartDateTime: request.workInitiation.plannedStartDateTime,
      approvedEndDateTime: request.workInitiation.plannedEndDateTime,
      workTypes: request.workInitiation.workType,
      supervisor: request.workInitiation.assignedSupervisor,
      hseApprover: request.hseApproval?.approver ?? "Samuel Bassey",
    }));
  const [actualStartDateTime, setActualStartDateTime] = useState("");
  const [actualCompletionDateTime, setActualCompletionDateTime] = useState("");
  const [workCompleted, setWorkCompleted] = useState("");
  const [completedAsApproved, setCompletedAsApproved] = useState("");
  const [incidentObserved, setIncidentObserved] = useState("");
  const [completionSummary, setCompletionSummary] = useState("");
  const [deviationExplanation, setDeviationExplanation] = useState("");
  const [incidentNote, setIncidentNote] = useState("");
  const [monitoredDuringExecution, setMonitoredDuringExecution] = useState("");
  const [stayedWithinScope, setStayedWithinScope] = useState("");
  const [ppeAndControlsMaintained, setPpeAndControlsMaintained] = useState("");
  const [unsafeConditionAddressed, setUnsafeConditionAddressed] = useState("");
  const [workAreaCleaned, setWorkAreaCleaned] = useState("");
  const [toolsRemoved, setToolsRemoved] = useState("");
  const [systemSafe, setSystemSafe] = useState("");
  const [remainingHazard, setRemainingHazard] = useState("");
  const [remainingHazardDetails, setRemainingHazardDetails] = useState("");
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);

  const selectedWorkAuthorization = useMemo(
    () =>
      workAuthorizations.find(
        (item) => item.id === selectedWorkAuthorizationId
      ) ?? null,
    [selectedWorkAuthorizationId, workAuthorizations]
  );
  const workAuthorizationOptions = workAuthorizations.map((item) => ({
    value: item.id,
    label: `${item.id} - ${item.title}`,
    description: `${item.requester} | ${item.requestDate}`,
  }));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWorkAuthorization) return;
    const submittedAt = formatLocalDateTime();

    createWorkCloseOut((id) => ({
      id,
      status: "submitted",
      title: `Close-out for ${selectedWorkAuthorization.title}`,
      requester,
      workAuthorization: selectedWorkAuthorization,
      completionDetails: {
        actualStartDateTime,
        actualCompletionDateTime,
        workCompleted: workCompleted === "Yes",
        completedAsApproved: completedAsApproved === "Yes",
        deviationExplanation,
        completionSummary,
        incidentObserved: incidentObserved === "Yes",
        incidentNote,
        completionEvidence: completionFiles.map((file) => ({
          name: file.name,
          type: file.type.startsWith("image/") ? "image" : "document",
        })),
        completionNotes: "",
      },
      monitoring: {
        monitoredDuringExecution: monitoredDuringExecution === "Yes",
        stayedWithinScope: stayedWithinScope === "Yes",
        ppeAndControlsMaintained: ppeAndControlsMaintained === "Yes",
        unsafeConditionAddressed: (unsafeConditionAddressed || "N/A") as "Yes" | "No" | "N/A",
        monitoringComment: "",
      },
      areaCondition: {
        workAreaCleaned: workAreaCleaned === "Yes",
        toolsRemoved: toolsRemoved === "Yes",
        systemSafe: systemSafe === "Yes",
        remainingHazard: remainingHazard === "Yes",
        remainingHazardDetails,
      },
      supervisorApproval: null,
      operationsHeadApproval: null,
      hseApproval: null,
      auditTrail: [{
        action: "Submitted",
        actor: requester.name,
        role: "Requester",
        dateTime: submittedAt,
        comment: "Work completion submitted for close-out.",
      }],
    }));
    toast.success("Work close-out submitted successfully.");
    window.setTimeout(() => {
      router.push("/safety/work-close-out");
    }, 700);
  }

  if (
    completionChecklist.isLoading ||
    monitoringChecklist.isLoading ||
    areaConditionChecklist.isLoading
  ) {
    return <SafetyProcessFormSkeleton sections={5} />;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-5">
      <FormSection title="Requester Details" description="Your employee information for this work completion request.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Requester Name" value={requester.name} disabled />
          <FormInput label="Department" value={requester.department} disabled />
          <FormInput label="Job Title / Role" value={requester.role} disabled />
          <FormDatePicker label="Request Date" value={requester.requestDate} disabled />
        </div>
      </FormSection>

      <FormSection title="Work Authorization Lookup" description="Select the approved work authorization being completed.">
        <FormSelect
          label="Work Authorization Reference"
          required
          searchable
          options={workAuthorizationOptions}
          value={selectedWorkAuthorizationId}
          placeholder="Select approved work authorization"
          dropdownClassName="md:min-w-[34rem]"
          onValueChange={setSelectedWorkAuthorizationId}
        />
      </FormSection>

      <ApprovedWorkSummary workAuthorization={selectedWorkAuthorization} />

      <FormSection title="Completion Details" description="Record when the work occurred and what was completed.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormDateTimeInput label="Actual Start Date/Time" required value={actualStartDateTime} onValueChange={setActualStartDateTime} />
          <FormDateTimeInput label="Actual Completion Date/Time" required value={actualCompletionDateTime} onValueChange={setActualCompletionDateTime} />
          {completionChecklist.isError ? (
            <p className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Closeout completion checklist template is not available.
            </p>
          ) : null}
          <div className="md:col-span-2">
            <SafetyChoiceTable
              options={yesNoOptions}
              rows={(completionChecklist.data?.items ?? [])
                .filter((item) =>
                  ["work_completed", "completed_as_approved", "incident_observed"].includes(
                    item.item_key,
                  ),
                )
                .map((item) => ({
                  label: item.label,
                  required: item.is_required,
                  value:
                    item.item_key === "work_completed"
                      ? workCompleted
                      : item.item_key === "completed_as_approved"
                        ? completedAsApproved
                        : incidentObserved,
                  onValueChange:
                    item.item_key === "work_completed"
                      ? setWorkCompleted
                      : item.item_key === "completed_as_approved"
                        ? setCompletedAsApproved
                        : setIncidentObserved,
                }))}
            />
          </div>
          {completionChecklist.data?.items
            .filter((item) => item.input_type === "text")
            .map((item: SafetyChecklistItem) => (
              <FormTextarea
                key={item.id}
                label={item.label}
                required={item.is_required}
                placeholder="Briefly describe what was completed"
                className="md:col-span-2"
                value={completionSummary}
                onChange={(event) => setCompletionSummary(event.target.value)}
              />
            ))}
          {completedAsApproved === "No" ? (
            <FormTextarea
              label="Explanation for change/deviation"
              required
              placeholder="Explain the deviation from approved scope"
              className="md:col-span-2"
              value={deviationExplanation}
              onChange={(event) => setDeviationExplanation(event.target.value)}
            />
          ) : null}
          {incidentObserved === "Yes" ? (
            <FormTextarea
              label="Incident/Hazard Note"
              required
              placeholder="Describe the incident, hazard, or near miss"
              value={incidentNote}
              onChange={(event) => setIncidentNote(event.target.value)}
            />
          ) : null}
          <div className="space-y-3 md:col-span-2">
            <FileDropzone
              label="Completion Evidence"
              value={completionFiles}
              onChange={setCompletionFiles}
              accept="image/*,.pdf,.doc,.docx"
              maxFiles={10}
              hint="Local selection only. No upload is performed."
            />
          </div>
          {/* <FormTextarea
            label="Completion Notes"
            placeholder="Add optional completion notes"
            className="md:col-span-2"
          /> */}
        </div>
      </FormSection>

      <FormSection title="Monitoring Attestation" description="Confirm the work was monitored and remained within its approved scope.">
        {monitoringChecklist.isError ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Closeout monitoring checklist template is not available.
          </p>
        ) : null}
        <SafetyChoiceTable
          options={yesNoNaOptions}
          rows={(monitoringChecklist.data?.items ?? [])
            .filter((item) => item.input_type === "boolean" || item.input_type === "enum")
            .map((item) => ({
              label: item.label,
              required: item.is_required,
              value:
                item.item_key === "monitored_during_execution"
                  ? monitoredDuringExecution
                  : item.item_key === "stayed_within_scope"
                    ? stayedWithinScope
                    : item.item_key === "ppe_and_controls_maintained"
                      ? ppeAndControlsMaintained
                      : unsafeConditionAddressed,
              onValueChange:
                item.item_key === "monitored_during_execution"
                  ? setMonitoredDuringExecution
                  : item.item_key === "stayed_within_scope"
                    ? setStayedWithinScope
                    : item.item_key === "ppe_and_controls_maintained"
                      ? setPpeAndControlsMaintained
                      : setUnsafeConditionAddressed,
            }))}
        />
      </FormSection>

      <FormSection title="Area / Equipment Condition" description="Confirm the work area and equipment were left in a safe condition.">
        <div className="space-y-4">
          {areaConditionChecklist.isError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Closeout area condition checklist template is not available.
            </p>
          ) : null}
          <SafetyChoiceTable
            options={yesNoOptions}
            rows={(areaConditionChecklist.data?.items ?? [])
              .filter((item) => item.input_type === "boolean")
              .map((item) => ({
                label: item.label,
                required: item.is_required,
                value:
                  item.item_key === "work_area_cleaned"
                    ? workAreaCleaned
                    : item.item_key === "tools_removed"
                      ? toolsRemoved
                      : item.item_key === "system_safe"
                        ? systemSafe
                        : remainingHazard,
                onValueChange:
                  item.item_key === "work_area_cleaned"
                    ? setWorkAreaCleaned
                    : item.item_key === "tools_removed"
                      ? setToolsRemoved
                      : item.item_key === "system_safe"
                        ? setSystemSafe
                        : setRemainingHazard,
              }))}
          />
          {remainingHazard === "Yes" ? (
            <FormTextarea
              label="Remaining Hazard Details"
              required
              placeholder="Describe remaining hazard"
              className="md:col-span-2"
              value={remainingHazardDetails}
              onChange={(event) => setRemainingHazardDetails(event.target.value)}
            />
          ) : null}
        </div>
      </FormSection>

      <div className="flex gap-3 pt-1">
        <Button type="submit">Submit Close-Out</Button>
      </div>
    </form>
  );
}

function ApprovedWorkSummary({
  workAuthorization,
}: {
  workAuthorization: ApprovedWorkAuthorizationOption | null;
}) {
  return (
    <FormSection title="Approved Work Summary" description="Approved work authorization details for this close-out.">
      {!workAuthorization ? (
        <p className="rounded-xl border border-dashed border-brand-border bg-gray-50 p-4 text-sm text-brand-text-secondary">
          Select an approved Work Authorization to load the work details.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Work Authorization Title" value={workAuthorization.title} disabled />
          <FormInput label="Original Requester" value={workAuthorization.requester} disabled />
          <FormInput label="Department" value={workAuthorization.department} disabled />
          <FormInput label="Work Location" value={workAuthorization.location} disabled />
          <FormTextarea label="Exact Work Area" value={workAuthorization.exactWorkArea} disabled />
          <FormInput label="Approved Start Date/Time" value={workAuthorization.approvedStartDateTime} disabled />
          <FormInput label="Approved End Date/Time" value={workAuthorization.approvedEndDateTime} disabled />
          <FormInput label="Approved Work Type" value={workAuthorization.workTypes.join(", ")} disabled />
          <FormInput label="Approved Supervisor" value={workAuthorization.supervisor} disabled />
          <FormInput label="HSE Approver" value={workAuthorization.hseApprover} disabled />
        </div>
      )}
    </FormSection>
  );
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
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
        {description ? <p className="mt-1 text-sm text-brand-text-secondary">{description}</p> : null}
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}
