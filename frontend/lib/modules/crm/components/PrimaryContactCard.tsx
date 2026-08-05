"use client";

import Card from "@/components/ui/Card";
import FormInput from "@/components/forms/FormInput";
import type { CustomerForm } from "../types";
import FormSelect from "@/components/forms/FormSelect";

type PrimaryContactField =
  | "contactPerson"
  | "department"
  | "position"
  | "role"
  | "preferredChannel"
  | "email"
  | "phone"
  | "alternatePhone";

interface Props {
  values: {
    contactPerson: string;
    department: string;
    email: string;
    phone: string;
    position: string;
    role: string;
    preferredChannel: string;
    alternatePhone: string | null;
  };

  errors?: Partial<Record<keyof Props["values"], string>>;

  readOnly?: boolean;

  onChange?: (
    field: PrimaryContactField,
    value: CustomerForm[PrimaryContactField],
  ) => void;
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
          placeholder="Enter Contact Person"
          required
          value={values.contactPerson}
          error={errors?.contactPerson}
          readOnly={readOnly}
          onChange={(e) => onChange?.("contactPerson", e.target.value)}
        />

        <FormInput
          label="Department"
          placeholder="Enter Department"
          required
          value={values.department}
          error={errors?.department}
          readOnly={readOnly}
          onChange={(e) => onChange?.("department", e.target.value)}
        />

        <FormInput
          label="Email Address"
          placeholder="Enter Email Address"
          type="email"
          required
          value={values.email}
          error={errors?.email}
          readOnly={readOnly}
          onChange={(e) => onChange?.("email", e.target.value)}
        />

        <FormInput
          label="Phone Number"
          placeholder="Enter Phone Number"
          required
          value={values.phone}
          error={errors?.phone}
          readOnly={readOnly}
          onChange={(e) => {
            const value = e.target.value;
            if (/^[0-9+\s-]*$/.test(value)) {
              onChange?.("phone", value);
            }
          }}
        />

        <FormInput
          label="Alternative Phone"
          placeholder="Enter Alternative Phone"
          value={values.alternatePhone ?? ""}
          error={errors?.alternatePhone}
          readOnly={readOnly}
          onChange={(e) => {
            const value = e.target.value;
            // allow only phone characters
            if (/^[0-9+\s-]*$/.test(value)) {
              onChange?.("phone", value);
            }
          }}
        />

        <FormInput
          label="Position"
          value={values.position}
          required
          placeholder="Enter Position"
          disabled={readOnly}
          error={errors.position}
          onChange={(e) => onChange?.("position", e.target.value)}
        />
        <FormInput
          label="Role"
          value={values.role}
          placeholder="Enter Role"
          disabled={readOnly}
          error={errors.role}
          required
          onChange={(e) => onChange?.("role", e.target.value)}
        />
        <FormSelect
          label="Preferred Contact Channel"
          value={values.preferredChannel}
          disabled={readOnly}
          required
          error={errors.preferredChannel}
          options={[
            { label: "Email", value: "email" },
            { label: "Phone", value: "phone" },
            { label: "WhatsApp", value: "whatsapp" },
          ]}
          onValueChange={(value) => onChange?.("preferredChannel", value)}
        />
      </div>
    </Card>
  );
}
