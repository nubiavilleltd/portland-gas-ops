"use client";

import { forwardRef } from "react";
import MultiSelectInput from "./MultiSelectInput";
import type { SelectOption } from "./SelectInput";

interface Props
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "onChange" | "value" | "defaultValue"
  > {
  label: string;
  options: SelectOption[];
  value?: string[];
  defaultValue?: string[];
  placeholder?: string;
  error?: string;
  hint?: string;
  searchable?: boolean;
  sortOptions?: boolean;
  searchPlaceholder?: string;
  creatable?: boolean;
  onValueChange?: (value: string[]) => void;
}

const FormMultiSelect = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <MultiSelectInput ref={ref} {...props} />;
});

FormMultiSelect.displayName = "FormMultiSelect";

export default FormMultiSelect;
