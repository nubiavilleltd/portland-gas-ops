import { z } from "zod";

/**
 * Shared validators for the HR and Finance request forms.
 *
 * The point of these is the wording: a bare `z.string().min(5, "X is required")`
 * tells someone who typed "TEST" that the field is required, which is plainly
 * wrong — they filled it in. These keep "required" for the empty case and state
 * the actual minimum once there is something to measure.
 *
 * Pair `minChars` with `minCharsHint` off the SAME constant so the hint under
 * the field and the error message can never disagree:
 *
 *   const DESCRIPTION_MIN = 5;
 *   description: minChars(DESCRIPTION_MIN, "Description")   // schema
 *   <FormTextarea hint={minCharsHint(DESCRIPTION_MIN)} />   // field
 */

/**
 * A required text field with a minimum length.
 *
 * Empty  → "Description is required"
 * "TEST" → "Description must be at least 5 characters"
 */
export function minChars(minLength: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .min(minLength, `${label} must be at least ${minLength} characters`);
}

/** Hint text for the field itself, so the rule is visible before submitting. */
export function minCharsHint(minLength: number): string {
  return `Minimum ${minLength} characters`;
}
