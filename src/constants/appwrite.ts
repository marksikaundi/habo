import Constants from "expo-constants";
import { Platform } from "react-native";

const extra = Constants.expoConfig?.extra ?? {};

export const appwriteConfig = {
  endpoint:
    process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ??
    (extra.appwriteEndpoint as string | undefined) ??
    "",
  projectId:
    process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ??
    (extra.appwriteProjectId as string | undefined) ??
    "",
  databaseId:
    process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ??
    (extra.appwriteDatabaseId as string | undefined) ??
    "habora",
  collections: {
    tasks:
      process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_TASKS ??
      (extra.appwriteCollectionTasks as string | undefined) ??
      "tasks",
    goals:
      process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_GOALS ??
      (extra.appwriteCollectionGoals as string | undefined) ??
      "goals",
    notes:
      process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_NOTES ??
      (extra.appwriteCollectionNotes as string | undefined) ??
      "notes",
    notifications:
      process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_NOTIFICATIONS ??
      (extra.appwriteCollectionNotifications as string | undefined) ??
      "notifications",
    userStats:
      process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_USER_STATS ??
      (extra.appwriteCollectionUserStats as string | undefined) ??
      "user_stats",
  },
  platform:
    process.env.EXPO_PUBLIC_APPWRITE_PLATFORM ??
    (extra.appwritePlatform as string | undefined) ??
    (Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.bundleIdentifier
      : Constants.expoConfig?.android?.package) ??
    "com.habora.habo",
};

export function isAppwriteConfigured(): boolean {
  return Boolean(appwriteConfig.endpoint && appwriteConfig.projectId);
}
