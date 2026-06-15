# Habora — Productivity App

Plan. Focus. Achieve.

A production-style productivity mobile app built with **Expo SDK 56**, **Expo Router**, and **Appwrite** for authentication and database.

## Get started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Appwrite

Follow **[docs/APPWRITE_SETUP.md](docs/APPWRITE_SETUP.md)** to create your Appwrite project, database collections, and mobile platform.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Appwrite endpoint and project ID.

### 4. Run the app

```bash
npx expo start -c
```

Open in Expo Go, iOS Simulator, or Android Emulator.

## Backend (Appwrite)

| Service | Usage |
|---------|-------|
| **Auth** | Email/password sign up, login, session persistence |
| **Database** | Tasks, goals, notes, notifications, user stats |

Collections are scoped per user with document-level permissions. See [docs/APPWRITE_SETUP.md](docs/APPWRITE_SETUP.md) for the full schema.

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

## Project structure

```
src/
├── app/              # Expo Router screens
├── components/       # Shared UI
├── constants/        # Theme + Appwrite config
├── context/          # App state (Appwrite-backed)
├── lib/              # Appwrite client + mappers
├── services/         # Auth + database API layer
└── types/
docs/
└── APPWRITE_SETUP.md # Backend setup guide
```

## Tech stack

- Expo 56 / React Native 0.85
- Expo Router
- Appwrite (`react-native-appwrite`)
- TypeScript (strict)

## Next steps

- Google OAuth via Appwrite
- Push notifications for task reminders
- Realtime subscriptions for live task sync
- Haptic feedback and sound alerts in Focus mode
