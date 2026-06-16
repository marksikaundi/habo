import { ID, Permission, Query, Role } from "react-native-appwrite";

import { appwriteConfig } from "@/constants/appwrite";
import { databases } from "@/lib/appwrite";
import {
  mapTaskDoc,
  mapWorkspaceActivityDoc,
  mapWorkspaceDoc,
  mapWorkspaceMemberDoc,
  type TaskDocument,
  type WorkspaceActivityDocument,
  type WorkspaceDocument,
  type WorkspaceMemberDocument,
  type WorkspaceTaskLinkDocument,
} from "@/lib/appwrite-mappers";
import { userDocumentPermissions } from "@/services/appwrite-auth";
import type { SharedTask, Task, User, Workspace, WorkspaceActivity, WorkspaceMember } from "@/types";

const { databaseId, collections } = appwriteConfig;

export type CollaborationData = {
  workspace: Workspace;
  members: WorkspaceMember[];
  sharedTasks: SharedTask[];
  sharedTaskIds: string[];
  activity: WorkspaceActivity[];
};

function memberPermissions(ownerId: string, memberUserIds: string[]): string[] {
  const ids = new Set([ownerId, ...memberUserIds.filter(Boolean)]);
  const permissions: string[] = [];

  for (const userId of ids) {
    permissions.push(
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
    );
  }

  permissions.push(
    Permission.delete(Role.user(ownerId)),
    Permission.update(Role.user(ownerId)),
  );

  return permissions;
}

function invitePermissions(ownerId: string, memberUserIds: string[]): string[] {
  return [...memberPermissions(ownerId, memberUserIds), Permission.read(Role.users())];
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

async function listWorkspaceTaskLinks(workspaceId: string): Promise<WorkspaceTaskLinkDocument[]> {
  const response = await databases.listDocuments<WorkspaceTaskLinkDocument>({
    databaseId,
    collectionId: collections.workspaceTasks,
    queries: [Query.equal("workspaceId", workspaceId), Query.orderDesc("sharedAt")],
  });

  return response.documents;
}

async function findTaskLinkByTaskId(taskId: string): Promise<WorkspaceTaskLinkDocument | null> {
  const response = await databases.listDocuments<WorkspaceTaskLinkDocument>({
    databaseId,
    collectionId: collections.workspaceTasks,
    queries: [Query.equal("taskId", taskId), Query.limit(1)],
  });

  return response.documents[0] ?? null;
}

async function fetchTasksForLinks(links: WorkspaceTaskLinkDocument[]): Promise<SharedTask[]> {
  const sharedTasks: SharedTask[] = [];

  for (const link of links) {
    try {
      const doc = await databases.getDocument<TaskDocument>({
        databaseId,
        collectionId: collections.tasks,
        documentId: link.taskId,
      });
      const task = mapTaskDoc(doc);
      sharedTasks.push({
        ...task,
        linkId: link.$id,
        assigneeUserId: link.assigneeUserId,
        assigneeName: link.assigneeName,
      });
    } catch {
      // Task may have been deleted; skip stale link
    }
  }

  return sharedTasks;
}

async function listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const response = await databases.listDocuments<WorkspaceMemberDocument>({
    databaseId,
    collectionId: collections.workspaceMembers,
    queries: [Query.equal("workspaceId", workspaceId), Query.orderAsc("$createdAt")],
  });

  return response.documents.map(mapWorkspaceMemberDoc);
}

async function listActiveMemberUserIds(members: WorkspaceMember[]): Promise<string[]> {
  return members
    .filter((m) => m.status === "active" && m.userId)
    .map((m) => m.userId as string);
}

async function logActivity(
  workspaceId: string,
  actor: User,
  action: string,
  activityType: WorkspaceActivity["activityType"],
  memberUserIds: string[],
): Promise<void> {
  const createdAt = new Date().toISOString();

  await databases.createDocument<WorkspaceActivityDocument>({
    databaseId,
    collectionId: collections.workspaceActivity,
    documentId: ID.unique(),
    data: {
      workspaceId,
      actorUserId: actor.id,
      actorName: actor.name,
      action,
      activityType,
      createdAt,
    },
    permissions: memberPermissions(actor.id, memberUserIds),
  });
}

