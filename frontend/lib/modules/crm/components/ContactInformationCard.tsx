"use client";

import FormInput from "@/components/forms/FormInput";
import FormSection from "@/components/ui/FormSection";

interface Values {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone: string;
}

interface Props {
  values: Values;
  errors?: Partial<Record<keyof Values, string>>;
  readOnly?: boolean;
  onChange?: (field: keyof Values, value: string) => void;
}

export default function ContactInformationCard({
  values,
  errors = {},
  readOnly,
  onChange,
}: Props) {
  return (
    <FormSection
      title="Contact Information"
      description="Basic information about the customer contact."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="First Name"
          placeholder="Enter First Name"
          value={values.firstName}
          disabled={readOnly}
          error={errors.firstName}
          onChange={(e) => onChange?.("firstName", e.target.value)}
        />

        <FormInput
          label="Last Name"
          value={values.lastName}
          placeholder="Enter Last Name"
          disabled={readOnly}
          error={errors.lastName}
          onChange={(e) => onChange?.("lastName", e.target.value)}
        />

        <FormInput
          label="Email Address"
          value={values.email}
          placeholder="Enter Email Address"
          disabled={readOnly}
          error={errors.email}
          onChange={(e) => onChange?.("email", e.target.value)}
        />

        <FormInput
          label="Phone Number"
          placeholder="Enter Phone Number"
          value={values.phone}
          disabled={readOnly}
          error={errors.phone}
          onChange={(e) => onChange?.("phone", e.target.value)}
        />

        <FormInput
          label="Alternate Phone"
          value={values.alternatePhone}
          placeholder="Enter Alternate Phone Number"
          disabled={readOnly}
          error={errors.alternatePhone}
          onChange={(e) => onChange?.("alternatePhone", e.target.value)}
        />
      </div>
    </FormSection>
  );
}
