"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle, Plus, Trash2, GripVertical,
  ChevronUp, ChevronDown, Pencil,
} from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import SelectInput from "@/components/forms/SelectInput";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import {
  useWorkflow,
  useUpdateWorkflow,
  useAddStep,
  useDeleteStep,
  useReorderSteps,
  useApproverGroups,
} from "@/lib/modules/workflow";
import { useEmployees } from "@/lib/modules/employees/hooks";
import { patch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { workflowKeys } from "@/lib/modules/workflow/queries";
import { useToast } from "@/hooks/useToast";
import type { WorkflowStep, AssigneeType } from "@/types/workflow";

// ── Constants ─────────────────────────────────────────────────────────────────

const ASSIGNEE_TYPE_OPTIONS = [
  { value: "requester_operations_manager", label: "Requester's Operations Manager" },
  { value: "specific",                     label: "Specific Person (pre-set)" },
  { value: "requester_pick",               label: "Requester Picks Approver" },
];

const ASSIGNEE_TYPE_LABELS: Record<string, string> = {
  requester_operations_manager: "Operations Manager",
  role:                         "By Role",
  specific:                     "Specific Person",
  requester_pick:               "Requester Picks",
  requester_hod:                "Head of Department",
  requester_skip_level:         "Skip-Level Manager",
};

// ── Step badge ─────────────────────────────────────────────────────────────────

function StepBadge({ type }: { type: AssigneeType }) {
  const styles: Record<AssigneeType, string> = {
    requester_operations_manager: "bg-blue-50 text-blue-700 border border-blue-200",
    role:                         "bg-purple-50 text-purple-700 border border-purple-200",
    specific:                     "bg-teal-50 text-teal-700 border border-teal-200",
    requester_pick:               "bg-amber-50 text-amber-700 border border-amber-200",
    requester_hod:                "bg-orange-50 text-orange-700 border border-orange-200",
    requester_skip_level:         "bg-gray-50 text-gray-600 border border-gray-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[type] ?? "bg-gray-100 text-gray-600"}`}>
      {ASSIGNEE_TYPE_LABELS[type]}
    </span>
  );
}

// ── Step form (add / edit) ────────────────────────────────────────────────────

interface StepFormData {
  step_name:     string;
  assignee_type: AssigneeType | "";
  employee_id:   string;        // for "specific"
  group_id:      string;        // for "requester_pick"
}

const EMPTY_STEP: StepFormData = {
  step_name:     "",
  assignee_type: "",
  employee_id:   "",
  group_id:      "",
};

function StepForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: StepFormData;
  onSave: (data: StepFormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<StepFormData>(initial ?? EMPTY_STEP);
  const [pickedEmployee, setPickedEmployee] = useState<PickedEmployee | null>(null);

  const { data: employeeList = [] } = useEmployees();
  const { data: groups = [] } = useApproverGroups();

  const employees: PickedEmployee[] = employeeList.map((e) => ({
    id:          e.id,
    name:        [e.user?.first_name, e.user?.last_name].filter(Boolean).join(" ") || "Unknown",
    role:        e.job_title ?? e.user?.role ?? "",
    department:  e.department ?? "",
    avatar_url:  e.user?.profile_picture_url,
  }));

  const groupOptions = groups.map((g) => ({ value: g.id, label: g.name }));

  function set<K extends keyof StepFormData>(k: K, v: StepFormData[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function handleTypeChange(v: string) {
    setForm((prev) => ({ ...prev, assignee_type: v as AssigneeType, employee_id: "", group_id: "" }));
    setPickedEmployee(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5 bg-gray-50 rounded-xl border border-brand-border">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          label="Step Name"
          required
          placeholder="e.g. Line Manager Review"
          value={form.step_name}
          onChange={(e) => set("step_name", e.target.value)}
        />
        <SelectInput
          label="Who Approves This Step"
          required
          placeholder="Select approver type…"
          value={form.assignee_type}
          onValueChange={handleTypeChange}
          options={ASSIGNEE_TYPE_OPTIONS}
        />
      </div>

      {form.assignee_type === "specific" && (
        <EmployeePicker
          label="Select Employee"
          required
          employees={employees}
          value={pickedEmployee}
          onChange={(emp) => {
            setPickedEmployee(emp);
            set("employee_id", emp?.id ?? "");
          }}
          placeholder="Search by name or department…"
        />
      )}

      {form.assignee_type === "requester_pick" && (
        <div className="space-y-1.5">
          <SelectInput
            label="Restrict to Group (optional)"
            placeholder="Any employee — no restriction"
            value={form.group_id}
            onValueChange={(v) => set("group_id", v)}
            options={groupOptions}
          />
          <p className="text-xs text-brand-text-secondary">
            {form.group_id
              ? "Requester will pick from this group's members only."
              : "No group selected — requester can pick any employee."}
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-brand-text-secondary border border-brand-border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Saving…" : "Save Step"}
        </Button>
      </div>
    </form>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast   = useToast();

  const { data: wf, isLoading, isError } = useWorkflow(id);
  const qc = useQueryClient();

  const updateWorkflow = useUpdateWorkflow(id);
  const addStep        = useAddStep(id);
  const deleteStep     = useDeleteStep(id);
  const reorderSteps   = useReorderSteps(id);

  const [showAddForm, setShowAddForm]       = useState(false);
  const [editingStep, setEditingStep]       = useState<WorkflowStep | null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<WorkflowStep | null>(null);

  // ── Header edit ────────────────────────────────────────────────────────────
  const [editingHeader, setEditingHeader]   = useState(false);
  const [headerName, setHeaderName]         = useState("");
  const [headerDesc, setHeaderDesc]         = useState("");

  function startHeaderEdit() {
    setHeaderName(wf?.name ?? "");
    setHeaderDesc(wf?.description ?? "");
    setEditingHeader(true);
  }

  async function saveHeader() {
    try {
      await updateWorkflow.mutateAsync({ name: headerName.trim(), description: headerDesc.trim() || undefined });
      setEditingHeader(false);
      toast.success("Workflow updated");
    } catch {
      toast.error("Failed to update workflow");
    }
  }

  // ── Step actions ───────────────────────────────────────────────────────────

  async function handleAddStep(form: StepFormData) {
    if (!form.step_name || !form.assignee_type) { toast.error("Step name and approver type are required"); return; }
    try {
      await addStep.mutateAsync({
        step_name:     form.step_name,
        assignee_type: form.assignee_type as string,
        employee_id:   form.assignee_type === "specific"       ? form.employee_id || undefined : undefined,
        group_id:      form.assignee_type === "requester_pick" ? form.group_id    || undefined : undefined,
      });
      setShowAddForm(false);
      toast.success("Step added");
    } catch {
      toast.error("Failed to add step");
    }
  }

  async function handleEditStep(form: StepFormData) {
    if (!editingStep) return;
    try {
      await patch(`/api/workflow/${id}/steps/${editingStep.id}`, {
        step_name:     form.step_name,
        assignee_type: form.assignee_type,
        employee_id:   form.assignee_type === "specific"       ? form.employee_id || undefined : undefined,
        group_id:      form.assignee_type === "requester_pick" ? form.group_id    || undefined : undefined,
      });
      await qc.invalidateQueries({ queryKey: workflowKeys.detail(id) });
      setEditingStep(null);
      toast.success("Step updated");
    } catch {
      toast.error("Failed to update step");
    }
  }

  async function handleDeleteStep() {
    if (!deleteTarget) return;
    try {
      await deleteStep.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("Step deleted");
    } catch {
      toast.error("Failed to delete step");
    }
  }

  async function moveStep(step: WorkflowStep, direction: "up" | "down") {
    if (!wf) return;
    const steps = [...wf.steps].sort((a, b) => a.step_number - b.step_number);
    const idx   = steps.findIndex((s) => s.id === step.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= steps.length) return;

    const reordered = [...steps];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

    try {
      await reorderSteps.mutateAsync(reordered.map((s) => s.id));
    } catch {
      toast.error("Failed to reorder steps");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) return <AppLayout pageTitle="Admin — Workflows"><div className="flex justify-center py-20"><LoadingSpinner /></div></AppLayout>;

  if (isError || !wf) {
    return (
      <AppLayout pageTitle="Admin — Workflows">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary">
          <AlertCircle size={32} />
          <p className="text-sm">Workflow not found.</p>
          <Link href="/admin/workflows" className="text-brand-purple text-sm hover:underline">Go back</Link>
        </div>
      </AppLayout>
    );
  }

  const sortedSteps = [...wf.steps].sort((a, b) => a.step_number - b.step_number);

  return (
    <AppLayout pageTitle="Admin — Workflows">
      <BackButton href="/admin/workflows" label="Back to Workflows" />

      {/* Header card */}
      <div className="bg-white border border-brand-border rounded-2xl px-6 py-5 mb-5">
        {editingHeader ? (
          <div className="space-y-3">
            <FormInput
              label="Workflow Name"
              value={headerName}
              onChange={(e) => setHeaderName(e.target.value)}
            />
            <FormTextarea
              label="Description"
              rows={2}
              value={headerDesc}
              onChange={(e) => setHeaderDesc(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingHeader(false)} className="px-4 py-2 text-sm text-brand-text-secondary border border-brand-border rounded-lg hover:bg-gray-50">Cancel</button>
              <Button size="sm" onClick={saveHeader} disabled={updateWorkflow.isPending}>
                {updateWorkflow.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-secondary mb-1">Approval Workflow</p>
              <h1 className="text-2xl font-bold text-brand-text-primary">{wf.name}</h1>
              {wf.description && (
                <p className="text-sm text-brand-text-secondary mt-0.5">{wf.description}</p>
              )}
              <p className="text-xs text-brand-text-secondary mt-1">
                {sortedSteps.length} step{sortedSteps.length !== 1 ? "s" : ""} ·{" "}
                {wf.is_active ? (
                  <span className="text-green-600 font-medium">Active</span>
                ) : (
                  <span className="text-gray-400 font-medium">Inactive</span>
                )} ·{" "}
                {wf.reset_on_return ? "Restarts from step 1 on resubmit" : "Resumes at returned step on resubmit"}
              </p>
            </div>
            <button
              onClick={startHeaderEdit}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-brand-text-secondary border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
          </div>
        )}
      </div>

      {/* Steps */}
      <FormSection
        title={`Approval Steps (${sortedSteps.length})`}
        description="Steps run in order — each approver must act before the next is notified."
        bodyClassName="space-y-3"
      >
        {sortedSteps.length === 0 && !showAddForm && (
          <p className="text-sm text-brand-text-secondary py-4 text-center">
            No steps yet. Add the first step below.
          </p>
        )}

        {sortedSteps.map((step, idx) => (
          <div key={step.id}>
            {editingStep?.id === step.id ? (
              <StepForm
                initial={{
                  step_name:     step.step_name,
                  assignee_type: step.assignee_type,
                  employee_id:   step.employee_id ?? "",
                  group_id:      step.group_id ?? "",
                }}
                onSave={handleEditStep}
                onCancel={() => setEditingStep(null)}
                saving={false}
              />
            ) : (
              <div className="flex items-center gap-3 p-4 bg-white border border-brand-border rounded-xl">
                {/* Step number */}
                <div className="h-7 w-7 rounded-full bg-brand-purple flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {step.step_number}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-brand-text-primary">{step.step_name}</p>
                    <StepBadge type={step.assignee_type} />
                    {step.role && (
                      <span className="text-xs font-mono text-brand-text-secondary bg-gray-100 px-1.5 py-0.5 rounded">
                        {step.role}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    title="Move up"
                    disabled={idx === 0 || reorderSteps.isPending}
                    onClick={() => moveStep(step, "up")}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-brand-text-secondary hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    title="Move down"
                    disabled={idx === sortedSteps.length - 1 || reorderSteps.isPending}
                    onClick={() => moveStep(step, "down")}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-brand-text-secondary hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    title="Edit step"
                    onClick={() => { setEditingStep(step); setShowAddForm(false); }}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-brand-text-secondary hover:bg-gray-100 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    title="Delete step"
                    onClick={() => setDeleteTarget(step)}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-brand-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add step form */}
        {showAddForm && (
          <StepForm
            onSave={handleAddStep}
            onCancel={() => setShowAddForm(false)}
            saving={addStep.isPending}
          />
        )}

        {!showAddForm && (
          <button
            type="button"
            onClick={() => { setShowAddForm(true); setEditingStep(null); }}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-brand-purple border border-dashed border-brand-purple/40 rounded-xl hover:bg-brand-purple/5 transition-colors"
          >
            <Plus size={15} /> Add Step
          </button>
        )}
      </FormSection>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Step"
        message={`Delete step "${deleteTarget?.step_name}"? Remaining steps will be renumbered automatically.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteStep}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
