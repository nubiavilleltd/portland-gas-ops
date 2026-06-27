function pad(value: number) {
  return String(value).padStart(2, "0");
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
