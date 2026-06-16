import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { isAppwriteConfigured } from "@/constants/appwrite";
import { getSchemaSetupMessage, isSchemaSetupError } from "@/lib/schema-errors";
import {
  createGoal as createGoalDoc,
  createNote as createNoteDoc,
  deleteNote as deleteNoteDoc,
  createTask as createTaskDoc,
  deleteGoal as deleteGoalDoc,
  deleteTask as deleteTaskDoc,
  fetchUserData,
  addFocusMinutes,
  createNotification,
  markNotificationAsRead as markNotificationReadDoc,
  syncNotifications,
  updateGoal as updateGoalDoc,
  updateNote as updateNoteDoc,
  updateTask as updateTaskDoc,
  updateTaskCompleted,
  type UserStats,
} from "@/services/appwrite-data";
import {
  completePasswordRecovery,
  getAppwriteErrorMessage,
  getCurrentSessionUser,
  loginWithEmail,
  logoutCurrentSession,
  requestPasswordRecovery,
  signupWithEmail,
} from "@/services/appwrite-auth";
import {
  fetchCollaborationData,
  inviteWorkspaceMember,
  logTaskCompletionActivity,
  shareTaskToWorkspace,
} from "@/services/appwrite-collaboration";
import { buildFocusSessionNotification } from "@/services/notification-sync";
import type { Goal, Note, Notification, Priority, SharedTask, Task, User, Workspace, WorkspaceActivity, WorkspaceMember } from "@/types";
import type { GoalUpdate, NoteUpdate, TaskUpdate } from "@/services/appwrite-data";

type AppState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  user: User | null;
  tasks: Task[];
  goals: Goal[];
  notes: Note[];
  notifications: Notification[];
  focusMinutesToday: number;
  focusStreak: number;
  xp: number;
  level: number;
  authError: string | null;
  schemaError: string | null;
  clearAuthError: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  completePasswordReset: (userId: string, secret: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, "id" | "completed">) => Promise<void>;
  updateTask: (id: string, updates: TaskUpdate) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, "id" | "taskIds" | "progress">) => Promise<void>;
  updateGoal: (id: string, updates: GoalUpdate) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addNote: (note: Omit<Note, "id" | "createdAt">) => Promise<void>;
  updateNote: (id: string, updates: NoteUpdate) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  refreshData: () => Promise<void>;
  saveFocusSession: (seconds: number) => Promise<void>;
  workspace: Workspace | null;
  workspaceMembers: WorkspaceMember[];
  sharedTasks: SharedTask[];
  sharedTaskIds: string[];
  workspaceActivity: WorkspaceActivity[];
  collaborationLoading: boolean;
  refreshCollaboration: () => Promise<void>;
  inviteMember: (email: string) => Promise<void>;
  shareTask: (taskId: string, assigneeMemberId?: string) => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);

