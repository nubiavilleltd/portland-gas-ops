"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitBranch, CheckCircle2 } from "lucide-react";
import { createPortal } from "react-dom";
import AppLayout from "@/components/layout/AppLayout";
import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import SelectInput from "@/components/forms/SelectInput";
import Button from "@/components/ui/Button";
import { useCreateWorkflow, useSetWorkflowAssignment } from "@/lib/modules/workflow";
import { useToast } from "@/hooks/useToast";

const REQUEST_TYPES = [
  { value: "procurement",      label: "Procurement Requests" },
  { value: "asset",            label: "Asset Requests" },
  { value: "leave",            label: "Leave Requests" },
  { value: "cash_requisition", label: "Cash Requisitions" },
  { value: "invoice",          label: "Invoice Approvals" },
  { value: "work_initiation",  label: "Work Initiation" },
  { value: "work_authorization", label: "Work Authorization" },
  { value: "work_closeout",    label: "Work Close-Out" },
  { value: "safety",           label: "Safety Incidents" },
];

// ── Assignment prompt modal ────────────────────────────────────────────────────

function AssignPrompt({
  workflowId,
  workflowName,
  onAssigned,
  onSkip,
}: {
  workflowId: string;
  workflowName: string;
  onAssigned: () => void;
  onSkip: () => void;
}) {
  const [requestType, setRequestType] = useState("");
  const assign = useSetWorkflowAssignment();
  const toast  = useToast();

  async function handleAssign() {
    if (!requestType) { toast.error("Pick a request type first"); return; }
    try {
      await assign.mutateAsync({ request_type: requestType, workflow_id: workflowId });
      toast.success("Workflow assigned");
      onAssigned();
    } catch {
      toast.error("Failed to assign workflow");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onSkip} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="bg-brand-purple px-6 py-5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <GitBranch size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">Workflow Created</p>
              <p className="text-lg font-bold text-white leading-tight">{workflowName}</p>
            </div>
          </div>
        </div>

        {/* Body — no overflow-hidden so the dropdown can escape */}
        <div className="bg-white px-6 py-5 space-y-4 rounded-b-2xl">
          <div>
            <p className="text-sm font-semibold text-brand-text-primary">Assign to a request type?</p>
            <p className="text-xs text-brand-text-secondary mt-1">
              Pick which process should use this workflow. You can always change this later in Workflow Assignments.
            </p>
          </div>

          <SelectInput
            placeholder="Select a request type…"
            sortOptions={false}
            value={requestType}
            onValueChange={setRequestType}
            options={REQUEST_TYPES}
          />

          <div className="flex gap-3 pt-1">
            <Button
              className="flex-1"
              disabled={!requestType || assign.isPending}
              onClick={handleAssign}
              leftIcon={<CheckCircle2 size={15} />}
            >
              {assign.isPending ? "Assigning…" : "Assign & Continue"}
            </Button>
            <Button variant="outline" onClick={onSkip} disabled={assign.isPending}>
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NewWorkflowPage() {
  const router = useRouter();
  const toast  = useToast();
  const create = useCreateWorkflow();

  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [resetOnReturn, setResetOnReturn] = useState(true);

  // After creation: hold the new workflow id/name to show the assign prompt
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Workflow name is required"); return; }
    try {
      const res = await create.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        reset_on_return: resetOnReturn,
      });
      // @ts-expect-error — response shape from API
      setCreated({ id: res.id, name: name.trim() });
    } catch {
      toast.error("Failed to create workflow");
    }
  }

  function proceed(id: string) {
    router.push(`/admin/workflows/${id}`);
  }

  return (
    <AppLayout pageTitle="Admin — Workflows">
      {created && (
        <AssignPrompt
          workflowId={created.id}
          workflowName={created.name}
          onAssigned={() => proceed(created.id)}
          onSkip={() => proceed(created.id)}
        />
      )}

      <div className="mb-4">
        <Link
          href="/admin/workflows"
          className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Workflows
        </Link>
      </div>

      <div className="bg-white border border-brand-border rounded-2xl px-6 py-5 mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-secondary mb-1">New Workflow</p>
        <h1 className="text-2xl font-bold text-brand-text-primary">Create Approval Workflow</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">
          Give it a name, then add approval steps on the next screen.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <FormSection title="Workflow Details">
          <div className="grid grid-cols-1 gap-5">
            <FormInput
              label="Workflow Name"
              required
              placeholder="e.g. Procurement Approval, Asset Request Approval"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <FormTextarea
              label="Description (optional)"
              placeholder="Briefly describe what this workflow is used for…"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-brand-border">
            <input
              id="reset-on-return"
              type="checkbox"
              checked={resetOnReturn}
              onChange={(e) => setResetOnReturn(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple"
            />
            <label htmlFor="reset-on-return" className="cursor-pointer">
              <p className="text-sm font-medium text-brand-text-primary">Restart from Step 1 on resubmit</p>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                When a request is returned and the employee resubmits, the approval chain starts over from the first step.
              </p>
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create & Add Steps →"}
            </Button>
          </div>
        </FormSection>
      </form>
    </AppLayout>
  );
}
