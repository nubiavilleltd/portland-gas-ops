"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormInput from "@/components/forms/FormInput";
import FormMultiSelect from "@/components/forms/FormMultiSelect";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import type { SelectOption } from "@/components/forms/SelectInput";
import { useToast } from "@/hooks/useToast";
import { getSafetyCurrentUser, isSafetyCurrentUser } from "@/lib/safety-demo-identity";
import { createWorkAuthorization, useSafetyDemoData } from "@/lib/safety-demo-store";
import {
  formatLocalDate,
  formatLocalDateTime,
  formatSafetyDisplayDate,
  formatSafetyDisplayDateTime,
} from "@/lib/safety-demo-dates";
import type { AssignedWorkInitiationSummary } from "@/types/safety";

const optionFromStrings = (items: string[]): SelectOption[] =>
  items.map((item) => ({ value: item, label: item }));

const riskIndicatorOptions = optionFromStrings([
  "Gas/CNG/LNG involved",
  "Pressurized system involved",
  "Heat, sparks, welding, cutting, or grinding",
  "Electrical isolation required",
  "Lifting/heavy equipment involved",
  "All required PPE available",
]);

export default function WorkAuthorizationForm() {
  const router = useRouter();
  const toast = useToast();
  const { workInitiations: storedWorkInitiations } = useSafetyDemoData();
  const requester = {
    ...getSafetyCurrentUser(),
    requestDate: formatLocalDate(),
  };
  const approvedWorkInitiations = storedWorkInitiations
    .filter(
      (request) =>
        request.status === "approved" &&
        request.operationalReview?.decision === "Approve" &&
        isSafetyCurrentUser(request.requester.name),
    );
  const workInitiations: AssignedWorkInitiationSummary[] = approvedWorkInitiations
    .map((request) => ({
      id: request.id,
      title: request.title,
      status: "approved",
      workCategory: request.workCategory,
      relatedIncidentHazardId: request.relatedIncidentHazardId,
      workType: request.workType,
      location: request.location,
      exactWorkArea: request.exactWorkArea,
      workDescription: request.workDescription,
      assignedSupervisor: request.assignment.assignedSupervisor,
      assignedWorkers: request.assignment.assignedWorkers,
      contractorsNeeded: request.assignment.contractorsNeeded,
      selectedContractor: request.assignment.selectedContractor,
      contractorContactEmail: request.assignment.contractorContactEmail,
      plannedStartDateTime: request.assignment.plannedStartDateTime,
      plannedEndDateTime: request.assignment.plannedEndDateTime,
    }));
  const [selectedWorkInitiationId, setSelectedWorkInitiationId] = useState("");
  const [riskIndicators, setRiskIndicators] = useState<string[]>([]);
  const [safetyNote, setSafetyNote] = useState("");
  const [attachmentNotes, setAttachmentNotes] = useState("");
  const [safetyFiles, setSafetyFiles] = useState<File[]>([]);
  const workInitiationOptions = approvedWorkInitiations.map((item) => ({
    value: item.id,
    label: `${item.id} - ${item.title}`,
    description: `${item.requester.name} | ${formatSafetyDisplayDate(item.requester.requestDate)}`,
  }));
  const selectedWorkInitiation = workInitiations.find(
    (item) => item.id === selectedWorkInitiationId,
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWorkInitiation) return;
    const submittedAt = formatLocalDateTime();

    createWorkAuthorization((id) => ({
      id,
      status: "submitted",
      requester,
      workInitiation: selectedWorkInitiation,
      requestDetails: {
        title: selectedWorkInitiation.title,
        location: selectedWorkInitiation.location,
        exactWorkArea: selectedWorkInitiation.exactWorkArea,
        expectedStartDateTime: selectedWorkInitiation.plannedStartDateTime,
        expectedEndDateTime: selectedWorkInitiation.plannedEndDateTime,
        supervisor: selectedWorkInitiation.assignedSupervisor,
      },
      workDetails: {
        typeOfWork: selectedWorkInitiation.workType,
        description: selectedWorkInitiation.workDescription,
        reason: "",
        workersInvolved: selectedWorkInitiation.assignedWorkers,
        contractorRequired: selectedWorkInitiation.contractorsNeeded,
        contractorName: selectedWorkInitiation.selectedContractor,
        contractorContactEmail: selectedWorkInitiation.contractorContactEmail,
        toolsEquipment: [],
        specialInstructions: "",
      },
      riskIndicators: {
        gasInvolved: riskIndicators.includes("Gas/CNG/LNG involved"),
        pressurizedSystem: riskIndicators.includes("Pressurized system involved"),
        heatOrSparks: riskIndicators.includes("Heat, sparks, welding, cutting, or grinding"),
        electricalIsolation: riskIndicators.includes("Electrical isolation required"),
        liftingEquipment: riskIndicators.includes("Lifting/heavy equipment involved"),
        ppeAvailable: riskIndicators.includes("All required PPE available"),
        additionalSafetyNote: safetyNote,
      },
      attachments: safetyFiles.map((file) => ({
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : "document",
      })),
      supervisorApproval: null,
      hseInspection: null,
      hseApproval: null,
      auditTrail: [{
        action: "Submitted",
        actor: requester.name,
        role: "Requester",
        dateTime: submittedAt,
        comment: attachmentNotes || "Work authorization request submitted for HSE review.",
      }],
    }));
    toast.success("Work authorization request submitted successfully.");
    window.setTimeout(() => {
      router.push("/safety/work-authorization");
    }, 700);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-5">
      <FormSection title="Requester Details" description="Your employee information for this work authorization request.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Requester Name" value={requester.name} disabled />
          <FormInput label="Department" value={requester.department} disabled />
          <FormInput label="Job Title / Role" value={requester.role} disabled />
          <FormInput label="Request Date" value={formatSafetyDisplayDate(requester.requestDate)} disabled />
        </div>
      </FormSection>

      <FormSection title="Work Initiation Lookup" description="Select the approved work initiation that requires safety authorization.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect
            label="Work Initiation Reference"
            required
            searchable
            options={workInitiationOptions}
            placeholder="Select approved work initiation"
            dropdownClassName="md:min-w-[34rem]"
            value={selectedWorkInitiationId}
            onValueChange={setSelectedWorkInitiationId}
          />
        </div>
      </FormSection>

      <AssignedWorkSummary workInitiation={selectedWorkInitiation} />

      <FormSection title="Safety / Risk Indicators" description="Identify safety considerations that apply before the work begins.">
        <div className="grid gap-4 md:grid-cols-[minmax(300px,420px)_1fr] md:items-start">
          <FormMultiSelect
            label="Risk Indicators"
            required
            searchable
            options={riskIndicatorOptions}
            placeholder="Select all risk indicators that apply"
            value={riskIndicators}
            onValueChange={setRiskIndicators}
          />
          <FormTextarea
            label="Additional Safety Note"
            minLength={5}
            placeholder="Add any extra safety concern"
            value={safetyNote}
            onChange={(event) => setSafetyNote(event.target.value)}
          />
        </div>
      </FormSection>

      <FormSection title="Attachments / Safety Evidence" description="Attach supporting safety documents or work area evidence.">
        <div className="space-y-3">
          <FileDropzone
            label="Safety-related Images/Documents"
            value={safetyFiles}
            onChange={setSafetyFiles}
            accept="image/*,.pdf,.doc,.docx"
            maxFiles={10}
            hint="Area images, safety checklists, hazard photos, PDFs, and documents are accepted."
          />
          <FormTextarea
            label="Attachment Notes"
            minLength={5}
            placeholder="Add notes about the selected files"
            value={attachmentNotes}
            onChange={(event) => setAttachmentNotes(event.target.value)}
          />
        </div>
      </FormSection>

      <div className="flex gap-3 pt-1">
        <Button type="submit">Submit Request</Button>
      </div>
    </form>
  );
}

