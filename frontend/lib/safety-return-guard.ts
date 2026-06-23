export const SAFETY_RETURNED_CHANGE_REQUIRED_MESSAGE =
  "No changes detected. Update a field or add context in the Additional Comments/Notes section before resubmitting.";

export function shouldBlockReturnedSafetyResubmission(
  status: string,
  hasRequesterChanges: boolean,
) {
  return status === "returned" && !hasRequesterChanges;
}
