export function formatNumber(value: string | number | undefined | null): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    return "";
  }

  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseFormattedNumber(value: string): string {
  if (!value) return "";
  return value.replace(/,/g, "");
}

export function pluralizeNumber(value: number, unit: string): string {
  return value === 1 ? unit : `${unit}s`;
}
