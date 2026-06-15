import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ListPageHeader } from "@/components/ListPageHeader";
import { ProgressBar } from "@/components/TaskItem";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";
import type { Badge } from "@/types";

type Challenge = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  progress: number;
  total: number;
  xp: number;
  color: string;
};

function todayIso() {
  return new Date().toISOString().split("T")[0] ?? "";
}

function buildBadges(
  completedCount: number,
  completedToday: number,
  focusMinutesToday: number,
  focusStreak: number,
  goals: { progress: number }[],
  xp: number,
): Badge[] {
  return [
    {
      id: "b1",
      name: "Early Bird",
      icon: "sunny",
      earned: completedToday >= 1,
      earnedAt: completedToday >= 1 ? todayIso() : undefined,
    },
    {
      id: "b2",
      name: "Focus Master",
      icon: "flame",
      earned: focusMinutesToday >= 60 || xp >= 150,
    },
    {
      id: "b3",
      name: "Task Crusher",
      icon: "trophy",
      earned: completedCount >= 5,
    },
    {
      id: "b4",
      name: "Streak King",
      icon: "ribbon",
      earned: focusStreak >= 3,
    },
    {
      id: "b5",
      name: "Goal Getter",
      icon: "star",
      earned: goals.some((g) => g.progress >= 50),
    },
    {
      id: "b6",
      name: "Night Owl",
      icon: "moon",
      earned: false,
    },
  ];
}

