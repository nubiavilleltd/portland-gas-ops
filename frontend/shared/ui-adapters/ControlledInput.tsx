"use client";

import { Controller, useFormContext } from "react-hook-form";
import FormInput from "@/components/forms/FormInput";

interface ControlledInputProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
}

export default function ControlledInput({
  name,
  label,
  type = "text",
  placeholder,
  required,
  disabled,
  error,
  hint,
}: ControlledInputProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormInput
          label={label}
          type={type}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
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