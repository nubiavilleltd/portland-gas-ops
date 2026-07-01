"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/ui/FileDropzone";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import { useToast } from "@/hooks/useToast";
import {
  safetyChecklistsApi,
  useActiveSafetyChecklist,
} from "@/lib/modules/safety/checklists";
import type {
  SafetyChecklistAnswerCreate,
  SafetyChecklistItem,
  SafetyChecklistTemplate,
} from "@/lib/modules/safety/checklists";
import { useWorkInitiations } from "@/lib/modules/safety/workInitiation";
import {
  workAuthorizationsApi,
  type WorkAuthorizationCreate,
} from "@/lib/modules/safety/workAuthorization";
import { getSafetyCurrentUser, isSafetyCurrentUser } from "@/lib/safety-demo-identity";
import { formatLocalDate } from "@/lib/safety-demo-dates";
import {
  clearValidationError,
  getFirstInvalidField,
  scrollToValidationField,
  type ValidationErrors,
} from "@/lib/modules/safety/form-validation";
import type { AssignedWorkInitiationSummary } from "@/types/safety";
import SafetyProcessFormSkeleton from "./SafetyProcessFormSkeleton";
import SafetyChoiceTable from "./SafetyChoiceTable";

const yesNoOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

type WorkAuthorizationValidationField = "selectedWorkInitiationId" | "riskChecklist";

const workAuthorizationFieldOrder: WorkAuthorizationValidationField[] = [
  "selectedWorkInitiationId",
  "riskChecklist",
];

