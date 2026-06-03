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

  // ── Built-in buttons — each independently toggled ──────────────────────────
  showReturn?: boolean;
  showReject?: boolean;
  showApprove?: boolean;

  // Labels — override defaults
  returnLabel?: string;
  rejectLabel?: string;
  approveLabel?: string;

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
  commentLabel = "Comment (optional)",
  commentPlaceholder = "Add a comment before submitting your decision…",
  commentRequired = false,
  commentMaxLength = 500,
  commentValue,
  onCommentChange,

  showReturn = true,
  showReject = true,
  showApprove = true,

  returnLabel = "Return",
  rejectLabel = "Reject",
  approveLabel = "Approve",

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
  const comment = commentValue ?? internalComment;

  function handleCommentChange(nextComment: string) {
    if (commentValue === undefined) {
      setInternalComment(nextComment);
    }
    onCommentChange?.(nextComment);
  }

  const sectionDescription = reviewingAs
    ? `Reviewing as ${reviewingAs}`
    : description;

  const anyLoading = returnLoading || rejectLoading || approveLoading ||
    extraActions.some((a) => a.loading);

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

      {/* Action buttons */}
      {hasButtons && (
        <div className="flex items-center justify-end gap-2 pt-1">

          {/* Return — leftmost negative action */}
          {showReturn && onReturn && (
            <ActionButton
              label={returnLabel}
              icon={returnIcon}
              variant="return"
              onClick={() => onReturn(comment)}
              loading={returnLoading}
              disabled={disabled || returnDisabled || anyLoading}
            />
          )}

          {/* Reject */}
          {showReject && onReject && (
            <ActionButton
              label={rejectLabel}
              icon={rejectIcon}
              variant="reject"
              onClick={() => onReject(comment)}
              loading={rejectLoading}
              disabled={disabled || rejectDisabled || anyLoading}
            />
          )}

          {/* Extra custom buttons — inserted before the primary approve */}
          {extraActions.map((action) => (
            <ActionButton
              key={action.key}
              label={action.label}
              icon={action.icon}
              variant={action.variant ?? "neutral"}
              onClick={() => action.onClick(comment)}
              loading={action.loading}
              disabled={disabled || action.disabled || anyLoading}
            />
          ))}

          {/* Approve — always rightmost / primary */}
          {showApprove && onApprove && (
            <ActionButton
              label={approveLabel}
              icon={approveIcon}
              variant="approve"
              onClick={() => onApprove(comment)}
              loading={approveLoading}
              disabled={disabled || approveDisabled || anyLoading}
            />
          )}

        </div>
      )}

    </FormSection>
  );
}
