"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  AlertTriangle,
  ClipboardCheck,
  FileSearch,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";
import type {
  DraftWorkflowRecords,
  IncidentHazardRecord,
  RegulatoryComplianceRecord,
  SafetyWorkflowRecord,
  WorkAuthorizationRecord,
  WorkCloseOutRecord,
  WorkflowFormKey,
} from "@/lib/safety-workflow-mocks";
import {
  complianceCategoryOptions,
  contractorOptions,
  createInitialDraftForms,
  employeeLookup,
  evidenceRequiredOptions,
  frequencyOptions,
  priorityOptions,
  reportTypeOptions,
  requirementSourceOptions,
  toolsEquipmentOptions,
  workAuthorizationLookup,
  workCategoryOptions,
  workLocationOptions,
  workflowSummaries,
} from "@/lib/safety-workflow-mocks";
import { fetchInitialSafetyDraftForms } from "@/lib/safety-workflow-api";
import { formatDate } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormFileUpload from "@/components/forms/FormFileUpload";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTagInput from "@/components/forms/FormTagInput";
import FormTextarea from "@/components/forms/FormTextarea";
import FormToggleGroup from "@/components/forms/FormToggleGroup";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

const formIcons: Record<WorkflowFormKey, LucideIcon> = {
  work_authorization: ShieldCheck,
  work_close_out: ClipboardCheck,
  regulatory_compliance: FileSearch,
  incident_hazard: AlertTriangle,
};

const hseInspectionResultOptions = [
  { value: "Passed", label: "Passed" },
  { value: "Returned", label: "Returned" },
  { value: "Failed", label: "Failed" },
];

const employeeOptions = employeeLookup.map((employee) => ({
  value: employee.name,
  label: employee.name,
}));

const locationSelectOptions = workLocationOptions.map((location) => ({
  value: location,
  label: location,
}));

const contractorSelectOptions = contractorOptions.map((contractor) => ({
  value: contractor,
  label: contractor,
}));

const complianceCategorySelectOptions = complianceCategoryOptions.map(
  (category) => ({
    value: category,
    label: category,
  })
);

const requirementSourceSelectOptions = requirementSourceOptions.map((source) => ({
  value: source,
  label: source,
}));

const frequencySelectOptions = frequencyOptions.map((frequency) => ({
  value: frequency,
  label: frequency,
}));

const prioritySelectOptions = priorityOptions.map((priority) => ({
  value: priority,
  label: priority,
}));

const reportTypeSelectOptions = reportTypeOptions.map((item) => ({
  value: item,
  label: item,
}));

const workAuthorizationSelectOptions = workAuthorizationLookup.map((item) => ({
  value: item.id,
  label: `${item.id} - ${item.title}`,
}));

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

interface Props {
  formKey: WorkflowFormKey;
  backHref: string;
  backLabel: string;
}

