"use client";

import { forwardRef } from "react";
import SelectInput, { type SelectOption } from "./SelectInput";

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
  searchable?: boolean;
  sortOptions?: boolean;
  searchPlaceholder?: string;
  creatable?: boolean;
  titleCaseOptions?: boolean;
  onValueChange?: (value: string) => void;
  triggerClassName?: string;
  dropdownClassName?: string;
  dropdownPosition?: "bottom" | "top" | "auto";
}

const FormSelect = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <SelectInput ref={ref} {...props} />;
});
FormSelect.displayName = "FormSelect";
export default FormSelect;
