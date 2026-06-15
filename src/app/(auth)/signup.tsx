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
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordMatch,
} from "@/lib/auth-validation";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signup, authError, clearAuthError, isConfigured } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignup = async () => {
    const nameError = validateName(name);
    if (nameError) {
      setLocalError(nameError);
      return;
    }
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
    const matchError = validatePasswordMatch(password, confirmPassword);
    if (matchError) {
      setLocalError(matchError);
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
      await signup(name, email, password);
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
      <ScreenHeader
        title="Create Account"
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
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Input
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Mark Johnson"
          autoCapitalize="words"
          autoComplete="name"
        />
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
          title={loading ? "Creating..." : "Sign Up"}
          onPress={handleSignup}
          disabled={
            loading ||
            !name.trim() ||
            !email.trim() ||
            !password ||
            !confirmPassword
          }
        />

        <Pressable onPress={() => router.replace("/(auth)/login")} style={styles.link}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Login</Text>
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