type StatPillProps = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function StatPill({ label, value, icon }: StatPillProps) {
  return (
    <View style={styles.statPill}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type ChallengeCardProps = {
  challenge: Challenge;
};

function ChallengeCard({ challenge }: ChallengeCardProps) {
  const pct = Math.min(100, (challenge.progress / challenge.total) * 100);
  const done = challenge.progress >= challenge.total;

  return (
    <View style={styles.challengeCard}>
      <View style={[styles.challengeIcon, { backgroundColor: challenge.color + "22" }]}>
        <Ionicons name={challenge.icon} size={22} color={challenge.color} />
      </View>

      <View style={styles.challengeBody}>
        <View style={styles.challengeTop}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <View style={[styles.xpPill, done && styles.xpPillDone]}>
            <Text style={[styles.xpPillText, done && styles.xpPillTextDone]}>
              {done ? "Done" : `+${challenge.xp} XP`}
            </Text>
          </View>
        </View>
        <Text style={styles.challengeSubtitle}>{challenge.subtitle}</Text>
        <View style={styles.challengeProgressRow}>
          <View style={styles.challengeBar}>
            <ProgressBar progress={pct} height={8} color={challenge.color} />
          </View>
          <Text style={styles.challengeCount}>
            {Math.min(challenge.progress, challenge.total)}/{challenge.total}
          </Text>
        </View>
      </View>
    </View>
  );
}

type BadgeItemProps = {
  badge: Badge;
};

function BadgeItem({ badge }: BadgeItemProps) {
  return (
    <View style={[styles.badgeItem, !badge.earned && styles.badgeItemLocked]}>
      <View
        style={[
          styles.badgeCircle,
          badge.earned ? styles.badgeCircleEarned : styles.badgeCircleLocked,
        ]}
      >
        <Ionicons
          name={badge.icon as keyof typeof Ionicons.glyphMap}
          size={26}
          color={badge.earned ? Colors.primary : Colors.textMuted}
        />
        {!badge.earned ? (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.badgeName, !badge.earned && styles.badgeNameLocked]} numberOfLines={2}>
        {badge.name}
      </Text>
    </View>
  );
}

export default function GamificationScreen() {
  const insets = useSafeAreaInsets();
  const { xp, level, focusStreak, focusMinutesToday, tasks, goals } = useApp();

  const today = todayIso();
  const completedTasks = tasks.filter((t) => t.completed);
  const completedToday = tasks.filter((t) => t.completed && t.dueDate === today).length;

  const xpForNextLevel = Math.max(level * 200, 200);
  const xpIntoLevel = xp % xpForNextLevel;
  const xpProgress = (xpIntoLevel / xpForNextLevel) * 100;
  const xpRemaining = xpForNextLevel - xpIntoLevel;

  const badges = useMemo(
    () =>
      buildBadges(
        completedTasks.length,
        completedToday,
        focusMinutesToday,
        focusStreak,
        goals,
        xp,
      ),
    [completedTasks.length, completedToday, focusMinutesToday, focusStreak, goals, xp],
  );

  const earnedBadgeCount = badges.filter((b) => b.earned).length;

  const challenges: Challenge[] = useMemo(
    () => [
      {
        id: "tasks",
        title: "Complete 5 tasks",
        subtitle: "Finish tasks due today",
        icon: "checkbox-outline",
        progress: completedToday,
        total: 5,
        xp: 50,
        color: Colors.primary,
      },
      {
        id: "focus",
        title: "Focus for 1 hour",
        subtitle: "Log focused work time",
        icon: "timer-outline",
        progress: focusMinutesToday,
        total: 60,
        xp: 75,
        color: Colors.info,
      },
      {
        id: "streak",
        title: "Keep your streak",
        subtitle: "Stay consistent today",
        icon: "flame-outline",
        progress: focusStreak > 0 ? 1 : 0,
        total: 1,
        xp: 25,
        color: Colors.streak,
      },
    ],
    [completedToday, focusMinutesToday, focusStreak],
  );

  const focusHours =
    focusMinutesToday >= 60
      ? `${Math.floor(focusMinutesToday / 60)}h ${focusMinutesToday % 60}m`
      : `${focusMinutesToday}m`;

  return (
    <View style={styles.container}>
      <ListPageHeader title="Rewards" showBack onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#6C3CE0", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View style={styles.levelRing}>
              <Text style={styles.levelNumber}>{level}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroLabel}>Your Level</Text>
              <Text style={styles.heroTitle}>Level {level}</Text>
              <Text style={styles.heroXp}>{xp.toLocaleString()} XP total</Text>
            </View>
            <View style={styles.streakPill}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakValue}>{focusStreak}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
          </View>

          <View style={styles.heroProgress}>
            <View style={styles.heroProgressLabels}>
              <Text style={styles.heroProgressText}>Progress to Level {level + 1}</Text>
              <Text style={styles.heroProgressText}>{xpRemaining} XP left</Text>
            </View>
            <View style={styles.heroBarTrack}>
              <View style={[styles.heroBarFill, { width: `${xpProgress}%` }]} />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatPill
            label="Tasks Done"
            value={String(completedTasks.length)}
            icon="checkmark-circle-outline"
          />
          <StatPill label="Focus Today" value={focusHours} icon="timer-outline" />
          <StatPill label="Badges" value={`${earnedBadgeCount}/${badges.length}`} icon="ribbon-outline" />
        </View>

        <Text style={styles.sectionTitle}>Daily Challenges</Text>
        <View style={styles.challengeList}>
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <Text style={styles.sectionMeta}>
            {earnedBadgeCount} of {badges.length} unlocked
          </Text>
        </View>

        <View style={styles.badgeGrid}>
          {badges.map((badge) => (
            <BadgeItem key={badge.id} badge={badge} />
          ))}
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
          <Text style={styles.tipText}>
            Complete challenges and focus sessions to earn XP, level up, and unlock more badges.
          </Text>
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
  scroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Shadow.md,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  levelRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  levelNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  heroInfo: {
    flex: 1,
    gap: 2,
  },
  heroLabel: {
    fontSize: FontSize.xs,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: "#fff",
  },
  heroXp: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  streakPill: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 72,
  },
  streakEmoji: {
    fontSize: 18,
  },
  streakValue: {
    fontSize: FontSize.lg,
    fontWeight: "800",
    color: "#fff",
  },
  streakLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  heroProgress: {
    gap: Spacing.sm,
  },
  heroProgressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroProgressText: {
    fontSize: FontSize.xs,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  heroBarTrack: {
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  heroBarFill: {
    height: "100%",
    borderRadius: Radius.full,
    backgroundColor: "#fff",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statPill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
    gap: 4,
    ...Shadow.sm,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: "500",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  sectionMeta: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  challengeList: {
    gap: Spacing.sm,
  },
  challengeCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  challengeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  challengeBody: {
    flex: 1,
    gap: 4,
  },
  challengeTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  challengeTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
  },
  xpPill: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  xpPillDone: {
    backgroundColor: "#D1FAE5",
  },
  xpPillText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.primary,
  },
  xpPillTextDone: {
    color: Colors.success,
  },
  challengeSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  challengeProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  challengeBar: {
    flex: 1,
  },
  challengeCount: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textMuted,
    minWidth: 36,
    textAlign: "right",
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  badgeItem: {
    width: "30%",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  badgeItemLocked: {
    opacity: 0.75,
  },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeCircleEarned: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  badgeCircleLocked: {
    backgroundColor: Colors.borderLight,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  lockOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeName: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 16,
  },
  badgeNameLocked: {
    color: Colors.textMuted,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.primaryDark,
    lineHeight: 20,
  },
});
