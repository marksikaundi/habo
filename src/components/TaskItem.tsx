import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getPriorityColor } from "@/context/AppContext";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";
import type { Priority, Task } from "@/types";

type TaskItemProps = {
  task: Task;
  onToggle?: () => void;
  onPress?: () => void;
  compact?: boolean;
  variant?: "default" | "list";
};

export function TaskItem({ task, onToggle, onPress, compact, variant = "default" }: TaskItemProps) {
  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.homeContainer, pressed && { opacity: 0.9 }]}
      >
        <Pressable onPress={onToggle} hitSlop={8} style={styles.checkbox}>
          <View
            style={[
              styles.checkboxInner,
              task.completed && styles.checkboxChecked,
            ]}
          >
            {task.completed ? (
              <Ionicons name="checkmark" size={14} color="#fff" />
            ) : null}
          </View>
        </Pressable>

        <View style={styles.homeContent}>
          <View style={styles.homeTopRow}>
            <Text
              style={[styles.homeTitle, task.completed && styles.titleCompleted]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            {task.dueTime ? (
              <Text style={styles.homeTime}>{task.dueTime}</Text>
            ) : null}
            <View
              style={[
                styles.priorityDot,
                { backgroundColor: getPriorityColor(task.priority) },
              ]}
            />
          </View>
          <Text style={styles.homeCategory}>{task.category}</Text>
        </View>
      </Pressable>
    );
  }

  if (variant === "list") {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.listContainer, pressed && { opacity: 0.9 }]}
      >
        <Pressable onPress={onToggle} hitSlop={8} style={styles.checkbox}>
          <View
            style={[
              styles.checkboxInner,
              styles.listCheckbox,
              task.completed && styles.checkboxChecked,
            ]}
          >
            {task.completed ? (
              <Ionicons name="checkmark" size={16} color="#fff" />
            ) : null}
          </View>
        </Pressable>

        <View style={styles.listContent}>
          <Text
            style={[styles.listTitle, task.completed && styles.titleCompleted]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <Text style={styles.listCategory}>{task.category}</Text>
        </View>

        <View style={styles.listRight}>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(task.priority) + "20" },
            ]}
          >
            <Text
              style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}
            >
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Text>
          </View>
          {task.dueTime ? <Text style={styles.listTime}>{task.dueTime}</Text> : null}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.9 }]}
    >
      <Pressable onPress={onToggle} hitSlop={8} style={styles.checkbox}>
        <View
          style={[
            styles.checkboxInner,
            task.completed && styles.checkboxChecked,
          ]}
        >
          {task.completed ? (
            <Ionicons name="checkmark" size={14} color="#fff" />
          ) : null}
        </View>
      </Pressable>

      <View style={styles.content}>
        <Text
          style={[styles.title, task.completed && styles.titleCompleted]}
          numberOfLines={compact ? 1 : 2}
        >
          {task.title}
        </Text>
        {!compact ? (
          <View style={styles.meta}>
            <Text style={styles.category}>{task.category}</Text>
            {task.dueTime ? (
              <>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.time}>{task.dueTime}</Text>
              </>
            ) : null}
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.priorityBadge,
          { backgroundColor: getPriorityColor(task.priority) + "20" },
        ]}
      >
        <Text
          style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}
        >
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </Text>
      </View>
    </Pressable>
  );
}

type PrioritySelectorProps = {
  value: Priority;
  onChange: (p: Priority) => void;
};

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  const options: Priority[] = ["high", "medium", "low"];

  return (
    <View style={styles.priorityRow}>
      {options.map((p) => (
        <Pressable
          key={p}
          onPress={() => onChange(p)}
          style={[
            styles.priorityOption,
            value === p && {
              backgroundColor: getPriorityColor(p) + "20",
              borderColor: getPriorityColor(p),
            },
          ]}
        >
          <View
            style={[styles.priorityDot, { backgroundColor: getPriorityColor(p) }]}
          />
          <Text
            style={[
              styles.priorityOptionText,
              value === p && { color: getPriorityColor(p), fontWeight: "600" },
            ]}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

type SummaryCardProps = {
  tasksDue: number;
  completed: number;
  focusTime: string;
};

export function SummaryCard({ tasksDue, completed, focusTime }: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{tasksDue}</Text>
        <Text style={styles.summaryLabel}>Tasks</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{completed}</Text>
        <Text style={styles.summaryLabel}>Completed</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryValue}>{focusTime}</Text>
        <Text style={styles.summaryLabel}>Focus Time</Text>
      </View>
    </View>
  );
}

type ProgressBarProps = {
  progress: number;
  color?: string;
  height?: number;
};

export function ProgressBar({
  progress,
  color = Colors.primary,
  height = 8,
}: ProgressBarProps) {
  return (
    <View style={[styles.progressTrack, { height }]}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.min(100, progress)}%`, backgroundColor: color, height },
        ]}
      />
    </View>
  );
}

type CardProps = {
  children: React.ReactNode;
  style?: object;
};

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  checkbox: {
    marginRight: Spacing.md,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.text,
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: Colors.textMuted,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  category: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  dot: {
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  time: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    marginLeft: Spacing.sm,
  },
  priorityText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  priorityRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  priorityOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityOptionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    ...Shadow.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  homeContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  homeContent: {
    flex: 1,
    paddingTop: 2,
  },
  homeTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  homeTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  homeTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  homeCategory: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  listContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.sm,
  },
  listCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  listContent: {
    flex: 1,
    paddingTop: 2,
    marginRight: Spacing.md,
  },
  listTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 20,
  },
  listCategory: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  listRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 48,
    gap: Spacing.sm,
  },
  listTime: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  progressTrack: {
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  progressFill: {
    borderRadius: Radius.full,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
});