export default function SafetyWorkflowWorkspace({
  formKey,
  backHref,
  backLabel,
}: Props) {
  const [draftForms, setDraftForms] =
    useState<DraftWorkflowRecords>(createInitialDraftForms);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const currentRecord = draftForms[formKey];
  const currentSummary = workflowSummaries[formKey];
  const CurrentIcon = formIcons[formKey];
  const editable = true;

  useEffect(() => {
    let active = true;

    fetchInitialSafetyDraftForms("requester").then((nextDraftForms) => {
      if (!active) return;
      setDraftForms(nextDraftForms);
      setLoadingProfile(false);
    });

    return () => {
      active = false;
    };
  }, []);

  function updateDraftRecord<K extends WorkflowFormKey>(
    formKey: K,
    updater: (record: DraftWorkflowRecords[K]) => DraftWorkflowRecords[K]
  ) {
    setDraftForms((current) => ({
      ...current,
      [formKey]: updater(current[formKey]),
    }));
  }

  return (
    <AppLayout pageTitle={currentSummary.title}>
      <PageHeader
        title={currentSummary.title}
        description={currentSummary.description}
        action={
          <Button href={backHref} variant="outline" leftIcon={<ArrowLeft size={16} />}>
            {backLabel}
          </Button>
        }
        className="mb-6"
      />

      <div className="mx-auto max-w-5xl space-y-4">
        <Card
          title="New Request"
          description={
            loadingProfile
              ? "Loading requester details..."
              : `Requester: ${currentRecord.requester.name || "Not loaded"}`
          }
          icon={<CurrentIcon size={20} />}
          className="border-emerald-100 bg-gradient-to-b from-white to-emerald-50/40"
          iconWrapperClassName="bg-emerald-50 text-emerald-800"
        />

        {formKey === "work_authorization"
              ? renderWorkAuthorization(
                  currentRecord as WorkAuthorizationRecord,
                  editable,
                  false,
                  (updater) =>
                    updateDraftRecord("work_authorization", updater)
                )
              : null}

        {formKey === "work_close_out"
              ? renderWorkCloseOut(
                  currentRecord as WorkCloseOutRecord,
                  editable,
                  (updater) => updateDraftRecord("work_close_out", updater)
                )
              : null}

        {formKey === "regulatory_compliance"
              ? renderRegulatoryCompliance(
                  currentRecord as RegulatoryComplianceRecord,
                  editable,
                  (updater) =>
                    updateDraftRecord("regulatory_compliance", updater)
                )
              : null}

        {formKey === "incident_hazard"
              ? renderIncidentHazard(
                  currentRecord as IncidentHazardRecord,
                  editable,
                  false,
                  (updater) => updateDraftRecord("incident_hazard", updater)
                )
              : null}

        <div className="sticky bottom-0 z-10 -mx-4 border-t border-brand-border bg-brand-bg/95 px-4 py-4 backdrop-blur md:-mx-6 md:px-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:justify-end">
            <Button href={backHref} variant="outline">
              Cancel
            </Button>
            <Button variant="secondary" leftIcon={<Save size={16} />}>
              Save Draft
            </Button>
            <Button leftIcon={<Send size={16} />}>
              Submit Request
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function RequesterSection({
  requester,
}: {
  requester: SafetyWorkflowRecord["requester"];
}) {
  return (
    <Card
      title="Requester Details"
      description="Auto-filled employee details."
      className="border-emerald-100"
      content={
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FormInput label="Requester Name" value={requester.name} disabled />
          <FormInput label="Department" value={requester.department} disabled />
          <FormInput label="Job Title / Role" value={requester.role} disabled />
          <FormInput
            label="Request Date"
            value={requester.requestDate ? formatDate(requester.requestDate) : ""}
            disabled
          />
        </div>
      }
    />
  );
}

function AttachmentList({
  files,
  emptyLabel = "No mock files attached yet.",
}: {
  files: string[];
  emptyLabel?: string;
}) {
  if (files.length === 0) {
    return <p className="text-xs text-brand-text-secondary">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file) => (
        <span
          key={file}
          className="rounded-full bg-brand-purple-faint px-3 py-1 text-xs font-medium text-brand-purple"
        >
          {file}
        </span>
      ))}
    </div>
  );
}

function DisabledStatusField({
  label,
  value,
  required,
}: {
  label: string;
  value: string | boolean | null | undefined;
  required?: boolean;
}) {
  const displayValue =
    typeof value === "boolean" ? (value ? "Yes" : "No") : value ?? "";

  return (
    <FormInput
      label={label}
      required={required}
      value={displayValue}
      disabled
      className="bg-gray-50 text-brand-text-secondary"
    />
  );
}

function booleanToToggleValue(value: boolean | "") {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
}

function toggleValueToBoolean(value: string) {
  return value === "yes";
}

