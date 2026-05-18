"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalTimeline from "@/components/approval/ApprovalTimeline";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FormFileUpload from "@/components/forms/FormFileUpload";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import PageHeader from "@/components/ui/PageHeader";
import {
  getDisplayReference,
  getWorkflowDetailFields,
  getWorkflowNarrative,
} from "@/components/safety/SafetyWorkflowListPage";
import {
  mockSafetyUsers,
  workflowSummaries,
  type ApprovalDecision,
  type MockSafetyUser,
  type SafetyWorkflowRole,
  type SafetyWorkflowRecord,
  type WorkAuthorizationRecord,
  type WorkflowFormKey,
} from "@/lib/safety-workflow-mocks";
import {
  fetchCurrentSafetyUser,
  fetchSafetyRequest,
} from "@/lib/safety-workflow-api";
import { formatDate } from "@/lib/utils";
import type { ApprovalStep, ApprovalStatus, DecisionStatus } from "@/types";

interface Props {
  formKey: WorkflowFormKey;
  requestId: string;
  backHref: string;
}

const inspectionDecisionOptions = [
  { value: "Pass", label: "Pass" },
  { value: "Fail", label: "Fail" },
  { value: "N/A", label: "N/A" },
];

const hseInspectionResultOptions = [
  { value: "Passed", label: "Passed" },
  { value: "Returned", label: "Returned" },
  { value: "Failed", label: "Failed" },
];

