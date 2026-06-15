import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
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
import {
  validatePassword,
  validatePasswordMatch,
} from "@/lib/auth-validation";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { userId, secret } = useLocalSearchParams<{
    userId?: string | string[];
    secret?: string | string[];
  }>();
  const { completePasswordReset, authError, clearAuthError } = useApp();

  const resolvedUserId = Array.isArray(userId) ? userId[0] : userId;
  const resolvedSecret = Array.isArray(secret) ? secret[0] : secret;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!resolvedUserId || !resolvedSecret) {
      setLocalError("Invalid or expired reset link. Request a new one from Forgot Password.");
    }
  }, [resolvedUserId, resolvedSecret]);

  const handleReset = async () => {
    if (!resolvedUserId || !resolvedSecret) return;

    const passwordError = validatePassword(password);
    if (passwordError) {
      setLocalError(passwordError);
      return;
    }

    const matchError = validatePasswordMatch(password, confirmPassword);
    if (matchError) {
      setLocalError(matchError);
      return;
    }

    setLoading(true);
    setLocalError(null);
    clearAuthError();

    try {
      await completePasswordReset(resolvedUserId, resolvedSecret, password);
      setSuccess(true);
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
      <ScreenHeader title="Reset Password" showBack onBack={goBackOrWelcome} />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {success ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Password updated</Text>
            <Text style={styles.successText}>
              Your password has been reset. You can now sign in with your new password.
            </Text>
            <Button title="Go to Login" onPress={() => router.replace("/(auth)/login")} />
          </View>
        ) : (
          <>
            <Text style={styles.description}>Choose a new password for your account.</Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Input
              label="New Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />

            <Button
              title={loading ? "Updating..." : "Update Password"}
              onPress={handleReset}
              disabled={
                loading ||
                !password ||
                !confirmPassword ||
                !resolvedUserId ||
                !resolvedSecret
              }
            />
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
});
