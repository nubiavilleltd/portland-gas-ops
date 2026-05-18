"use client";

import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

const FormTextarea = forwardRef<HTMLTextAreaElement, Props>(
  (
    {
      label,
      error,
      hint,
      className,
      id,
      rows = 4,
      maxLength = 500,
      value,
      defaultValue,
      onChange,
      readOnly,
      disabled,
      ...props
    },
    ref
  ) => {
    const textareaId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const isControlled = value !== undefined;
    const [uncontrolledLength, setUncontrolledLength] = useState(() =>
      defaultValue === undefined ? 0 : String(defaultValue).length
    );
    const currentLength = isControlled ? String(value ?? "").length : uncontrolledLength;
    const shouldBeReadOnly = readOnly ?? (value !== undefined && onChange === undefined);

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={textareaId} className="text-sm font-medium text-brand-text-primary">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          {...props}
          ref={ref}
          id={textareaId}
          rows={rows}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          readOnly={shouldBeReadOnly}
          className={cn(
            "rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-shadow resize-none",
            (disabled || shouldBeReadOnly) &&
              "cursor-not-allowed border-gray-200 bg-gray-300 opacity-50 shadow-none focus:ring-0 focus:border-gray-200",
            error && "border-red-400 focus:ring-red-400",
            className
          )}
          onChange={(event) => {
            if (!isControlled) {
              setUncontrolledLength(event.target.value.length);
            }
            onChange?.(event);
          }}
        />
        <div className="flex items-start justify-between gap-3">
          <div>
            {hint && !error && <p className="text-xs text-brand-text-secondary">{hint}</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
          <p className="ml-auto shrink-0 text-xs text-brand-text-secondary">
            {currentLength}/{maxLength}
          </p>
        </div>
      </div>
    );
  }
);
FormTextarea.displayName = "FormTextarea";
export default FormTextarea;
