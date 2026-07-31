"use client";

import { ExternalLink, FileText, ImageIcon, Trash2, Video } from "lucide-react";
import type { MouseEvent } from "react";
import api from "@/lib/api";
import type { WorkAuthorizationAttachment } from "@/types/safety";

type SafetyAttachmentListProps = {
  attachments?: WorkAuthorizationAttachment[];
  label?: string;
  emptyMessage?: string;
  getAttachmentHref?: (attachment: WorkAuthorizationAttachment) => string;
  onRemove?: (attachmentId: string) => void;
};

export default function SafetyAttachmentList({
  attachments = [],
  label,
  emptyMessage = "No attachments.",
  getAttachmentHref,
  onRemove,
}: SafetyAttachmentListProps) {
  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-sm font-medium text-brand-text-primary">{label}</p>
      ) : null}
      {attachments.length === 0 ? (
        <p className="text-sm text-brand-text-secondary">{emptyMessage}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <SafetyAttachmentItem
              key={attachment.id ?? attachment.url ?? attachment.name}
              attachment={attachment}
              href={getAttachmentHref?.(attachment)}
              onRemove={attachment.id ? onRemove : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SafetyAttachmentItem({
  attachment,
  href,
  onRemove,
}: {
  attachment: WorkAuthorizationAttachment;
  href?: string;
  onRemove?: (attachmentId: string) => void;
}) {
  const attachmentHref = href ?? attachment.url;
  async function handleAttachmentClick(
    event: MouseEvent<HTMLAnchorElement>,
  ) {
    if (!attachmentHref?.startsWith("/api/")) return;

    event.preventDefault();
    const openedWindow = window.open("about:blank", "_blank");
    if (openedWindow) openedWindow.opener = null;
    try {
      const response = await api.get<Blob>(attachmentHref, {
        responseType: "blob",
      });
      const blobUrl = URL.createObjectURL(response.data);
      if (openedWindow) {
        openedWindow.location.href = blobUrl;
      } else {
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      }
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch {
      if (openedWindow) openedWindow.close();
    }
  }

  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-brand-purple">
        {attachment.type === "image" && attachment.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={attachment.url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <AttachmentIcon type={attachment.type} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-brand-text-primary">
          {attachment.name}
        </p>
        <p className="text-xs capitalize text-brand-text-secondary">
          {attachment.type}
          {attachment.fileSize ? ` · ${formatFileSize(attachment.fileSize)}` : ""}
        </p>
      </div>
      {attachmentHref ? (
        <ExternalLink size={15} className="shrink-0 text-brand-text-secondary" />
      ) : null}
    </>
  );
  const className =
    "flex min-w-0 items-center gap-3 rounded-xl border border-brand-border bg-gray-50 p-3 text-left";

  return (
    <div className="relative">
      {attachmentHref ? (
        <a
          href={attachmentHref}
          target="_blank"
          rel="noreferrer"
          onClick={handleAttachmentClick}
          className={`${className} pr-11 transition-colors hover:border-brand-purple/40 hover:bg-white`}
        >
          {content}
        </a>
      ) : (
        <div className={`${className} pr-11`}>{content}</div>
      )}
      {onRemove && attachment.id ? (
        <button
          type="button"
          onClick={() => onRemove(attachment.id!)}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50"
          aria-label={`Remove ${attachment.name}`}
        >
          <Trash2 size={15} />
        </button>
      ) : null}
    </div>
  );
}

function AttachmentIcon({ type }: { type: WorkAuthorizationAttachment["type"] }) {
  if (type === "image") return <ImageIcon size={18} />;
  if (type === "video") return <Video size={18} />;
  return <FileText size={18} />;
}

function formatFileSize(value: number) {
  if (value < 1024) return `${value} B`;
  const kb = value / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
