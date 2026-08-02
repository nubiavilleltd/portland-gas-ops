export function formatDateTime(dateString: string) {
  console.log(dateString, "dateString");
  if (!dateString) return "-";

  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour12: true,
  });
}
