import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";
import type { Notification } from "@/types";

const GROUPS = [
  { key: "today" as const, label: "Today" },
  { key: "yesterday" as const, label: "Yesterday" },
];

function isMissedNotification(notif: Notification): boolean {
  return (
    notif.title.toLowerCase().includes("missed") ||
    notif.message.toLowerCase().includes("not completed")
  );
}

type StatusIconProps = {
  notif: Notification;
};

function NotificationStatusIcon({ notif }: StatusIconProps) {
  const missed = isMissedNotification(notif);

  if (missed) {
    return <View style={[styles.statusRing, styles.statusRingMissed]} />;
  }

  if (!notif.read) {
    return (
      <View style={[styles.statusRing, styles.statusRingUnread]}>
        <View style={styles.statusDot} />
      </View>
    );
  }

  return <View style={styles.statusRing} />;
}

type NotificationCardProps = {
  notif: Notification;
  onPress: () => void;
};

function NotificationCard({ notif, onPress }: NotificationCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
    >
      <NotificationStatusIcon notif={notif} />

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardTitle, !notif.read && styles.cardTitleUnread]} numberOfLines={1}>
            {notif.title}
          </Text>
          <Text style={styles.cardTime}>{notif.time}</Text>
        </View>
        <Text style={styles.cardMessage} numberOfLines={2}>
          {notif.message}
        </Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const [showMenu, setShowMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    setShowMenu(false);
    await markAllNotificationsRead();
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Notifications"
        showBack
        onBack={() => router.back()}
        rightElement={
          <Pressable onPress={() => setShowMenu(true)} style={styles.menuBtn} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={22} color={Colors.text} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 },
          notifications.length === 0 && styles.scrollEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {GROUPS.map(({ key, label }) => {
          const items = notifications.filter((n) => n.group === key);
          if (items.length === 0) return null;

          return (
            <View key={key} style={styles.section}>
              <Text style={styles.sectionTitle}>{label}</Text>
              {items.map((notif) => (
                <NotificationCard
                  key={notif.id}
                  notif={notif}
                  onPress={() => markNotificationRead(notif.id)}
                />
              ))}
            </View>
          );
        })}

        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              Task reminders and updates will appear here
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuSheet, { top: insets.top + 56 }]}>
            <Pressable
              onPress={handleMarkAllRead}
              disabled={unreadCount === 0}
              style={({ pressed }) => [
                styles.menuItem,
                unreadCount === 0 && styles.menuItemDisabled,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="checkmark-done-outline" size={20} color={Colors.text} />
              <Text style={styles.menuItemText}>Mark all as read</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingTop: Spacing.sm,
  },
  scrollEmpty: {
    flexGrow: 1,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  statusRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  statusRingUnread: {
    borderColor: Colors.textMuted,
  },
  statusRingMissed: {
    borderColor: Colors.danger,
    borderWidth: 2.5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  cardTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
  },
  cardTitleUnread: {
    color: Colors.text,
  },
  cardTime: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
    flexShrink: 0,
  },
  cardMessage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    paddingRight: Spacing.sm,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl * 2,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  menuSheet: {
    position: "absolute",
    right: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 200,
    ...Shadow.md,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  menuItemDisabled: {
    opacity: 0.45,
  },
  menuItemText: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: "500",
  },
});
