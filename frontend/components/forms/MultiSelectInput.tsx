"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn, toTitleCase } from "@/lib/utils";
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
  triggerClassName?: string;
  dropdownClassName?: string;
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

const MultiSelectInput = forwardRef<HTMLInputElement, Props>(
  (
    {
      label,
      options,
      value,
      defaultValue,
      placeholder = "Select one or more options",
      error,
      hint,
      searchable,
      sortOptions = true,
      searchPlaceholder = "Search options",
      creatable = false,
      className,
      triggerClassName,
      dropdownClassName,
      id,
      onBlur,
      onValueChange,
      disabled,
      required,
      name,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const hiddenInputRef = useRef<HTMLInputElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string[]>(
      Array.isArray(defaultValue) ? defaultValue : []
    );

    const enableSearch = searchable ?? options.length > 5;
    const selectedValues = useMemo(
      () => (isControlled ? value ?? [] : internalValue),
      [internalValue, isControlled, value]
    );
    const trimmedSearchQuery = searchQuery.trim();

    const normalizedOptions = useMemo(() => {
      const mappedOptions = options.map((option) => ({
        ...option,
        displayLabel: toTitleCase(option.label),
      }));

      return sortOptions
        ? [...mappedOptions].sort((left, right) =>
            left.displayLabel.localeCompare(right.displayLabel)
          )
        : mappedOptions;
    }, [options, sortOptions]);

    const selectedOptions = useMemo(
      () =>
        selectedValues.map((currentValue) => {
          const existing = normalizedOptions.find(
            (option) => option.value === currentValue
          );

          return (
            existing ?? {
              value: currentValue,
              label: currentValue,
              displayLabel: toTitleCase(currentValue),
            }
          );
        }),
      [normalizedOptions, selectedValues]
    );

    const filteredOptions = useMemo(() => {
      if (!enableSearch || !trimmedSearchQuery) return normalizedOptions;

      const query = trimmedSearchQuery.toLowerCase();
      return normalizedOptions.filter(
        (option) =>
          option.displayLabel.toLowerCase().includes(query) ||
          option.value.toLowerCase().includes(query)
      );
    }, [enableSearch, normalizedOptions, trimmedSearchQuery]);

    const canCreateOption =
      creatable &&
      trimmedSearchQuery.length > 0 &&
      !normalizedOptions.some(
        (option) =>
          option.value.toLowerCase() === trimmedSearchQuery.toLowerCase() ||
          option.displayLabel.toLowerCase() === trimmedSearchQuery.toLowerCase()
      );

    useEffect(() => {
      if (!open) return;

      function handleClickOutside(event: MouseEvent) {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
          onBlur?.({
            target: hiddenInputRef.current,
          } as React.FocusEvent<HTMLInputElement>);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, onBlur]);

    useEffect(() => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = selectedValues.join(", ");
      }
    }, [selectedValues]);

    function setRefs(node: HTMLInputElement | null) {
      hiddenInputRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }

    function updateValue(nextValue: string[]) {
      if (!isControlled) {
        setInternalValue(nextValue);
      }

      if (hiddenInputRef.current) {
        setNativeInputValue(hiddenInputRef.current, nextValue.join(", "));
      }

      onValueChange?.(nextValue);
    }

    function toggleValue(nextValue: string) {
      const exists = selectedValues.includes(nextValue);
      const updatedValues = exists
        ? selectedValues.filter((item) => item !== nextValue)
        : [...selectedValues, nextValue];

      updateValue(updatedValues);
    }

    function handleCreate() {
      if (!trimmedSearchQuery) return;
      toggleValue(trimmedSearchQuery);
      setSearchQuery("");
    }

    return (
      <div ref={containerRef} className={cn("relative flex flex-col gap-1", className)}>
        <label htmlFor={inputId} className="text-sm font-medium text-brand-text-primary">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>

        <input
          {...props}
          ref={setRefs}
          id={`${inputId}-value`}
          name={name}
          type="hidden"
          value={selectedValues.join(", ")}
          disabled={disabled}
          readOnly
        />

        <button
          type="button"
          id={inputId}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "min-h-10 rounded-lg border border-brand-border bg-white px-3 py-2 text-left text-sm text-brand-text-primary transition-shadow",
            "flex items-start justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent",
            error && "border-red-400 focus:ring-red-400",
            disabled && "cursor-not-allowed bg-gray-50 text-brand-text-secondary opacity-70",
            triggerClassName
          )}
        >
          <div className="flex min-h-6 flex-1 flex-wrap items-center gap-1.5">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-purple-faint px-2 py-1 text-xs font-medium text-brand-purple"
                >
                  {option.displayLabel}
                </span>
              ))
            ) : (
              <span className="py-0.5 text-brand-text-secondary">{placeholder}</span>
            )}
          </div>

          <ChevronDown
            size={16}
            className={cn(
              "mt-1 shrink-0 text-brand-text-secondary transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        {open && !disabled && (
          <div
            className={cn(
              "absolute top-full z-50 mt-1 w-full rounded-2xl border border-brand-border bg-white p-2 shadow-xl",
              dropdownClassName
            )}
          >
            {enableSearch && (
              <div className="relative mb-2">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary"
                />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 w-full rounded-xl border border-brand-border bg-gray-50 pl-9 pr-3 text-sm text-brand-text-primary outline-none focus:border-brand-purple focus:bg-white"
                />
              </div>
            )}

            {canCreateOption ? (
              <button
                type="button"
                onClick={handleCreate}
                className="mb-2 flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-brand-purple/40 bg-brand-purple-faint px-3 py-2 text-left text-sm text-brand-purple transition-colors hover:border-brand-purple hover:bg-brand-purple-mid"
              >
                <span>Add &quot;{toTitleCase(trimmedSearchQuery)}&quot;</span>
                <Check size={15} className="shrink-0" />
              </button>
            ) : null}

            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleValue(option.value)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-brand-purple-faint text-brand-purple"
                          : "text-brand-text-primary hover:bg-gray-50"
                      )}
                    >
                      <span>{option.displayLabel}</span>
                      {isSelected ? <Check size={15} className="shrink-0" /> : null}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-6 text-center text-sm text-brand-text-secondary">
                  No matching options.
                </div>
              )}
            </div>

            {selectedOptions.length > 0 ? (
              <div className="mt-2 flex items-center justify-between border-t border-gray-100 px-1 pt-2">
                <p className="text-xs text-brand-text-secondary">
                  {selectedOptions.length} selected
                </p>
                <button
                  type="button"
                  onClick={() => updateValue([])}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-text-secondary transition-colors hover:text-brand-text-primary"
                >
                  <X size={12} />
                  Clear all
                </button>
              </div>
            ) : null}
          </div>
        )}

        {hint && !error && <p className="text-xs text-brand-text-secondary">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

MultiSelectInput.displayName = "MultiSelectInput";

export default MultiSelectInput;
