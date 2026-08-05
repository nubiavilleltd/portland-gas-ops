export function formatDateTime(dateString: string) {
  if (!dateString) return "-";

  return new Date(`${dateString}Z`).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
