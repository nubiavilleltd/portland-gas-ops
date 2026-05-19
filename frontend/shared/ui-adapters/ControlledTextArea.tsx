"use client";

import { Controller, useFormContext } from "react-hook-form";
import FormTextarea from "@/components/forms/FormTextarea";

interface Props {
  name: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function ControlledTextarea({
  name,
  label,
  placeholder,
  disabled,
  required,
}: Props) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormTextarea
          label={label}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          value={field.value ?? ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}