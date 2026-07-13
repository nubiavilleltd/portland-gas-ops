"use client";

import Card from "@/components/ui/Card";
import FormInput from "@/components/forms/FormInput";

interface Props {
  values: {
    rcNumber: string;
    tin: string;
    vatNumber: string;
    industry: string;
  };

  errors?: Partial<Record<keyof Props["values"], string>>;

  readOnly?: boolean;

  onChange?: (field: keyof Props["values"], value: string) => void;
}

export default function BusinessInformationCard({
  values,
  errors,
  readOnly = false,
  onChange,
}: Props) {
  return (
    <Card>
      <h2 className="mb-5 text-base font-semibold text-brand-text-primary">
        Business Information
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormInput
          label="Registered Company Number"
          value={values.rcNumber}
          error={errors?.rcNumber}
          readOnly={readOnly}
          onChange={(e) => onChange?.("rcNumber", e.target.value)}
        />

        <FormInput
          label="TIN"
          value={values.tin}
          error={errors?.tin}
          readOnly={readOnly}
          onChange={(e) => onChange?.("tin", e.target.value)}
        />

        <FormInput
          label="VAT Number"
          value={values.vatNumber}
          error={errors?.vatNumber}
          readOnly={readOnly}
          onChange={(e) => onChange?.("vatNumber", e.target.value)}
        />

        <FormInput
          label="Industry"
          value={values.industry}
          error={errors?.industry}
          readOnly={readOnly}
          onChange={(e) => onChange?.("industry", e.target.value)}
        />
      </div>
    </Card>
  );
}
