export type Priority = "high" | "medium" | "low";

export type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  priority: Priority;
  category: string;
  completed: boolean;
  goalId?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
};

export type Goal = {
  id: string;
  title: string;
  progress: number;
  dueDate: string;
  taskIds: string[];
};

export type Note = {
  id: string;
  title: string;
  content: string;
  tag: string;
  createdAt: string;
  taskId?: string;
};

export type Notification = {
  id: string;
  type: "task" | "focus" | "summary" | "goal";
  title: string;
  message: string;
  time: string;
  group: "today" | "yesterday";
  read: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Badge = {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
};
