"use client";

import Card from "@/components/ui/Card";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
interface Props {
  values: {
    country: string;
    state: string;
    city: string;
    addressLine1: string;
    addressLine2: string;
    postalCode: string;
  };

  errors?: Partial<Record<keyof Props["values"], string>>;

  readOnly?: boolean;

  onChange?: (field: keyof Props["values"], value: string) => void;
}
const COUNTRIES = [
  { value: "Nigeria", label: "Nigeria" },
  { value: "Ghana", label: "Ghana" },
  { value: "Kenya", label: "Kenya" },
  { value: "South Africa", label: "South Africa" },
  { value: "United States", label: "United States" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Canada", label: "Canada" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
  { value: "India", label: "India" },
  { value: "China", label: "China" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "Netherlands", label: "Netherlands" },
  { value: "Australia", label: "Australia" },
];

export default function AddressInformationCard({
  values,
  errors,
  readOnly = false,
  onChange,
}: Props) {
  return (
    <Card>
      <h2 className="mb-5 text-base font-semibold text-brand-text-primary">
        Address Information
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormSelect
          label="Country"
          required
          value={values.country}
          error={errors?.country}
          disabled={readOnly}
          options={COUNTRIES}
          onValueChange={(value) => onChange?.("country", value)}
        />

        <FormInput
          label="State"
          placeholder="Enter State"
          required
          value={values.state}
          error={errors?.state}
          readOnly={readOnly}
          onChange={(e) => onChange?.("state", e.target.value)}
        />

        <FormInput
          label="City"
          placeholder="Enter City"
          required
          value={values.city}
          error={errors?.city}
          readOnly={readOnly}
          onChange={(e) => onChange?.("city", e.target.value)}
        />

        <FormInput
          label="Postal Code"
          placeholder="Enter Postal Code"
          value={values.postalCode ?? ""}
          error={errors?.postalCode}
          readOnly={readOnly}
          onChange={(e) => onChange?.("postalCode", e.target.value)}
        />

        <div className="md:col-span-2">
          <FormInput
            label="Address Line 1"
            placeholder="Enter Address Line 1"
            required
            value={values.addressLine1}
            error={errors?.addressLine1}
            readOnly={readOnly}
            onChange={(e) => onChange?.("addressLine1", e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <FormInput
            label="Address Line 2"
            placeholder="Enter Address Line 2"
            value={values.addressLine2 ?? ""}
            error={errors?.addressLine2}
            readOnly={readOnly}
            onChange={(e) => onChange?.("addressLine2", e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
}
