"use client";

import Card from "@/components/ui/Card";
import FormMultiSelect from "@/components/forms/FormMultiSelect";
import SelectInput from "@/components/forms/SelectInput";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";

import { PRODUCT_OPTIONS, DEMAND_RANGES, SUPPLY_METHODS } from "../constants";

interface Props {
  values: {
    preferredProducts: string[];
    supplyMethod: string;
    estimatedMonthlyDemand: string;
  };

  errors?: Partial<Record<keyof Props["values"], string>>;

  readOnly?: boolean;

  onChange?: (field: keyof Props["values"], value: string | string[]) => void;
}

export default function CommercialInformationCard({
  values,
  errors,
  readOnly = false,
  onChange,
}: Props) {
  const { products, isLoading, error, refetch } = useProducts();

  const productOptions = isLoading
    ? [{ label: "Loading products...", value: "", disabled: true }]
    : products
        .filter((item) => item.status === "active")
        .map((item) => ({
          label: item.name,
          value: item.productNo,
        }));

  return (
    <Card>
      <h2 className="mb-5 text-base font-semibold text-brand-text-primary">
        Commercial Information
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <FormMultiSelect
            label="Preferred Products"
            options={productOptions}
            placeholder={
              isLoading ? "Loading products..." : "Select one or more option"
            }
            value={values.preferredProducts}
            error={errors?.preferredProducts}
            disabled={readOnly || isLoading}
            onValueChange={(value) => onChange?.("preferredProducts", value)}
          />
        </div>

        <SelectInput
          label="Supply Method"
          value={values.supplyMethod}
          error={errors?.supplyMethod}
          disabled={readOnly}
          options={SUPPLY_METHODS.map((item) => ({
            label: item.charAt(0).toUpperCase() + item.slice(1),
            value: item,
          }))}
          onValueChange={(value) => onChange?.("supplyMethod", value)}
        />

        <SelectInput
          label="Estimated Monthly Demand"
          value={values.estimatedMonthlyDemand}
          error={errors?.estimatedMonthlyDemand}
          disabled={readOnly}
          options={DEMAND_RANGES.map((item) => ({
            label: item,
            value: item,
          }))}
          onValueChange={(value) => onChange?.("estimatedMonthlyDemand", value)}
        />
      </div>
    </Card>
  );
}
