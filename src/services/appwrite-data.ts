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

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await databases.updateDocument<NotificationDocument>({
    databaseId,
    collectionId: collections.notifications,
    documentId: notificationId,
    data: { read: true },
  });
}
