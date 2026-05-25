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
import {
  closeOutRequester,
} from "@/lib/mock/work-close-out";
import {
  createWorkCloseOut,
  useSafetyDemoData,
} from "@/lib/safety-demo-store";
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
  const workAuthorizations: ApprovedWorkAuthorizationOption[] = storedWorkAuthorizations
    .filter((request) => request.status === "approved")
    .map((request) => ({
      id: request.id,
      title: request.workInitiation.title,
      status: "approved",
      requester: request.requester.name,
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
  }));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWorkAuthorization) return;
    createWorkCloseOut((id) => ({
      id,
      status: "submitted",
      title: `Close-out for ${selectedWorkAuthorization.title}`,
      requester: closeOutRequester,
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
        actor: closeOutRequester.name,
        role: "Requester",
        dateTime: "2026-05-25 03:00 PM",
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
      <FormSection title="Requester Details">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Requester Name" value={closeOutRequester.name} disabled />
          <FormInput label="Department" value={closeOutRequester.department} disabled />
          <FormInput label="Job Title / Role" value={closeOutRequester.role} disabled />
          <FormDatePicker label="Request Date" value={closeOutRequester.requestDate} disabled />
        </div>
      </FormSection>

      <FormSection title="Work Authorization Lookup">
        <FormSelect
          label="Work Authorization Reference"
          required
          searchable
          options={workAuthorizationOptions}
          value={selectedWorkAuthorizationId}
          placeholder="Select approved work authorization"
          onValueChange={setSelectedWorkAuthorizationId}
        />
      </FormSection>

      <ApprovedWorkSummary workAuthorization={selectedWorkAuthorization} />

      <FormSection title="Completion Details">
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
            placeholder="Briefly describe what was completed"
            className="md:col-span-2"
            value={completionSummary}
            onChange={(event) => setCompletionSummary(event.target.value)}
          />
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

      <FormSection title="Monitoring Attestation">
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

      <FormSection title="Area / Equipment Condition">
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
    <FormSection title="Approved Work Summary">
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
          <FormInput label="Exact Work Area" value={workAuthorization.exactWorkArea} disabled />
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-visible rounded-2xl border border-brand-border bg-white">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-5 py-4 md:px-6">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}