async function acceptPendingInvites(user: User): Promise<void> {
  const normalizedEmail = user.email.toLowerCase();

  const invites = await databases.listDocuments<WorkspaceMemberDocument>({
    databaseId,
    collectionId: collections.workspaceMembers,
    queries: [
      Query.equal("email", normalizedEmail),
      Query.equal("status", "invited"),
      Query.limit(20),
    ],
  });

  for (const invite of invites.documents) {
    const members = await listWorkspaceMembers(invite.workspaceId);
    const workspace = await databases.getDocument<WorkspaceDocument>({
      databaseId,
      collectionId: collections.workspaces,
      documentId: invite.workspaceId,
    });
    const memberUserIds = members
      .filter((m) => m.status === "active" && m.userId)
      .map((m) => m.userId as string);

    await databases.updateDocument<WorkspaceMemberDocument>({
      databaseId,
      collectionId: collections.workspaceMembers,
      documentId: invite.$id,
      data: {
        memberUserId: user.id,
        name: user.name,
        status: "active",
      },
      permissions: memberPermissions(workspace.ownerId, [...memberUserIds, user.id]),
    });
  }
}

async function findOwnedWorkspace(userId: string): Promise<WorkspaceDocument | null> {
  const response = await databases.listDocuments<WorkspaceDocument>({
    databaseId,
    collectionId: collections.workspaces,
    queries: [Query.equal("ownerId", userId), Query.limit(1)],
  });

  return response.documents[0] ?? null;
}

async function findMemberWorkspace(user: User): Promise<WorkspaceDocument | null> {
  const membership = await databases.listDocuments<WorkspaceMemberDocument>({
    databaseId,
    collectionId: collections.workspaceMembers,
    queries: [
      Query.equal("memberUserId", user.id),
      Query.equal("status", "active"),
      Query.limit(1),
    ],
  });

  const workspaceId = membership.documents[0]?.workspaceId;
  if (!workspaceId) return null;

  return await databases.getDocument<WorkspaceDocument>({
    databaseId,
    collectionId: collections.workspaces,
    documentId: workspaceId,
  });
}

async function createDefaultWorkspace(user: User): Promise<WorkspaceDocument> {
  const firstName = user.name.trim().split(" ")[0] || "My";
  const workspace = await databases.createDocument<WorkspaceDocument>({
    databaseId,
    collectionId: collections.workspaces,
    documentId: ID.unique(),
    data: {
      ownerId: user.id,
      name: `${firstName}'s Workspace`,
      createdAt: todayIso(),
    },
    permissions: userDocumentPermissions(user.id),
  });

  await databases.createDocument<WorkspaceMemberDocument>({
    databaseId,
    collectionId: collections.workspaceMembers,
    documentId: ID.unique(),
    data: {
      workspaceId: workspace.$id,
      memberUserId: user.id,
      email: user.email.toLowerCase(),
      name: user.name,
      role: "owner",
      status: "active",
    },
    permissions: userDocumentPermissions(user.id),
  });

  await logActivity(
    workspace.$id,
    user,
    "created the workspace",
    "invite",
    [user.id],
  );

  return workspace;
}

async function ensureWorkspace(user: User): Promise<WorkspaceDocument> {
  const owned = await findOwnedWorkspace(user.id);
  if (owned) return owned;

  const memberWorkspace = await findMemberWorkspace(user);
  if (memberWorkspace) return memberWorkspace;

  return await createDefaultWorkspace(user);
}

