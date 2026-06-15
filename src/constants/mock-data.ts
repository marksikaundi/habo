import type { Badge, Goal, Note, Notification, Task } from "@/types";

export const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Review project proposal",
    description: "Go through the Q2 proposal draft",
    dueDate: "2024-05-21",
    dueTime: "10:00 AM",
    priority: "high",
    category: "Work",
    completed: false,
    goalId: "g1",
  },
  {
    id: "2",
    title: "Team standup meeting",
    dueDate: "2024-05-21",
    dueTime: "11:00 AM",
    priority: "medium",
    category: "Work",
    completed: false,
  },
  {
    id: "3",
    title: "Gym workout",
    dueDate: "2024-05-21",
    dueTime: "6:00 PM",
    priority: "low",
    category: "Personal",
    completed: true,
  },
  {
    id: "4",
    title: "Design mockups review",
    dueDate: "2024-05-22",
    dueTime: "2:00 PM",
    priority: "high",
    category: "Work",
    completed: false,
    goalId: "g1",
  },
  {
    id: "5",
    title: "Read chapter 5",
    dueDate: "2024-05-22",
    dueTime: "8:00 PM",
    priority: "low",
    category: "Personal",
    completed: false,
  },
  {
    id: "6",
    title: "Client presentation prep",
    dueDate: "2024-05-23",
    dueTime: "9:00 AM",
    priority: "high",
    category: "Work",
    completed: false,
  },
  {
    id: "7",
    title: "Weekly grocery run",
    dueDate: "2024-05-20",
    priority: "medium",
    category: "Personal",
    completed: true,
  },
  {
    id: "8",
    title: "Update portfolio site",
    dueDate: "2024-05-19",
    priority: "medium",
    category: "Work",
    completed: true,
  },
];

export const MOCK_GOALS: Goal[] = [
  {
    id: "g1",
    title: "Launch Habora v1.0",
    progress: 65,
    dueDate: "2024-06-30",
    taskIds: ["1", "4"],
  },
  {
    id: "g2",
    title: "Read 12 books this year",
    progress: 45,
    dueDate: "2024-12-31",
    taskIds: [],
  },
  {
    id: "g3",
    title: "Run a half marathon",
    progress: 30,
    dueDate: "2024-09-15",
    taskIds: [],
  },
];

export const MOCK_NOTES: Note[] = [
  {
    id: "n1",
    title: "App feature ideas",
    content: "Voice input for tasks, widget support, Apple Watch companion...",
    tag: "Ideas",
    createdAt: "2024-05-20",
  },
  {
    id: "n2",
    title: "Meeting notes - Q2 planning",
    content: "Focus on mobile launch, target 10k users by end of Q2...",
    tag: "Work",
    createdAt: "2024-05-19",
  },
  {
    id: "n3",
    title: "Weekend plans",
    content: "Hiking on Saturday, dinner with friends Sunday evening.",
    tag: "Personal",
    createdAt: "2024-05-18",
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "not1",
    type: "task",
    title: "Upcoming Task",
    message: "Review project proposal starts in 30 minutes",
    time: "9:30 AM",
    group: "today",
    read: false,
  },
  {
    id: "not2",
    type: "focus",
    title: "Focus Reminder",
    message: "Time for your afternoon focus session",
    time: "2:00 PM",
    group: "today",
    read: false,
  },
  {
    id: "not3",
    type: "summary",
    title: "Daily Summary",
    message: "You completed 5 tasks and logged 2.5h focus time today",
    time: "6:00 PM",
    group: "today",
    read: true,
  },
  {
    id: "not4",
    type: "goal",
    title: "Goal Update",
    message: "Launch Habora v1.0 is now 65% complete!",
    time: "Yesterday",
    group: "yesterday",
    read: true,
  },
];

export const MOCK_BADGES: Badge[] = [
  { id: "b1", name: "Early Bird", icon: "sunny", earned: true, earnedAt: "2024-05-10" },
  { id: "b2", name: "Focus Master", icon: "flame", earned: true, earnedAt: "2024-05-15" },
  { id: "b3", name: "Task Crusher", icon: "trophy", earned: true, earnedAt: "2024-05-18" },
  { id: "b4", name: "Streak King", icon: "ribbon", earned: false },
  { id: "b5", name: "Goal Getter", icon: "star", earned: false },
  { id: "b6", name: "Night Owl", icon: "moon", earned: false },
];

export const ONBOARDING_SLIDES = [
  {
    title: "Organize tasks",
    subtitle: "Keep everything in one place with smart categorization",
    icon: "checkbox" as const,
  },
  {
    title: "Focus better",
    subtitle: "Pomodoro sessions to maximize your productivity",
    icon: "timer" as const,
  },
  {
    title: "Track progress",
    subtitle: "Analytics and goals to stay motivated",
    icon: "analytics" as const,
  },
];
