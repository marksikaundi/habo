import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, FontSize, Spacing } from "@/constants/theme";

type ScreenHeaderProps = {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  leftElement?: React.ReactNode;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightElement?: React.ReactNode;
  transparent?: boolean;
};

export function ScreenHeader({
  title,
  subtitle,
  showBack,
  onBack,
  leftIcon,
  onLeftPress,
  leftElement,
  rightIcon,
  onRightPress,
  rightElement,
  transparent,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.sm },
        transparent && styles.transparent,
      ]}
    >
      <View style={styles.row}>
        {leftElement ??
          (showBack ? (
            <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={8}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </Pressable>
          ) : leftIcon ? (
            <Pressable onPress={onLeftPress} style={styles.iconBtn} hitSlop={8}>
              <Ionicons name={leftIcon} size={26} color={Colors.text} />
            </Pressable>
          ) : (
            <View style={styles.iconPlaceholder} />
          ))}

        <View style={styles.center}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {rightElement ??
          (rightIcon ? (
            <Pressable onPress={onRightPress} style={styles.iconBtn} hitSlop={8}>
              <Ionicons name={rightIcon} size={24} color={Colors.text} />
            </Pressable>
          ) : (
            <View style={styles.iconPlaceholder} />
          ))}
      </View>
    </View>
  );
}

type GreetingHeaderProps = {
  name: string;
  date: string;
  onNotificationPress?: () => void;
  unreadCount?: number;
};

export function GreetingHeader({
  name,
  date,
  onNotificationPress,
  unreadCount = 0,
}: GreetingHeaderProps) {
  const insets = useSafeAreaInsets();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={[styles.greetingContainer, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greeting}>
            {greeting}, {name} 👋
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <Pressable onPress={onNotificationPress} style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  transparent: {
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPlaceholder: {
    width: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  greetingContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.text,
  },
  date: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...({ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } as ViewStyle),
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
