# Appwrite Setup for Habora

Follow these steps to connect Habora to your Appwrite project for authentication and database storage.

## 1. Create an Appwrite project

1. Go to [Appwrite Cloud](https://cloud.appwrite.io) (or your self-hosted instance).
2. Create a new project (e.g. **Habora**).
3. Copy your **Project ID** from Settings.

## 2. Add a mobile platform

In Appwrite Console → your project → **Settings** → **Platforms**:

| Platform | Value |
|----------|-------|
| **iOS** | Bundle ID: `com.habora.habo` |
| **Android** | Package name: `com.habora.habo` |

These must match `app.json` in this repo.

## 3. Enable Email/Password auth

1. Go to **Auth** → **Settings**.
2. Enable **Email/Password** sign-in.
3. Under **Auth** → **Security**, ensure password recovery is enabled.

### Password reset redirect URL

Add this redirect URL in Appwrite Console → **Auth** → **Settings** → **URLs**:

```
habo://reset-password
```

This must match the deep link the app sends when requesting a password reset. Users open the email link on their device to land on the reset password screen.

## 4. Create the database

Create a database in Appwrite Console (or use your existing database ID in `.env`).

Create these **empty collections** (IDs must match `.env`):
`tasks`, `goals`, `notes`, `notifications`, `user_stats`

### Automated schema setup (recommended)

The app queries by `userId` — each collection needs that attribute and an index.

1. In Appwrite Console → **API Keys** → Create key with **`databases.write`** scope
2. Add to `.env`:
   ```
   APPWRITE_API_KEY=your_api_key_here
   ```
3. Run from project root:
   ```bash
   npm run appwrite:setup
   ```

This creates all attributes, indexes, and permissions automatically.

### Manual schema (alternative)

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| userId | String | Yes | Appwrite user `$id` |
| title | String | Yes | |
| description | String | No | |
| dueDate | String | Yes | ISO date `YYYY-MM-DD` |
| dueTime | String | No | e.g. `10:00 AM` |
| priority | Enum | Yes | `high`, `medium`, `low` |
| category | String | Yes | |
| completed | Boolean | Yes | Default: `false` |
| goalId | String | No | Linked goal document ID |
| subtasks | String | No | JSON stringified array |

**Indexes:** `userId` (key)

**Permissions:** Role `users` — Create, Read, Update, Delete

### Collection: `goals`

| Attribute | Type | Required |
|-----------|------|----------|
| userId | String | Yes |
| title | String | Yes |
| progress | Integer | Yes |
| dueDate | String | Yes |

**Indexes:** `userId`

**Permissions:** Role `users` — Create, Read, Update, Delete

### Collection: `notes`

| Attribute | Type | Required |
|-----------|------|----------|
| userId | String | Yes |
| title | String | Yes |
| content | String | Yes |
| tag | String | Yes |
| createdAt | String | Yes |
| taskId | String | No |

**Indexes:** `userId`

**Permissions:** Role `users` — Create, Read, Update, Delete

### Collection: `notifications`

| Attribute | Type | Required |
|-----------|------|----------|
| userId | String | Yes |
| type | Enum | Yes | `task`, `focus`, `summary`, `goal` |
| title | String | Yes |
| message | String | Yes |
| time | String | Yes |
| group | Enum | Yes | `today`, `yesterday` |
| read | Boolean | Yes |

**Indexes:** `userId`

**Permissions:** Role `users` — Create, Read, Update, Delete

### Collection: `user_stats`

| Attribute | Type | Required |
|-----------|------|----------|
| userId | String | Yes |
| focusMinutesToday | Integer | Yes |
| focusStreak | Integer | Yes |
| xp | Integer | Yes |
| level | Integer | Yes |

**Indexes:** `userId` (unique recommended)

**Permissions:** Role `users` — Create, Read, Update, Delete

## 5. Configure the app

```bash
cp .env.example .env
```

Edit `.env`:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_APPWRITE_DATABASE_ID=habora
EXPO_PUBLIC_APPWRITE_PLATFORM=com.habora.app
```

Restart Expo after changing env vars:

```bash
npx expo start -c
```

## 6. Test

1. Open the app → **Get Started** → **Sign Up**
2. Create an account with email/password
3. Add a task via the **+** button
4. Verify documents appear in Appwrite Console → Databases → `habora`

## Security notes

- Each document is created with per-user permissions (`read/update/delete` for the owning user only).
- All queries filter by `userId` so users only see their own data.
- Never commit `.env` to version control.

## Optional: Google OAuth

1. Enable Google provider in Appwrite Console → Auth.
2. Configure OAuth credentials in Google Cloud Console.
3. Use `account.createOAuth2Session()` in the app (requires `expo-web-browser` deep linking setup).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Project with the requested ID could not be found` | Check `EXPO_PUBLIC_APPWRITE_PROJECT_ID` |
| `Invalid platform` | Add iOS/Android platform in Appwrite with `com.habora.app` |
| `Collection not found` | Create collections with exact IDs above |
| `Document with the requested ID already exists` | Use unique document IDs (app uses `ID.unique()`) |
| Network error on Android emulator (self-hosted) | Use `http://10.0.2.2/v1` instead of `localhost` |
