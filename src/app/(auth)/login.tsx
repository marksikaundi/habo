import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { AuthField } from "@/components/auth/AuthField";
import {
  AuthDivider,
  AuthFooterLink,
  AuthPrimaryButton,
  AuthScreenLayout,
  GoogleButton,
} from "@/components/auth/AuthScreenLayout";
import { validateEmail, validatePassword } from "@/lib/auth-validation";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function LoginScreen() {
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
    <AuthScreenLayout
      title="Welcome Back"
      subtitle="Login to continue."
      error={errorMessage}
      footer={
        <AuthFooterLink
          text="Don't have an account?"
          linkText="Sign up"
          onPress={() => router.replace("/(auth)/signup")}
        />
      }
    >
      <AuthField
        icon="mail-outline"
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <AuthField
        icon="lock-closed-outline"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
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

      <AuthPrimaryButton
        title="Login"
        onPress={handleLogin}
        loading={loading}
        disabled={!email.trim() || !password}
      />

      <AuthDivider />

      <GoogleButton
        onPress={() =>
          setLocalError("Google sign-in will be available soon. Use email for now.")
        }
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  forgot: {
    alignSelf: "flex-end",
    marginTop: -Spacing.sm,
    marginBottom: Spacing.xl,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: "500",
  },
});
