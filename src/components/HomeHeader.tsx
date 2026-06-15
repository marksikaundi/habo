import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, FontSize, Spacing } from "@/constants/theme";

type HomeHeaderProps = {
  name: string;
  date: string;
  unreadCount?: number;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
};

export function HomeHeader({
  name,
  date,
  unreadCount = 0,
  onMenuPress,
  onNotificationPress,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.topRow}>
        <Pressable onPress={onMenuPress} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="menu" size={26} color={Colors.text} />
        </Pressable>
        <Pressable onPress={onNotificationPress} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          {unreadCount > 0 ? <View style={styles.badge} /> : null}
        </Pressable>
      </View>

      <Text style={styles.greeting}>
        {greeting}, {name} 👋
      </Text>
      <Text style={styles.date}>{date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.background,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  date: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
