function pad(value: number) {
  return String(value).padStart(2, "0");
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatLocalDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatLocalDateTime(date = new Date()) {
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const period = hours24 >= 12 ? "PM" : "AM";

  return `${formatLocalDate(date)} ${hours12}:${pad(date.getMinutes())} ${period}`;
}

export function formatSafetyDisplayDate(value?: string | null) {
  const parsed = parseSafetyDate(value);
  if (!parsed) return value || "-";

  return `${ordinal(parsed.getDate())} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

export function formatSafetyDisplayDateTime(value?: string | null) {
  const parsed = parseSafetyDate(value);
  if (!parsed) return value || "-";

  const hours24 = parsed.getHours();
  const hours12 = hours24 % 12 || 12;
  const period = hours24 >= 12 ? "pm" : "am";

  return `${ordinal(parsed.getDate())} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()} at ${pad(hours12)}:${pad(parsed.getMinutes())} ${period}`;
}

export function formatSafetyDisplayDateMaybeTime(value?: string | null) {
  if (!value) return "-";
  return hasTimePart(value) ? formatSafetyDisplayDateTime(value) : formatSafetyDisplayDate(value);
}

function parseSafetyDate(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?)?/i,
  );

  if (match) {
    const [, year, month, day, rawHour, rawMinute, rawPeriod] = match;
    let hour = rawHour ? Number(rawHour) : 0;
    const minute = rawMinute ? Number(rawMinute) : 0;
    const period = rawPeriod?.toUpperCase();

    if (period === "PM" && hour < 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    const parsed = new Date(Number(year), Number(month) - 1, Number(day), hour, minute);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hasTimePart(value: string) {
  return /\d{1,2}:\d{2}/.test(value);
}

function ordinal(day: number) {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;

  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}
