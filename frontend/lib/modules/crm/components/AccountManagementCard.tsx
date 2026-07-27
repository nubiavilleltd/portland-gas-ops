"use client";
import type { CustomerForm } from "../types";

import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";

type Props = {
  values: {
    customerType: string;
    salesContact: string | null;
    referrerType: string;
    referrerId: string;
  };
  readOnly?: boolean;
  errors?: Record<string, string>;
  onChange: <K extends keyof CustomerForm>(
    field: K,
    value: CustomerForm[K],
  ) => void;
};

const EMPLOYEE_OPTIONS = [
  { label: "Magdalene Princess", value: "Magdalene Princess" },
  { label: "John Doe", value: "John Doe" },
  { label: "Sarah James", value: "Sarah James" },
];

const REFERRER_TYPES = [
  { label: "Employee", value: "employee" },
  { label: "Existing Customer", value: "customer" },
  { label: "Partner", value: "partner" },
  { label: "Consultant", value: "consultant" },
  { label: "Marketing", value: "marketing" },
];

export default function AccountManagementCard({
  values,
  errors = {},
  readOnly = false,
  onChange,
}: Props) {
  return (
    <FormSection
      title="Account Management"
      description="Assign ownership of this customer and capture referral information."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <FormInput
          label="Customer Type"
          value={
            values.customerType === "purchasing"
              ? "Purchasing Customer"
              : "Potential Customer"
          }
          disabled={readOnly}
        />

        <FormSelect
          label="Sales Contact"
          value={values.salesContact ?? ""}
          placeholder="Select sales contact"
          options={EMPLOYEE_OPTIONS}
          error={errors.salesContact}
          onValueChange={(value) => onChange("salesContact", value)}
          disabled={readOnly}
        />

        <FormSelect
          label="Referrer Type"
          value={values.referrerType}
          options={REFERRER_TYPES}
          error={errors.referrerType}
          onValueChange={(value) => {
            onChange("referrerType", value as CustomerForm["referrerType"]);
            onChange("referrerId", "");
          }}
          disabled={readOnly}
        />

        {values.referrerType === "employee" ? (
          <FormSelect
            label="Referrer"
            value={values.referrerId}
            placeholder="Select employee"
            options={EMPLOYEE_OPTIONS}
            error={errors.referrer}
            onValueChange={(value) => onChange("referrerId", value)}
            disabled={readOnly}
          />
        ) : (
          <FormInput
            label="Referrer"
            placeholder="Enter referrer"
            value={values.referrerId}
            error={errors.referrer}
            onChange={(e) => onChange("referrerId", e.target.value)}
            disabled={readOnly}
          />
        )}
      </div>
    </FormSection>
  );
}
