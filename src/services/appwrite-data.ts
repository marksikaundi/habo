import { ID, Query } from "react-native-appwrite";

import { appwriteConfig } from "@/constants/appwrite";
import { databases } from "@/lib/appwrite";
import {
  mapGoalDoc,
  mapNoteDoc,
  mapNotificationDoc,
  mapTaskDoc,
  taskToDocumentData,
  type GoalDocument,
  type NoteDocument,
  type NotificationDocument,
  type TaskDocument,
  type UserStatsDocument,
} from "@/lib/appwrite-mappers";
import { userDocumentPermissions } from "@/services/appwrite-auth";
import type { Goal, Note, Notification, Task } from "@/types";

const { databaseId, collections } = appwriteConfig;

export type UserStats = {
  focusMinutesToday: number;
  focusStreak: number;
  xp: number;
  level: number;
  statsDocId?: string;
};

const DEFAULT_STATS: UserStats = {
  focusMinutesToday: 0,
  focusStreak: 0,
  xp: 0,
  level: 1,
};

export async function ensureUserStats(userId: string): Promise<UserStats> {
  const response = await databases.listDocuments<UserStatsDocument>({
    databaseId,
    collectionId: collections.userStats,
    queries: [Query.equal("userId", userId), Query.limit(1)],
  });

  const existing = response.documents[0];
  if (existing) {
    return {
      focusMinutesToday: existing.focusMinutesToday,
      focusStreak: existing.focusStreak,
      xp: existing.xp,
      level: existing.level,
      statsDocId: existing.$id,
    };
  }

  const created = await databases.createDocument<UserStatsDocument>({
    databaseId,
    collectionId: collections.userStats,
    documentId: ID.unique(),
    data: {
      userId,
      ...DEFAULT_STATS,
    },
    permissions: userDocumentPermissions(userId),
  });

  return {
    focusMinutesToday: created.focusMinutesToday,
    focusStreak: created.focusStreak,
    xp: created.xp,
    level: created.level,
    statsDocId: created.$id,
  };
}

export async function fetchUserData(userId: string): Promise<{
  tasks: Task[];
  goals: Goal[];
  notes: Note[];
  notifications: Notification[];
  stats: UserStats;
}> {
  const [tasksRes, goalsRes, notesRes, notificationsRes, stats] = await Promise.all([
    databases.listDocuments<TaskDocument>({
      databaseId,
      collectionId: collections.tasks,
      queries: [Query.equal("userId", userId), Query.orderDesc("$createdAt")],
    }),
    databases.listDocuments<GoalDocument>({
      databaseId,
      collectionId: collections.goals,
      queries: [Query.equal("userId", userId), Query.orderDesc("$createdAt")],
    }),
    databases.listDocuments<NoteDocument>({
      databaseId,
      collectionId: collections.notes,
      queries: [Query.equal("userId", userId), Query.orderDesc("$createdAt")],
    }),
    databases.listDocuments<NotificationDocument>({
      databaseId,
      collectionId: collections.notifications,
      queries: [Query.equal("userId", userId), Query.orderDesc("$createdAt")],
    }),
    ensureUserStats(userId),
  ]);

  const tasks = tasksRes.documents.map(mapTaskDoc);

  const goals = goalsRes.documents.map((doc) => {
    const taskIds = tasks.filter((t) => t.goalId === doc.$id).map((t) => t.id);
    return mapGoalDoc(doc, taskIds);
  });

  return {
    tasks,
    goals,
    notes: notesRes.documents.map(mapNoteDoc),
    notifications: notificationsRes.documents.map(mapNotificationDoc),
    stats,
  };
}

export async function createTask(
  userId: string,
  task: Omit<Task, "id" | "completed">,
): Promise<Task> {
  const doc = await databases.createDocument<TaskDocument>({
    databaseId,
    collectionId: collections.tasks,
    documentId: ID.unique(),
    data: taskToDocumentData(task, userId),
    permissions: userDocumentPermissions(userId),
  });
  return mapTaskDoc(doc);
}

export async function updateTaskCompleted(
  taskId: string,
  completed: boolean,
): Promise<void> {
  await databases.updateDocument<TaskDocument>({
    databaseId,
    collectionId: collections.tasks,
    documentId: taskId,
    data: { completed },
  });
}

export type TaskUpdate = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "dueDate"
    | "dueTime"
    | "priority"
    | "category"
    | "completed"
    | "goalId"
    | "subtasks"
  >
>;

