import type React from "react";

export type ValidationErrors<Field extends string> = Partial<Record<Field, string>>;

export type ValidationRef = React.RefObject<HTMLElement | null>;

export function clearValidationError<Field extends string>(
  field: Field,
  setErrors: React.Dispatch<React.SetStateAction<ValidationErrors<Field>>>,
) {
  setErrors((current) => {
    if (!current[field]) return current;
    const next = { ...current };
    delete next[field];
    return next;
  });
}

export function getFirstInvalidField<Field extends string>(
  errors: ValidationErrors<Field>,
  fieldOrder: Field[],
) {
  return fieldOrder.find((field) => Boolean(errors[field]));
}

export function scrollToValidationField(ref: ValidationRef) {
  window.requestAnimationFrame(() => {
    const element = ref.current;
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    element.focus?.({ preventScroll: true });
  });
}
