import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { ProgressBar, TaskItem } from "@/components/TaskItem";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Spacing } from "@/constants/theme";

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { goals, tasks, toggleTask } = useApp();

  const goal = goals.find((g) => g.id === id);
  const linkedTasks = tasks.filter((t) => t.goalId === id);

  if (!goal) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Goal" showBack onBack={() => router.back()} />
        <Text style={styles.notFound}>Goal not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={goal.title}
        showBack
        onBack={() => router.back()}
        rightIcon="create-outline"
      />

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40 }}
      >
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{goal.progress}%</Text>
          <ProgressBar progress={goal.progress} height={12} />
        </View>

        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Deadline</Text>
            <Text style={styles.metaValue}>
              {new Date(goal.dueDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Linked Tasks</Text>
            <Text style={styles.metaValue}>{linkedTasks.length}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Linked Tasks</Text>
        {linkedTasks.length > 0 ? (
          linkedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id)}
            />
          ))
        ) : (
          <Text style={styles.empty}>No tasks linked yet</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFound: {
    textAlign: "center",
    marginTop: Spacing.xxxl,
    color: Colors.textMuted,
  },
  progressSection: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  progressLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  progressValue: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.primary,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  metaLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  empty: {
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
});
