"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  FileStack,
  ShieldCheck,
  Sparkles,
  Workflow,
  Wrench,
} from "lucide-react";
import type { Column } from "@/components/ui/DataTable";
import type { ApprovalStep, ApprovalStatus, DecisionStatus } from "@/types";
import type {
  AuditTrailItem,
  DraftWorkflowRecords,
  IncidentHazardRecord,
  RegulatoryComplianceRecord,
  SafetyWorkflowRecord,
  WorkAuthorizationRecord,
  WorkCloseOutRecord,
  WorkflowApprovals,
  WorkflowFormKey,
  WorkflowStage,
} from "@/lib/safety-workflow-mocks";
import {
  complianceCategoryOptions,
  contractorOptions,
  createInitialDraftForms,
  departmentOptions,
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
  workflowScenarios,
  workflowStageLabels,
  workflowSummaries,
} from "@/lib/safety-workflow-mocks";
import { formatDate, formatDateTime } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalTimeline from "@/components/approval/ApprovalTimeline";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import FormFileUpload from "@/components/forms/FormFileUpload";
import FormInput from "@/components/forms/FormInput";
import FormMultiSelect from "@/components/forms/FormMultiSelect";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormToggleGroup from "@/components/forms/FormToggleGroup";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import ReadOnlyField from "@/components/ui/ReadOnlyField";
import StatCard from "@/components/ui/StatCard";
import StatusStepper from "@/components/ui/StatusStepper";

const formIcons: Record<WorkflowFormKey, LucideIcon> = {
  work_authorization: ShieldCheck,
  work_close_out: ClipboardCheck,
  regulatory_compliance: FileSearch,
  incident_hazard: AlertTriangle,
};

const stageOptions = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "pending_approval", label: "Pending Approval" },
  { key: "approved", label: "Approved" },
] as const;

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const yesNoNaOptions = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "N/A", label: "N/A" },
];

const inspectionOptions = [
  { value: "Pass", label: "Pass" },
  { value: "Fail", label: "Fail" },
  { value: "N/A", label: "N/A" },
];

const hseInspectionResultOptions = [
  { value: "Passed", label: "Passed" },
  { value: "Returned", label: "Returned" },
  { value: "Failed", label: "Failed" },
];

const employeeOptions = employeeLookup.map((employee) => ({
  value: employee.name,
  label: employee.name,
}));

const departmentSelectOptions = departmentOptions.map((department) => ({
  value: department,
  label: department,
}));

const locationSelectOptions = workLocationOptions.map((location) => ({
  value: location,
  label: location,
}));

const workCategorySelectOptions = workCategoryOptions.map((category) => ({
  value: category,
  label: category,
}));

