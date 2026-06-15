import type { Models } from "react-native-appwrite";

import type { Goal, Note, Notification, Priority, Task } from "@/types";

export type TaskDocument = Models.Document & {
  userId: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  priority: Priority;
  category: string;
  completed: boolean;
  goalId?: string;
  subtasks?: string;
};

export type GoalDocument = Models.Document & {
  userId: string;
  title: string;
  progress: number;
  dueDate: string;
};

export type NoteDocument = Models.Document & {
  userId: string;
  title: string;
  content: string;
  tag: string;
  createdAt: string;
  taskId?: string;
};

export type NotificationDocument = Models.Document & {
  userId: string;
  type: Notification["type"];
  title: string;
  message: string;
  time: string;
  group: Notification["group"];
  read: boolean;
};

export type UserStatsDocument = Models.Document & {
  userId: string;
  focusMinutesToday: number;
  focusStreak: number;
  xp: number;
  level: number;
};

export function mapTaskDoc(doc: TaskDocument): Task {
  let subtasks: Task["subtasks"];
  if (doc.subtasks) {
    try {
      subtasks = JSON.parse(doc.subtasks) as Task["subtasks"];
    } catch {
      subtasks = undefined;
    }
  }

  return {
    id: doc.$id,
    title: doc.title,
    description: doc.description,
    dueDate: doc.dueDate,
    dueTime: doc.dueTime,
    priority: doc.priority,
    category: doc.category,
    completed: doc.completed,
    goalId: doc.goalId,
    subtasks,
  };
}

export function mapGoalDoc(doc: GoalDocument, taskIds: string[] = []): Goal {
  return {
    id: doc.$id,
    title: doc.title,
    progress: doc.progress,
    dueDate: doc.dueDate,
    taskIds,
  };
}

export function mapNoteDoc(doc: NoteDocument): Note {
  return {
    id: doc.$id,
    title: doc.title,
    content: doc.content,
    tag: doc.tag,
    createdAt: doc.createdAt,
    taskId: doc.taskId,
  };
}

export function mapNotificationDoc(doc: NotificationDocument): Notification {
  return {
    id: doc.$id,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    time: doc.time,
    group: doc.group,
    read: doc.read,
  };
}

export function taskToDocumentData(
  task: Omit<Task, "id" | "completed">,
  userId: string,
): Omit<TaskDocument, keyof Models.Document> {
  return {
    userId,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    priority: task.priority,
    category: task.category,
    completed: false,
    goalId: task.goalId,
    subtasks: task.subtasks ? JSON.stringify(task.subtasks) : undefined,
  };
}
