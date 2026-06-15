# Habora — Productivity App

Plan. Focus. Achieve.

A production-style productivity mobile app built with **Expo SDK 56** and **Expo Router**. Combines task management, focus sessions, goals, notes, analytics, and gamification in a clean purple-themed UI.

## Get started

```bash
npm install
npx expo start
```

Open in Expo Go, iOS Simulator, or Android Emulator.

## App flow

| Screen | Route |
|--------|-------|
| Splash | `/` |
| Welcome / Onboarding | `/(auth)/welcome` |
| Sign Up | `/(auth)/signup` |
| Login | `/(auth)/login` |
| Home Dashboard | `/(tabs)` |
| Tasks | `/(tabs)/tasks` |
| Calendar | `/(tabs)/calendar` |
| Focus Mode | `/(tabs)/focus` |
| Settings | `/(tabs)/settings` |
| Add Task (modal) | `/add-task` |
| Goals | `/goals` |
| Notes | `/notes` |
| Notifications | `/notifications` |
| Analytics | `/analytics` |
| Gamification | `/gamification` |
| Collaboration | `/collaboration` |

## Features

- **Bottom tab navigation** — Home, Tasks, Calendar, Focus, Settings
- **Floating action button** — Quick add task from any tab
- **Auth flow** — Welcome carousel, sign up, login (persisted with AsyncStorage)
- **Task management** — Tabs, search, priority filter, swipe-to-complete
- **Focus mode** — Pomodoro timer with break sessions and streak counter
- **Goals & notes** — Progress tracking and tagged notes
- **Analytics** — Productivity score, focus time, completion charts
- **Gamification** — XP, levels, badges, daily challenges

## Project structure

```
src/
├── app/           # Expo Router screens
├── components/    # Shared UI (Button, TaskItem, ScreenHeader, etc.)
├── constants/     # Theme tokens and mock data
├── context/       # App state (tasks, goals, auth)
└── types/         # TypeScript types
```

## Tech stack

- Expo 56 / React Native 0.85
- Expo Router (file-based routing)
- TypeScript (strict)
- @expo/vector-icons
- expo-linear-gradient
- @react-native-async-storage/async-storage

## Next steps

- Connect a backend (e.g. Convex) for real-time sync
- Add Clerk authentication
- Push notifications for task reminders
- Haptic feedback and sound alerts in Focus mode