function renderWorkAuthorization(
  record: WorkAuthorizationRecord,
  editable: boolean,
  showReviewSections: boolean,
  update: (updater: (record: WorkAuthorizationRecord) => WorkAuthorizationRecord) => void
) {
  return (
    <>
      <RequesterSection requester={record.requester} />

      <Card
        title="Request Details"
        description="Shared request metadata and scheduling details."
        content={
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormInput
              label="Department"
              required
              value={record.department}
              disabled
            />
            <FormSelect
              label="Supervisor"
              required
              value={record.supervisor}
              options={employeeOptions}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  supervisor: value,
                }))
              }
            />
            <FormSelect
              label="Work Location"
              required
              creatable
              value={record.workLocation}
              options={locationSelectOptions}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  workLocation: value,
                }))
              }
            />
            <FormInput
              label="Exact Work Area"
              required
              value={record.exactWorkArea}
              disabled={!editable}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  exactWorkArea: event.target.value,
                }))
              }
            />
            <FormDatePicker
              label="Expected Start Date"
              required
              value={record.expectedStartDateTime}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  expectedStartDateTime: value,
                }))
              }
            />
            <FormDatePicker
              label="Expected End Date"
              required
              value={record.expectedEndDateTime}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  expectedEndDateTime: value,
                }))
              }
            />
          </div>
        }
      />

      <Card
        title="Work Details"
        description="Operational scope, crew, contractor support, and attachments."
        content={
          <div className="mt-4 space-y-4">
            <FormTextarea
              label="Work Description"
              required
              value={record.workDescription}
              disabled={!editable}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  workDescription: event.target.value,
                }))
              }
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormTagInput
                label="Work Category"
                required
                value={record.workCategories}
                suggestions={workCategoryOptions}
                placeholder="Type work category, then add"
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    workCategories: value,
                  }))
                }
              />
              <FormTagInput
                label="Workers Involved"
                required
                value={record.workersInvolved}
                suggestions={employeeLookup.map((employee) => employee.name)}
                placeholder="Type worker name, then add"
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    workersInvolved: value,
                  }))
                }
              />
              <FormToggleGroup
                label="Contractor Involved?"
                required
                value={booleanToToggleValue(record.contractorInvolved)}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    contractorInvolved: toggleValueToBoolean(value),
                    contractorName:
                      value === "yes" ? current.contractorName : "",
                  }))
                }
              />
              {record.contractorInvolved ? (
                <FormSelect
                  label="Contractor Name"
                  required
                  creatable
                  value={record.contractorName}
                  options={contractorSelectOptions}
                  disabled={!editable}
                  onValueChange={(value) =>
                    update((current) => ({
                      ...current,
                      contractorName: value,
                    }))
                  }
                />
              ) : null}
              <FormTagInput
                label="Tools/Equipment To Be Used"
                required
                value={record.toolsEquipment}
                suggestions={toolsEquipmentOptions}
                placeholder="Type tool or equipment, then add"
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    toolsEquipment: value,
                  }))
                }
              />
              <div className="space-y-3">
                <FormFileUpload
                  label="Attachments"
                  disabled={!editable}
                  hint="Mock only for now. No real file persistence is wired up."
                />
                <AttachmentList files={record.attachments} />
              </div>
            </div>
          </div>
        }
      />

      <Card
        title="Risk & Safety Triggers"
        description="Lightweight readiness checks to flag elevated-risk work."
        content={
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <FormToggleGroup
                label="Is gas/CNG/LNG involved?"
                required
                value={booleanToToggleValue(record.riskTriggers.gasInvolved)}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    riskTriggers: {
                      ...current.riskTriggers,
                      gasInvolved: toggleValueToBoolean(value),
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Is a pressurized system involved?"
                required
                value={booleanToToggleValue(record.riskTriggers.pressurizedSystem)}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    riskTriggers: {
                      ...current.riskTriggers,
                      pressurizedSystem: toggleValueToBoolean(value),
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Will there be heat, sparks, welding, cutting, or grinding?"
                required
                value={booleanToToggleValue(record.riskTriggers.heatOrSparks)}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    riskTriggers: {
                      ...current.riskTriggers,
                      heatOrSparks: toggleValueToBoolean(value),
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Is electrical isolation required?"
                required
                value={booleanToToggleValue(
                  record.riskTriggers.electricalIsolation
                )}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    riskTriggers: {
                      ...current.riskTriggers,
                      electricalIsolation: toggleValueToBoolean(value),
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Is lifting/heavy equipment involved?"
                required
                value={booleanToToggleValue(record.riskTriggers.liftingEquipment)}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    riskTriggers: {
                      ...current.riskTriggers,
                      liftingEquipment: toggleValueToBoolean(value),
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Are all required PPE available?"
                required
                value={booleanToToggleValue(record.riskTriggers.ppeAvailable)}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    riskTriggers: {
                      ...current.riskTriggers,
                      ppeAvailable: toggleValueToBoolean(value),
                    },
                  }))
                }
              />
            </div>

            <FormTextarea
              label="Additional Safety Note"
              value={record.riskTriggers.additionalSafetyNote}
              disabled={!editable}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  riskTriggers: {
                    ...current.riskTriggers,
                    additionalSafetyNote: event.target.value,
                  },
                }))
              }
            />
          </div>
        }
      />

      {showReviewSections ? (
        <Card
          title="HSE Inspection"
          description="Only HSE reviewers see these checks after the requester submits."
          content={
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <DisabledStatusField
                  label="Work area is safe, clean, and accessible"
                  required
                  value={record.hseInspection.workAreaSafe}
                />
                <DisabledStatusField
                  label="Fire extinguisher/emergency equipment is available"
                  required
                  value={record.hseInspection.emergencyEquipmentAvailable}
                />
                <DisabledStatusField
                  label="Gas leak/pressure/abnormal condition check completed"
                  required
                  value={record.hseInspection.gasPressureCheckCompleted}
                />
                <DisabledStatusField
                  label="Required PPE and safety kits are available"
                  required
                  value={record.hseInspection.ppeAndSafetyKitsAvailable}
                />
                <DisabledStatusField
                  label="Tools/equipment are safe and suitable for the job"
                  required
                  value={record.hseInspection.toolsSafe}
                />
                <FormSelect
                  label="HSE Inspection Result"
                  required
                  value={record.hseInspection.result}
                  options={hseInspectionResultOptions}
                  disabled={!editable}
                  onValueChange={(value) =>
                    update((current) => ({
                      ...current,
                      hseInspection: {
                        ...current.hseInspection,
                        result:
                          value as WorkAuthorizationRecord["hseInspection"]["result"],
                      },
                    }))
                  }
                />
              </div>

              <FormTextarea
                label="HSE Inspection Comments"
                value={record.hseInspection.comments}
                disabled={!editable}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    hseInspection: {
                      ...current.hseInspection,
                      comments: event.target.value,
                    },
                  }))
                }
              />

              <div className="space-y-3">
                <FormFileUpload
                  label="HSE Inspection Photo/Evidence"
                  disabled={!editable}
                  hint="Mock upload only for this phase."
                />
                <AttachmentList
                  files={record.hseInspection.evidence}
                  emptyLabel="No inspection evidence attached in this state."
                />
              </div>
            </div>
          }
        />
      ) : null}
    </>
  );
}

