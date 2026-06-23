"use client";

import { forwardRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const FormFileUpload = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, className, id, onChange, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const [fileName, setFileName] = useState<string>("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFileName(e.target.files?.[0]?.name ?? "");
      onChange?.(e);
    };

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-brand-text-primary">
          {label}
        </label>
        <div
          className={cn(
            "relative flex h-10 items-center gap-2 overflow-hidden rounded-lg border border-dashed bg-white px-3 text-sm transition-colors",
            fileName
              ? "border-brand-purple text-brand-text-primary"
              : "border-brand-border text-brand-text-secondary hover:border-brand-purple hover:text-brand-purple",
            error && "border-red-400",
            className
          )}
        >
          <Paperclip size={14} className="shrink-0" />
          <span className="flex-1 truncate">
            {fileName || "Choose file or drag and drop"}
          </span>
          {fileName && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setFileName("");
                // Reset the underlying input value so the same file can be re-selected
                const input = document.getElementById(inputId) as HTMLInputElement | null;
                if (input) input.value = "";
                // Synthesise a change event with no files so external onChange is notified
                const synth = Object.create(e.nativeEvent, { target: { value: input } });
                onChange?.(synth as unknown as React.ChangeEvent<HTMLInputElement>);
              }}
              className="shrink-0 text-brand-text-secondary hover:text-red-500 transition-colors"
              title="Remove file"
            >
              <X size={13} />
            </button>
          )}
          <input
            ref={ref}
            id={inputId}
            type="file"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={handleChange}
            {...props}
          />
        </div>
        {hint && !error && <p className="text-xs text-brand-text-secondary">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
FormFileUpload.displayName = "FormFileUpload";
export default FormFileUpload;
