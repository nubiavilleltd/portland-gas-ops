"use client";

import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormSection from "@/components/ui/FormSection";

interface Values {
  department: string;
  preferred_channel: string;
  position: string;
  role: string;
}

interface Props {
  values: Values;
  errors?: Partial<Record<keyof Values, string>>;
  readOnly?: boolean;
  onChange?: (field: keyof Values, value: string) => void;
}

export default function EmploymentInformationCard({
  values,
  errors = {},
  readOnly,
  onChange,
}: Props) {
  return (
    <FormSection
      title="Work Information"
      description="Department and preferred contact method."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormInput
          label="Department"
          value={values.department}
          placeholder="Enter Department"
          disabled={readOnly}
          error={errors.department}
          onChange={(e) => onChange?.("department", e.target.value)}
        />
        <FormInput
          label="Position"
          value={values.position}
          placeholder="Enter Position"
          disabled={readOnly}
          error={errors.position}
          onChange={(e) => onChange?.("position", e.target.value)}
        />{" "}
        <FormInput
          label="Role"
          value={values.role}
          placeholder="Enter Role"
          disabled={readOnly}
          error={errors.role}
          onChange={(e) => onChange?.("role", e.target.value)}
        />
        <FormSelect
          label="Preferred Contact Channel"
          value={values.preferred_channel}
          disabled={readOnly}
          error={errors.preferred_channel}
          options={[
            { label: "Email", value: "Email" },
            { label: "Phone", value: "Phone" },
            { label: "WhatsApp", value: "WhatsApp" },
          ]}
          onValueChange={(value) => onChange?.("preferred_channel", value)}
        />
      </div>
    </FormSection>
  );
}
