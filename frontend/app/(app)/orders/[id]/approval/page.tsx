"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalTimeline from "@/components/approval/ApprovalTimeline";
import ApprovalActions from "@/components/approval/ApprovalActions";
import { useApprovalActions } from "@/hooks/useApprovals";
import type { ApprovalStep } from "@/types";

const MOCK_STEPS: ApprovalStep[] = [
  { id: "s1", request_id: "1", step_number: 1, step_type: "individual", group_rule: null, status: "in_progress", completed_at: null, assignees: [{ id: "a1", step_id: "s1", user_id: "u1", user_name: "Funmilayo Adeyemi", decision: "pending", decided_at: null, comment: null }] },
];

export default function OrderApprovalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { approve, reject, returnToSubmitter } = useApprovalActions(id);

  return (
    <AppLayout pageTitle="Orders">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors">
        <ArrowLeft size={14} /> Back
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
        <div className="lg:col-span-2 bg-white border border-brand-border rounded-2xl p-6">
          <p className="text-xs font-mono text-brand-text-secondary">ORD-20240512-C3D4</p>
          <h2 className="text-lg font-semibold text-brand-text-primary mt-1 mb-4">CNG Delivery — Dangote Cement</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[["Customer", "Dangote Cement Plc"], ["Quantity", "12,000 kg"], ["Total", "₦10,200,000"], ["Delivery", "Obajana, Kogi"]].map(([l, v]) => (
              <div key={l}><p className="text-brand-text-secondary text-xs">{l}</p><p className="font-medium mt-0.5">{v}</p></div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4">Approval Timeline</h3>
          <ApprovalTimeline steps={MOCK_STEPS} />
        </div>
      </div>
      <ApprovalActions loading={approve.isPending || reject.isPending} onApprove={(c) => approve.mutate(c)} onReject={(c) => reject.mutate(c)} onReturn={(c) => returnToSubmitter.mutate(c)} />
    </AppLayout>
  );
}
