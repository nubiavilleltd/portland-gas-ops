"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label: string;
  error?: string;
  hint?: string;
  onValueChange?: (value: string) => void;
  triggerClassName?: string;
  dropdownClassName?: string;
}

function parseDate(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value?: string) {
  const parsed = parseDate(value);
  if (!parsed) return "";

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getMonthDays(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function setNativeInputValue(input: HTMLInputElement, nextValue: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;

  valueSetter?.call(input, nextValue);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

const DatePicker = forwardRef<HTMLInputElement, Props>(
  (
    {
      label,
      error,
      hint,
      className,
      triggerClassName,
      dropdownClassName,
      id,
      value,
      defaultValue,
      onValueChange,
      onBlur,
      placeholder = "Select date",
      disabled,
      required,
      min,
      max,
      name,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const hiddenInputRef = useRef<HTMLInputElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const today = useMemo(() => new Date(), []);
    const isControlled = value !== undefined;
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(
      typeof defaultValue === "string" ? defaultValue : ""
    );

    const selectedValue = isControlled ? String(value ?? "") : internalValue;
    const selectedDate = parseDate(selectedValue);
    const [viewDate, setViewDate] = useState<Date>(selectedDate ?? today);

    const minDate = parseDate(typeof min === "string" ? min : undefined);
    const maxDate = parseDate(typeof max === "string" ? max : undefined);

    useEffect(() => {
      if (selectedDate) {
        setViewDate(selectedDate);
      }
    }, [selectedValue]); // selectedDate is derived from selectedValue — don't include it or it creates an infinite loop

    useEffect(() => {
      if (!open) return;

      function handleClickOutside(event: MouseEvent) {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
          onBlur?.({ target: hiddenInputRef.current } as React.FocusEvent<HTMLInputElement>);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, onBlur]);

    useEffect(() => {
      if (isControlled && hiddenInputRef.current) {
        hiddenInputRef.current.value = selectedValue;
      }
    }, [isControlled, selectedValue]);

    function setRefs(node: HTMLInputElement | null) {
      hiddenInputRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }

    function isDayDisabled(day: Date) {
      if (minDate && day < minDate) return true;
      if (maxDate && day > maxDate) return true;
      return false;
    }

    function updateValue(nextValue: string) {
      if (!isControlled) {
        setInternalValue(nextValue);
      }

      if (hiddenInputRef.current) {
        setNativeInputValue(hiddenInputRef.current, nextValue);
      }

      onValueChange?.(nextValue);
    }

    function selectDay(dayNumber: number) {
      const nextDate = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth(),
        dayNumber
      );
      updateValue(toISODate(nextDate));
      setOpen(false);
      onBlur?.({ target: hiddenInputRef.current } as React.FocusEvent<HTMLInputElement>);
    }

    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const daysInMonth = getMonthDays(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const cells = [
      ...Array(firstDayOfMonth).fill(null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];

    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div ref={containerRef} className={cn("relative flex flex-col gap-1", className)}>
        <label htmlFor={inputId} className="text-sm font-medium text-brand-text-primary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <input
          {...props}
          ref={setRefs}
          id={`${inputId}-value`}
          name={name}
          type="hidden"
          value={selectedValue}
          readOnly
        />

        <button
          type="button"
          id={inputId}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "h-10 rounded-lg border border-brand-border bg-white px-3 text-sm text-left transition-shadow",
            "flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent",
            error && "border-red-400 focus:ring-red-400",
            disabled && "cursor-not-allowed bg-gray-50 text-brand-text-secondary opacity-70",
            triggerClassName
          )}
        >
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-brand-text-secondary" />
            <span className={cn(selectedValue ? "text-brand-text-primary" : "text-brand-text-secondary")}>
              {selectedValue ? formatDisplayDate(selectedValue) : placeholder}
            </span>
          </div>
          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-brand-text-secondary transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        {open && !disabled && (
          <div
            className={cn(
              "absolute top-full z-50 mt-1 w-full max-w-[320px] overflow-hidden rounded-2xl border border-brand-border bg-white shadow-xl",
              dropdownClassName
            )}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <button
                type="button"
                onClick={() =>
                  setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                }
                className="rounded-full p-1 text-brand-text-secondary transition-colors hover:bg-gray-100 hover:text-brand-text-primary"
              >
                <ChevronLeft size={16} />
              </button>

              <p className="text-sm font-semibold text-brand-text-primary">
                {MONTHS[month]} {year}
              </p>

              <button
                type="button"
                onClick={() =>
                  setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                }
                className="rounded-full p-1 text-brand-text-secondary transition-colors hover:bg-gray-100 hover:text-brand-text-primary"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 px-3 pt-3 pb-1">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-xs font-medium text-brand-text-secondary"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1 px-3 pb-3">
              {cells.map((dayNumber, index) => {
                if (!dayNumber) return <div key={`empty-${index}`} />;

                const currentDate = new Date(year, month, dayNumber);
                const disabledDay = isDayDisabled(currentDate);
                const isSelected =
                  selectedDate &&
                  dayNumber === selectedDate.getDate() &&
                  month === selectedDate.getMonth() &&
                  year === selectedDate.getFullYear();
                const isToday =
                  dayNumber === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear();

                return (
                  <button
                    key={dayNumber}
                    type="button"
                    disabled={disabledDay}
                    onClick={() => selectDay(dayNumber)}
                    className={cn(
                      "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                      isSelected
                        ? "bg-brand-purple text-white font-semibold"
                        : isToday
                          ? "border border-brand-purple text-brand-purple font-semibold hover:bg-brand-purple-faint"
                          : disabledDay
                            ? "cursor-not-allowed text-gray-300"
                            : "text-brand-text-primary hover:bg-gray-100"
                    )}
                  >
                    {dayNumber}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2">
              <button
                type="button"
                onClick={() => {
                  setViewDate(today);
                  updateValue(toISODate(today));
                  setOpen(false);
                  onBlur?.({ target: hiddenInputRef.current } as React.FocusEvent<HTMLInputElement>);
                }}
                className="text-xs font-medium text-brand-purple transition-colors hover:text-brand-purple-dark"
              >
                Today
              </button>

              {!required && selectedValue ? (
                <button
                  type="button"
                  onClick={() => {
                    updateValue("");
                    setOpen(false);
                    onBlur?.({ target: hiddenInputRef.current } as React.FocusEvent<HTMLInputElement>);
                  }}
                  className="text-xs font-medium text-brand-text-secondary transition-colors hover:text-brand-text-primary"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        )}

        {hint && !error && <p className="text-xs text-brand-text-secondary">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export default DatePicker;
 