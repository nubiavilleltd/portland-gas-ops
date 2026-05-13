"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import ApprovalTimeline from "@/components/approval/ApprovalTimeline";
import { formatCurrency, formatDate, capitalize } from "@/lib/utils";
import type { ApprovalStep } from "@/types";

// Mock approval steps — real data will come from /api/approvals/{id}
const MOCK_STEPS: ApprovalStep[] = [
  { id: "s1", request_id: "1", step_number: 1, step_type: "individual", group_rule: null, status: "approved", completed_at: "2024-05-11T09:30:00Z", assignees: [{ id: "a1", step_id: "s1", user_id: "u1", user_name: "Chinyere Okafor", decision: "approved", decided_at: "2024-05-11T09:30:00Z", comment: "Budgeted and necessary." }] },
  { id: "s2", request_id: "1", step_number: 2, step_type: "individual", group_rule: null, status: "in_progress", completed_at: null, assignees: [{ id: "a2", step_id: "s2", user_id: "u2", user_name: "Emeka Nwosu", decision: "pending", decided_at: null, comment: null }] },
  { id: "s3", request_id: "1", step_number: 3, step_type: "individual", group_rule: null, status: "pending", completed_at: null, assignees: [{ id: "a3", step_id: "s3", user_id: "u3", user_name: "Adaeze Obi", decision: "pending", decided_at: null, comment: null }] },
];

export default function ProcurementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <AppLayout pageTitle="Procurement">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors">
        <ArrowLeft size={14} /> Back to Procurement
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-brand-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-mono text-brand-text-secondary">PRQ-20240510-A1B2</p>
                <h2 className="text-lg font-semibold text-brand-text-primary mt-1">Generator fuel supply — Q3 2024</h2>
              </div>
              <ApprovalBadge status="in_progress" />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ["Department", "Operations"],
                ["Estimated Amount", formatCurrency(4500000)],
                ["Vendor", "Total Energies Nigeria"],
                ["Required By", formatDate("2024-07-01")],
                ["Submitted By", "Biodun Adeyemi"],
                ["Date Submitted", formatDate("2024-05-10")],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-brand-text-secondary text-xs">{label}</p>
                  <p className="text-brand-text-primary font-medium mt-0.5">{val}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-brand-border">
              <p className="text-xs text-brand-text-secondary mb-1">Description</p>
              <p className="text-sm text-brand-text-primary">Procurement of generator fuel (AGO) for Q3 operations across Apapa and Lekki depots to ensure uninterrupted CNG compression operations.</p>
            </div>
          </div>
        </div>

        {/* Right — timeline */}
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-brand-text-primary mb-4">Approval Status</h3>
          <ApprovalTimeline steps={MOCK_STEPS} />
        </div>
      </div>
    </AppLayout>
  );
}
