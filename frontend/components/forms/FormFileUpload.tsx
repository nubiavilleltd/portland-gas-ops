"use client";

import { forwardRef } from "react";
import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const FormFileUpload = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-brand-text-primary">
          {label}
        </label>
        <label
          htmlFor={inputId}
          className={cn(
            "flex items-center gap-2 h-10 rounded-lg border border-dashed border-brand-border bg-white px-3 text-sm text-brand-text-secondary cursor-pointer hover:border-brand-purple hover:text-brand-purple transition-colors",
            error && "border-red-400",
            className
          )}
        >
          <Paperclip size={14} />
          <span>Choose file or drag and drop</span>
        </label>
        <input
          ref={ref}
          id={inputId}
          type="file"
          className="sr-only"
          {...props}
        />
        {hint && !error && <p className="text-xs text-brand-text-secondary">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
FormFileUpload.displayName = "FormFileUpload";
export default FormFileUpload;
