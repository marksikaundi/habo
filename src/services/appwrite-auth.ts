import * as Linking from "expo-linking";
import {
  AppwriteException,
  ID,
  Permission,
  Role,
  type Models,
} from "react-native-appwrite";

import { account } from "@/lib/appwrite";
import { normalizeEmail } from "@/lib/auth-validation";
import type { User } from "@/types";

/** Deep link Appwrite redirects to after the user taps the recovery email. */
export const PASSWORD_RESET_URL = Linking.createURL("reset-password");

export function getAppwriteErrorMessage(error: unknown): string {
  if (error instanceof AppwriteException) {
    const code = error.code;
    const type = error.type ?? "";

    if (code === 401 || type === "user_invalid_credentials") {
      return "Incorrect email or password. Please try again.";
    }
    if (code === 409 || type === "user_already_exists") {
      return "An account with this email already exists. Try logging in instead.";
    }
    if (type === "user_email_already_exists") {
      return "This email is already registered. Try logging in instead.";
    }
    if (type === "general_rate_limit_exceeded") {
      return "Too many attempts. Please wait a moment and try again.";
    }
    if (type === "user_password_mismatch") {
      return "Passwords do not match.";
    }
    if (type === "password_recently_used") {
      return "Choose a password you haven't used recently.";
    }
    if (messageIncludes(error.message, "session is active")) {
      return "A session is already active. Please try again.";
    }
    if (messageIncludes(error.message, "Invalid `url`")) {
      return "Password reset URL is not configured in Appwrite. Add your app scheme to Auth settings.";
    }
    if (messageIncludes(error.message, "platform")) {
      return "App platform mismatch. Ensure Appwrite platform ID matches your app bundle ID.";
    }

    return error.message || "Something went wrong. Please try again.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function messageIncludes(message: string, fragment: string): boolean {
  return message.toLowerCase().includes(fragment.toLowerCase());
}

export function mapAppwriteUser(appwriteUser: Models.User<Models.Preferences>): User {
  return {
    id: appwriteUser.$id,
    name: appwriteUser.name,
    email: appwriteUser.email,
  };
}

async function clearExistingSessions(): Promise<void> {
  try {
    await account.deleteSessions();
  } catch {
    // No active sessions to clear
  }
}

export async function getCurrentSessionUser(): Promise<User | null> {
  try {
    const appwriteUser = await account.get();
    return mapAppwriteUser(appwriteUser);
  } catch {
    return null;
  }
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const normalizedEmail = normalizeEmail(email);

  try {
    await account.createEmailPasswordSession({
      email: normalizedEmail,
      password,
    });
  } catch (error) {
    if (error instanceof AppwriteException && shouldRetryAfterClearingSessions(error)) {
      await clearExistingSessions();
      await account.createEmailPasswordSession({
        email: normalizedEmail,
        password,
      });
    } else {
      throw error;
    }
  }

  const appwriteUser = await account.get();
  return mapAppwriteUser(appwriteUser);
}

export async function signupWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const normalizedEmail = normalizeEmail(email);
  const trimmedName = name.trim();

  try {
    await account.create({
      userId: ID.unique(),
      email: normalizedEmail,
      password,
      name: trimmedName,
    });
  } catch (error) {
    if (
      error instanceof AppwriteException &&
      (error.code === 409 || error.type === "user_already_exists")
    ) {
      throw new Error("An account with this email already exists. Try logging in instead.");
    }
    throw error;
  }

  await clearExistingSessions();

  try {
    await account.createEmailPasswordSession({
      email: normalizedEmail,
      password,
    });
  } catch (error) {
    if (error instanceof AppwriteException && shouldRetryAfterClearingSessions(error)) {
      await clearExistingSessions();
      await account.createEmailPasswordSession({
        email: normalizedEmail,
        password,
      });
    } else {
      throw error;
    }
  }

  const appwriteUser = await account.get();
  return mapAppwriteUser(appwriteUser);
}

export async function requestPasswordRecovery(email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);

  await account.createRecovery({
    email: normalizedEmail,
    url: PASSWORD_RESET_URL,
  });
}

export async function completePasswordRecovery(
  userId: string,
  secret: string,
  password: string,
): Promise<void> {
  await account.updateRecovery({
    userId,
    secret,
    password,
  });
}

export async function logoutCurrentSession(): Promise<void> {
  try {
    await account.deleteSession({ sessionId: "current" });
  } catch {
    await clearExistingSessions();
  }
}

export function userDocumentPermissions(userId: string): string[] {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

function shouldRetryAfterClearingSessions(error: AppwriteException): boolean {
  return (
    error.code === 401 ||
    messageIncludes(error.message, "session is active") ||
    messageIncludes(error.message, "session is prohibited")
  );
}
