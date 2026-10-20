"use client";

import Card from "@/components/ui/Card";
import FormInput from "@/components/forms/FormInput";
interface Props {
  values: {
    address: string;
    postalCode: string;
  };

  errors?: Partial<Record<keyof Props["values"], string>>;

  readOnly?: boolean;

  onChange?: (field: keyof Props["values"], value: string) => void;
}

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
        <div className="md:col-span-2">
          <FormInput
            label="Address"
            placeholder="Enter full address"
            required
            value={values.address}
            error={errors?.address}
            readOnly={readOnly}
            onChange={(e) => onChange?.("address", e.target.value)}
          />
        </div>

        <FormInput
          label="Postal Code"
          placeholder="Enter Postal Code"
          value={values.postalCode ?? ""}
          error={errors?.postalCode}
          readOnly={readOnly}
          onChange={(e) =>
            onChange?.("postalCode", e.target.value.replace(/\D/g, ""))
          }
        />
      </div>
    </Card>
  );
}
