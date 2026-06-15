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

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signup, authError, clearAuthError, isConfigured } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!name || !email || !password) return;
    if (!isConfigured) {
      setLocalError("Appwrite is not configured. Add your keys to .env — see docs/APPWRITE_SETUP.md");
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
        onBack={() => router.back()}
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

        <Input label="Full Name" value={name} onChangeText={setName} placeholder="Mark Johnson" />
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

        <Button
          title={loading ? "Creating..." : "Sign Up"}
          onPress={handleSignup}
          disabled={loading || !name || !email || !password}
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
          onPress={handleSignup}
        />

        <Pressable onPress={() => router.push("/(auth)/login")} style={styles.link}>
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
