import {
  formatFocusDuration,
  formatNotificationTime,
  getTodayDateString,
  getYesterdayDateString,
  notificationExists,
  type NotificationDraft,
} from "@/lib/notification-helpers";
import type { UserStats } from "@/services/appwrite-data";
import type { Goal, Notification, Task } from "@/types";

function draftExists(drafts: NotificationDraft[], draft: NotificationDraft): boolean {
  return drafts.some(
    (n) => n.type === draft.type && n.title === draft.title && n.message === draft.message,
  );
}

export function buildNotificationsFromState(
  tasks: Task[],
  goals: Goal[],
  stats: UserStats,
  existing: Notification[],
): NotificationDraft[] {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const drafts: NotificationDraft[] = [];

  const addDraft = (draft: NotificationDraft) => {
    if (!notificationExists(existing, draft) && !draftExists(drafts, draft)) {
      drafts.push(draft);
    }
  };

  for (const task of tasks) {
    if (task.completed) continue;

    if (task.dueDate === today) {
      addDraft({
        type: "task",
        title: "Upcoming Task",
        message: task.dueTime
          ? `${task.title} is due at ${task.dueTime}`
          : `${task.title} is due today`,
        time: formatNotificationTime(),
        group: "today",
      });
      continue;
    }

    if (task.dueDate < today) {
      addDraft({
        type: "task",
        title: "Missed Task",
        message: `${task.title} was not completed`,
        time: task.dueDate === yesterday ? "Yesterday" : formatNotificationTime(),
        group: "yesterday",
      });
    }
  }

  for (const goal of goals) {
    if (goal.progress <= 0 || goal.progress >= 100) continue;

    addDraft({
      type: "goal",
      title: "Goal Update",
      message: `${goal.title} is now ${goal.progress}% complete!`,
      time: goal.dueDate === yesterday ? "Yesterday" : formatNotificationTime(),
      group: goal.dueDate < today ? "yesterday" : "today",
    });
  }

  const completedToday = tasks.filter((t) => t.completed && t.dueDate === today).length;
  if (completedToday > 0 || stats.focusMinutesToday > 0) {
    addDraft({
      type: "summary",
      title: "Daily Summary",
      message: `You completed ${completedToday} task${completedToday === 1 ? "" : "s"} and logged ${formatFocusDuration(stats.focusMinutesToday)} focus time today`,
      time: formatNotificationTime(),
      group: "today",
    });
  }

  return drafts;
}

export function buildFocusSessionNotification(minutes: number): NotificationDraft {
  return {
    type: "focus",
    title: "Focus Session Complete",
    message: `Great work! You focused for ${formatFocusDuration(minutes)}`,
    time: formatNotificationTime(),
    group: "today",
  };
}
