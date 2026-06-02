import { Controller } from "react-hook-form";
import CurrencyInput from "./CurrencyInput";

export function FormCurrencyInput({
  control,
  name,
  label,
  error,
}: {
  control: any;
  name: string;
  label: string;
  error?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <CurrencyInput
          label={label}
          value={field.value}
          error={error}
          onValueChange={field.onChange}
        />
      )}
    />
  );
}