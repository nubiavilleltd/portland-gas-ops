"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import PageHeader from "@/components/ui/PageHeader";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import {
  workflowStageLabels,
  workflowSummaries,
  type SafetyWorkflowRecord,
  type WorkflowFormKey,
  type WorkflowStage,
} from "@/lib/safety-workflow-mocks";
import { fetchSafetyRequests } from "@/lib/safety-workflow-api";
import { formatDate, formatDateTime } from "@/lib/utils";

interface Props {
  formKey: WorkflowFormKey;
  baseHref: string;
}

interface WorkflowRow {
  id: string;
  reference: string;
  title: string;
  department: string;
  requester: string;
  date: string;
  status: string;
}

const columns: Column<WorkflowRow>[] = [
  { key: "reference", label: "Reference" },
  { key: "title", label: "Request" },
  { key: "department", label: "Department" },
  { key: "requester", label: "Requester" },
  { key: "date", label: "Date", render: (value) => formatDate(String(value)) },
  {
    key: "status",
    label: "Status",
    render: (value) => <ApprovalBadge status={String(value)} />,
  },
];

export default function SafetyWorkflowListPage({ formKey, baseHref }: Props) {
  const summary = workflowSummaries[formKey];
  const [records, setRecords] = useState<SafetyWorkflowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const rows = records.map((record) => toWorkflowRow(record));

  useEffect(() => {
    let active = true;

    fetchSafetyRequests(formKey).then((nextRecords) => {
      if (!active) return;
      setRecords(nextRecords);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [formKey]);

  return (
    <AppLayout pageTitle={summary.title}>
      <PageHeader
        title={summary.title}
        description={summary.description}
        action={
          <Button href={`${baseHref}/new`} leftIcon={<Plus size={16} />}>
            New Request
          </Button>
        }
        className="mb-6"
      />

      <DataTable
        columns={columns}
        data={rows}
        rowHref={(row) => `${baseHref}/${row.id}`}
        emptyMessage={loading ? "Loading requests..." : "No requests found."}
      />
    </AppLayout>
  );
}

function toWorkflowRow(record: SafetyWorkflowRecord): WorkflowRow {
  return {
    id: record.stage,
    reference: getDisplayReference(record),
    title: getRecordTitle(record),
    department: getRecordDepartment(record),
    requester: record.requester.name,
    date: record.requester.requestDate,
    status: record.stage,
  };
}

export function getDisplayReference(record: SafetyWorkflowRecord) {
  const stageNumber: Record<WorkflowStage, string> = {
    draft: "0001",
    submitted: "0002",
    pending_approval: "0003",
    approved: "0004",
  };

  return record.reference.replace(/\d{4}$/, stageNumber[record.stage]);
}

function getRecordTitle(record: SafetyWorkflowRecord) {
  if (record.formKey === "work_authorization") return record.requestTitle;
  if (record.formKey === "work_close_out") return record.requestTitle;
  if (record.formKey === "regulatory_compliance") return record.complianceTitle;
  return `${record.reportType} - ${record.location}`;
}

function getRecordDepartment(record: SafetyWorkflowRecord) {
  if (record.formKey === "incident_hazard") return record.requester.department;
  return record.department;
}

export function getWorkflowDetailFields(record: SafetyWorkflowRecord) {
  const baseFields = [
    ["Reference", getDisplayReference(record)],
    ["Status", workflowStageLabels[record.stage]],
    ["Requester", record.requester.name],
    ["Request Date", formatDate(record.requester.requestDate)],
  ];

  if (record.formKey === "work_authorization") {
    return [
      ...baseFields,
      ["Title", record.requestTitle],
      ["Department", record.department],
      ["Supervisor", record.supervisor],
      ["Work Location", record.workLocation],
      ["Expected Start", formatDateTime(record.expectedStartDateTime)],
      ["Expected End", formatDateTime(record.expectedEndDateTime)],
      ["Workers", record.workersInvolved.join(", ")],
      ["Tools/Equipment", record.toolsEquipment.join(", ")],
    ];
  }

  if (record.formKey === "work_close_out") {
    return [
      ...baseFields,
      ["Work Authorization", record.workAuthorizationReference],
      ["Title", record.requestTitle],
      ["Department", record.department],
      ["Work Location", record.workLocation],
      ["Actual Start", formatDateTime(record.actualStartDateTime)],
      ["Actual Completion", formatDateTime(record.actualCompletionDateTime)],
      ["Completed As Approved", record.completedAsApproved ? "Yes" : "No"],
      ["Incident Observed", record.incidentObserved ? "Yes" : "No"],
    ];
  }

  if (record.formKey === "regulatory_compliance") {
    return [
      ...baseFields,
      ["Title", record.complianceTitle],
      ["Department", record.department],
      ["Responsible Person", record.responsiblePerson],
      ["Due Date", formatDate(record.dueDate)],
      ["Priority", record.priority],
      ["Category", record.complianceCategory],
      ["Frequency", record.frequency],
      ["Evidence Required", record.evidenceRequired.join(", ")],
    ];
  }

  return [
    ...baseFields,
    ["Report Type", record.reportType],
    ["Location", record.location],
    ["Observed", formatDateTime(record.dateTimeObserved)],
    ["Related Work Authorization", record.relatedWorkAuthorization || "None"],
    ["Severity Estimate", record.severityEstimate],
    ["Anyone Injured", record.anyoneInjured ? "Yes" : "No"],
    ["Property Damaged", record.propertyDamaged ? "Yes" : "No"],
  ];
}

export function getWorkflowNarrative(record: SafetyWorkflowRecord) {
  if (record.formKey === "work_authorization") return record.workDescription;
  if (record.formKey === "work_close_out") return record.completionSummary;
  if (record.formKey === "regulatory_compliance") return record.description;
  return record.description;
}