function renderWorkCloseOut(
  record: WorkCloseOutRecord,
  editable: boolean,
  update: (updater: (record: WorkCloseOutRecord) => WorkCloseOutRecord) => void
) {
  return (
    <>
      <RequesterSection requester={record.requester} />

      <Card
        title="Request Details"
        description="The close-out keeps the approved work context visible and read-only."
        content={
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <FormSelect
              label="Work Authorization Reference"
              value={record.workAuthorizationReference}
              options={workAuthorizationSelectOptions}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  workAuthorizationReference: value,
                }))
              }
            />
            <FormInput label="Request Title" value={record.requestTitle} disabled />
            <FormInput label="Department" value={record.department} disabled />
            <FormInput label="Work Location" value={record.workLocation} disabled />
            <FormInput
              label="Approved Start"
              value={
                record.approvedStartDateTime
                  ? formatDate(record.approvedStartDateTime)
                  : ""
              }
              disabled
            />
            <FormInput
              label="Approved End"
              value={
                record.approvedEndDateTime
                  ? formatDate(record.approvedEndDateTime)
                  : ""
              }
              disabled
            />
          </div>
        }
      />

      <Card
        title="Completion Details"
        description="Capture the actual execution timing, summary, and any deviation from the approved plan."
        content={
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormDatePicker
                label="Actual Start Date"
                required
                value={record.actualStartDateTime}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    actualStartDateTime: value,
                  }))
                }
              />
              <FormDatePicker
                label="Actual Completion Date"
                required
                value={record.actualCompletionDateTime}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    actualCompletionDateTime: value,
                  }))
                }
              />
            </div>

            <FormToggleGroup
              label="Was the work completed as approved?"
              required
              value={booleanToToggleValue(record.completedAsApproved)}
              options={yesNoOptions}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  completedAsApproved: toggleValueToBoolean(value),
                  explanationForChange:
                    value === "yes" ? "" : current.explanationForChange,
                }))
              }
            />

            {record.completedAsApproved === false ? (
              <FormTextarea
                label="Explanation for Change"
                required
                value={record.explanationForChange}
                disabled={!editable}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    explanationForChange: event.target.value,
                  }))
                }
              />
            ) : null}

            <FormTextarea
              label="Completion Summary"
              required
              value={record.completionSummary}
              disabled={!editable}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  completionSummary: event.target.value,
                }))
              }
            />

            <FormToggleGroup
              label="Any incident, hazard, or near miss observed?"
              required
              value={booleanToToggleValue(record.incidentObserved)}
              options={yesNoOptions}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  incidentObserved: toggleValueToBoolean(value),
                }))
              }
            />

            <div className="space-y-3">
              <FormFileUpload
                label="Completion Photos"
                disabled={!editable}
                hint="Mock upload only for this phase."
              />
              <AttachmentList files={record.completionPhotos} />
            </div>
          </div>
        }
      />

      <Card
        title="Monitoring Attestation"
        description="Reduced yes/no questions to confirm safe execution and proper oversight."
        content={
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <FormToggleGroup
                label="Work was monitored during execution"
                required
                value={booleanToToggleValue(
                  record.monitoring.monitoredDuringExecution
                )}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    monitoring: {
                      ...current.monitoring,
                      monitoredDuringExecution: toggleValueToBoolean(value),
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Work stayed within the approved scope"
                required
                value={booleanToToggleValue(record.monitoring.stayedWithinScope)}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    monitoring: {
                      ...current.monitoring,
                      stayedWithinScope: toggleValueToBoolean(value),
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Required PPE and safety controls were maintained"
                required
                value={booleanToToggleValue(
                  record.monitoring.ppeAndControlsMaintained
                )}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    monitoring: {
                      ...current.monitoring,
                      ppeAndControlsMaintained: toggleValueToBoolean(value),
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Any unsafe condition was reported or addressed"
                required
                value={
                  record.monitoring.unsafeConditionReportedOrAddressed === "Yes"
                    ? "yes"
                    : record.monitoring.unsafeConditionReportedOrAddressed === "No"
                      ? "no"
                      : ""
                }
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    monitoring: {
                      ...current.monitoring,
                      unsafeConditionReportedOrAddressed:
                        value === "yes" ? "Yes" : "No",
                    },
                  }))
                }
              />
            </div>

            <FormTextarea
              label="Monitoring Comments"
              value={record.monitoring.comments}
              disabled={!editable}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  monitoring: {
                    ...current.monitoring,
                    comments: event.target.value,
                  },
                }))
              }
            />
          </div>
        }
      />
    </>
  );
}