export default function SafetyWorkflowDetailPage({
  formKey,
  requestId,
  backHref,
}: Props) {
  const router = useRouter();
  const summary = workflowSummaries[formKey];
  const [currentRole, setCurrentRole] =
    useState<SafetyWorkflowRole>("requester");
  const [currentUser, setCurrentUser] = useState<MockSafetyUser>(
    mockSafetyUsers.requester
  );
  const [record, setRecord] = useState<SafetyWorkflowRecord | null>(null);
  const [hseInspection, setHseInspection] =
    useState<WorkAuthorizationRecord["hseInspection"]>(
      getBlankHseInspection()
    );

  useEffect(() => {
    let active = true;

    Promise.all([
      fetchCurrentSafetyUser(currentRole),
      fetchSafetyRequest(formKey, requestId),
    ]).then(([nextUser, nextRecord]) => {
      if (!active) return;
      setCurrentUser(nextUser);
      setRecord(nextRecord);
      setHseInspection(getInitialHseInspection(nextRecord));
    });

    return () => {
      active = false;
    };
  }, [currentRole, formKey, requestId]);

  const fields = record ? getWorkflowDetailFields(record) : [];
  const displayReference = record ? getDisplayReference(record) : "Loading request...";
  const showHseInspection =
    record?.formKey === "work_authorization" &&
    record.stage === "pending_approval" &&
    currentUser.workflowRole === "hse";

  return (
    <AppLayout pageTitle={summary.title}>
      <button
        onClick={() => router.push(backHref)}
        className="mb-5 flex items-center gap-2 text-sm text-brand-text-secondary transition-colors hover:text-brand-text-primary"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <PageHeader
        title={displayReference}
        description={summary.description}
        action={record ? <ApprovalBadge status={record.stage} /> : null}
        className="mb-6"
      />

      <RoleSwitcher
        currentRole={currentRole}
        currentUser={currentUser}
        onRoleChange={setCurrentRole}
      />

      {!record ? (
        <Card
          className="mt-6"
          title="Loading request..."
          description="Fetching the mock workflow record the same way the backend endpoint will later."
        />
      ) : (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-brand-border bg-white p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono text-brand-text-secondary">
                  {displayReference}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-brand-text-primary">
                  {getDetailTitle(record)}
                </h2>
              </div>
              <ApprovalBadge status={record.stage} />
            </div>

            <div className="grid gap-x-6 gap-y-4 text-sm md:grid-cols-2">
              {fields.map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-brand-text-secondary">{label}</p>
                  <p className="mt-1 font-medium text-brand-text-primary">
                    {value || "-"}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-brand-border pt-5">
              <p className="mb-1 text-xs text-brand-text-secondary">Details</p>
              <p className="text-sm leading-relaxed text-brand-text-primary">
                {getWorkflowNarrative(record)}
              </p>
            </div>
          </section>

          {showHseInspection ? (
            <section className="rounded-2xl border border-brand-border bg-white p-6">
              <HseInspectionFields
                inspection={hseInspection}
                onInspectionChange={setHseInspection}
                onSave={() => {
                  setHseInspection((current) => ({
                    ...current,
                  }));
                }}
              />
            </section>
          ) : null}

          <RequesterDetailsCard requester={record.requester} />

          <section className="rounded-2xl border border-brand-border bg-white p-6">
            <h3 className="mb-4 text-base font-semibold text-brand-text-primary">
              Activity
            </h3>
            <div className="space-y-3">
              {record.auditTrail.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-brand-border bg-gray-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-brand-text-primary">
                        {item.action}
                      </p>
                      <p className="mt-1 text-xs text-brand-text-secondary">
                        {item.actor} · {item.role}
                      </p>
                    </div>
                    <p className="text-xs text-brand-text-secondary">
                      {item.dateTime}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-brand-text-secondary">
                    {item.comment}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="rounded-2xl border border-brand-border bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-brand-text-primary">
            Approval Status
          </h3>
          <ApprovalTimeline steps={buildApprovalSteps(record)} />
          <WorkflowActionPanel
            currentUser={currentUser}
            record={record}
            className="mt-5"
          />
        </aside>
      </div>
      )}
    </AppLayout>
  );
}

function getDetailTitle(record: SafetyWorkflowRecord) {
  if (record.formKey === "work_authorization") return record.requestTitle;
  if (record.formKey === "work_close_out") return record.requestTitle;
  if (record.formKey === "regulatory_compliance") return record.complianceTitle;
  return `${record.reportType} - ${record.location}`;
}

function RoleSwitcher({
  currentRole,
  currentUser,
  onRoleChange,
}: {
  currentRole: SafetyWorkflowRole;
  currentUser: MockSafetyUser;
  onRoleChange: (role: SafetyWorkflowRole) => void;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-text-primary">
            Mock signed-in user
          </p>
          <p className="mt-1 text-sm text-brand-text-secondary">
            {currentUser.name} · {currentUser.role} · {currentUser.department}
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-brand-text-primary md:min-w-64">
          Demo role
          <select
            value={currentRole}
            onChange={(event) =>
              onRoleChange(event.target.value as SafetyWorkflowRole)
            }
            className="h-10 rounded-lg border border-brand-border bg-white px-3 text-sm text-brand-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-purple"
          >
            <option value="requester">Requester</option>
            <option value="supervisor">Supervisor</option>
            <option value="hse">HSE</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function RequesterDetailsCard({
  requester,
}: {
  requester: SafetyWorkflowRecord["requester"];
}) {
  const fields = [
    ["Requester Name", requester.name],
    ["Department", requester.department],
    ["Job Title / Role", requester.role],
    ["Request Date", formatDate(requester.requestDate)],
  ];

  return (
    <section className="rounded-2xl border border-brand-border bg-white p-6">
      <h3 className="mb-1 text-base font-semibold text-brand-text-primary">
        Requester Details
      </h3>
      <p className="mb-5 text-sm text-brand-text-secondary">
        Loaded from the mock profile API, mirroring the SharePoint form behavior.
      </p>
      <div className="grid gap-x-6 gap-y-4 text-sm md:grid-cols-2 xl:grid-cols-3">
        {fields.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-brand-text-secondary">{label}</p>
            <p className="mt-1 font-medium text-brand-text-primary">
              {value || "-"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkflowActionPanel({
  currentUser,
  record,
  className,
}: {
  currentUser: MockSafetyUser;
  record: SafetyWorkflowRecord;
  className?: string;
}) {
  const [decision, setDecision] = useState("");
  const [comment, setComment] = useState("");
  const isSupervisorTurn =
    currentUser.workflowRole === "supervisor" && record.stage === "submitted";
  const isHseTurn =
    currentUser.workflowRole === "hse" && record.stage === "pending_approval";
  const canAct = isSupervisorTurn || isHseTurn;
  const roleLabel =
    currentUser.workflowRole === "hse" ? "HSE Review" : "Supervisor Review";

  if (!canAct) {
    return (
      <div className={className}>
        <Card
          title="Current User Actions"
          description={getReadOnlyActionMessage(currentUser.workflowRole, record)}
          className="bg-gray-50 p-4"
          titleClassName="mt-0"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <Card
        title={roleLabel}
        description="Only this role sees the decision controls at this workflow stage."
        className="border-amber-200 bg-amber-50/60 p-4"
        titleClassName="mt-0"
        content={
          <div className="mt-4 space-y-4">
            <FormSelect
              label="Decision"
              required
              value={decision}
              options={[
                { value: "approve", label: "Approve" },
                { value: "return", label: "Return to Requester" },
                { value: "reject", label: "Reject" },
              ]}
              onValueChange={setDecision}
            />
            <FormTextarea
              label="Comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Add review notes for the audit trail"
            />
            <Button fullWidth disabled={!decision}>
              Submit Decision
            </Button>
          </div>
        }
      />
    </div>
  );
}

function HseInspectionFields({
  inspection,
  onInspectionChange,
  onSave,
}: {
  inspection: WorkAuthorizationRecord["hseInspection"];
  onInspectionChange: (
    inspection: WorkAuthorizationRecord["hseInspection"]
  ) => void;
  onSave: () => void;
}) {
  function updateInspection(
    updates: Partial<WorkAuthorizationRecord["hseInspection"]>
  ) {
    onInspectionChange({
      ...inspection,
      ...updates,
    });
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-text-primary">
            HSE Inspection Checklist
          </p>
          <p className="mt-1 text-sm text-brand-text-secondary">
            Complete these checks before submitting the final HSE decision.
          </p>
        </div>
        <Button variant="secondary" onClick={onSave}>
          Save Inspection
        </Button>
      </div>

      <div className="mt-4 grid gap-4">
        <FormSelect
          label="Work area is safe, clean, and accessible"
          required
          value={inspection.workAreaSafe}
          options={inspectionDecisionOptions}
          onValueChange={(value) =>
            updateInspection({
              workAreaSafe:
                value as WorkAuthorizationRecord["hseInspection"]["workAreaSafe"],
            })
          }
        />
        <FormSelect
          label="Fire extinguisher/emergency equipment is available"
          required
          value={inspection.emergencyEquipmentAvailable}
          options={inspectionDecisionOptions}
          onValueChange={(value) =>
            updateInspection({
              emergencyEquipmentAvailable:
                value as WorkAuthorizationRecord["hseInspection"]["emergencyEquipmentAvailable"],
            })
          }
        />
        <FormSelect
          label="Gas leak/pressure/abnormal condition check completed"
          required
          value={inspection.gasPressureCheckCompleted}
          options={inspectionDecisionOptions}
          onValueChange={(value) =>
            updateInspection({
              gasPressureCheckCompleted:
                value as WorkAuthorizationRecord["hseInspection"]["gasPressureCheckCompleted"],
            })
          }
        />
        <FormSelect
          label="Required PPE and safety kits are available"
          required
          value={inspection.ppeAndSafetyKitsAvailable}
          options={inspectionDecisionOptions}
          onValueChange={(value) =>
            updateInspection({
              ppeAndSafetyKitsAvailable:
                value as WorkAuthorizationRecord["hseInspection"]["ppeAndSafetyKitsAvailable"],
            })
          }
        />
        <FormSelect
          label="Tools/equipment are safe and suitable for the job"
          required
          value={inspection.toolsSafe}
          options={inspectionDecisionOptions}
          onValueChange={(value) =>
            updateInspection({
              toolsSafe:
                value as WorkAuthorizationRecord["hseInspection"]["toolsSafe"],
            })
          }
        />
        <FormTextarea
          label="HSE inspection comments"
          value={inspection.comments}
          onChange={(event) =>
            updateInspection({
              comments: event.target.value,
            })
          }
        />
        <FormFileUpload
          label="HSE inspection photo/evidence"
          hint="Mock upload only for this phase."
          multiple
          accept="image/*"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            updateInspection({
              evidence: files.map((file) => file.name),
            });
          }}
        />
        {inspection.evidence.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {inspection.evidence.map((file) => (
              <span
                key={file}
                className="rounded-full bg-brand-purple-faint px-3 py-1 text-xs font-medium text-brand-purple"
              >
                {file}
              </span>
            ))}
          </div>
        ) : null}
        <FormSelect
          label="HSE inspection result"
          required
          value={inspection.result}
          options={hseInspectionResultOptions}
          onValueChange={(value) =>
            updateInspection({
              result:
                value as WorkAuthorizationRecord["hseInspection"]["result"],
            })
          }
        />
      </div>
    </div>
  );
}

function getInitialHseInspection(record: SafetyWorkflowRecord) {
  if (record.formKey === "work_authorization") {
    return record.hseInspection;
  }

  return getBlankHseInspection();
}

function getBlankHseInspection() {
  return {
    workAreaSafe: "",
    emergencyEquipmentAvailable: "",
    gasPressureCheckCompleted: "",
    ppeAndSafetyKitsAvailable: "",
    toolsSafe: "",
    comments: "",
    result: "",
    evidence: [],
  } satisfies WorkAuthorizationRecord["hseInspection"];
}

function getReadOnlyActionMessage(
  role: SafetyWorkflowRole,
  record: SafetyWorkflowRecord
) {
  if (role === "requester") {
    if (record.stage === "approved") return "Your request has completed the approval route.";
    return "Requester can view progress here. Decision fields are hidden until a reviewer signs in.";
  }

  if (role === "supervisor") {
    if (record.stage === "submitted") return "Supervisor review is ready.";
    if (record.stage === "draft") return "This request has not been submitted yet.";
    return "Supervisor review is already complete or no longer required at this stage.";
  }

  if (record.stage === "pending_approval") return "HSE review is ready.";
  if (record.stage === "submitted") return "Waiting for supervisor approval before HSE can act.";
  if (record.stage === "approved") return "HSE approval is complete.";
  return "No HSE action is available yet.";
}

function buildApprovalSteps(record: SafetyWorkflowRecord): ApprovalStep[] {
  const supervisorDone =
    record.stage === "pending_approval" || record.stage === "approved";
  const hseDone = record.stage === "approved";

  return [
    {
      id: `${record.reference}-supervisor`,
          request_id: record.reference,
      step_number: 1,
      step_type: "individual",
      group_rule: null,
      status: supervisorDone
        ? mapDecisionToApprovalStatus(record.approvals.supervisor.decision)
        : record.stage === "submitted"
          ? "in_progress"
          : "pending",
      completed_at: record.approvals.supervisor.dateTime || null,
      assignees: [
        {
          id: `${record.reference}-supervisor-assignee`,
          step_id: `${record.reference}-supervisor`,
          user_id: "EMP-002",
          user_name: record.approvals.supervisor.name,
          decision: supervisorDone
            ? mapDecisionToDecisionStatus(record.approvals.supervisor.decision)
            : "pending",
          decided_at: record.approvals.supervisor.dateTime || null,
          comment: record.approvals.supervisor.comment || null,
        },
      ],
    },
    {
      id: `${record.reference}-hse`,
      request_id: record.reference,
      step_number: 2,
      step_type: "individual",
      group_rule: null,
      status: hseDone
        ? mapDecisionToApprovalStatus(record.approvals.hse.decision)
        : record.stage === "pending_approval"
          ? "in_progress"
          : "pending",
      completed_at: record.approvals.hse.dateTime || null,
      assignees: [
        {
          id: `${record.reference}-hse-assignee`,
          step_id: `${record.reference}-hse`,
          user_id: "EMP-003",
          user_name: record.approvals.hse.name,
          decision: hseDone
            ? mapDecisionToDecisionStatus(record.approvals.hse.decision)
            : "pending",
          decided_at: record.approvals.hse.dateTime || null,
          comment: record.approvals.hse.comment || null,
        },
      ],
    },
  ];
}

function mapDecisionToApprovalStatus(decision: ApprovalDecision): ApprovalStatus {
  if (decision === "Approve") return "approved";
  if (decision === "Return") return "returned";
  if (decision === "Reject") return "rejected";
  return "pending";
}

function mapDecisionToDecisionStatus(decision: ApprovalDecision): DecisionStatus {
  if (decision === "Approve") return "approved";
  if (decision === "Return") return "returned";
  if (decision === "Reject") return "rejected";
  return "pending";
}
