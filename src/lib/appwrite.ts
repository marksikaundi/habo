import "react-native-url-polyfill/auto";

import { Client, Account, Databases } from "react-native-appwrite";

import { appwriteConfig, isAppwriteConfigured } from "@/constants/appwrite";

const client = new Client();

if (isAppwriteConfigured()) {
  client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform);
}

export const appwriteClient = client;
export const account = new Account(client);
export const databases = new Databases(client);
