import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  MOCK_BADGES,
  MOCK_GOALS,
  MOCK_NOTES,
  MOCK_NOTIFICATIONS,
  MOCK_TASKS,
} from "@/constants/mock-data";
import type { Goal, Note, Notification, Priority, Task, User } from "@/types";

type AppState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  tasks: Task[];
  goals: Goal[];
  notes: Note[];
  notifications: Notification[];
  focusMinutesToday: number;
  focusStreak: number;
  xp: number;
  level: number;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  toggleTask: (id: string) => void;
  addTask: (task: Omit<Task, "id" | "completed">) => void;
  addGoal: (goal: Omit<Goal, "id" | "taskIds" | "progress">) => void;
  addNote: (note: Omit<Note, "id" | "createdAt">) => void;
  markNotificationRead: (id: string) => void;
};

const AUTH_KEY = "@habora/auth";

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS);
  const [notes, setNotes] = useState<Note[]>(MOCK_NOTES);
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY)
      .then((stored) => {
        if (stored) {
          setUser(JSON.parse(stored) as User);
          setIsAuthenticated(true);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    const u: User = { name: "Mark", email };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
    setIsAuthenticated(true);
  }, []);

  const signup = useCallback(
    async (name: string, email: string, _password: string) => {
      const u: User = { name, email };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(u));
      setUser(u);
      setIsAuthenticated(true);
    },
    [],
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const completeOnboarding = useCallback(async () => {
    // no-op for now; splash handles routing
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  }, []);

  const addTask = useCallback((task: Omit<Task, "id" | "completed">) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      completed: false,
    };
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  const addGoal = useCallback(
    (goal: Omit<Goal, "id" | "taskIds" | "progress">) => {
      const newGoal: Goal = {
        ...goal,
        id: `g${Date.now()}`,
        progress: 0,
        taskIds: [],
      };
      setGoals((prev) => [newGoal, ...prev]);
    },
    [],
  );

  const addNote = useCallback((note: Omit<Note, "id" | "createdAt">) => {
    const newNote: Note = {
      ...note,
      id: `n${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0] ?? "",
    };
    setNotes((prev) => [newNote, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const value = useMemo<AppState>(
    () => ({
      isLoading,
      isAuthenticated,
      user,
      tasks,
      goals,
      notes,
      notifications,
      focusMinutesToday: 150,
      focusStreak: 3,
      xp: 1250,
      level: 7,
      login,
      signup,
      logout,
      completeOnboarding,
      toggleTask,
      addTask,
      addGoal,
      addNote,
      markNotificationRead,
    }),
    [
      isLoading,
      isAuthenticated,
      user,
      tasks,
      goals,
      notes,
      notifications,
      login,
      signup,
      logout,
      completeOnboarding,
      toggleTask,
      addTask,
      addGoal,
      addNote,
      markNotificationRead,
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
