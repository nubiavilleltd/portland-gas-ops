"use client";

import { useState } from "react";
import { RotateCcw, XCircle, CheckCircle, Loader2 } from "lucide-react";
import FormSection from "@/components/ui/FormSection";
import FormTextarea from "@/components/forms/FormTextarea";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ApprovalButtonVariant = "approve" | "reject" | "return" | "neutral";

export interface ApprovalExtraAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: ApprovalButtonVariant;
  onClick: (comment: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface ApprovalPanelProps {
  // ── Section header ──────────────────────────────────────────────────────────
  title?: string;
  description?: string;
  reviewingAs?: string;

  // ── Extra fields (rendered above comment, e.g. Payment Terms select) ────────
  extraFields?: React.ReactNode;

  // ── Comment field ───────────────────────────────────────────────────────────
  showComment?: boolean;
  commentLabel?: string;
  commentPlaceholder?: string;
  commentRequired?: boolean;
  commentMaxLength?: number;
  commentValue?: string;
  onCommentChange?: (comment: string) => void;
  requireCommentForRejectReturn?: boolean;

  // ── Built-in buttons — each independently toggled ──────────────────────────
  showReturn?: boolean;
  showReject?: boolean;
  showApprove?: boolean;

  // Labels — override defaults
  returnLabel?: string;
  rejectLabel?: string;
  approveLabel?: string;
  returnLoadingLabel?: string;
  rejectLoadingLabel?: string;
  approveLoadingLabel?: string;

  // Icons — override defaults
  returnIcon?: React.ReactNode;
  rejectIcon?: React.ReactNode;
  approveIcon?: React.ReactNode;

  // Callbacks — receive the current comment string
  onReturn?: (comment: string) => void;
  onReject?: (comment: string) => void;
  onApprove?: (comment: string) => void;

  // Loading states
  returnLoading?: boolean;
  rejectLoading?: boolean;
  approveLoading?: boolean;

  // Disabled states
  returnDisabled?: boolean;
  rejectDisabled?: boolean;
  approveDisabled?: boolean;

  // ── Extra custom buttons ────────────────────────────────────────────────────
  extraActions?: ApprovalExtraAction[];

  // ── Global disable (e.g. while any mutation is in flight) ──────────────────
  disabled?: boolean;
}

// ── Button variant styles ──────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ApprovalButtonVariant, string> = {
  approve: "bg-brand-purple text-white hover:bg-brand-purple-dark",
  reject:  "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
  return:  "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100",
  neutral: "bg-white text-brand-text-secondary border border-brand-border hover:bg-gray-50",
};

// ── Internal button ────────────────────────────────────────────────────────────

function ActionButton({
  label, icon, variant = "neutral", onClick, loading = false, disabled = false,
}: {
  label: string;
  icon?: React.ReactNode;
  variant?: ApprovalButtonVariant;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={[
        "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
        VARIANT_STYLES[variant],
        isDisabled ? "opacity-60 pointer-events-none" : "",
      ].join(" ")}
    >
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : icon
      }
      {label}
    </button>
  );
}

// ── ApprovalPanel ──────────────────────────────────────────────────────────────

