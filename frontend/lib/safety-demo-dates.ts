function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseDateValue(value?: string | null) {
  if (!value) return null;

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatLocalDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatLocalDateTime(date = new Date()) {
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const period = hours24 >= 12 ? "PM" : "AM";

  return `${formatLocalDate(date)} ${hours12}:${pad(date.getMinutes())} ${period}`;
}

export function formatFriendlyDate(value?: string | null) {
  const parsed = parseDateValue(value);
  if (!parsed) return value ?? "";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function formatFriendlyDateTime(value?: string | null) {
  const parsed = parseDateValue(value);
  if (!parsed) return value ?? "";

  const formattedDate = formatFriendlyDate(value);
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(parsed)
    .toLowerCase();

  return `${formattedDate}, ${formattedTime}`;
}

export function toApiDateTime(value: string) {
  const parsed = parseDateValue(value);
  if (!parsed) return value;

  return parsed.toISOString();
}
