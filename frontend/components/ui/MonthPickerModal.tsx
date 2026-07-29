"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export interface MonthSelection {
  year: number;
  month: number; // 0-indexed
  label: string; // e.g. "November 2026"
}

/**
 * Reusable month/year picker modal. Used to choose a payroll period (payslips)
 * and a loan start month (employee loans).
 */
export default function MonthPickerModal({
  title = "Select Month",
  description,
  confirmLabel = "Select",
  initialYear,
  initialMonth = new Date().getMonth(),
  onConfirm,
  onCancel,
}: {
  title?: string;
  description?: string;
  confirmLabel?: string;
  initialYear?: number;
  initialMonth?: number | null;
  onConfirm: (selection: MonthSelection) => void;
  onCancel: () => void;
}) {
  const now = new Date();
  const [year, setYear] = useState(initialYear ?? now.getFullYear());
  const [month, setMonth] = useState<number | null>(initialMonth);

  const selectedLabel = month !== null ? `${MONTH_FULL[month]} ${year}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-7">
          {/* header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-brand-text-primary">{title}</h3>
              {description && <p className="text-sm text-brand-text-secondary mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onCancel}
              className="text-brand-text-secondary hover:text-brand-text-primary transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          {/* year navigation */}
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-brand-text-secondary hover:text-brand-text-primary"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-base font-bold text-brand-text-primary tracking-wide">{year}</span>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-brand-text-secondary hover:text-brand-text-primary"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* month grid — inline style forces 3-column layout regardless of Tailwind purge */}
          <div
            className="mb-6"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}
          >
            {MONTHS.map((m, i) => {
              const isSelected = month === i;
              const isCurrent = i === now.getMonth() && year === now.getFullYear();
              return (
                <button
                  key={m}
                  onClick={() => setMonth(i)}
                  className={`
                    relative py-2.5 rounded-xl text-sm font-medium transition-all text-center
                    ${isSelected
                      ? "bg-brand-purple text-white shadow-sm"
                      : "hover:bg-brand-purple-faint text-brand-text-primary hover:text-brand-purple"
                    }
                  `}
                >
                  {m}
                  {isCurrent && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-purple" />
                  )}
                </button>
              );
            })}
          </div>

          {/* selected label */}
          <div className="h-6 mb-5 flex items-center justify-center">
            {selectedLabel ? (
              <p className="text-sm font-semibold text-brand-purple">{selectedLabel}</p>
            ) : (
              <p className="text-sm text-brand-text-secondary">No month selected</p>
            )}
          </div>

          {/* actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => month !== null && selectedLabel && onConfirm({ year, month, label: selectedLabel })}
              disabled={month === null}
              className="flex-1"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
