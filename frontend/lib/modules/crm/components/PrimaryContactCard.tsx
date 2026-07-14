"use client";

import Card from "@/components/ui/Card";
import FormInput from "@/components/forms/FormInput";

interface Props {
  values: {
    contactPerson: string;
    designation: string;
    email: string;
    phone: string;
    alternatePhone: string;
  };

  errors?: Partial<Record<keyof Props["values"], string>>;

  readOnly?: boolean;

  onChange?: (field: string, value: string) => void;
}

export default function PrimaryContactCard({
  values,
  errors = {},
  onChange,
  readOnly = false,
}: Props) {
  return (
    <Card>
      <h2 className="mb-5 text-base font-semibold text-brand-text-primary">
        Primary Contact
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormInput
          label="Contact Person"
          required
          value={values.contactPerson}
          error={errors?.contactPerson}
          readOnly={readOnly}
          onChange={(e) => onChange?.("contactPerson", e.target.value)}
        />

        <FormInput
          label="Designation"
          value={values.designation}
          error={errors?.designation}
          readOnly={readOnly}
          onChange={(e) => onChange?.("designation", e.target.value)}
        />

        <FormInput
          label="Email Address"
          type="email"
          required
          value={values.email}
          error={errors?.email}
          readOnly={readOnly}
          onChange={(e) => onChange?.("email", e.target.value)}
        />

        <FormInput
          label="Phone Number"
          required
          value={values.phone}
          error={errors?.phone}
          readOnly={readOnly}
          onChange={(e) => onChange?.("phone", e.target.value)}
        />

        <FormInput
          label="Alternative Phone"
          value={values.alternatePhone}
          error={errors?.alternatePhone}
          readOnly={readOnly}
          onChange={(e) => onChange?.("alternatePhone", e.target.value)}
        />
      </div>
    </Card>
  );
}