export default function ApprovalPanel({
  title = "Approval Decision",
  description,
  reviewingAs,

  extraFields,

  showComment = true,
  commentLabel = "Comment",
  commentPlaceholder = "Add a comment before submitting your decision…",
  commentRequired = false,
  commentMaxLength = 500,
  commentValue,
  onCommentChange,
  requireCommentForRejectReturn = false,

  showReturn = true,
  showReject = true,
  showApprove = true,

  returnLabel = "Return",
  rejectLabel = "Reject",
  approveLabel = "Approve",
  returnLoadingLabel = "Returning...",
  rejectLoadingLabel,
  approveLoadingLabel,

  returnIcon = <RotateCcw size={14} />,
  rejectIcon = <XCircle size={14} />,
  approveIcon = <CheckCircle size={14} />,

  onReturn,
  onReject,
  onApprove,

  returnLoading = false,
  rejectLoading = false,
  approveLoading = false,

  returnDisabled = false,
  rejectDisabled = false,
  approveDisabled = false,

  extraActions = [],

  disabled = false,
}: ApprovalPanelProps) {
  const [internalComment, setInternalComment] = useState("");
  const [validationError, setValidationError] = useState("");
  const [lastAction, setLastAction] = useState<"return" | "reject" | "approve" | string | null>(null);
  const comment = commentValue ?? internalComment;

  function handleCommentChange(nextComment: string) {
    if (commentValue === undefined) {
      setInternalComment(nextComment);
    }
    onCommentChange?.(nextComment);
    setValidationError("");
  }

  function handleReturnClick() {
    if (requireCommentForRejectReturn && !comment.trim()) {
      setValidationError("Please add a comment before returning this request.");
      return;
    }
    setValidationError("");
    setLastAction("return");
    onReturn?.(comment);
  }

  function handleRejectClick() {
    if (requireCommentForRejectReturn && !comment.trim()) {
      setValidationError("Please add a comment before denying this request.");
      return;
    }
    setValidationError("");
    setLastAction("reject");
    onReject?.(comment);
  }

  function handleApproveClick() {
    setLastAction("approve");
    onApprove?.(comment);
  }

  const sectionDescription = reviewingAs
    ? `Reviewing as ${reviewingAs}`
    : description;

  const anyLoading = returnLoading || rejectLoading || approveLoading ||
    extraActions.some((a) => a.loading);

  // A button is loading if: explicit loading prop OR (global disabled + it was the last clicked)
  const isReturnLoading  = returnLoading  || (disabled && lastAction === "return");
  const isRejectLoading  = rejectLoading  || (disabled && lastAction === "reject");
  const isApproveLoading = approveLoading || (disabled && lastAction === "approve");
  const resolvedRejectLoadingLabel =
    rejectLoadingLabel ?? (rejectLabel === "Deny" ? "Denying..." : "Rejecting...");
  const resolvedApproveLoadingLabel =
    approveLoadingLabel ??
    (approveLabel === "Acknowledge" ? "Acknowledging..." : "Approving...");

  const hasButtons = showReturn || showReject || showApprove || extraActions.length > 0;

  return (
    <FormSection title={title} description={sectionDescription}>

      {/* Extra fields slot — payment terms, dropdowns, etc. */}
      {extraFields && <div>{extraFields}</div>}

      {/* Comment field */}
      {showComment && (
        <FormTextarea
          label={commentLabel}
          placeholder={commentPlaceholder}
          rows={3}
          maxLength={commentMaxLength}
          required={commentRequired}
          value={comment}
          onChange={(e) => handleCommentChange(e.target.value)}
        />
      )}

      {/* Validation error message */}
      {validationError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{validationError}</p>
        </div>
      )}

      {/* Action buttons */}
      {hasButtons && (
        <div className="flex items-center justify-end gap-2 pt-1">

          {/* Return — leftmost negative action */}
          {showReturn && onReturn && (
            <ActionButton
              label={isReturnLoading ? returnLoadingLabel : returnLabel}
              icon={returnIcon}
              variant="return"
              onClick={handleReturnClick}
              loading={isReturnLoading}
              disabled={disabled || returnDisabled || anyLoading}
            />
          )}

          {/* Reject */}
          {showReject && onReject && (
            <ActionButton
              label={isRejectLoading ? resolvedRejectLoadingLabel : rejectLabel}
              icon={rejectIcon}
              variant="reject"
              onClick={handleRejectClick}
              loading={isRejectLoading}
              disabled={disabled || rejectDisabled || anyLoading}
            />
          )}

          {/* Extra custom buttons — inserted before the primary approve */}
          {extraActions.map((action) => (
            <ActionButton
              key={action.key}
              label={
                action.loading || (disabled && lastAction === action.key)
                  ? `${action.label}...`
                  : action.label
              }
              icon={action.icon}
              variant={action.variant ?? "neutral"}
              onClick={() => { setLastAction(action.key); action.onClick(comment); }}
              loading={action.loading || (disabled && lastAction === action.key)}
              disabled={disabled || action.disabled || anyLoading}
            />
          ))}

          {/* Approve — always rightmost / primary */}
          {showApprove && onApprove && (
            <ActionButton
              label={isApproveLoading ? resolvedApproveLoadingLabel : approveLabel}
              icon={approveIcon}
              variant="approve"
              onClick={handleApproveClick}
              loading={isApproveLoading}
              disabled={disabled || approveDisabled || anyLoading}
            />
          )}

        </div>
      )}

    </FormSection>
  );
}
