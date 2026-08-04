export function formatDateTime(dateString: string) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour12: true,
  });
}
