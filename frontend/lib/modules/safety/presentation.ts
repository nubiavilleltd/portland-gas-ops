export function getSafetyDisplayStatus(status: string) {
  return status.trim().toLowerCase() === "denied" ? "rejected" : status;
}
