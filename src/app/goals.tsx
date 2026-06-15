import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card, ProgressBar } from "@/components/TaskItem";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const { goals } = useApp();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Goals"
        showBack
        onBack={() => router.back()}
        rightIcon="add"
        onRightPress={() => {}}
      />

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {goals.map((goal) => (
          <Pressable
            key={goal.id}
            onPress={() => router.push(`/goal/${goal.id}`)}
          >
            <Card style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalPercent}>{goal.progress}%</Text>
              </View>
              <ProgressBar progress={goal.progress} />
              <View style={styles.goalFooter}>
                <View style={styles.goalMeta}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.goalDate}>
                    Due {new Date(goal.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </Text>
                </View>
                <Text style={styles.taskCount}>{goal.taskIds.length} tasks linked</Text>
              </View>
            </Card>
          </Pressable>
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
  goalCard: {
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
  },
  goalPercent: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.primary,
  },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  goalDate: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  taskCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