export async function updateTask(taskId: string, updates: TaskUpdate): Promise<Task> {
  const data: Record<string, unknown> = {};

  if (updates.title !== undefined) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.dueDate !== undefined) data.dueDate = updates.dueDate;
  if (updates.dueTime !== undefined) data.dueTime = updates.dueTime;
  if (updates.priority !== undefined) data.priority = updates.priority;
  if (updates.category !== undefined) data.category = updates.category;
  if (updates.completed !== undefined) data.completed = updates.completed;
  if (updates.goalId !== undefined) data.goalId = updates.goalId || null;
  if (updates.subtasks !== undefined) {
    data.subtasks = updates.subtasks.length > 0 ? JSON.stringify(updates.subtasks) : null;
  }

  const doc = await databases.updateDocument<TaskDocument>({
    databaseId,
    collectionId: collections.tasks,
    documentId: taskId,
    data: data as Partial<TaskDocument>,
  });

  return mapTaskDoc(doc);
}

export async function deleteTask(taskId: string): Promise<void> {
  await databases.deleteDocument({
    databaseId,
    collectionId: collections.tasks,
    documentId: taskId,
  });
}

export async function createGoal(
  userId: string,
  goal: Omit<Goal, "id" | "taskIds" | "progress">,
): Promise<Goal> {
  const doc = await databases.createDocument<GoalDocument>({
    databaseId,
    collectionId: collections.goals,
    documentId: ID.unique(),
    data: {
      userId,
      title: goal.title,
      progress: 0,
      dueDate: goal.dueDate,
    },
    permissions: userDocumentPermissions(userId),
  });
  return mapGoalDoc(doc);
}

export type GoalUpdate = Partial<Pick<Goal, "title" | "dueDate" | "progress">>;

export async function updateGoal(goalId: string, updates: GoalUpdate): Promise<GoalDocument> {
  const data: Record<string, unknown> = {};
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.dueDate !== undefined) data.dueDate = updates.dueDate;
  if (updates.progress !== undefined) data.progress = updates.progress;

  return await databases.updateDocument<GoalDocument>({
    databaseId,
    collectionId: collections.goals,
    documentId: goalId,
    data: data as Partial<GoalDocument>,
  });
}

export async function deleteGoal(goalId: string): Promise<void> {
  await databases.deleteDocument({
    databaseId,
    collectionId: collections.goals,
    documentId: goalId,
  });
}

export async function createNote(
  userId: string,
  note: Omit<Note, "id" | "createdAt">,
): Promise<Note> {
  const doc = await databases.createDocument<NoteDocument>({
    databaseId,
    collectionId: collections.notes,
    documentId: ID.unique(),
    data: {
      userId,
      title: note.title,
      content: note.content,
      tag: note.tag,
      createdAt: new Date().toISOString().split("T")[0] ?? "",
      taskId: note.taskId,
    },
    permissions: userDocumentPermissions(userId),
  });
  return mapNoteDoc(doc);
}

export type NoteUpdate = Partial<Pick<Note, "title" | "content" | "tag" | "taskId">>;

export async function updateNote(noteId: string, updates: NoteUpdate): Promise<Note> {
  const data: Record<string, unknown> = {};
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.content !== undefined) data.content = updates.content;
  if (updates.tag !== undefined) data.tag = updates.tag;
  if (updates.taskId !== undefined) data.taskId = updates.taskId || null;

  const doc = await databases.updateDocument<NoteDocument>({
    databaseId,
    collectionId: collections.notes,
    documentId: noteId,
    data: data as Partial<NoteDocument>,
  });

  return mapNoteDoc(doc);
}

export async function deleteNote(noteId: string): Promise<void> {
  await databases.deleteDocument({
    databaseId,
    collectionId: collections.notes,
    documentId: noteId,
  });
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await databases.updateDocument<NotificationDocument>({
    databaseId,
    collectionId: collections.notifications,
    documentId: notificationId,
    data: { read: true },
  });
}

export async function addFocusMinutes(
  userId: string,
  seconds: number,
): Promise<UserStats> {
  const stats = await ensureUserStats(userId);
  if (seconds < 30) {
    return stats;
  }

  const additionalMinutes = Math.max(1, Math.round(seconds / 60));
  const focusMinutesToday = stats.focusMinutesToday + additionalMinutes;
  const xp = stats.xp + additionalMinutes * 2;

  if (!stats.statsDocId) {
    return { ...stats, focusMinutesToday, xp };
  }

  await databases.updateDocument<UserStatsDocument>({
    databaseId,
    collectionId: collections.userStats,
    documentId: stats.statsDocId,
    data: { focusMinutesToday, xp },
  });

  return { ...stats, focusMinutesToday, xp };
}