function AssignedWorkSummary({
  workInitiation,
}: {
  workInitiation: AssignedWorkInitiationSummary | undefined;
}) {
  return (
    <FormSection title="Assigned Work Summary" description="Approved work scope and assignments from the selected initiation request.">
      {!workInitiation ? (
        <p className="text-sm text-brand-text-secondary">
          Select an approved Work Initiation to load work details.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Work Title" value={workInitiation.title} disabled />
          <FormInput label="Work Category" value={workInitiation.workCategory} disabled />
          {workInitiation.relatedIncidentHazardId ? (
            <FormInput label="Related Incident/Hazard Request" value={workInitiation.relatedIncidentHazardId} disabled />
          ) : null}
          <FormInput label="Work Type" value={workInitiation.workType.join(", ")} disabled />
          <FormInput label="Location" value={workInitiation.location} disabled />
          <FormTextarea label="Exact Work Area" minLength={5} value={workInitiation.exactWorkArea} disabled />
          <FormInput label="Assigned Supervisor" value={workInitiation.assignedSupervisor} disabled />
          <FormInput label="Assigned Workers" value={workInitiation.assignedWorkers.join(", ")} disabled />
          <FormInput label="Contractors Needed" value={workInitiation.contractorsNeeded ? "Yes" : "No"} disabled />
          {workInitiation.contractorsNeeded ? (
            <>
              <FormInput label="Selected Contractor" value={workInitiation.selectedContractor} disabled />
              <FormInput label="Contractor Contact Email" type="email" value={workInitiation.contractorContactEmail} disabled />
            </>
          ) : null}
          <FormInput label="Planned Start Date/Time" value={formatSafetyDisplayDateTime(workInitiation.plannedStartDateTime)} disabled />
          <FormInput label="Planned End Date/Time" value={formatSafetyDisplayDateTime(workInitiation.plannedEndDateTime)} disabled />
          <FormTextarea label="Work Description" minLength={5} value={workInitiation.workDescription} disabled className="md:col-span-2" />
          <FormTextarea label="Additional Comments" minLength={5} value={workInitiation.additionalComments ?? ""} disabled className="md:col-span-2" />
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
    <section className="overflow-visible rounded-2xl border border-brand-border bg-white shadow-sm">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-brand-text-secondary">{description}</p> : null}
      </div>
      <div className="px-6 pt-5 pb-6">{children}</div>
    </section>
  );
}
