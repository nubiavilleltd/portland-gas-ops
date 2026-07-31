"use client";

import Card from "@/components/ui/Card";
import FormTextarea from "@/components/forms/FormTextarea";

interface Props {
  value: string;

  error?: string;

  readOnly?: boolean;

  onChange: (value: string) => void;
}

export default function InternalNotesCard({
  value,
  error,
  readOnly = false,
  onChange,
}: Props) {
  return (
    <Card>
      <h2 className="mb-5 text-base font-semibold text-brand-text-primary">
        Internal Notes
      </h2>

      <FormTextarea
        label="Notes"
        placeholder="Add internal notes about this customer..."
        value={value ?? ""}
        error={error}
        readOnly={readOnly}
        maxLength={1000}
        onChange={(e) => onChange(e.target.value)}
      />
    </Card>
  );
}
