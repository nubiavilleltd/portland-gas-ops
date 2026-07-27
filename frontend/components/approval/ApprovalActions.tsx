"use client";

import { useState } from "react";
import { Download, RotateCcw, XCircle, CheckCircle } from "lucide-react";
import FormTextarea from "@/components/forms/FormTextarea";

interface Props {
  onApprove: (comment?: string) => void;
  onReject: (comment?: string) => void;
  onReturn: (comment?: string) => void;
  loading?: boolean;
  approveLabel?: string;
}

type Action = "approve" | "reject" | "return" | null;

export default function ApprovalActions({ onApprove, onReject, onReturn, loading, approveLabel = "Approve" }: Props) {
  const [pendingAction, setPendingAction] = useState<Action>(null);
  const [comment, setComment] = useState("");

  function handleConfirm() {
    if (pendingAction === "approve") onApprove(comment || undefined);
    if (pendingAction === "reject") onReject(comment || undefined);
    if (pendingAction === "return") onReturn(comment || undefined);
    setPendingAction(null);
    setComment("");
  }

  const dialogConfig = {
    approve: { title: "Approve Request", message: "Confirm that you are approving this request.", confirmLabel: "Approve", destructive: false },
    reject: { title: "Deny Request", message: "This action will deny the request. It cannot be undone without resubmission.", confirmLabel: "Deny", destructive: true },
    return: { title: "Return to Submitter", message: "The request will be returned to the submitter for revision.", confirmLabel: "Return", destructive: false },
  };

  const config = pendingAction ? dialogConfig[pendingAction] : null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-border px-6 py-3 flex items-center gap-3 z-40">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-brand-border rounded-lg text-brand-text-secondary hover:bg-gray-50 transition-colors"
        >
          <Download size={14} />
          Download PDF
        </button>
        <div className="flex-1" />
        <button
          disabled={loading}
          onClick={() => setPendingAction("return")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
        >
          <RotateCcw size={14} />
          Return
        </button>
        <button
          disabled={loading}
          onClick={() => setPendingAction("reject")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <XCircle size={14} />
          Deny
        </button>
        <button
          disabled={loading}
          onClick={() => setPendingAction("approve")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
        >
          <CheckCircle size={14} />
          {approveLabel}
        </button>
      </div>

      {pendingAction && config && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPendingAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-brand-text-primary">{config.title}</h3>
            <p className="text-sm text-brand-text-secondary mt-2 mb-4">{config.message}</p>
            <FormTextarea
              label="Comment (optional)"
              placeholder="Add a comment…"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 text-sm font-medium text-brand-text-secondary border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={
                  config.destructive
                    ? "px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    : "px-4 py-2 text-sm font-medium text-white bg-brand-purple rounded-lg hover:bg-brand-purple-dark transition-colors"
                }
              >
                {config.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
