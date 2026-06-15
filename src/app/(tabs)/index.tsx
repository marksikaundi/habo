import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { GreetingHeader } from "@/components/ScreenHeader";
import { Card, ProgressBar, SummaryCard, TaskItem } from "@/components/TaskItem";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

const TODAY = "2024-05-21";

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function HomeScreen() {
  const { user, tasks, goals, toggleTask, focusMinutesToday, notifications } = useApp();

  const todayTasks = tasks.filter((t) => t.dueDate === TODAY && !t.completed);
  const completedToday = tasks.filter((t) => t.dueDate === TODAY && t.completed).length;
  const activeGoal = goals[0];
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const focusHours = `${Math.floor(focusMinutesToday / 60)}h ${focusMinutesToday % 60}m`;

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date().getDay();

  return (
    <View style={styles.container}>
      <GreetingHeader
        name={user?.name ?? "there"}
        date={formatDate()}
        unreadCount={unreadNotifs}
        onNotificationPress={() => router.push("/notifications")}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SummaryCard
          tasksDue={todayTasks.length + completedToday}
          completed={completedToday}
          focusTime={focusHours}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Tasks</Text>
            <Pressable onPress={() => router.push("/(tabs)/tasks")}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          {todayTasks.slice(0, 4).map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id)}
            />
          ))}
          {todayTasks.length === 0 ? (
            <Text style={styles.empty}>All tasks completed for today! 🎉</Text>
          ) : null}
        </View>

        {activeGoal ? (
          <Card style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="flag" size={18} color={Colors.primary} />
              <Text style={styles.goalLabel}>Active Goal</Text>
            </View>
            <Text style={styles.goalTitle}>{activeGoal.title}</Text>
            <View style={styles.goalProgress}>
              <ProgressBar progress={activeGoal.progress} />
              <Text style={styles.goalPercent}>{activeGoal.progress}%</Text>
            </View>
            <Pressable onPress={() => router.push("/goals")}>
              <Text style={styles.goalLink}>View all goals →</Text>
            </Pressable>
          </Card>
        ) : null}

        <Button
          title="Start Focus"
          icon="play"
          onPress={() => router.push("/(tabs)/focus")}
          fullWidth
        />

        <Card style={styles.calendarPreview}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <Pressable onPress={() => router.push("/(tabs)/calendar")}>
              <Text style={styles.seeAll}>Calendar</Text>
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {weekDays.map((day, i) => (
              <View
                key={i}
                style={[styles.dayCell, i === today && styles.dayCellActive]}
              >
                <Text style={[styles.dayLabel, i === today && styles.dayLabelActive]}>
                  {day}
                </Text>
                <Text style={[styles.dayNum, i === today && styles.dayNumActive]}>
                  {15 + i}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.quickLinks}>
          {[
            { label: "Goals", icon: "flag-outline" as const, route: "/goals" },
            { label: "Notes", icon: "document-text-outline" as const, route: "/notes" },
            { label: "Analytics", icon: "bar-chart-outline" as const, route: "/analytics" },
            { label: "Rewards", icon: "trophy-outline" as const, route: "/gamification" },
          ].map((item) => (
            <Pressable
              key={item.label}
              style={styles.quickLink}
              onPress={() => router.push(item.route as "/goals")}
            >
              <Ionicons name={item.icon} size={22} color={Colors.primary} />
              <Text style={styles.quickLinkText}>{item.label}</Text>
            </Pressable>
          ))}
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
    padding: Spacing.lg,
    paddingBottom: 120,
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  seeAll: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "500",
  },
  empty: {
    textAlign: "center",
    color: Colors.textSecondary,
    paddingVertical: Spacing.xl,
  },
  goalCard: {
    gap: Spacing.sm,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  goalLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  goalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.text,
  },
  goalProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  goalPercent: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
    minWidth: 36,
  },
  goalLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "500",
    marginTop: Spacing.xs,
  },
  calendarPreview: {
    gap: Spacing.md,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCell: {
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: Radius.md,
    minWidth: 40,
  },
  dayCellActive: {
    backgroundColor: Colors.primary,
  },
  dayLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  dayLabelActive: {
    color: "rgba(255,255,255,0.8)",
  },
  dayNum: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  dayNumActive: {
    color: "#fff",
  },
  quickLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  quickLink: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
    ...({ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }),
  },
  quickLinkText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
});
