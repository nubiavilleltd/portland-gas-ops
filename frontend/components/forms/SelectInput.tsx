// "use client";

// import {
//   forwardRef,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { Check, ChevronDown, Search } from "lucide-react";
// import { cn, toTitleCase } from "@/lib/utils";

// export interface SelectOption {
//   value: string;
//   label: string;
// }

// interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
//   label: string;
//   options: SelectOption[];
//   placeholder?: string;
//   error?: string;
//   hint?: string;
//   searchable?: boolean;
//   sortOptions?: boolean;
//   searchPlaceholder?: string;
//   onValueChange?: (value: string) => void;
//   triggerClassName?: string;
//   dropdownClassName?: string;
// }

// function setNativeInputValue(input: HTMLInputElement, nextValue: string) {
//   const valueSetter = Object.getOwnPropertyDescriptor(
//     HTMLInputElement.prototype,
//     "value"
//   )?.set;

//   valueSetter?.call(input, nextValue);
//   input.dispatchEvent(new Event("input", { bubbles: true }));
//   input.dispatchEvent(new Event("change", { bubbles: true }));
// }

// const SelectInput = forwardRef<HTMLInputElement, Props>(
//   (
//     {
//       label,
//       options,
//       placeholder = "Select an option",
//       error,
//       hint,
//       searchable,
//       sortOptions = true,
//       searchPlaceholder = "Search options",
//       className,
//       triggerClassName,
//       dropdownClassName,
//       id,
//       value,
//       defaultValue,
//       onBlur,
//       onValueChange,
//       disabled,
//       required,
//       name,
//       ...props
//     },
//     ref
//   ) => {
//     const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
//     const hiddenInputRef = useRef<HTMLInputElement | null>(null);
//     const containerRef = useRef<HTMLDivElement | null>(null);
//     const [open, setOpen] = useState(false);
//     const [searchQuery, setSearchQuery] = useState("");
//     const isControlled = value !== undefined;
//     const [internalValue, setInternalValue] = useState(
//       typeof defaultValue === "string" ? defaultValue : ""
//     );

//     const enableSearch = searchable ?? options.length > 5;

//     const normalizedOptions = useMemo(() => {
//       const mappedOptions = options.map((option) => ({
//           ...option,
//           displayLabel: toTitleCase(option.label),
//         }));

//       return sortOptions
//         ? [...mappedOptions].sort((left, right) =>
//             left.displayLabel.localeCompare(right.displayLabel)
//           )
//         : mappedOptions;
//     }, [options, sortOptions]);

//     const filteredOptions = useMemo(() => {
//       if (!enableSearch || !searchQuery.trim()) return normalizedOptions;

//       const query = searchQuery.trim().toLowerCase();
//       return normalizedOptions.filter((option) =>
//         option.displayLabel.toLowerCase().includes(query)
//       );
//     }, [enableSearch, normalizedOptions, searchQuery]);

//     const selectedValue = isControlled ? String(value ?? "") : internalValue;
//     const selectedOption = normalizedOptions.find(
//       (option) => option.value === selectedValue
//     );

//     useEffect(() => {
//       if (!open) return;

//       function handleClickOutside(event: MouseEvent) {
//         if (
//           containerRef.current &&
//           !containerRef.current.contains(event.target as Node)
//         ) {
//           setOpen(false);
//           onBlur?.({ target: hiddenInputRef.current } as React.FocusEvent<HTMLInputElement>);
//         }
//       }

//       document.addEventListener("mousedown", handleClickOutside);
//       return () => document.removeEventListener("mousedown", handleClickOutside);
//     }, [open, onBlur]);

//     useEffect(() => {
//       if (isControlled && hiddenInputRef.current) {
//         hiddenInputRef.current.value = selectedValue;
//       }
//     }, [isControlled, selectedValue]);

//     function setRefs(node: HTMLInputElement | null) {
//       hiddenInputRef.current = node;

//       if (typeof ref === "function") {
//         ref(node);
//       } else if (ref) {
//         ref.current = node;
//       }
//     }

//     function handleSelect(nextValue: string) {
//       if (!isControlled) {
//         setInternalValue(nextValue);
//       }

//       if (hiddenInputRef.current) {
//         setNativeInputValue(hiddenInputRef.current, nextValue);
//       }

//       onValueChange?.(nextValue);
//       setOpen(false);
//       setSearchQuery("");
//       onBlur?.({ target: hiddenInputRef.current } as React.FocusEvent<HTMLInputElement>);
//     }

//     return (
//       <div ref={containerRef} className={cn("relative flex flex-col gap-1", className)}>
//         <label htmlFor={inputId} className="text-sm font-medium text-brand-text-primary">
//           {label}
//           {required && <span className="text-red-500 ml-1">*</span>}
//         </label>

//         <input
//           {...props}
//           ref={setRefs}
//           id={`${inputId}-value`}
//           name={name}
//           type="hidden"
//           value={selectedValue}
//           disabled={disabled}
//           readOnly
//         />

