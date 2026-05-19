"use client";

import { Controller, useFormContext } from "react-hook-form";
import FormDatePicker from "@/components/forms/FormDatePicker";

interface ControlledDatePickerProps {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  hint?: string;
}

export default function ControlledDatePicker({
  name,
  label,
  required,
  disabled,
  placeholder,
  error,
  hint,
}: ControlledDatePickerProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormDatePicker
          label={label}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={field.value ?? ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message || error}
          hint={hint}
        />
      )}
    />
  );
}