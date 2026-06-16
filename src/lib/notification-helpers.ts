import type { Notification } from "@/types";

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export function getYesterdayDateString(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0] ?? "";
}

export function formatNotificationTime(date = new Date()): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatFocusDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export type NotificationDraft = Omit<Notification, "id" | "read">;

export function notificationExists(
  existing: Notification[],
  draft: NotificationDraft,
): boolean {
  return existing.some(
    (n) => n.type === draft.type && n.title === draft.title && n.message === draft.message,
  );
}
