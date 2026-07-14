"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, GitBranch, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { type Column, type DataTableAction } from "@/components/ui/DataTable";
import Tip from "@/components/ui/Tip";
import { BackButton } from "@/components/ui/BackButton";
import { useWorkflows, useUpdateWorkflow, useDeleteWorkflow } from "@/lib/modules/workflow";
import { useToast } from "@/hooks/useToast";
import { formatDate } from "@/lib/utils";
import type { ApprovalWorkflowListItem } from "@/types/workflow";

const COLUMNS: Column<ApprovalWorkflowListItem>[] = [
  {
    key: "name",
    label: "Workflow Name",
    render: (_, wf) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-brand-purple/10 flex items-center justify-center shrink-0">
          <GitBranch size={14} className="text-brand-purple" />
        </div>
        <div>
          <p className="text-sm font-medium text-brand-text-primary">{wf.name}</p>
          {wf.description && (
            <p className="text-xs text-brand-text-secondary truncate max-w-[300px]">{wf.description}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "step_count",
    label: "Steps",
    render: (v) => (
      <span className="text-sm text-brand-text-secondary">
        {Number(v)} step{Number(v) !== 1 ? "s" : ""}
      </span>
    ),
  },
  {
    key: "assignment_count",
    label: "Assigned To",
    render: (v) =>
      Number(v) > 0 ? (
        <span className="text-sm text-brand-text-primary">
          {Number(v)} process{Number(v) !== 1 ? "es" : ""}
        </span>
      ) : (
        <span className="text-xs text-brand-text-secondary italic">Unassigned</span>
      ),
  },
  {
    key: "is_active",
    label: "Status",
    render: (v) =>
      v ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
          Active
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          Inactive
        </span>
      ),
  },
  {
    key: "created_at",
    label: "Created",
    render: (v) => (
      <span className="text-xs text-brand-text-secondary">{formatDate(v as string)}</span>
    ),
  },
];

export default function WorkflowsPage() {
  const { data: workflows = [], isLoading, isError } = useWorkflows();
  const deleteWorkflow = useDeleteWorkflow();
  const toast = useToast();

  const [deleteTarget, setDeleteTarget] = useState<ApprovalWorkflowListItem | null>(null);
  const [toggleTarget, setToggleTarget] = useState<ApprovalWorkflowListItem | null>(null);

  // Hook must be called unconditionally at the top level — ID is swapped via state
  const updateWorkflow = useUpdateWorkflow(toggleTarget?.id ?? "");

  function handleToggleConfirm() {
    if (!toggleTarget) return;
    const next = !toggleTarget.is_active;
    updateWorkflow.mutate(
      { is_active: next },
      {
        onSuccess: () => { toast.success(next ? "Workflow activated" : "Workflow deactivated"); setToggleTarget(null); },
        onError:   () => toast.error("Failed to update workflow"),
      }
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteWorkflow.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success("Workflow deleted"); setDeleteTarget(null); },
      onError:   () => toast.error("Failed to delete workflow — it may be assigned to active processes"),
    });
  }

  const tableActions: DataTableAction<ApprovalWorkflowListItem>[] = [
    {
      key: "row-actions",
      label: "",
      render: (wf) => (
        <div className="flex items-center gap-1">
          <Tip label="Edit Workflow">
            <Link
              href={`/admin/workflows/${wf.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-brand-text-secondary hover:bg-gray-100 hover:text-brand-text-primary transition-colors"
            >
              <Pencil size={14} />
            </Link>
          </Tip>
          <Tip label={wf.is_active ? "Deactivate" : "Activate"}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setToggleTarget(wf); }}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-brand-text-secondary hover:bg-gray-100 hover:text-brand-text-primary transition-colors"
            >
              {wf.is_active ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} />}
            </button>
          </Tip>
          <Tip label="Delete Workflow">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(wf); }}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-brand-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </Tip>
        </div>
      ),
    },
  ];

  return (
    <AppLayout pageTitle="Admin — Workflows">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader
        title="Approval Workflows"
        description="Create and manage multi-step approval chains for procurement, assets, and more"
        action={
          <div className="flex items-center gap-2">
            <Button href="/admin/workflows/assignments?from=workflows" variant="outline" size="sm">Assignments</Button>
            <Button href="/admin/workflows/groups?from=workflows" variant="outline" size="sm">Approver Groups</Button>
            <Button href="/admin/workflows/new" leftIcon={<Plus size={15} />} size="sm">New Workflow</Button>
          </div>
        }
      />

      {isError ? (
        <div className="text-center py-20 text-brand-text-secondary">Failed to load workflows.</div>
      ) : !isLoading && workflows.length === 0 ? (
        <EmptyState
          title="No workflows yet"
          description="Create your first approval workflow to start routing requests through approvers."
          action={<Button href="/admin/workflows/new" leftIcon={<Plus size={15} />}>Create Workflow</Button>}
        />
      ) : (
        <DataTable
          columns={COLUMNS}
          data={workflows}
          isLoading={isLoading}
          rowHref={(wf) => `/admin/workflows/${wf.id}`}
          emptyMessage="No workflows found."
          searchable={false}
          showActions
          actions={tableActions}
        />
      )}

      <ConfirmDialog
        open={!!toggleTarget}
        title={toggleTarget?.is_active ? "Deactivate Workflow" : "Activate Workflow"}
        message={
          toggleTarget?.is_active
            ? `Deactivate "${toggleTarget?.name}"? New requests will not be routed through this workflow until it is reactivated.`
            : `Activate "${toggleTarget?.name}"? It will be available for assignment and will start routing new requests.`
        }
        confirmLabel={toggleTarget?.is_active ? "Deactivate" : "Activate"}
        destructive={toggleTarget?.is_active}
        loading={updateWorkflow.isPending}
        onConfirm={handleToggleConfirm}
        onCancel={() => setToggleTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Workflow"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone. Any processes currently using this workflow will need to be reassigned.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
