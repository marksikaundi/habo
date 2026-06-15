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
import { goBackOrWelcome } from "@/lib/auth-navigation";
import { validateEmail, validatePassword } from "@/lib/auth-validation";
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
    const emailError = validateEmail(email);
    if (emailError) {
      setLocalError(emailError);
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setLocalError(passwordError);
      return;
    }
    if (!isConfigured) {
      setLocalError("Appwrite is not configured. Add your keys to .env");
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
      <ScreenHeader title="Welcome Back" showBack onBack={goBackOrWelcome} />
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
          autoComplete="email"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
        />

        <Pressable
          style={styles.forgot}
          onPress={() => router.push("/(auth)/forgot-password")}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        <Button
          title={loading ? "Signing in..." : "Login"}
          onPress={handleLogin}
          disabled={loading || !email.trim() || !password}
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
