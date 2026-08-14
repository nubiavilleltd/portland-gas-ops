"use client";

import Card from "@/components/ui/Card";
import FormInput from "@/components/forms/FormInput";
import SelectInput from "@/components/forms/SelectInput";

interface Props {
  values: {
    rcNumber: string;
    tin: string;
    vatNumber: string;
    industry: string;
    otherIndustry: string;
  };

  errors?: Partial<Record<keyof Props["values"], string>>;

  readOnly?: boolean;

  onChange?: (field: keyof Props["values"], value: string) => void;
}
export const INDUSTRIES = [
  "oil_and_gas",
  "manufacturing",
  "construction",
  "telecommunications",
  "banking_and_finance",
  "healthcare",
  "pharmaceuticals",
  "agriculture",
  "transportation_and_logistics",
  "retail",
  "wholesale",
  "hospitality",
  "real_estate",
  "education",
  "government",
  "energy",
  "technology",
  "professional_services",
  "other",
] as const;
export default function BusinessInformationCard({
  values,
  errors,
  readOnly = false,
  onChange,
}: Props) {
  const isOtherIndustry = values.industry === "other";

  return (
    <Card>
      <h2 className="mb-5 text-base font-semibold text-brand-text-primary">
        Business Information
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormInput
          label="Registered Company Number"
          placeholder="Enter Registered Company Number"
          value={values.rcNumber}
          error={errors?.rcNumber}
          required
          readOnly={readOnly}
          onChange={(e) => onChange?.("rcNumber", e.target.value)}
        />

        <FormInput
          label="TIN"
          placeholder="Enter Tax Identification Number"
          value={values.tin ?? ""}
          error={errors?.tin}
          readOnly={readOnly}
          onChange={(e) => onChange?.("tin", e.target.value)}
        />

        <FormInput
          label="VAT Number"
          placeholder="Enter VAT Number"
          value={values.vatNumber ?? ""}
          error={errors?.vatNumber}
          readOnly={readOnly}
          onChange={(e) => onChange?.("vatNumber", e.target.value)}
        />

        <SelectInput
          label="Industry"
          required
          value={values.industry}
          error={errors?.industry}
          disabled={readOnly}
          options={INDUSTRIES.map((industry) => ({
            label: industry
              .replace(/_/g, " ")
              .replace(/\b\w/g, (char) => char.toUpperCase()),
            value: industry,
          }))}
          onValueChange={(value) => onChange?.("industry", value)}
        />

        {isOtherIndustry && (
          <FormInput
            label="Other Industry"
            placeholder="Enter Industry"
            value={values.otherIndustry}
            error={errors?.otherIndustry}
            required
            readOnly={readOnly}
            onChange={(e) => onChange?.("otherIndustry", e.target.value)}
          />
        )}
      </div>
    </Card>
  );
}
