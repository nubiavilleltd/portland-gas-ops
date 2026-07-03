"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import Button from "@/components/ui/Button";
import { useCreateWorkflow } from "@/lib/modules/workflow";
import { useToast } from "@/hooks/useToast";

export default function NewWorkflowPage() {
  const router = useRouter();
  const toast  = useToast();
  const create = useCreateWorkflow();

  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [resetOnReturn, setResetOnReturn] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Workflow name is required"); return; }
    try {
      const res = await create.mutateAsync({ name: name.trim(), description: description.trim() || undefined, reset_on_return: resetOnReturn });
      toast.success("Workflow created");
      // @ts-expect-error — response shape from API
      router.push(`/admin/workflows/${res.id}`);
    } catch {
      toast.error("Failed to create workflow");
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
