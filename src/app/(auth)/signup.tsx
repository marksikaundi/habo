import { router } from "expo-router";
import { useState } from "react";

import { AuthField } from "@/components/auth/AuthField";
import {
  AuthDivider,
  AuthFooterLink,
  AuthPrimaryButton,
  AuthScreenLayout,
  GoogleButton,
} from "@/components/auth/AuthScreenLayout";
import {
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/auth-validation";
import { useApp } from "@/context/AppContext";

export default function SignUpScreen() {
  const { signup, authError, clearAuthError, isConfigured } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <AuthScreenLayout
      title="Create Account"
      subtitle="Let's get you started."
      error={errorMessage}
      footer={
        <AuthFooterLink
          text="Already have an account?"
          linkText="Login"
          onPress={() => router.replace("/(auth)/login")}
        />
      }
    >
      <AuthField
        icon="person-outline"
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoComplete="name"
      />
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
        autoComplete="new-password"
      />

      <AuthPrimaryButton
        title="Sign Up"
        onPress={handleSignup}
        loading={loading}
        disabled={!name.trim() || !email.trim() || !password}
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