function renderRegulatoryCompliance(
  record: RegulatoryComplianceRecord,
  editable: boolean,
  update: (
    updater: (
      record: RegulatoryComplianceRecord
    ) => RegulatoryComplianceRecord
  ) => void
) {
  return (
    <>
      <RequesterSection requester={record.requester} />

      <Card
        title="Request Details"
        description="Core compliance ownership, due date, and urgency settings."
        content={
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormInput
              label="Department"
              required
              value={record.department}
              disabled
            />
            <FormSelect
              label="Responsible Person"
              required
              value={record.responsiblePerson}
              options={employeeOptions}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  responsiblePerson: value,
                }))
              }
            />
            <FormDatePicker
              label="Due Date"
              required
              value={record.dueDate}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  dueDate: value,
                }))
              }
            />
            <FormSelect
              label="Priority"
              required
              value={record.priority}
              options={prioritySelectOptions}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  priority: value as RegulatoryComplianceRecord["priority"],
                }))
              }
            />
          </div>
        }
      />

      <Card
        title="Compliance Details"
        description="Details about the requirement, its source, expected frequency, and evidence."
        content={
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Compliance Title"
                required
                value={record.complianceTitle}
                disabled={!editable}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    complianceTitle: event.target.value,
                  }))
                }
              />
              <FormSelect
                label="Compliance Category"
                required
                creatable
                value={record.complianceCategory}
                options={complianceCategorySelectOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    complianceCategory: value,
                  }))
                }
              />
            </div>

            <FormTextarea
              label="Description"
              required
              value={record.description}
              disabled={!editable}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormSelect
                label="Requirement Source"
                required
                creatable
                value={record.requirementSource}
                options={requirementSourceSelectOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    requirementSource: value,
                  }))
                }
              />
              <FormSelect
                label="Frequency"
                required
                value={record.frequency}
                options={frequencySelectOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    frequency:
                      value as RegulatoryComplianceRecord["frequency"],
                  }))
                }
              />
            </div>

            <FormTagInput
              label="Evidence Required"
              required
              value={record.evidenceRequired}
              suggestions={evidenceRequiredOptions}
              placeholder="Type evidence, then add"
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  evidenceRequired: value,
                }))
              }
            />

            <div className="space-y-3">
              <FormFileUpload
                label="Evidence Upload"
                disabled={!editable}
                hint="Mock upload only for this phase."
              />
              <AttachmentList files={record.evidenceUpload} />
            </div>

            <FormTextarea
              label="Additional Notes"
              value={record.additionalNotes}
              disabled={!editable}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  additionalNotes: event.target.value,
                }))
              }
            />
          </div>
        }
      />
    </>
  );
}

