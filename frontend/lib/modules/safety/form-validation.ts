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
    const target = getValidationScrollTarget(ref.current);
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    target.focus?.({ preventScroll: true });
  });
}

export function getValidationScrollTarget(element: HTMLElement | null) {
  if (!element) return null;

  if (element instanceof HTMLInputElement && element.type === "hidden") {
    const visibleTriggerId = element.id.replace(/-value$/, "");
    const visibleTrigger = document.getElementById(visibleTriggerId);

    if (visibleTrigger instanceof HTMLElement) {
      return visibleTrigger;
    }

    const visibleParent = element.closest<HTMLElement>(".flex, .relative");
    if (visibleParent) return visibleParent;
  }

  return element;
}
