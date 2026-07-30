function pad(value: number) {
  return String(value).padStart(2, "0");
}

export const MIN_SCHEDULE_DURATION_MINUTES = 3;
export const SCHEDULE_DEVIATION_TOLERANCE_MINUTES = 3;

export function startOfMinute(date: Date) {
  const normalized = new Date(date);
  normalized.setSeconds(0, 0);
  return normalized;
}

export function toLocalDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toLocalDateTimeInputValue(date: Date) {
  return `${toLocalDateInputValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function getLatestIncidentObservedDateTime() {
  return toLocalDateTimeInputValue(
    addMinutes(startOfMinute(new Date()), -5),
  );
}

export function getEarliestPlannedStartDateTime() {
  return toLocalDateTimeInputValue(
    addMinutes(startOfMinute(new Date()), 10),
  );
}

export function getLatestActualWorkDateTime() {
  return toLocalDateTimeInputValue(startOfMinute(new Date()));
}

export function getLatestActualWorkStartDateTime() {
  return toLocalDateTimeInputValue(
    addMinutes(startOfMinute(new Date()), -MIN_SCHEDULE_DURATION_MINUTES),
  );
}

export function getTodayDateInputValue() {
  return toLocalDateInputValue(new Date());
}

export function getDateTimeAfter(value: string, minutes = 1) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return toLocalDateTimeInputValue(
    addMinutes(parsed, minutes),
  );
}

export function isDateTimeBefore(value: string, minimum: string) {
  const parsedValue = new Date(value);
  const parsedMinimum = new Date(minimum);
  if (Number.isNaN(parsedValue.getTime()) || Number.isNaN(parsedMinimum.getTime())) {
    return false;
  }
  return parsedValue < parsedMinimum;
}
