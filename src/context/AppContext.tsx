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
  createTask as createTaskDoc,
  fetchUserData,
  addFocusMinutes,
  markNotificationAsRead as markNotificationReadDoc,
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
import type { Goal, Note, Notification, Priority, Task, User } from "@/types";

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
  addGoal: (goal: Omit<Goal, "id" | "taskIds" | "progress">) => Promise<void>;
  addNote: (note: Omit<Note, "id" | "createdAt">) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  saveFocusSession: (seconds: number) => Promise<void>;
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
      setNotifications(data.notifications);
      applyStats(
        { setFocusMinutesToday, setFocusStreak, setXp, setLevel },
        data.stats,
      );
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

  const refreshData = useCallback(async () => {
    if (!user) return;
    await loadUserData(user.id);
  }, [user, loadUserData]);

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
  }, []);

  const completeOnboarding = useCallback(async () => {}, []);

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const nextCompleted = !task.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)),
    );

    try {
      await updateTaskCompleted(id, nextCompleted);
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: task.completed } : t)),
      );
    }
  }, [tasks]);

  const addTask = useCallback(
    async (task: Omit<Task, "id" | "completed">) => {
      if (!user) return;
      const created = await createTaskDoc(user.id, task);
      setTasks((prev) => [created, ...prev]);
    },
    [user],
  );

  const addGoal = useCallback(
    async (goal: Omit<Goal, "id" | "taskIds" | "progress">) => {
      if (!user) return;
      const created = await createGoalDoc(user.id, goal);
      setGoals((prev) => [created, ...prev]);
    },
    [user],
  );

  const addNote = useCallback(
    async (note: Omit<Note, "id" | "createdAt">) => {
      if (!user) return;
      const created = await createNoteDoc(user.id, note);
      setNotes((prev) => [created, ...prev]);
    },
    [user],
  );

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

  const saveFocusSession = useCallback(
    async (seconds: number) => {
      if (!user || seconds < 30) return;

      try {
        const updated = await addFocusMinutes(user.id, seconds);
        setFocusMinutesToday(updated.focusMinutesToday);
        setXp(updated.xp);
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
      addGoal,
      addNote,
      markNotificationRead,
      refreshData,
      saveFocusSession,
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
      addGoal,
      addNote,
      markNotificationRead,
      refreshData,
      saveFocusSession,
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