const toolsEquipmentSelectOptions = toolsEquipmentOptions.map((tool) => ({
  value: tool,
  label: tool,
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

const evidenceRequiredSelectOptions = evidenceRequiredOptions.map((item) => ({
  value: item,
  label: item,
}));

const reportTypeSelectOptions = reportTypeOptions.map((item) => ({
  value: item,
  label: item,
}));

const workAuthorizationSelectOptions = workAuthorizationLookup.map((item) => ({
  value: item.id,
  label: `${item.id} - ${item.title}`,
}));

const auditTrailColumns: Column<AuditTrailItem>[] = [
  { key: "action", label: "Action" },
  { key: "actor", label: "Actor" },
  { key: "role", label: "Role" },
  {
    key: "dateTime",
    label: "Date/Time",
    render: (value) => formatDateTime(String(value)),
  },
  { key: "comment", label: "Comment" },
];

export default function SafetyWorkflowWorkspace() {
  const [selectedForm, setSelectedForm] =
    useState<WorkflowFormKey>("work_authorization");
  const [selectedStage, setSelectedStage] = useState<WorkflowStage>("draft");
  const [draftForms, setDraftForms] =
    useState<DraftWorkflowRecords>(createInitialDraftForms);

  const currentRecord =
    selectedStage === "draft"
      ? draftForms[selectedForm]
      : workflowScenarios[selectedForm][selectedStage];
  const currentSummary = workflowSummaries[selectedForm];
  const CurrentIcon = formIcons[selectedForm];
  const editable = selectedStage === "draft";

  function updateDraftRecord<K extends WorkflowFormKey>(
    formKey: K,
    updater: (record: DraftWorkflowRecords[K]) => DraftWorkflowRecords[K]
  ) {
    setDraftForms((current) => ({
      ...current,
      [formKey]: updater(current[formKey]),
    }));
  }

  function resetDrafts() {
    setDraftForms(createInitialDraftForms());
    setSelectedStage("draft");
  }

  return (
    <AppLayout pageTitle="Safety & Compliance">
      <PageHeader
        title="Safety & Compliance Workflows"
        description="Design-only HSE workflow forms built on reusable UI primitives, with mock state transitions and no backend behavior yet."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" href="/safety/demo">
              Open UI Demo
            </Button>
            <Button variant="secondary" onClick={resetDrafts}>
              Reset Draft Mock
            </Button>
          </div>
        }
        className="mb-6"
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Workflow Forms"
            value="4"
            subtitle="Authorization, close-out, compliance, and incident reporting"
            icon={FileStack}
          />
          <StatCard
            label="Approval Route"
            value="2-step"
            subtitle="Supervisor approval followed by HSE approval"
            icon={Workflow}
          />
          <StatCard
            label="New Reusables"
            value="5"
            subtitle="Only the missing building blocks were added for the spec"
            icon={Wrench}
          />
          <StatCard
            label="Current View"
            value={workflowStageLabels[selectedStage]}
            subtitle={currentSummary.title}
            icon={CheckCircle2}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
          <div className="space-y-4">
            <Card
              title="Workflow Forms"
              description="Pick a form to review its mock layout, approval route, and status-driven UI."
              content={
                <div className="mt-4 space-y-3">
                  {(
                    Object.keys(workflowSummaries) as WorkflowFormKey[]
                  ).map((formKey) => {
                    const Icon = formIcons[formKey];
                    const summary = workflowSummaries[formKey];
                    const active = selectedForm === formKey;

                    return (
                      <button
                        key={formKey}
                        type="button"
                        onClick={() => setSelectedForm(formKey)}
                        className={[
                          "w-full rounded-2xl border p-4 text-left transition-colors",
                          active
                            ? "border-brand-purple bg-brand-purple-faint"
                            : "border-brand-border bg-white hover:border-brand-purple/40 hover:bg-gray-50",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-brand-purple-faint p-2 text-brand-purple">
                              <Icon size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-brand-text-primary">
                                {summary.title}
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-brand-text-secondary">
                                {summary.description}
                              </p>
                            </div>
                          </div>
                          {active ? (
                            <ApprovalBadge status={selectedStage} className="shrink-0" />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              }
            />

            <Card
              title="Mock States"
              description="Draft is editable for illustration. Submitted and later states lock the fields and show the mock approval flow."
              content={
                <div className="mt-4 space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    {stageOptions.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setSelectedStage(option.key)}
                        className={[
                          "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                          selectedStage === option.key
                            ? "border-brand-purple bg-brand-purple text-white"
                            : "border-brand-border bg-white text-brand-text-secondary hover:bg-gray-50 hover:text-brand-text-primary",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-dashed border-brand-border bg-gray-50 p-4">
                    <p className="text-sm font-medium text-brand-text-primary">
                      Design phase note
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">
                      The page stays intentionally front-end only. The stage
                      switcher, attachment areas, and approval panels are there
                      to make the flow concrete without pretending the API or
                      workflow engine already exists.
                    </p>
                  </div>
                </div>
              }
            />
          </div>

          <div className="space-y-4">
            <Card
              title={currentSummary.title}
              description={currentSummary.description}
              icon={<CurrentIcon size={20} />}
              action={<ApprovalBadge status={selectedStage} />}
              content={
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <ReadOnlyField
                      label={currentSummary.referenceLabel}
                      value={currentRecord.reference}
                    />
                    <ReadOnlyField
                      label="Module Flow"
                      value="Supervisor Approval -> HSE Approval"
                    />
                    <ReadOnlyField
                      label="Mock Mode"
                      value={editable ? "Editable draft preview" : "Read-only status preview"}
                    />
                    <ReadOnlyField
                      label="Requester"
                      value={currentRecord.requester.name}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-brand-purple-faint px-3 py-1 font-medium text-brand-purple">
                      Reusables first
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-brand-text-secondary">
                      Mock audit trail
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-brand-text-secondary">
                      Mock approval timeline
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-brand-text-secondary">
                      Conditional fields
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-brand-text-secondary">
                    {currentSummary.note}
                  </p>
                </div>
              }
            />

            <Card
              title="Status Progress"
              description="Shared workflow progression used across all HSE forms."
              content={
                <div className="mt-4">
                  <StatusStepper
                    steps={stageOptions.map((option) => ({
                      key: option.key,
                      label: option.label,
                    }))}
                    currentStep={selectedStage}
                  />
                </div>
              }
            />

            <SummarySnapshotCard record={currentRecord} />

            {selectedForm === "work_authorization"
              ? renderWorkAuthorization(
                  currentRecord as WorkAuthorizationRecord,
                  editable,
                  (updater) =>
                    updateDraftRecord("work_authorization", updater)
                )
              : null}

            {selectedForm === "work_close_out"
              ? renderWorkCloseOut(
                  currentRecord as WorkCloseOutRecord,
                  editable,
                  (updater) => updateDraftRecord("work_close_out", updater)
                )
              : null}

            {selectedForm === "regulatory_compliance"
              ? renderRegulatoryCompliance(
                  currentRecord as RegulatoryComplianceRecord,
                  editable,
                  (updater) =>
                    updateDraftRecord("regulatory_compliance", updater)
                )
              : null}

            {selectedForm === "incident_hazard"
              ? renderIncidentHazard(
                  currentRecord as IncidentHazardRecord,
                  editable,
                  (updater) => updateDraftRecord("incident_hazard", updater)
                )
              : null}

            <ApprovalSection
              stage={selectedStage}
              approvals={currentRecord.approvals}
            />

            <Card
              title="Audit Trail"
              description="Mock activity captured for the selected form and state."
              content={
                <div className="mt-4">
                  <DataTable columns={auditTrailColumns} data={currentRecord.auditTrail} />
                </div>
              }
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function SummarySnapshotCard({ record }: { record: SafetyWorkflowRecord }) {
  const fields = getSummarySnapshotFields(record);

  return (
    <Card
      title="Submission Snapshot"
      description="A compact preview of the most important values for the current mock state."
      icon={<Sparkles size={20} />}
      content={
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {fields.map((field) => (
            <ReadOnlyField key={field.label} label={field.label} value={field.value} />
          ))}
        </div>
      }
    />
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
      description="Auto-filled mock employee data for this design phase."
      content={
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ReadOnlyField label="Requester Name" value={requester.name} />
          <ReadOnlyField label="Employee ID" value={requester.employeeId} />
          <ReadOnlyField label="Department" value={requester.department} />
          <ReadOnlyField label="Job Title / Role" value={requester.role} />
          <ReadOnlyField label="Email" value={requester.email} />
          <ReadOnlyField label="Phone / Extension" value={requester.phone} />
          <ReadOnlyField
            label="Request Date"
            value={formatDate(requester.requestDate)}
            className="md:col-span-2 xl:col-span-3"
          />
        </div>
      }
    />
  );
}

function ApprovalSection({
  stage,
  approvals,
}: {
  stage: WorkflowStage;
  approvals: WorkflowApprovals;
}) {
  const steps = buildApprovalSteps(stage, approvals);

  return (
    <Card
      title="Approver Section"
      description="Two-level mock approval route shared across every HSE workflow."
      content={
        <div className="mt-4 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <ApprovalBadge status={stage} />
            <span className="text-sm text-brand-text-secondary">
              Supervisor Approval -&gt; HSE Approval
            </span>
          </div>

          <ApprovalTimeline steps={steps} />

          <div className="grid gap-4 lg:grid-cols-2">
            {(
              [
                ["supervisor", "Supervisor"],
                ["hse", "HSE"],
              ] as const
            ).map(([roleKey, roleLabel]) => {
              const actor = approvals[roleKey];

              return (
                <div
                  key={roleKey}
                  className="rounded-2xl border border-brand-border bg-gray-50/60 p-4"
                >
                  <p className="text-sm font-semibold text-brand-text-primary">
                    {roleLabel} Approval
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <ReadOnlyField label="Approver" value={actor.name} />
                    <ReadOnlyField label="Decision" value={actor.decision} />
                    <ReadOnlyField
                      label="Approval Date"
                      value={actor.dateTime ? formatDateTime(actor.dateTime) : "Pending"}
                    />
                    <ReadOnlyField
                      label="Comment"
                      value={actor.comment || "Awaiting review"}
                      className="sm:col-span-2"
                    />
                  </div>
                </div>
              );
            })}
          </div>
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

function renderWorkAuthorization(
  record: WorkAuthorizationRecord,
  editable: boolean,
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
              label="Request Title"
              required
              value={record.requestTitle}
              disabled={!editable}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  requestTitle: event.target.value,
                }))
              }
            />
            <ReadOnlyField label="Request Reference" value={record.reference} />
            <FormSelect
              label="Department"
              required
              value={record.department}
              options={departmentSelectOptions}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  department: value,
                }))
              }
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
            <FormDateTimeInput
              label="Expected Start Date/Time"
              required
              value={record.expectedStartDateTime}
              disabled={!editable}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  expectedStartDateTime: event.target.value,
                }))
              }
            />
            <FormDateTimeInput
              label="Expected End Date/Time"
              required
              value={record.expectedEndDateTime}
              disabled={!editable}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  expectedEndDateTime: event.target.value,
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
              <FormMultiSelect
                label="Work Category"
                required
                creatable
                value={record.workCategories}
                options={workCategorySelectOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    workCategories: value,
                  }))
                }
              />
              <FormMultiSelect
                label="Workers Involved"
                required
                value={record.workersInvolved}
                options={employeeOptions}
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
                value={record.contractorInvolved ? "yes" : "no"}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    contractorInvolved: value === "yes",
                    contractorName: value === "yes" ? current.contractorName : "",
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
              <FormMultiSelect
                label="Tools/Equipment To Be Used"
                required
                creatable
                value={record.toolsEquipment}
                options={toolsEquipmentSelectOptions}
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
                value={record.riskTriggers.gasInvolved ? "yes" : "no"}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    riskTriggers: {
                      ...current.riskTriggers,
                      gasInvolved: value === "yes",
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Is a pressurized system involved?"
                required
                value={record.riskTriggers.pressurizedSystem ? "yes" : "no"}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    riskTriggers: {
                      ...current.riskTriggers,
                      pressurizedSystem: value === "yes",
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Will there be heat, sparks, welding, cutting, or grinding?"
                required
                value={record.riskTriggers.heatOrSparks ? "yes" : "no"}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    riskTriggers: {
                      ...current.riskTriggers,
                      heatOrSparks: value === "yes",
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Is electrical isolation required?"
                required
                value={record.riskTriggers.electricalIsolation ? "yes" : "no"}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    riskTriggers: {
                      ...current.riskTriggers,
                      electricalIsolation: value === "yes",
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Is lifting/heavy equipment involved?"
                required
                value={record.riskTriggers.liftingEquipment ? "yes" : "no"}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    riskTriggers: {
                      ...current.riskTriggers,
                      liftingEquipment: value === "yes",
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Are all required PPE available?"
                required
                value={record.riskTriggers.ppeAvailable ? "yes" : "no"}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    riskTriggers: {
                      ...current.riskTriggers,
                      ppeAvailable: value === "yes",
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

      <Card
        title="HSE Inspection"
        description="Only the most important pre-work checks are shown in this first pass."
        content={
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <FormToggleGroup
                label="Work area is safe, clean, and accessible"
                required
                value={record.hseInspection.workAreaSafe}
                options={inspectionOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    hseInspection: {
                      ...current.hseInspection,
                      workAreaSafe: value as WorkAuthorizationRecord["hseInspection"]["workAreaSafe"],
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Fire extinguisher/emergency equipment is available"
                required
                value={record.hseInspection.emergencyEquipmentAvailable}
                options={inspectionOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    hseInspection: {
                      ...current.hseInspection,
                      emergencyEquipmentAvailable:
                        value as WorkAuthorizationRecord["hseInspection"]["emergencyEquipmentAvailable"],
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Gas leak/pressure/abnormal condition check completed"
                required
                value={record.hseInspection.gasPressureCheckCompleted}
                options={inspectionOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    hseInspection: {
                      ...current.hseInspection,
                      gasPressureCheckCompleted:
                        value as WorkAuthorizationRecord["hseInspection"]["gasPressureCheckCompleted"],
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Required PPE and safety kits are available"
                required
                value={record.hseInspection.ppeAndSafetyKitsAvailable}
                options={inspectionOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    hseInspection: {
                      ...current.hseInspection,
                      ppeAndSafetyKitsAvailable:
                        value as WorkAuthorizationRecord["hseInspection"]["ppeAndSafetyKitsAvailable"],
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Tools/equipment are safe and suitable for the job"
                required
                value={record.hseInspection.toolsSafe}
                options={inspectionOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    hseInspection: {
                      ...current.hseInspection,
                      toolsSafe: value as WorkAuthorizationRecord["hseInspection"]["toolsSafe"],
                    },
                  }))
                }
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
                      result: value as WorkAuthorizationRecord["hseInspection"]["result"],
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
            <ReadOnlyField
              label="Work Authorization Reference"
              value={record.workAuthorizationReference}
            />
            <ReadOnlyField label="Close-Out Reference" value={record.reference} />
            <ReadOnlyField label="Request Title" value={record.requestTitle} />
            <ReadOnlyField label="Department" value={record.department} />
            <ReadOnlyField label="Work Location" value={record.workLocation} />
            <ReadOnlyField
              label="Approved Start"
              value={formatDateTime(record.approvedStartDateTime)}
            />
            <ReadOnlyField
              label="Approved End"
              value={formatDateTime(record.approvedEndDateTime)}
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
              <FormDateTimeInput
                label="Actual Start Date/Time"
                required
                value={record.actualStartDateTime}
                disabled={!editable}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    actualStartDateTime: event.target.value,
                  }))
                }
              />
              <FormDateTimeInput
                label="Actual Completion Date/Time"
                required
                value={record.actualCompletionDateTime}
                disabled={!editable}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    actualCompletionDateTime: event.target.value,
                  }))
                }
              />
            </div>

            <FormToggleGroup
              label="Was the work completed as approved?"
              required
              value={record.completedAsApproved ? "yes" : "no"}
              options={yesNoOptions}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  completedAsApproved: value === "yes",
                  explanationForChange:
                    value === "yes" ? current.explanationForChange : "",
                }))
              }
            />

            {!record.completedAsApproved ? (
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
              value={record.incidentObserved ? "yes" : "no"}
              options={yesNoOptions}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  incidentObserved: value === "yes",
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
                value={record.monitoring.monitoredDuringExecution ? "yes" : "no"}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    monitoring: {
                      ...current.monitoring,
                      monitoredDuringExecution: value === "yes",
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Work stayed within the approved scope"
                required
                value={record.monitoring.stayedWithinScope ? "yes" : "no"}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    monitoring: {
                      ...current.monitoring,
                      stayedWithinScope: value === "yes",
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Required PPE and safety controls were maintained"
                required
                value={record.monitoring.ppeAndControlsMaintained ? "yes" : "no"}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    monitoring: {
                      ...current.monitoring,
                      ppeAndControlsMaintained: value === "yes",
                    },
                  }))
                }
              />
              <FormToggleGroup
                label="Any unsafe condition was reported or addressed"
                required
                value={record.monitoring.unsafeConditionReportedOrAddressed}
                options={yesNoNaOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    monitoring: {
                      ...current.monitoring,
                      unsafeConditionReportedOrAddressed:
                        value as WorkCloseOutRecord["monitoring"]["unsafeConditionReportedOrAddressed"],
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
            <ReadOnlyField label="Compliance Reference" value={record.reference} />
            <FormSelect
              label="Department"
              required
              value={record.department}
              options={departmentSelectOptions}
              disabled={!editable}
              onValueChange={(value) =>
                update((current) => ({
                  ...current,
                  department: value,
                }))
              }
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

            <FormMultiSelect
              label="Evidence Required"
              required
              creatable
              value={record.evidenceRequired}
              options={evidenceRequiredSelectOptions}
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
            <ReadOnlyField label="Report Reference" value={record.reference} />
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
            <FormDateTimeInput
              label="Date/Time Observed"
              required
              value={record.dateTimeObserved}
              disabled={!editable}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  dateTimeObserved: event.target.value,
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
                value={record.anyoneInjured ? "yes" : "no"}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    anyoneInjured: value === "yes",
                  }))
                }
              />
              <FormToggleGroup
                label="Was equipment/property damaged?"
                required
                value={record.propertyDamaged ? "yes" : "no"}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    propertyDamaged: value === "yes",
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
                value={record.review.correctiveActionRequired ? "yes" : "no"}
                options={yesNoOptions}
                disabled={!editable}
                onValueChange={(value) =>
                  update((current) => ({
                    ...current,
                    review: {
                      ...current.review,
                      correctiveActionRequired: value === "yes",
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
    </>
  );
}

function buildApprovalSteps(
  stage: WorkflowStage,
  approvals: WorkflowApprovals
): ApprovalStep[] {
  const supervisorStatus =
    stage === "draft"
      ? "draft"
      : stage === "submitted"
        ? "in_progress"
        : mapDecisionToApprovalStatus(approvals.supervisor.decision);

  const hseStatus =
    stage === "draft"
      ? "draft"
      : stage === "submitted"
        ? "pending"
        : stage === "pending_approval"
          ? "in_progress"
          : mapDecisionToApprovalStatus(approvals.hse.decision);

  return [
    {
      id: "approval-step-supervisor",
      request_id: "mock-request",
      step_number: 1,
      step_type: "individual",
      group_rule: null,
      status: supervisorStatus,
      completed_at: approvals.supervisor.dateTime || null,
      assignees: [
        {
          id: "approval-assignee-supervisor",
          step_id: "approval-step-supervisor",
          user_id: "EMP-002",
          user_name: approvals.supervisor.name,
          decision: mapDecisionToDecisionStatus(approvals.supervisor.decision),
          decided_at: approvals.supervisor.dateTime || null,
          comment: approvals.supervisor.comment || null,
        },
      ],
    },
    {
      id: "approval-step-hse",
      request_id: "mock-request",
      step_number: 2,
      step_type: "individual",
      group_rule: null,
      status: hseStatus,
      completed_at: approvals.hse.dateTime || null,
      assignees: [
        {
          id: "approval-assignee-hse",
          step_id: "approval-step-hse",
          user_id: "EMP-003",
          user_name: approvals.hse.name,
          decision: mapDecisionToDecisionStatus(approvals.hse.decision),
          decided_at: approvals.hse.dateTime || null,
          comment: approvals.hse.comment || null,
        },
      ],
    },
  ];
}

function mapDecisionToApprovalStatus(decision: string): ApprovalStatus {
  if (decision === "Approve") return "approved";
  if (decision === "Return") return "returned";
  if (decision === "Reject") return "rejected";
  return "pending";
}

function mapDecisionToDecisionStatus(decision: string): DecisionStatus {
  if (decision === "Approve") return "approved";
  if (decision === "Return") return "returned";
  if (decision === "Reject") return "rejected";
  return "pending";
}

function getSummarySnapshotFields(record: SafetyWorkflowRecord) {
  if (record.formKey === "work_authorization") {
    return [
      { label: "Department", value: record.department },
      { label: "Location", value: record.workLocation },
      { label: "Crew Size", value: `${record.workersInvolved.length} workers` },
      {
        label: "HSE Result",
        value: record.hseInspection.result,
      },
    ];
  }

  if (record.formKey === "work_close_out") {
    return [
      { label: "Work Reference", value: record.workAuthorizationReference },
      { label: "Location", value: record.workLocation },
      {
        label: "Completed As Approved",
        value: record.completedAsApproved ? "Yes" : "No",
      },
      {
        label: "Incidents Observed",
        value: record.incidentObserved ? "Yes" : "No",
      },
    ];
  }

  if (record.formKey === "regulatory_compliance") {
    return [
      { label: "Department", value: record.department },
      { label: "Responsible Person", value: record.responsiblePerson },
      { label: "Due Date", value: formatDate(record.dueDate) },
      { label: "Priority", value: record.priority },
    ];
  }

  return [
    { label: "Report Type", value: record.reportType },
    { label: "Location", value: record.location },
    { label: "Severity", value: record.severityEstimate },
    {
      label: "Related Work Auth",
      value: record.relatedWorkAuthorization || "None linked",
    },
  ];
}
