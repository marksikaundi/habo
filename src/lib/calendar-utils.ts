export function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatDayHeader(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatWeekdayShort(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase().slice(0, 3);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toLocalIso(a) === toLocalIso(b);
}

export function parseTimeToHour(time: string): number | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = parseInt(match[1] ?? "0", 10);
  const period = (match[3] ?? "").toUpperCase();

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return hour;
}

export function formatHourLabel(hour24: number): string {
  if (hour24 === 0) return "12 AM";
  if (hour24 < 12) return `${hour24} AM`;
  if (hour24 === 12) return "12 PM";
  return `${hour24 - 12} PM`;
}

export const TIMELINE_START_HOUR = 7;
export const TIMELINE_END_HOUR = 21;

export function getTimelineHours(): number[] {
  return Array.from(
    { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
    (_, i) => i + TIMELINE_START_HOUR,
  );
}