export default function WorkAuthorizationForm() {
  const router = useRouter();
  const toast = useToast();
  const requester = {
    ...getSafetyCurrentUser(),
    requestDate: formatLocalDate(),
  };
  const workInitiationsQuery = useWorkInitiations({ status: "approved" });
  const riskChecklist = useActiveSafetyChecklist(
    "work_authorization",
    "risk_assessment",
  );
  const approvedWorkInitiations = (workInitiationsQuery.data ?? [])
    .filter(
      (request) =>
        request.status === "approved" &&
        request.operationalReview?.decision === "Approve" &&
        (
          isSafetyCurrentUser(request.requester.name) ||
          isSafetyCurrentUser(request.assignment.assignedSupervisor) ||
          request.assignment.assignedWorkers.some(isSafetyCurrentUser)
        ),
    );
  const workInitiations: AssignedWorkInitiationSummary[] = approvedWorkInitiations
    .map((request) => ({
      id: request.id,
      reference: request.reference,
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
  const [validationErrors, setValidationErrors] = useState<
    ValidationErrors<WorkAuthorizationValidationField>
  >({});
  const [riskAnswers, setRiskAnswers] = useState<Record<string, string>>({});
  const [safetyNote, setSafetyNote] = useState("");
  const [attachmentNotes, setAttachmentNotes] = useState("");
  const [safetyFiles, setSafetyFiles] = useState<File[]>([]);
  const workInitiationOptions = approvedWorkInitiations.map((item) => ({
    value: item.id,
    label: `${item.reference ?? item.id} - ${item.title}`,
    description: `${item.requester.name} | ${item.requester.requestDate}`,
  }));
  const selectedWorkInitiation = workInitiations.find(
    (item) => item.id === selectedWorkInitiationId,
  );
  const selectedWorkInitiationRef = useRef<HTMLInputElement | null>(null);
  const riskChecklistRef = useRef<HTMLDivElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextValidationErrors = validateWorkAuthorizationForm({
      selectedWorkInitiation,
      riskAnswers,
      checklist: riskChecklist.data,
    });
    setValidationErrors(nextValidationErrors);

    const firstInvalidField = getFirstInvalidField(
      nextValidationErrors,
      workAuthorizationFieldOrder,
    );
    if (firstInvalidField) {
      toast.error(nextValidationErrors[firstInvalidField] ?? "Complete the required field.");
      scrollToValidationField(
        firstInvalidField === "selectedWorkInitiationId"
          ? selectedWorkInitiationRef
          : riskChecklistRef,
      );
      return;
    }
    if (!selectedWorkInitiation) return;

    const payload: WorkAuthorizationCreate = {
      work_initiation_id: selectedWorkInitiation.id,
      gas_involved: riskAnswers.gas_involved === "Yes",
      pressurized_system: riskAnswers.pressurized_system === "Yes",
      heat_or_sparks: riskAnswers.heat_or_sparks === "Yes",
      electrical_isolation: riskAnswers.electrical_isolation === "Yes",
      lifting_equipment: riskAnswers.lifting_equipment === "Yes",
      ppe_available: riskAnswers.ppe_available === "Yes",
      additional_safety_note: emptyToNull(safetyNote),
      attachment_notes: emptyToNull(attachmentNotes),
      attachments: safetyFiles.map((file) => ({
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : "document",
      })),
    };

    let authorizationWasSaved = false;
    try {
      setIsSubmitting(true);
      const savedAuthorization = await workAuthorizationsApi.create(payload);
      authorizationWasSaved = true;
      const checklistAnswers = riskChecklist.data
        ? buildRiskChecklistAnswers(riskChecklist.data, riskAnswers, safetyNote)
        : [];

      if (checklistAnswers.length > 0) {
        await safetyChecklistsApi.createResponses({
          parent_type: "work_authorization",
          parent_id: savedAuthorization.id,
          answers: checklistAnswers,
        });
      }

      toast.success("Work authorization request submitted successfully.");
      window.setTimeout(() => {
        router.push("/safety/work-authorization");
      }, 700);
    } catch (error) {
      toast.error(
        authorizationWasSaved
          ? "Work authorization was saved, but checklist answers could not be saved."
          : getApiErrorMessage(error, "Work authorization request could not be submitted."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (riskChecklist.isLoading || workInitiationsQuery.isLoading) {
    return <SafetyProcessFormSkeleton sections={5} />;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-5">
      <FormSection title="Requester Details" description="Your employee information for this work authorization request.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput label="Requester Name" value={requester.name} disabled />
          <FormInput label="Department" value={requester.department} disabled />
          <FormInput label="Job Title / Role" value={requester.role} disabled />
          <FormDatePicker label="Request Date" value={requester.requestDate} disabled />
        </div>
      </FormSection>

      <FormSection title="Work Initiation Lookup" description="Select the approved work initiation that requires safety authorization.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelect
            ref={selectedWorkInitiationRef}
            label="Work Initiation Reference"
            required
            searchable
            options={workInitiationOptions}
            placeholder="Select approved work initiation"
            dropdownClassName="md:min-w-[34rem]"
            value={selectedWorkInitiationId}
            error={validationErrors.selectedWorkInitiationId}
            onValueChange={(value) => {
              setSelectedWorkInitiationId(value);
              clearValidationError("selectedWorkInitiationId", setValidationErrors);
            }}
          />
        </div>
      </FormSection>

      <AssignedWorkSummary workInitiation={selectedWorkInitiation} />

      <FormSection title="Safety / Risk Indicators" description="Identify safety considerations that apply before the work begins.">
        {riskChecklist.isError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Risk assessment checklist template is not available.
          </p>
        ) : null}
        <div
          ref={riskChecklistRef}
          className={
            validationErrors.riskChecklist
              ? "space-y-4 rounded-xl border border-red-400 p-2"
              : "space-y-4"
          }
        >
          {riskChecklist.data ? (
            <SafetyChoiceTable
              options={yesNoOptions}
              rows={riskChecklist.data.items
                .filter((item) => item.input_type === "boolean")
                .map((item) => ({
                  label: item.label,
                  required: item.is_required,
                  value: riskAnswers[item.item_key] ?? "",
                  onValueChange: (value) => {
                    setRiskAnswers((current) => ({
                      ...current,
                      [item.item_key]: value,
                    }));
                    clearValidationError("riskChecklist", setValidationErrors);
                  },
                }))}
            />
          ) : null}
          {validationErrors.riskChecklist ? (
            <p className="text-xs text-red-600">{validationErrors.riskChecklist}</p>
          ) : null}
          {riskChecklist.data?.items
            .filter((item) => item.input_type === "text")
            .map((item: SafetyChecklistItem) => (
              <FormTextarea
                key={item.id}
                label={item.label}
                placeholder="Add any extra safety concern"
                value={safetyNote}
                onChange={(event) => setSafetyNote(event.target.value)}
              />
            ))}
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
            placeholder="Add notes about the selected files"
            value={attachmentNotes}
            onChange={(event) => setAttachmentNotes(event.target.value)}
          />
        </div>
      </FormSection>

      <div className="flex gap-3 pt-1">
        <Button type="submit" loading={isSubmitting} loadingText="Submitting...">
          Submit Request
        </Button>
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
          <FormTextarea label="Exact Work Area" value={workInitiation.exactWorkArea} disabled />
          <FormInput label="Assigned Supervisor" value={workInitiation.assignedSupervisor} disabled />
          <FormInput label="Assigned Workers" value={workInitiation.assignedWorkers.join(", ")} disabled />
          <FormInput label="Contractors Needed" value={workInitiation.contractorsNeeded ? "Yes" : "No"} disabled />
          {workInitiation.contractorsNeeded ? (
            <>
              <FormInput label="Selected Contractor" value={workInitiation.selectedContractor} disabled />
              <FormInput label="Contractor Contact Email" type="email" value={workInitiation.contractorContactEmail} disabled />
            </>
          ) : null}
          <FormInput label="Planned Start Date/Time" value={workInitiation.plannedStartDateTime} disabled />
          <FormInput label="Planned End Date/Time" value={workInitiation.plannedEndDateTime} disabled />
          <FormTextarea label="Work Description" value={workInitiation.workDescription} disabled className="md:col-span-2" />
        </div>
      )}
    </FormSection>
  );
}

function validateWorkAuthorizationForm({
  selectedWorkInitiation,
  riskAnswers,
  checklist,
}: {
  selectedWorkInitiation: AssignedWorkInitiationSummary | undefined;
  riskAnswers: Record<string, string>;
  checklist: { items: SafetyChecklistItem[] } | undefined;
}): ValidationErrors<WorkAuthorizationValidationField> {
  const errors: ValidationErrors<WorkAuthorizationValidationField> = {};

  if (!selectedWorkInitiation) {
    errors.selectedWorkInitiationId = "Select approved work initiation.";
  }

  const missingRiskAnswer = checklist?.items.some((item) => (
    item.is_required &&
    item.input_type === "boolean" &&
    !riskAnswers[item.item_key]
  ));

  if (missingRiskAnswer) {
    errors.riskChecklist = "Complete the required safety/risk checks.";
  }

  return errors;
}

function buildRiskChecklistAnswers(
  template: SafetyChecklistTemplate,
  values: Record<string, string>,
  safetyNote: string,
): SafetyChecklistAnswerCreate[] {
  return template.items.reduce<SafetyChecklistAnswerCreate[]>((answers, item) => {
    if (item.input_type === "boolean") {
      const value = values[item.item_key];
      if (value) {
        answers.push({
          item_id: item.id,
          value_boolean: value === "Yes",
        });
      }
    } else if (item.input_type === "text") {
      const value = safetyNote.trim();
      if (value) {
        answers.push({
          item_id: item.id,
          value_text: value,
        });
      }
    }
    return answers;
  }, []);
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const detail = (error as { response?: { data?: { detail?: unknown } } }).response
    ?.data?.detail;

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