export async function fetchCollaborationData(user: User): Promise<CollaborationData> {
  await acceptPendingInvites(user);

  const workspaceDoc = await ensureWorkspace(user);
  const workspace = mapWorkspaceDoc(workspaceDoc);
  const members = await listWorkspaceMembers(workspace.id);

  const [links, activityRes] = await Promise.all([
    listWorkspaceTaskLinks(workspace.id),
    databases.listDocuments<WorkspaceActivityDocument>({
      databaseId,
      collectionId: collections.workspaceActivity,
      queries: [
        Query.equal("workspaceId", workspace.id),
        Query.orderDesc("createdAt"),
        Query.limit(20),
      ],
    }),
  ]);

  const sharedTasks = await fetchTasksForLinks(links);

  return {
    workspace,
    members,
    sharedTasks,
    sharedTaskIds: links.map((link) => link.taskId),
    activity: activityRes.documents.map(mapWorkspaceActivityDoc),
  };
}

export async function inviteWorkspaceMember(
  user: User,
  workspace: Workspace,
  email: string,
  members: WorkspaceMember[],
): Promise<WorkspaceMember> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.includes("@")) {
    throw new Error("Enter a valid email address");
  }

  const alreadyMember = members.some((m) => m.email.toLowerCase() === normalizedEmail);
  if (alreadyMember) {
    throw new Error("This person is already in the workspace");
  }

  if (normalizedEmail === user.email.toLowerCase()) {
    throw new Error("You are already in this workspace");
  }

  const displayName = normalizedEmail.split("@")[0] ?? normalizedEmail;
  const memberUserIds = await listActiveMemberUserIds(members);

  const doc = await databases.createDocument<WorkspaceMemberDocument>({
    databaseId,
    collectionId: collections.workspaceMembers,
    documentId: ID.unique(),
    data: {
      workspaceId: workspace.id,
      email: normalizedEmail,
      name: displayName,
      role: "member",
      status: "invited",
    },
    permissions: invitePermissions(workspace.ownerId, memberUserIds),
  });

  await logActivity(
    workspace.id,
    user,
    `invited ${normalizedEmail}`,
    "invite",
    memberUserIds,
  );

  return mapWorkspaceMemberDoc(doc);
}

export async function shareTaskToWorkspace(
  user: User,
  workspace: Workspace,
  task: Task,
  members: WorkspaceMember[],
  assignee?: WorkspaceMember,
): Promise<SharedTask> {
  const existing = await findTaskLinkByTaskId(task.id);
  if (existing) {
    throw new Error("This task is already shared");
  }

  const memberUserIds = await listActiveMemberUserIds(members);
  const permissions = memberPermissions(workspace.ownerId, memberUserIds);
  const sharedAt = new Date().toISOString();

  await databases.updateDocument<TaskDocument>({
    databaseId,
    collectionId: collections.tasks,
    documentId: task.id,
    permissions,
  });

  const link = await databases.createDocument<WorkspaceTaskLinkDocument>({
    databaseId,
    collectionId: collections.workspaceTasks,
    documentId: ID.unique(),
    data: {
      workspaceId: workspace.id,
      taskId: task.id,
      sharedByUserId: user.id,
      assigneeUserId: assignee?.userId,
      assigneeName: assignee?.name,
      sharedAt,
    },
    permissions,
  });

  const action = assignee
    ? `shared "${task.title}" with ${assignee.name}`
    : `shared "${task.title}" with the team`;

  await logActivity(workspace.id, user, action, "task_shared", memberUserIds);

  if (assignee) {
    await logActivity(
      workspace.id,
      user,
      `assigned "${task.title}" to ${assignee.name}`,
      "task_assigned",
      memberUserIds,
    );
  }

  return {
    ...task,
    linkId: link.$id,
    assigneeUserId: assignee?.userId,
    assigneeName: assignee?.name,
  };
}

export async function logTaskCompletionActivity(
  user: User,
  workspaceId: string,
  taskTitle: string,
): Promise<void> {
  const members = await listWorkspaceMembers(workspaceId);
  const memberUserIds = await listActiveMemberUserIds(members);
  await logActivity(
    workspaceId,
    user,
    `completed "${taskTitle}"`,
    "task_completed",
    memberUserIds,
  );
}

export function formatActivityTime(createdAt: string): string {
  return formatRelativeTime(createdAt);
}

export function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

const MEMBER_COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#06B6D4"];

export function memberColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length] ?? MEMBER_COLORS[0]!;
}
