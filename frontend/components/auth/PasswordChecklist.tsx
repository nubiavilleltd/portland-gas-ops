"use client";

import { Check, X } from "lucide-react";

const checks = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
  { label: "One special character", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

interface Props {
  password: string;
  visible: boolean;
}

export default function PasswordChecklist({ password, visible }: Props) {
  if (!visible) return null;

  return (
    <div className="bg-gray-50 border border-brand-border rounded-lg px-3 py-2.5 space-y-1.5">
      {checks.map(({ label, test }) => {
        const passed = test(password);
        return (
          <div key={label} className="flex items-center gap-2">
            <span className={`flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center transition-colors ${passed ? "bg-green-500" : "bg-gray-200"}`}>
              {passed
                ? <Check size={10} strokeWidth={3} className="text-white" />
                : <X size={10} strokeWidth={3} className="text-gray-400" />
              }
            </span>
            <span className={`text-xs transition-colors ${passed ? "text-green-700" : "text-brand-text-secondary"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
