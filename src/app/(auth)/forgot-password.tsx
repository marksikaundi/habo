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
import { validateEmail } from "@/lib/auth-validation";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { requestPasswordReset, authError, clearAuthError, isConfigured } = useApp();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setLocalError(emailError);
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
      await requestPasswordReset(email);
      setSent(true);
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
      <ScreenHeader
        title="Forgot Password"
        showBack
        onBack={goBackOrWelcome}
      />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successText}>
              If an account exists for {email.trim().toLowerCase()}, we sent a password
              reset link. Open it on this device to set a new password.
            </Text>
            <Button
              title="Back to Login"
              onPress={() => router.replace("/(auth)/login")}
            />
          </View>
        ) : (
          <>
            <Text style={styles.description}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </Text>

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

            <Button
              title={loading ? "Sending..." : "Send Reset Link"}
              onPress={handleSubmit}
              disabled={loading || !email.trim()}
            />

            <Pressable onPress={() => router.replace("/(auth)/login")} style={styles.link}>
              <Text style={styles.linkText}>
                Remember your password? <Text style={styles.linkBold}>Login</Text>
              </Text>
            </Pressable>
          </>
        )}
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
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
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
  successBox: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: 12,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
  },
  successText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
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
});
