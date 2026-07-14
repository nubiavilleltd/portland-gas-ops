"use client";

import Card from "@/components/ui/Card";
import type { CustomerAttachment } from "@/lib/modules/crm";

interface Props {
  attachments: CustomerAttachment[];
}

export default function CustomerAttachmentsSection({ attachments }: Props) {
  return (
    <Card title="Attachments" description="Uploaded customer documents.">
      {attachments.length === 0 ? (
        <p className="text-sm text-brand-text-secondary">
          No attachments uploaded.
        </p>
      ) : (
        <div className="space-y-3 mt-4">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border border-brand-border px-4 py-3"
            >
              <div>
                <p className="font-medium">{file.fileName}</p>

                <p className="text-xs text-brand-text-secondary">
                  {file.documentType}
                </p>
              </div>

              <a
                href={file.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-brand-purple hover:underline"
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