function applyStats(setters: {
  setFocusMinutesToday: (v: number) => void;
  setFocusStreak: (v: number) => void;
  setXp: (v: number) => void;
  setLevel: (v: number) => void;
}, stats: UserStats) {
  setters.setFocusMinutesToday(stats.focusMinutesToday);
  setters.setFocusStreak(stats.focusStreak);
  setters.setXp(stats.xp);
  setters.setLevel(stats.level);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [focusMinutesToday, setFocusMinutesToday] = useState(0);
  const [focusStreak, setFocusStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [authError, setAuthError] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [sharedTasks, setSharedTasks] = useState<SharedTask[]>([]);
  const [sharedTaskIds, setSharedTaskIds] = useState<string[]>([]);
  const [workspaceActivity, setWorkspaceActivity] = useState<WorkspaceActivity[]>([]);
  const [collaborationLoading, setCollaborationLoading] = useState(false);

  const isConfigured = isAppwriteConfigured();

  const clearAuthError = useCallback(() => {
    setAuthError(null);
    setSchemaError(null);
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const data = await fetchUserData(userId);
      setTasks(data.tasks);
      setGoals(data.goals);
      setNotes(data.notes);
      applyStats(
        { setFocusMinutesToday, setFocusStreak, setXp, setLevel },
        data.stats,
      );

      try {
        const synced = await syncNotifications(
          userId,
          data.tasks,
          data.goals,
          data.stats,
          data.notifications,
        );
        setNotifications(synced);
      } catch (syncError) {
        console.warn("Failed to sync notifications:", getAppwriteErrorMessage(syncError));
        setNotifications(data.notifications);
      }
    } catch (error) {
      const message = getAppwriteErrorMessage(error);
      console.warn("Failed to load user data:", message);
      if (isSchemaSetupError(message)) {
        setSchemaError(getSchemaSetupMessage());
      }
      setTasks([]);
      setGoals([]);
      setNotes([]);
      setNotifications([]);
    }
  }, []);

  const refreshCollaboration = useCallback(async () => {
    if (!user) return;
    setCollaborationLoading(true);
    try {
      const data = await fetchCollaborationData(user);
      setWorkspace(data.workspace);
      setWorkspaceMembers(data.members);
      setSharedTasks(data.sharedTasks);
      setSharedTaskIds(data.sharedTaskIds);
      setWorkspaceActivity(data.activity);
    } catch (error) {
      const message = getAppwriteErrorMessage(error);
      console.warn("Failed to load collaboration:", message);
      if (isSchemaSetupError(message)) {
        setSchemaError(getSchemaSetupMessage());
      }
    } finally {
      setCollaborationLoading(false);
    }
  }, [user]);

  const inviteMember = useCallback(
    async (email: string) => {
      if (!user || !workspace) {
        throw new Error("Workspace not ready");
      }
      const member = await inviteWorkspaceMember(user, workspace, email, workspaceMembers);
      setWorkspaceMembers((prev) => [...prev, member]);
      await refreshCollaboration();
    },
    [user, workspace, workspaceMembers, refreshCollaboration],
  );

  const shareTask = useCallback(
    async (taskId: string, assigneeMemberId?: string) => {
      if (!user || !workspace) {
        throw new Error("Workspace not ready");
      }
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        throw new Error("Task not found");
      }
      const assignee = assigneeMemberId
        ? workspaceMembers.find((m) => m.id === assigneeMemberId)
        : undefined;
      const shared = await shareTaskToWorkspace(user, workspace, task, workspaceMembers, assignee);
      setSharedTasks((prev) => [shared, ...prev]);
      setSharedTaskIds((prev) => [...prev, taskId]);
      await refreshCollaboration();
    },
    [user, workspace, tasks, workspaceMembers, refreshCollaboration],
  );

  const refreshNotifications = useCallback(async () => {
    if (!user) return;

    const stats: UserStats = {
      focusMinutesToday,
      focusStreak,
      xp,
      level,
    };

    try {
      const synced = await syncNotifications(user.id, tasks, goals, stats, notifications);
      setNotifications(synced);
    } catch (error) {
      console.warn("Failed to refresh notifications:", getAppwriteErrorMessage(error));
    }
  }, [user, tasks, goals, notifications, focusMinutesToday, focusStreak, xp, level]);

  const refreshData = useCallback(async () => {
    if (!user) return;
    await loadUserData(user.id);
    await refreshCollaboration();
  }, [user, loadUserData, refreshCollaboration]);

  useEffect(() => {
    if (user) {
      void refreshCollaboration();
    }
  }, [user, refreshCollaboration]);

  useEffect(() => {
    async function init() {
      if (!isConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        const sessionUser = await getCurrentSessionUser();
        if (sessionUser) {
          setUser(sessionUser);
          setIsAuthenticated(true);
          await loadUserData(sessionUser.id);
        }
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    void init();
  }, [isConfigured, loadUserData]);

  const login = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      try {
        const sessionUser = await loginWithEmail(email, password);
        setUser(sessionUser);
        setIsAuthenticated(true);
        await loadUserData(sessionUser.id);
      } catch (error) {
        setAuthError(getAppwriteErrorMessage(error));
        throw error;
      }
    },
    [loadUserData],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      setAuthError(null);
      try {
        const sessionUser = await signupWithEmail(name, email, password);
        setUser(sessionUser);
        setIsAuthenticated(true);
        await loadUserData(sessionUser.id);
      } catch (error) {
        setAuthError(getAppwriteErrorMessage(error));
        throw error;
      }
    },
    [loadUserData],
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    setAuthError(null);
    try {
      await requestPasswordRecovery(email);
    } catch (error) {
      setAuthError(getAppwriteErrorMessage(error));
      throw error;
    }
  }, []);

  const completePasswordReset = useCallback(
    async (userId: string, secret: string, password: string) => {
      setAuthError(null);
      try {
        await completePasswordRecovery(userId, secret, password);
      } catch (error) {
        setAuthError(getAppwriteErrorMessage(error));
        throw error;
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutCurrentSession();
    setUser(null);
    setIsAuthenticated(false);
    setTasks([]);
    setGoals([]);
    setNotes([]);
    setNotifications([]);
    setFocusMinutesToday(0);
    setFocusStreak(0);
    setXp(0);
    setLevel(1);
    setWorkspace(null);
    setWorkspaceMembers([]);
    setSharedTasks([]);
    setSharedTaskIds([]);
    setWorkspaceActivity([]);
  }, []);

  const completeOnboarding = useCallback(async () => {}, []);

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const nextCompleted = !task.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)),
    );
    setSharedTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)),
    );

    try {
      await updateTaskCompleted(id, nextCompleted);
      if (nextCompleted && sharedTaskIds.includes(id) && workspace && user) {
        await logTaskCompletionActivity(user, workspace.id, task.title);
        await refreshCollaboration();
      }
      await refreshNotifications();
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: task.completed } : t)),
      );
      setSharedTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: task.completed } : t)),
      );
    }
  }, [tasks, user, workspace, sharedTaskIds, refreshCollaboration, refreshNotifications]);

  const addTask = useCallback(
    async (task: Omit<Task, "id" | "completed">) => {
      if (!user) return;
      const created = await createTaskDoc(user.id, task);
      setTasks((prev) => [created, ...prev]);
      await refreshNotifications();
    },
    [user, refreshNotifications],
  );

  const updateTask = useCallback(
    async (id: string, updates: TaskUpdate) => {
      const previous = tasks.find((t) => t.id === id);
      if (!previous) return;

      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      );

      try {
        const updated = await updateTaskDoc(id, updates);
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      } catch {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? previous : t)),
        );
        throw new Error("Failed to update task");
      }
    },
    [tasks],
  );

  const deleteTask = useCallback(async (id: string) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setGoals((prev) =>
      prev.map((g) => ({
        ...g,
        taskIds: g.taskIds.filter((taskId) => taskId !== id),
      })),
    );

    try {
      await deleteTaskDoc(id);
    } catch {
      setTasks(previous);
      await refreshData();
      throw new Error("Failed to delete task");
    }
  }, [tasks, refreshData]);

  const addGoal = useCallback(
    async (goal: Omit<Goal, "id" | "taskIds" | "progress">) => {
      if (!user) return;
      const created = await createGoalDoc(user.id, goal);
      setGoals((prev) => [created, ...prev]);
    },
    [user],
  );

  const updateGoal = useCallback(
    async (id: string, updates: GoalUpdate) => {
      const previous = goals.find((g) => g.id === id);
      if (!previous) return;

      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      );

      try {
        await updateGoalDoc(id, updates);
        await refreshNotifications();
      } catch {
        setGoals((prev) =>
          prev.map((g) => (g.id === id ? previous : g)),
        );
        throw new Error("Failed to update goal");
      }
    },
    [goals, refreshNotifications],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      const previousGoals = goals;
      const previousTasks = tasks;
      const linked = tasks.filter((t) => t.goalId === id);

      setGoals((prev) => prev.filter((g) => g.id !== id));
      setTasks((prev) =>
        prev.map((t) => (t.goalId === id ? { ...t, goalId: undefined } : t)),
      );

      try {
        await Promise.all(
          linked.map((t) => updateTaskDoc(t.id, { goalId: undefined })),
        );
        await deleteGoalDoc(id);
      } catch {
        setGoals(previousGoals);
        setTasks(previousTasks);
        throw new Error("Failed to delete goal");
      }
    },
    [goals, tasks],
  );

  const addNote = useCallback(
    async (note: Omit<Note, "id" | "createdAt">) => {
      if (!user) return;
      const created = await createNoteDoc(user.id, note);
      setNotes((prev) => [created, ...prev]);
    },
    [user],
  );

  const updateNote = useCallback(
    async (id: string, updates: NoteUpdate) => {
      const previous = notes.find((n) => n.id === id);
      if (!previous) return;

      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      );

      try {
        const updated = await updateNoteDoc(id, updates);
        setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      } catch {
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? previous : n)),
        );
        throw new Error("Failed to update note");
      }
    },
    [notes],
  );

  const deleteNote = useCallback(async (id: string) => {
    const previous = notes;
    setNotes((prev) => prev.filter((n) => n.id !== id));

    try {
      await deleteNoteDoc(id);
    } catch {
      setNotes(previous);
      throw new Error("Failed to delete note");
    }
  }, [notes]);

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await markNotificationReadDoc(id);
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await Promise.all(unreadIds.map((id) => markNotificationReadDoc(id)));
    } catch {
      await refreshData();
    }
  }, [notifications, refreshData]);

  const saveFocusSession = useCallback(
    async (seconds: number) => {
      if (!user || seconds < 30) return;

      try {
        const updated = await addFocusMinutes(user.id, seconds);
        setFocusMinutesToday(updated.focusMinutesToday);
        setXp(updated.xp);

        const minutes = Math.max(1, Math.round(seconds / 60));
        const draft = buildFocusSessionNotification(minutes);
        const created = await createNotification(user.id, draft);
        setNotifications((prev) => [created, ...prev]);
      } catch (error) {
        console.warn("Failed to save focus session:", getAppwriteErrorMessage(error));
      }
    },
    [user],
  );

  const value = useMemo<AppState>(
    () => ({
      isLoading,
      isAuthenticated,
      isConfigured,
      user,
      tasks,
      goals,
      notes,
      notifications,
      focusMinutesToday,
      focusStreak,
      xp,
      level,
      authError,
      schemaError,
      clearAuthError,
      login,
      signup,
      requestPasswordReset,
      completePasswordReset,
      logout,
      completeOnboarding,
      toggleTask,
      addTask,
      updateTask,
      deleteTask,
      addGoal,
      updateGoal,
      deleteGoal,
      addNote,
      updateNote,
      deleteNote,
      markNotificationRead,
      markAllNotificationsRead,
      refreshData,
      saveFocusSession,
      workspace,
      workspaceMembers,
      sharedTasks,
      sharedTaskIds,
      workspaceActivity,
      collaborationLoading,
      refreshCollaboration,
      inviteMember,
      shareTask,
    }),
    [
      isLoading,
      isAuthenticated,
      isConfigured,
      user,
      tasks,
      goals,
      notes,
      notifications,
      focusMinutesToday,
      focusStreak,
      xp,
      level,
      authError,
      schemaError,
      clearAuthError,
      login,
      signup,
      requestPasswordReset,
      completePasswordReset,
      logout,
      completeOnboarding,
      toggleTask,
      addTask,
      updateTask,
      deleteTask,
      addGoal,
      updateGoal,
      deleteGoal,
      addNote,
      updateNote,
      deleteNote,
      markNotificationRead,
      markAllNotificationsRead,
      refreshData,
      saveFocusSession,
      workspace,
      workspaceMembers,
      sharedTasks,
      sharedTaskIds,
      workspaceActivity,
      collaborationLoading,
      refreshCollaboration,
      inviteMember,
      shareTask,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case "high":
      return "#EF4444";
    case "medium":
      return "#F59E0B";
    case "low":
      return "#10B981";
  }
}

export function getPriorityLabel(priority: Priority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}
