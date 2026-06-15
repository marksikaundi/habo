import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

const NOTIF_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  task: "checkbox-outline",
  focus: "timer-outline",
  summary: "bar-chart-outline",
  goal: "flag-outline",
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, markNotificationRead } = useApp();

  const groups = ["today", "yesterday"] as const;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Notifications"
        showBack
        onBack={() => router.back()}
        rightIcon="ellipsis-horizontal"
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {groups.map((group) => {
          const items = notifications.filter((n) => n.group === group);
          if (items.length === 0) return null;

          return (
            <View key={group} style={styles.group}>
              <Text style={styles.groupTitle}>
                {group === "today" ? "Today" : "Yesterday"}
              </Text>
              {items.map((notif) => (
                <Pressable
                  key={notif.id}
                  onPress={() => markNotificationRead(notif.id)}
                  style={[styles.notifCard, !notif.read && styles.notifUnread]}
                >
                  <View
                    style={[
                      styles.notifIcon,
                      { backgroundColor: Colors.primaryMuted },
                    ]}
                  >
                    <Ionicons
                      name={NOTIF_ICONS[notif.type] ?? "notifications"}
                      size={20}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.notifContent}>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                    <Text style={styles.notifMessage}>{notif.message}</Text>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                  </View>
                  {!notif.read ? <View style={styles.unreadDot} /> : null}
                </Pressable>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  group: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  groupTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  notifUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  notifMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
});
