"use client";

import Card from "@/components/ui/Card";
import FormInput from "@/components/forms/FormInput";
import SelectInput from "@/components/forms/SelectInput";

import { CUSTOMER_CATEGORIES, ENTITY_TYPES } from "../constants";

interface Props {
  values: {
    customerName: string;
    entityType: string;
    category: string;
  };

  errors?: Partial<Record<keyof Props["values"], string>>;

  readOnly?: boolean;

  onChange?: (field: keyof Props["values"], value: string) => void;
}

export default function CustomerInformationCard({
  values,
  errors,
  readOnly = false,
  onChange,
}: Props) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-brand-text-primary mb-5">
        Customer Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormInput
          label="Customer Name"
          required
          value={values.customerName}
          error={errors?.customerName}
          readOnly={readOnly}
          onChange={(e) => onChange?.("customerName", e.target.value)}
        />

        <SelectInput
          label="Entity Type"
          required
          value={values.entityType}
          error={errors?.entityType}
          disabled={readOnly}
          options={ENTITY_TYPES.map((type) => ({
            label: type.charAt(0).toUpperCase() + type.slice(1),
            value: type,
          }))}
          onValueChange={(value) => onChange?.("entityType", value)}
        />

        <SelectInput
          label="Customer Category"
          required
          value={values.category}
          error={errors?.category}
          disabled={readOnly}
          options={CUSTOMER_CATEGORIES.map((category) => ({
            label: category.charAt(0).toUpperCase() + category.slice(1),
            value: category,
          }))}
          onValueChange={(value) => onChange?.("category", value)}
        />
      </div>
    </Card>
  );
}
