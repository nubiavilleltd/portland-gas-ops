"use client";

import { Controller, useFormContext } from "react-hook-form";
import SelectInput, { SelectOption } from "@/components/forms/SelectInput";

interface ControlledSelectProps {
  name: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  searchable?: boolean;
  sortOptions?: boolean;
}

export default function ControlledSelect({
  name,
  label,
  options,
  placeholder,
  required,
  disabled,
  error,
  hint,
  searchable,
  sortOptions,
}: ControlledSelectProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <SelectInput
          label={label}
          options={options}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          searchable={searchable}
          sortOptions={sortOptions}
          value={field.value}
          onValueChange={field.onChange}
          error={fieldState.error?.message || error}
          hint={hint}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}