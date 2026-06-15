import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card, ProgressBar } from "@/components/TaskItem";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { MOCK_BADGES } from "@/constants/mock-data";

const DAILY_CHALLENGES = [
  { title: "Complete 5 tasks", progress: 3, total: 5, xp: 50 },
  { title: "Focus for 1 hour", progress: 45, total: 60, xp: 75 },
  { title: "Maintain streak", progress: 1, total: 1, xp: 25 },
];

export default function GamificationScreen() {
  const insets = useSafeAreaInsets();
  const { xp, level, focusStreak } = useApp();

  const xpForNextLevel = level * 200;
  const xpProgress = (xp % xpForNextLevel) / xpForNextLevel * 100;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Rewards"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40, gap: Spacing.xl }}
      >
        <Card style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{level}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Level {level}</Text>
              <Text style={styles.xpText}>{xp} XP</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {focusStreak}</Text>
            </View>
          </View>
          <ProgressBar progress={xpProgress} height={10} />
          <Text style={styles.nextLevel}>
            {xpForNextLevel - (xp % xpForNextLevel)} XP to Level {level + 1}
          </Text>
        </Card>

        <View>
          <Text style={styles.sectionTitle}>Daily Challenges</Text>
          {DAILY_CHALLENGES.map((challenge) => (
            <Card key={challenge.title} style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Text style={styles.challengeXp}>+{challenge.xp} XP</Text>
              </View>
              <ProgressBar
                progress={(challenge.progress / challenge.total) * 100}
                color={Colors.success}
              />
              <Text style={styles.challengeProgress}>
                {challenge.progress}/{challenge.total}
              </Text>
            </Card>
          ))}
        </View>

        <View>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgeGrid}>
            {MOCK_BADGES.map((badge) => (
              <View
                key={badge.id}
                style={[styles.badgeItem, !badge.earned && styles.badgeLocked]}
              >
                <View
                  style={[
                    styles.badgeIcon,
                    badge.earned
                      ? { backgroundColor: Colors.primaryMuted }
                      : { backgroundColor: Colors.borderLight },
                  ]}
                >
                  <Ionicons
                    name={badge.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={badge.earned ? Colors.primary : Colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.badgeName,
                    !badge.earned && styles.badgeNameLocked,
                  ]}
                >
                  {badge.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  levelCard: {
    gap: Spacing.md,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  levelNumber: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: "#fff",
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  xpText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  streakText: {
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  nextLevel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  challengeCard: {
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  challengeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  challengeTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  challengeXp: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  challengeProgress: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  badgeItem: {
    width: "30%",
    alignItems: "center",
    gap: Spacing.sm,
  },
  badgeLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeName: {
    fontSize: FontSize.xs,
    fontWeight: "500",
    color: Colors.text,
    textAlign: "center",
  },
  badgeNameLocked: {
    color: Colors.textMuted,
  },
});
