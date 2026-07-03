import type { SafetyEmployeeProfile } from "./types";

export function getSafetyEmployeeDisplayName(
  employee?: SafetyEmployeeProfile | null,
) {
  return [
    employee?.user?.first_name,
    employee?.user?.last_name,
  ].filter(Boolean).join(" ");
}

export function formatSafetyDepartment(department?: string | null) {
  if (!department) return "";

  return department
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getSafetyEmployeeRequester(
  employee: SafetyEmployeeProfile | undefined,
  requestDate: string,
) {
  return {
    name: getSafetyEmployeeDisplayName(employee),
    department: formatSafetyDepartment(employee?.department),
    role: employee?.job_title ?? "",
    requestDate,
    reportDate: requestDate,
  };
}
