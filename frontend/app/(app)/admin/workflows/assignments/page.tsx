"use client";

import Link from "next/link";
import { ArrowLeft, GitBranch, AlertCircle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FormSection from "@/components/ui/FormSection";
import SelectInput from "@/components/forms/SelectInput";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useWorkflows, useWorkflowAssignments, useSetWorkflowAssignment } from "@/lib/modules/workflow";
import { useToast } from "@/hooks/useToast";

const REQUEST_TYPES = [
  { value: "procurement",        label: "Procurement Requests",   description: "Purchase requests raised by employees" },
  { value: "asset",              label: "Asset Requests",         description: "Loan and requisition requests for company assets" },
  { value: "leave",              label: "Leave Requests",         description: "Annual, sick, and other leave types" },
  { value: "cash_requisition",   label: "Cash Requisitions",      description: "Petty cash and advance payment requests" },
  { value: "invoice",            label: "Invoice Approvals",      description: "Vendor invoice review and payment approval" },
  { value: "work_initiation",    label: "Work Initiation",        description: "PTW / work initiation forms before field work begins" },
  { value: "work_closeout",      label: "Work Close-Out",         description: "Completion sign-off after field work is done" },
  { value: "safety",             label: "Safety Incidents",       description: "Incident and hazard reports requiring HSE review" },
];

export default function WorkflowAssignmentsPage() {
  const { data: assignments = [], isLoading: loadingAssignments } = useWorkflowAssignments();
  const { data: workflows   = [], isLoading: loadingWorkflows    } = useWorkflows();
  const setAssignment = useSetWorkflowAssignment();
  const toast         = useToast();

  const isLoading = loadingAssignments || loadingWorkflows;

  const activeWorkflows = workflows.filter((wf) => wf.is_active);

  const workflowOptions = [
    { value: "", label: "No workflow assigned" },
    ...activeWorkflows.map((wf) => ({
      value: wf.id,
      label: `${wf.name} (${wf.step_count} step${wf.step_count !== 1 ? "s" : ""})`,
    })),
  ];

  function currentWorkflowId(requestType: string): string {
    return assignments.find((a) => a.request_type === requestType)?.workflow_id ?? "";
  }

  async function handleChange(requestType: string, workflowId: string) {
    if (!workflowId) return; // user selected "No workflow" — could add unassign later
    try {
      await setAssignment.mutateAsync({ request_type: requestType, workflow_id: workflowId });
      toast.success("Assignment updated");
    } catch {
      toast.error("Failed to update assignment");
    }
  }

  return (
    <AppLayout pageTitle="Admin — Workflows">
      <div className="mb-4">
        <Link
          href="/admin/workflows"
          className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Workflows
        </Link>
      </div>

      <PageHeader
        title="Workflow Assignments"
        description="Map each request type to the approval workflow it should follow."
        className="mb-6"
      />

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : activeWorkflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary">
          <AlertCircle size={32} />
          <p className="text-sm">No active workflows yet.</p>
          <Link href="/admin/workflows/new" className="text-brand-purple text-sm hover:underline">
            Create a workflow first
          </Link>
        </div>
      ) : (
        <FormSection
          title="Request Type Assignments"
          description="Select which workflow runs when a new request of each type is submitted."
        >
          <div className="space-y-5">
            {REQUEST_TYPES.map((rt) => (
              <div key={rt.value} className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <GitBranch size={16} className="text-brand-text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-text-primary">{rt.label}</p>
                  <p className="text-xs text-brand-text-secondary mb-2">{rt.description}</p>
                  <SelectInput
                    placeholder="No workflow assigned"
                    sortOptions={false}
                    value={currentWorkflowId(rt.value)}
                    onValueChange={(v) => handleChange(rt.value, v)}
                    options={workflowOptions}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Changing a workflow assignment only affects new requests submitted after the change.
              Requests already in progress continue with the workflow they were started with.
            </p>
          </div>
        </FormSection>
      )}
    </AppLayout>
  );
}
