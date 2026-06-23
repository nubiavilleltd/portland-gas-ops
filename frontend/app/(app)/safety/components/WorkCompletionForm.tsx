"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import { getSafetyCurrentUser, isSafetyCurrentUser } from "@/lib/safety-demo-identity";
import {
  createWorkCloseOut,
  useSafetyDemoData,
} from "@/lib/safety-demo-store";
import {
  formatLocalDate,
  formatLocalDateTime,
  formatSafetyDisplayDate,
  formatSafetyDisplayDateTime,
} from "@/lib/safety-demo-dates";
import type { ApprovedWorkAuthorizationOption } from "@/types/safety";
import { useToast } from "@/hooks/useToast";
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
  const [completionNotes, setCompletionNotes] = useState("");
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
    description: `${item.requester} | ${formatSafetyDisplayDate(item.requestDate)}`,
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
        completionNotes,
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

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-5">
      <FormSection title="Requester Details" description="Your employee information for this work completion request.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Requester Name" value={requester.name} disabled />
          <FormInput label="Department" value={requester.department} disabled />
          <FormInput label="Job Title / Role" value={requester.role} disabled />
          <FormInput label="Request Date" value={formatSafetyDisplayDate(requester.requestDate)} disabled />
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
          <div className="md:col-span-2">
            <SafetyChoiceTable
              options={yesNoOptions}
              rows={[
                { label: "Was work completed?", required: true, value: workCompleted, onValueChange: setWorkCompleted },
                {
                  label: "Was work completed as approved?",
                  required: true,
                  value: completedAsApproved,
                  onValueChange: setCompletedAsApproved,
                },
              ]}
            />
          </div>
          <div className="md:col-span-2">
            <SafetyChoiceTable
              options={yesNoOptions}
              rows={[
                {
                  label: "Any incident, hazard, or near miss observed?",
                  required: true,
                  value: incidentObserved,
                  onValueChange: setIncidentObserved,
                },
              ]}
            />
          </div>
          <FormTextarea
            label="Completion Summary"
            required
            minLength={5}
            placeholder="Briefly describe what was completed"
            className="md:col-span-2"
            value={completionSummary}
            onChange={(event) => setCompletionSummary(event.target.value)}
          />
          {completedAsApproved === "No" ? (
            <FormTextarea
              label="Explanation for change/deviation"
              required
              minLength={5}
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
              minLength={5}
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
          <FormTextarea
            label="Completion Notes"
            minLength={5}
            placeholder="Add optional completion notes"
            className="md:col-span-2"
            value={completionNotes}
            onChange={(event) => setCompletionNotes(event.target.value)}
          />
        </div>
      </FormSection>

      <FormSection title="Monitoring Attestation" description="Confirm the work was monitored and remained within its approved scope.">
        <SafetyChoiceTable
          options={yesNoNaOptions}
          rows={[
            { label: "Work was monitored during execution", required: true, value: monitoredDuringExecution, onValueChange: setMonitoredDuringExecution },
            { label: "Work stayed within approved scope", required: true, value: stayedWithinScope, onValueChange: setStayedWithinScope },
            { label: "Required PPE and safety controls were maintained", required: true, value: ppeAndControlsMaintained, onValueChange: setPpeAndControlsMaintained },
            { label: "Unsafe condition was reported/addressed if noticed", required: true, value: unsafeConditionAddressed, onValueChange: setUnsafeConditionAddressed },
          ]}
        />
      </FormSection>

      <FormSection title="Area / Equipment Condition" description="Confirm the work area and equipment were left in a safe condition.">
        <div className="space-y-4">
          <SafetyChoiceTable
            options={yesNoOptions}
            rows={[
              { label: "Work area cleaned after completion", required: true, value: workAreaCleaned, onValueChange: setWorkAreaCleaned },
              { label: "Tools/equipment removed from work area", required: true, value: toolsRemoved, onValueChange: setToolsRemoved },
              { label: "Vehicle/equipment/system left in safe condition", required: true, value: systemSafe, onValueChange: setSystemSafe },
              {
                label: "Any remaining hazard?",
                required: true,
                value: remainingHazard,
                onValueChange: setRemainingHazard,
              },
            ]}
          />
          {remainingHazard === "Yes" ? (
            <FormTextarea
              label="Remaining Hazard Details"
              required
              minLength={5}
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
          <FormTextarea label="Exact Work Area" minLength={5} value={workAuthorization.exactWorkArea} disabled />
          <FormInput label="Approved Start Date/Time" value={formatSafetyDisplayDateTime(workAuthorization.approvedStartDateTime)} disabled />
          <FormInput label="Approved End Date/Time" value={formatSafetyDisplayDateTime(workAuthorization.approvedEndDateTime)} disabled />
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
