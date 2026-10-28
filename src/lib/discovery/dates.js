export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}
