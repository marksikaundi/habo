import { router } from "expo-router";

export function goBackOrWelcome() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/(auth)/welcome");
  }
}
