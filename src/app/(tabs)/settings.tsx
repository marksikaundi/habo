import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

type SettingItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  route?: string;
  action?: () => void;
  danger?: boolean;
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useApp();

  const sections: { title?: string; items: SettingItem[] }[] = [
    {
      items: [],
    },
    {
      title: "Preferences",
      items: [
        { icon: "person-outline", label: "Profile Settings", route: "/(auth)/signup" },
        { icon: "color-palette-outline", label: "Appearance", value: "Light Mode" },
        { icon: "notifications-outline", label: "Notifications", route: "/notifications" },
        { icon: "timer-outline", label: "Focus Mode Settings", route: "/(tabs)/focus" },
      ],
    },
    {
      title: "Data",
      items: [
        { icon: "cloud-outline", label: "Backup & Sync" },
        { icon: "swap-horizontal-outline", label: "Import / Export" },
        { icon: "shield-outline", label: "Privacy & Security" },
      ],
    },
    {
      title: "More",
      items: [
        { icon: "help-circle-outline", label: "Help & Support" },
        { icon: "information-circle-outline", label: "About Habora", value: "v1.0.0" },
        { icon: "people-outline", label: "Collaboration", route: "/collaboration" },
        { icon: "trophy-outline", label: "Gamification", route: "/gamification" },
        {
          icon: "log-out-outline",
          label: "Sign Out",
          danger: true,
          action: async () => {
            await logout();
            router.replace("/(auth)/welcome");
          },
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name ?? "M").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.name ?? "Mark Johnson"}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? "mark@example.com"}</Text>
          </View>
        </View>

        {sections.slice(1).map((section) => (
          <View key={section.title} style={styles.section}>
            {section.title ? (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            ) : null}
            <View style={styles.sectionCard}>
              {section.items.map((item, i) => (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    if (item.action) item.action();
                    else if (item.route) router.push(item.route as "/goals");
                  }}
                  style={[
                    styles.settingRow,
                    i < section.items.length - 1 && styles.settingRowBorder,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={item.danger ? Colors.danger : Colors.textSecondary}
                  />
                  <Text
                    style={[styles.settingLabel, item.danger && styles.dangerLabel]}
                  >
                    {item.label}
                  </Text>
                  {item.value ? (
                    <Text style={styles.settingValue}>{item.value}</Text>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: "#fff",
  },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  dangerLabel: {
    color: Colors.danger,
  },
  settingValue: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginRight: Spacing.xs,
  },
});
