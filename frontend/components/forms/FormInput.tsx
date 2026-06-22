"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const FormInput = forwardRef<HTMLInputElement, Props>(
  (
    {
      label,
      error,
      hint,
      className,
      id,
      type,
      value,
      onChange,
      readOnly,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const isPassword = type === "password";
    const shouldBeReadOnly = readOnly ?? (value !== undefined && onChange === undefined);
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-brand-text-primary">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <input
            suppressHydrationWarning
            {...props}
            ref={ref}
            id={inputId}
            type={isPassword ? (showPassword ? "text" : "password") : type}
            autoCapitalize={type === "email" || isPassword ? undefined : "none"}
            autoCorrect={type === "email" || isPassword ? undefined : "off"}
            value={value}
            onChange={onChange}
            disabled={disabled}
            readOnly={shouldBeReadOnly}
            className={cn(
              "h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-shadow",
              (disabled || shouldBeReadOnly) &&
                "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-900 opacity-80 shadow-none placeholder:text-brand-text-secondary focus:ring-0 focus:border-gray-200",
              isPassword && "pr-10",
              error && "border-red-400 focus:ring-red-400",
              className
            )}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {hint && !error && <p className="text-xs text-brand-text-secondary">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
FormInput.displayName = "FormInput";
export default FormInput;
