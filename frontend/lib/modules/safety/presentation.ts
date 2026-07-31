export function getSafetyDisplayStatus(status: string) {
  const normalizedStatus = status.trim().toLowerCase();
  if (normalizedStatus === "denied") return "rejected";
  if (normalizedStatus === "submitted") return "pending";
  return status;
}
