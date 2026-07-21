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

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

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

function setNativeInputValue(input: HTMLInputElement, nextValue: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;

  valueSetter?.call(input, nextValue);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

const SelectInput = forwardRef<HTMLInputElement, Props>(
  (
    {
      label,
      options,
      placeholder = "Select an option",
      error,
      hint,
      searchable,
      sortOptions = true,
      searchPlaceholder = "Search options",
      creatable = false,
      titleCaseOptions = false,
      className,
      triggerClassName,
      dropdownClassName,
      dropdownPosition = "auto",
      id,
      value,
      defaultValue,
      onBlur,
      onValueChange,
      disabled,
      required,
      name,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : "select-input");
    const hiddenInputRef = useRef<HTMLInputElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);
    const [resolvedPosition, setResolvedPosition] = useState<"bottom" | "top">("bottom");
    const [searchQuery, setSearchQuery] = useState("");
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(
      typeof defaultValue === "string" ? defaultValue : ""
    );

    const enableSearch = searchable ?? options.length > 5;

    const normalizedOptions = useMemo(() => {
      const mappedOptions = options.map((option) => ({
          ...option,
          displayLabel: titleCaseOptions ? toTitleCase(option.label) : option.label,
        }));

      return sortOptions
        ? [...mappedOptions].sort((left, right) =>
            left.displayLabel.localeCompare(right.displayLabel)
          )
        : mappedOptions;
    }, [options, sortOptions, titleCaseOptions]);

    const filteredOptions = useMemo(() => {
      if (!enableSearch || !searchQuery.trim()) return normalizedOptions;

      const query = searchQuery.trim().toLowerCase();
      return normalizedOptions.filter((option) =>
        option.displayLabel.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query)
      );
    }, [enableSearch, normalizedOptions, searchQuery]);

    const selectedValue = isControlled ? String(value ?? "") : internalValue;
    const selectedOption =
      normalizedOptions.find((option) => option.value === selectedValue) ??
      (selectedValue
        ? {
            value: selectedValue,
            label: selectedValue,
            displayLabel: titleCaseOptions ? toTitleCase(selectedValue) : selectedValue,
          }
        : undefined);
    const trimmedSearchQuery = searchQuery.trim();
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

    function handleSelect(nextValue: string) {
      if (!isControlled) {
        setInternalValue(nextValue);
      }

      if (hiddenInputRef.current) {
        setNativeInputValue(hiddenInputRef.current, nextValue);
      }

      onValueChange?.(nextValue);
      setOpen(false);
      setSearchQuery("");
      onBlur?.({ target: hiddenInputRef.current } as React.FocusEvent<HTMLInputElement>);
    }

    function handleClearSelected() {
      if (!isControlled) {
        setInternalValue("");
      }

      if (hiddenInputRef.current) {
        setNativeInputValue(hiddenInputRef.current, "");
      }

      onValueChange?.("");
      setOpen(false);
      setSearchQuery("");
      onBlur?.({ target: hiddenInputRef.current } as React.FocusEvent<HTMLInputElement>);
    }

    return (
      <div ref={containerRef} className={cn("relative flex w-full flex-col gap-1 self-start", className)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-brand-text-primary">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <input
          {...props}
          ref={setRefs}
          id={`${inputId}-value`}
          name={name}
          type="hidden"
          value={selectedValue}
          disabled={disabled}
          readOnly
        />

        <div className="relative">
          <button
            ref={triggerRef}
            type="button"
            id={inputId}
            disabled={disabled}
            onClick={() => {
              const next = !open;
              if (next && dropdownPosition === "auto" && triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                setResolvedPosition(spaceBelow >= 260 ? "bottom" : "top");
              }
              setOpen(next);
            }}
            className={cn(
              "h-10 w-full rounded-lg border border-brand-border bg-white px-3 pr-16 text-sm text-left text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-shadow",
              "flex items-center gap-3",
              error && "border-red-400 focus:ring-red-400",
              disabled &&
                "cursor-not-allowed border-gray-200 bg-gray-50 text-brand-text-secondary opacity-100 shadow-none focus:ring-0 focus:border-gray-200",
              triggerClassName
            )}
          >
            <span className={cn("min-w-0 flex-1 truncate", !selectedOption && "text-brand-text-secondary")}>
              {selectedOption ? selectedOption.displayLabel : placeholder}
            </span>
          </button>

          {selectedOption && !disabled ? (
            <button
              type="button"
              aria-label={`Clear ${label}`}
              onClick={handleClearSelected}
              className="absolute right-9 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-brand-text-secondary transition-colors hover:bg-gray-100 hover:text-brand-text-primary"
            >
              <X size={14} />
            </button>
          ) : null}

          <ChevronDown
            size={16}
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 shrink-0 text-brand-text-secondary transition-transform",
              open && "rotate-180"
            )}
          />
        </div>

        {open && !disabled && (
          <div
            className={cn(
              "absolute z-50 w-full rounded-2xl border border-brand-border bg-white p-2 shadow-xl",
              (dropdownPosition === "top" || (dropdownPosition === "auto" && resolvedPosition === "top")) ? "bottom-full mb-1" : "top-full mt-1",
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

            <div className="max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={handleClearSelected}
                className={cn(
                  "mb-1 flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  selectedValue
                    ? "text-brand-text-secondary hover:bg-gray-50"
                    : "bg-gray-50 text-brand-text-secondary"
                )}
              >
                <span>{placeholder}</span>
                {!selectedValue ? <Check size={15} className="shrink-0" /> : null}
              </button>

              {canCreateOption ? (
                <button
                  type="button"
                  onClick={() => handleSelect(trimmedSearchQuery)}
                  className="mb-2 flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-brand-purple/40 bg-brand-purple-faint px-3 py-2 text-left text-sm text-brand-purple transition-colors hover:border-brand-purple hover:bg-brand-purple-mid"
                >
                  <span>
                    Add &quot;{titleCaseOptions ? toTitleCase(trimmedSearchQuery) : trimmedSearchQuery}&quot;
                  </span>
                  <Check size={15} className="shrink-0" />
                </button>
              ) : null}

              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = option.value === selectedValue;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "flex w-full items-start justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-brand-purple-faint text-brand-purple"
                          : "text-brand-text-primary hover:bg-gray-50"
                      )}
                    >
                      <span className="min-w-0">
                        <span className={cn("block", option.description && "font-medium")}>
                          {option.displayLabel}
                        </span>
                        {option.description ? (
                          <span className="mt-1 block text-xs text-brand-text-secondary">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
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
          </div>
        )}

        {hint && !error && <p className="text-xs text-brand-text-secondary">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

SelectInput.displayName = "SelectInput";

export default SelectInput;
 