function renderIncidentHazard(
  record: IncidentHazardRecord,
  editable: boolean,
  showReviewSections: boolean,
  update: (updater: (record: IncidentHazardRecord) => IncidentHazardRecord) => void
) {
  return (
    <>
      <RequesterSection requester={record.requester} />

      <Card
        title="Request Details"
        description="Capture the type, location, observation time, and any related approved work."
        content={
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormSelect
              label="Report Type"
              required
              creatable
              value={record.reportType}
              options={reportTypeSelectOptions}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  reportType: value,
                }))
              }
            />
            <FormSelect
              label="Location"
              required
              creatable
              value={record.location}
              options={locationSelectOptions}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  location: value,
                }))
              }
            />
            <FormDatePicker
              label="Date Observed"
              required
              value={record.dateTimeObserved}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  dateTimeObserved: value,
                }))
              }
            />
            <FormSelect
              label="Related Work Authorization"
              value={record.relatedWorkAuthorization}
              options={workAuthorizationSelectOptions}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  relatedWorkAuthorization: value,
                }))
              }
            />
          </div>
        }
      />

      <Card
        title="Incident / Hazard Details"
        description="Keep the first report easy to complete while still capturing severity and immediate action."
        content={
          <div className="mt-4 space-y-4">
            <FormTextarea
              label="Description"
              required
              value={record.description}
              disabled={!editable}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormSelect
                label="Severity Estimate"
                required
                value={record.severityEstimate}
                options={prioritySelectOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    severityEstimate:
                      value as IncidentHazardRecord["severityEstimate"],
                  }))
                }
              />
              <FormToggleGroup
                label="Was anyone injured?"
                required
                value={booleanToToggleValue(record.anyoneInjured)}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    anyoneInjured: toggleValueToBoolean(value),
                  }))
                }
              />
              <FormToggleGroup
                label="Was equipment/property damaged?"
                required
                value={booleanToToggleValue(record.propertyDamaged)}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    propertyDamaged: toggleValueToBoolean(value),
                  }))
                }
              />
            </div>

            <FormTextarea
              label="Immediate Action Taken"
              required
              value={record.immediateActionTaken}
              disabled={!editable}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  immediateActionTaken: event.target.value,
                }))
              }
            />

            <div className="space-y-3">
              <FormFileUpload
                label="Photos / Videos"
                disabled={!editable}
                hint="Mock upload only for this phase."
              />
              <AttachmentList files={record.photos} />
            </div>
          </div>
        }
      />

      {showReviewSections ? (
        <Card
          title="Review & Corrective Action"
          description="Supervisor and HSE can confirm severity and add follow-up actions where needed."
          content={
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormSelect
                  label="Confirmed Severity"
                  required
                  value={record.review.confirmedSeverity}
                  options={prioritySelectOptions}
                  disabled={!editable}
                  onValueChange={(value) =>
                    update((current) => ({
                      ...current,
                      review: {
                        ...current.review,
                        confirmedSeverity:
                          value as IncidentHazardRecord["review"]["confirmedSeverity"],
                      },
                    }))
                  }
                />
                <FormToggleGroup
                  label="Corrective Action Required?"
                  required
                  value={booleanToToggleValue(record.review.correctiveActionRequired)}
                  options={yesNoOptions}
                  disabled={!editable}
                  onValueChange={(value) =>
                    update((current) => ({
                      ...current,
                      review: {
                        ...current.review,
                        correctiveActionRequired: toggleValueToBoolean(value),
                        correctiveAction:
                          value === "yes" ? current.review.correctiveAction : "",
                        actionOwner:
                          value === "yes" ? current.review.actionOwner : "",
                        targetCompletionDate:
                          value === "yes"
                            ? current.review.targetCompletionDate
                            : "",
                      },
                    }))
                  }
                />
              </div>

              <FormTextarea
                label="Root Cause / Likely Cause"
                value={record.review.rootCause}
                disabled={!editable}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    review: {
                      ...current.review,
                      rootCause: event.target.value,
                    },
                  }))
                }
              />

              {record.review.correctiveActionRequired ? (
                <>
                  <FormTextarea
                    label="Corrective Action"
                    required
                    value={record.review.correctiveAction}
                    disabled={!editable}
                    onChange={(event) =>
                      update((current) => ({
                        ...current,
                        review: {
                          ...current.review,
                          correctiveAction: event.target.value,
                        },
                      }))
                    }
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormSelect
                      label="Action Owner"
                      required
                      value={record.review.actionOwner}
                      options={employeeOptions}
                      disabled={!editable}
                      onValueChange={(value) =>
                        update((current) => ({
                          ...current,
                          review: {
                            ...current.review,
                            actionOwner: value,
                          },
                        }))
                      }
                    />
                    <FormDatePicker
                      label="Target Completion Date"
                      required
                      value={record.review.targetCompletionDate}
                      disabled={!editable}
                      onValueChange={(value) =>
                        update((current) => ({
                          ...current,
                          review: {
                            ...current.review,
                            targetCompletionDate: value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <FormFileUpload
                      label="Completion Evidence"
                      disabled={!editable}
                      hint="Mock upload only for this phase."
                    />
                    <AttachmentList files={record.review.completionEvidence} />
                  </div>
                </>
              ) : null}
            </div>
          }
        />
      ) : null}
    </>
  );
}
