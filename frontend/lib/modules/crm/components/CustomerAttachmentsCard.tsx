"use client";

import Card from "@/components/ui/Card";
import FormFileUpload from "@/components/forms/FormFileUpload";

export interface CustomerAttachments {
  cacCertificate: File | null;
  tinCertificate: File | null;
  vatCertificate: File | null;
  businessLogo: File | null;
  otherDocuments: File[];
}

interface Props {
  values: CustomerAttachments;
  onChange?: (value: CustomerAttachments) => void;
  readOnly?: boolean;
}

export default function CustomerAttachmentsCard({ values, onChange }: Props) {
  return (
    <Card
      title="Attachments"
      description="Upload supporting documents for customer onboarding."
    >
      <div className="grid grid-cols-1 gap-5 mt-5 md:grid-cols-2">
        <FormFileUpload
          label="CAC Certificate"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) =>
            onChange?.({
              ...values,
              cacCertificate: e.target.files?.[0] ?? null,
            })
          }
        />

        <FormFileUpload
          label="TIN Certificate"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) =>
            onChange?.({
              ...values,
              tinCertificate: e.target.files?.[0] ?? null,
            })
          }
        />

        <FormFileUpload
          label="VAT Certificate"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) =>
            onChange?.({
              ...values,
              vatCertificate: e.target.files?.[0] ?? null,
            })
          }
        />

        <FormFileUpload
          label="Business Logo"
          accept=".jpg,.jpeg,.png,.svg"
          onChange={(e) =>
            onChange?.({
              ...values,
              businessLogo: e.target.files?.[0] ?? null,
            })
          }
        />

        <div className="md:col-span-2">
          <FormFileUpload
            label="Other Supporting Documents"
            multiple
            onChange={(e) =>
              onChange?.({
                ...values,
                otherDocuments: e.target.files
                  ? Array.from(e.target.files)
                  : [],
              })
            }
          />
        </div>
      </div>
    </Card>
  );
}
