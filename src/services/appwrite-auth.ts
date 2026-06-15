import {
  AppwriteException,
  ID,
  Permission,
  Role,
  type Models,
} from "react-native-appwrite";

import { account } from "@/lib/appwrite";
import type { User } from "@/types";

export function getAppwriteErrorMessage(error: unknown): string {
  if (error instanceof AppwriteException) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function mapAppwriteUser(appwriteUser: Models.User<Models.Preferences>): User {
  return {
    id: appwriteUser.$id,
    name: appwriteUser.name,
    email: appwriteUser.email,
  };
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
  await account.createEmailPasswordSession({ email, password });
  const appwriteUser = await account.get();
  return mapAppwriteUser(appwriteUser);
}

export async function signupWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  await account.create({
    userId: ID.unique(),
    email,
    password,
    name,
  });
  await account.createEmailPasswordSession({ email, password });
  const appwriteUser = await account.get();
  return mapAppwriteUser(appwriteUser);
}

export async function logoutCurrentSession(): Promise<void> {
  try {
    await account.deleteSession({ sessionId: "current" });
  } catch {
    // Session may already be expired
  }
}

export function userDocumentPermissions(userId: string): string[] {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}
