"use client";

import { forwardRef } from "react";
import DatePicker from "./DatePicker";

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label: string;
  error?: string;
  hint?: string;
  onValueChange?: (value: string) => void;
  triggerClassName?: string;
  dropdownClassName?: string;
  formatDisplayValue?: (value: string) => string;
}

const FormDatePicker = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <DatePicker ref={ref} {...props} />;
});
FormDatePicker.displayName = "FormDatePicker";
export default FormDatePicker;