//         <button
//           type="button"
//           id={inputId}
//           disabled={disabled}
//           onClick={() => setOpen((current) => !current)}
//           className={cn(
//             "h-10 rounded-lg border border-brand-border bg-white px-3 text-sm text-left text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-shadow",
//             "flex items-center justify-between gap-3",
//             error && "border-red-400 focus:ring-red-400",
//             disabled && "cursor-not-allowed bg-gray-50 text-brand-text-secondary opacity-70",
//             triggerClassName
//           )}
//         >
//           <span className={cn(!selectedOption && "text-brand-text-secondary")}>
//             {selectedOption ? selectedOption.displayLabel : placeholder}
//           </span>
//           <ChevronDown
//             size={16}
//             className={cn(
//               "shrink-0 text-brand-text-secondary transition-transform",
//               open && "rotate-180"
//             )}
//           />
//         </button>

//         {open && !disabled && (
//           <div
//             className={cn(
//               "absolute top-full z-50 mt-1 w-full rounded-2xl border border-brand-border bg-white p-2 shadow-xl",
//               dropdownClassName
//             )}
//           >
//             {enableSearch && (
//               <div className="relative mb-2">
//                 <Search
//                   size={14}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary"
//                 />
//                 <input
//                   value={searchQuery}
//                   onChange={(event) => setSearchQuery(event.target.value)}
//                   placeholder={searchPlaceholder}
//                   className="h-9 w-full rounded-xl border border-brand-border bg-gray-50 pl-9 pr-3 text-sm text-brand-text-primary outline-none focus:border-brand-purple focus:bg-white"
//                 />
//               </div>
//             )}

//             <div className="max-h-60 overflow-y-auto">
//               {filteredOptions.length > 0 ? (
//                 filteredOptions.map((option) => {
//                   const isSelected = option.value === selectedValue;

//                   return (
//                     <button
//                       key={option.value}
//                       type="button"
//                       onClick={() => handleSelect(option.value)}
//                       className={cn(
//                         "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
//                         isSelected
//                           ? "bg-brand-purple-faint text-brand-purple"
//                           : "text-brand-text-primary hover:bg-gray-50"
//                       )}
//                     >
//                       <span>{option.displayLabel}</span>
//                       {isSelected ? <Check size={15} className="shrink-0" /> : null}
//                     </button>
//                   );
//                 })
//               ) : (
//                 <div className="px-3 py-6 text-center text-sm text-brand-text-secondary">
//                   No matching options.
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {hint && !error && <p className="text-xs text-brand-text-secondary">{hint}</p>}
//         {error && <p className="text-xs text-red-600">{error}</p>}
//       </div>
//     );
//   }
// );

// SelectInput.displayName = "SelectInput";

// export default SelectInput;




"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
  Search,
} from "lucide-react";

import {
  cn,
  toTitleCase,
} from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "onChange"
  > {
  label: string;

  options: SelectOption[];

  placeholder?: string;

  error?: string;

  hint?: string;

  searchable?: boolean;

  sortOptions?: boolean;

  searchPlaceholder?: string;

  triggerClassName?: string;

  dropdownClassName?: string;

  onValueChange?: (
    value: string
  ) => void;

  onChange?: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
}

function setNativeInputValue(
  input: HTMLInputElement,
  nextValue: string
) {
  const valueSetter =
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;

  valueSetter?.call(
    input,
    nextValue
  );

  input.dispatchEvent(
    new Event("input", {
      bubbles: true,
    })
  );

  input.dispatchEvent(
    new Event("change", {
      bubbles: true,
    })
  );
}

const SelectInput = forwardRef<
  HTMLInputElement,
  Props
