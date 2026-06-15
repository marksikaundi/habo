import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { HomeHeader } from "@/components/HomeHeader";
import { Card, ProgressBar, SummaryCard, TaskItem } from "@/components/TaskItem";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";

function todayIso() {
  return new Date().toISOString().split("T")[0] ?? "";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function HomeScreen() {
  const { user, tasks, goals, toggleTask, focusMinutesToday, notifications, schemaError } =
    useApp();

  const today = todayIso();
  const todayTasks = tasks.filter((t) => t.dueDate === today && !t.completed);
  const completedToday = tasks.filter((t) => t.dueDate === today && t.completed).length;
  const totalToday = todayTasks.length + completedToday;
  const activeGoal = goals[0];
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const focusHours =
    focusMinutesToday >= 60
      ? `${(focusMinutesToday / 60).toFixed(1).replace(/\.0$/, "")}h`
      : `${focusMinutesToday}m`;

  return (
    <View style={styles.container}>
      <HomeHeader
        name={user?.name ?? "there"}
        date={formatDate()}
        unreadCount={unreadNotifs}
        onMenuPress={() => router.push("/(tabs)/settings")}
        onNotificationPress={() => router.push("/notifications")}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {schemaError ? (
          <View style={styles.schemaBanner}>
            <Ionicons name="warning-outline" size={20} color={Colors.warning} />
            <Text style={styles.schemaText}>{schemaError}</Text>
          </View>
        ) : null}

        <SummaryCard
          tasksDue={totalToday}
          completed={completedToday}
          focusTime={focusHours}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Tasks</Text>
            <Pressable onPress={() => router.push("/(tabs)/tasks")}>
              <Text style={styles.viewAll}>View All</Text>
            </Pressable>
          </View>

          {todayTasks.length > 0 ? (
            todayTasks.slice(0, 5).map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                compact
                onToggle={() => toggleTask(task.id)}
              />
            ))
          ) : (
            <Text style={styles.empty}>All tasks completed for today! 🎉</Text>
          )}
        </View>

        {activeGoal ? (
          <Card style={styles.goalCard}>
            <Text style={styles.goalLabel}>Active Goal</Text>
            <Text style={styles.goalTitle}>{activeGoal.title}</Text>
            <View style={styles.goalProgressRow}>
              <View style={styles.goalBarWrap}>
                <ProgressBar progress={activeGoal.progress} height={10} />
              </View>
              <Text style={styles.goalPercent}>{activeGoal.progress}%</Text>
            </View>
          </Card>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.focusBtn, pressed && { opacity: 0.9 }]}
          onPress={() => router.push("/(tabs)/focus")}
        >
          <Ionicons name="locate-outline" size={20} color={Colors.primary} />
          <Text style={styles.focusBtnText}>Start Focus</Text>
        </Pressable>
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
    paddingBottom: 120,
    gap: Spacing.xl,
  },
  schemaBanner: {
    flexDirection: "row",
    gap: Spacing.sm,
    backgroundColor: "#FEF3C7",
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "flex-start",
  },
  schemaText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: "#92400E",
    lineHeight: 18,
  },
  section: {
    gap: Spacing.xs,
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
  viewAll: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    color: Colors.textSecondary,
    paddingVertical: Spacing.xl,
  },
  goalCard: {
    gap: Spacing.sm,
  },
  goalLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  goalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.text,
  },
  goalProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  goalBarWrap: {
    flex: 1,
  },
  goalPercent: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
    minWidth: 36,
    textAlign: "right",
  },
  focusBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  focusBtnText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.primary,
  },
});
