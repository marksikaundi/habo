import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, authError, clearAuthError, isConfigured } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) return;
    if (!isConfigured) {
      setLocalError("Appwrite is not configured. Add your keys to .env — see docs/APPWRITE_SETUP.md");
      return;
    }
    setLoading(true);
    setLocalError(null);
    clearAuthError();
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch {
      // authError set in context
    } finally {
      setLoading(false);
    }
  };

  const errorMessage = localError ?? authError;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader title="Welcome Back" showBack onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="mark@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        <Pressable style={styles.forgot}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        <Button
          title={loading ? "Signing in..." : "Login"}
          onPress={handleLogin}
          disabled={loading || !email || !password}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          title="Continue with Google"
          variant="secondary"
          icon="logo-google"
          onPress={handleLogin}
        />

        <Pressable onPress={() => router.push("/(auth)/signup")} style={styles.link}>
          <Text style={styles.linkText}>
            Don&apos;t have an account? <Text style={styles.linkBold}>Sign up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  forgot: {
    alignSelf: "flex-end",
    marginBottom: Spacing.xl,
    marginTop: -Spacing.sm,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: "500",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.lg,
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  link: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  linkText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  linkBold: {
    color: Colors.primary,
    fontWeight: "600",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
});