>(
  (
    {
      label,
      options,

      placeholder =
        "Select an option",

      error,
      hint,

      searchable,

      sortOptions = true,

      searchPlaceholder =
        "Search options",

      className,

      triggerClassName,

      dropdownClassName,

      id,

      value,

      defaultValue,

      onBlur,

      onChange,

      onValueChange,

      disabled,

      required,

      name,

      ...props
    },
    ref
  ) => {
    const inputId =
      id ??
      label
        .toLowerCase()
        .replace(/\s+/g, "-");

    const hiddenInputRef =
      useRef<HTMLInputElement | null>(
        null
      );

    const containerRef =
      useRef<HTMLDivElement | null>(
        null
      );

    const [open, setOpen] =
      useState(false);

    const [
      searchQuery,
      setSearchQuery,
    ] = useState("");

    const isControlled =
      value !== undefined;

    const [
      internalValue,
      setInternalValue,
    ] = useState(
      typeof defaultValue ===
        "string"
        ? defaultValue
        : ""
    );

    const enableSearch =
      searchable ??
      options.length > 5;

    const normalizedOptions =
      useMemo(() => {
        const mappedOptions =
          options.map(
            (option) => ({
              ...option,

              displayLabel:
                toTitleCase(
                  option.label
                ),
            })
          );

        return sortOptions
          ? [
              ...mappedOptions,
            ].sort(
              (
                left,
                right
              ) =>
                left.displayLabel.localeCompare(
                  right.displayLabel
                )
            )
          : mappedOptions;
      }, [
        options,
        sortOptions,
      ]);

    const filteredOptions =
      useMemo(() => {
        if (
          !enableSearch ||
          !searchQuery.trim()
        ) {
          return normalizedOptions;
        }

        const query =
          searchQuery
            .trim()
            .toLowerCase();

        return normalizedOptions.filter(
          (option) =>
            option.displayLabel
              .toLowerCase()
              .includes(query)
        );
      }, [
        enableSearch,
        normalizedOptions,
        searchQuery,
      ]);

    const selectedValue =
      isControlled
        ? String(value ?? "")
        : internalValue;

    const selectedOption =
      normalizedOptions.find(
        (option) =>
          option.value ===
          selectedValue
      );

    useEffect(() => {
      if (!open) return;

      function handleClickOutside(
        event: MouseEvent
      ) {
        if (
          containerRef.current &&
          !containerRef.current.contains(
            event.target as Node
          )
        ) {
          setOpen(false);

          if (
            hiddenInputRef.current
          ) {
            onBlur?.({
              target:
                hiddenInputRef.current,
            } as React.FocusEvent<HTMLInputElement>);
          }
        }
      }

      document.addEventListener(
        "mousedown",
        handleClickOutside
      );

      return () =>
        document.removeEventListener(
          "mousedown",
          handleClickOutside
        );
    }, [open, onBlur]);

    function setRefs(
      node: HTMLInputElement | null
    ) {
      hiddenInputRef.current =
        node;

      if (
        typeof ref === "function"
      ) {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }

    function triggerChanges(
      nextValue: string
    ) {
      if (
        !hiddenInputRef.current
      ) {
        return;
      }

      setNativeInputValue(
        hiddenInputRef.current,
        nextValue
      );

      const syntheticEvent = {
        target:
          hiddenInputRef.current,
      } as React.ChangeEvent<HTMLInputElement>;

      onChange?.(
        syntheticEvent
      );

      onValueChange?.(
        nextValue
      );
    }

    function handleSelect(
      nextValue: string
    ) {
      if (!isControlled) {
        setInternalValue(
          nextValue
        );
      }

      triggerChanges(
        nextValue
      );

      setOpen(false);

      setSearchQuery("");

      if (
        hiddenInputRef.current
      ) {
        onBlur?.({
          target:
            hiddenInputRef.current,
        } as React.FocusEvent<HTMLInputElement>);
      }
    }

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative flex flex-col gap-1",
          className
        )}
      >
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-brand-text-primary"
        >
          {label}

          {required && (
            <span className="ml-1 text-red-500">
              *
            </span>
          )}
        </label>

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

        <button
          type="button"
          id={inputId}
          disabled={disabled}
          onClick={() =>
            setOpen(
              (current) =>
                !current
            )
          }
          className={cn(
            "flex h-10 items-center justify-between gap-3 rounded-lg border border-brand-border bg-white px-3 text-left text-sm text-brand-text-primary transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-purple",

            error &&
              "border-red-400 focus:ring-red-400",

            disabled &&
              "cursor-not-allowed bg-gray-50 text-brand-text-secondary opacity-70",

            triggerClassName
          )}
        >
          <span
            className={cn(
              !selectedOption &&
                "text-brand-text-secondary"
            )}
          >
            {selectedOption
              ? selectedOption.displayLabel
              : placeholder}
          </span>

          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-brand-text-secondary transition-transform",

              open &&
                "rotate-180"
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
                  value={
                    searchQuery
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchQuery(
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    searchPlaceholder
                  }
                  className="h-9 w-full rounded-xl border border-brand-border bg-gray-50 pl-9 pr-3 text-sm text-brand-text-primary outline-none focus:border-brand-purple focus:bg-white"
                />
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length >
              0 ? (
                filteredOptions.map(
                  (option) => {
                    const isSelected =
                      option.value ===
                      selectedValue;

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        onClick={() =>
                          handleSelect(
                            option.value
                          )
                        }
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",

                          isSelected
                            ? "bg-brand-purple-faint text-brand-purple"
                            : "text-brand-text-primary hover:bg-gray-50"
                        )}
                      >
                        <span>
                          {
                            option.displayLabel
                          }
                        </span>

                        {isSelected ? (
                          <Check
                            size={
                              15
                            }
                            className="shrink-0"
                          />
                        ) : null}
                      </button>
                    );
                  }
                )
              ) : (
                <div className="px-3 py-6 text-center text-sm text-brand-text-secondary">
                  No matching
                  options.
                </div>
              )}
            </div>
          </div>
        )}

        {hint && !error && (
          <p className="text-xs text-brand-text-secondary">
            {hint}
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

SelectInput.displayName =
  "SelectInput";

export default SelectInput;
