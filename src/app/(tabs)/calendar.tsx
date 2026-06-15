import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { getPriorityColor } from "@/context/AppContext";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9);
const WEEK_DAYS = [
  { label: "Mon", date: 20 },
  { label: "Tue", date: 21 },
  { label: "Wed", date: 22 },
  { label: "Thu", date: 23 },
  { label: "Fri", date: 24 },
  { label: "Sat", date: 25 },
  { label: "Sun", date: 26 },
];

const VIEWS = ["Day", "Week", "Month"] as const;

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useApp();
  const [selectedDay, setSelectedDay] = useState(21);
  const [view, setView] = useState<(typeof VIEWS)[number]>("Week");

  const scheduledTasks = tasks.filter(
    (t) => t.dueDate === `2024-05-${selectedDay}` && t.dueTime && !t.completed,
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="May 2024"
        rightIcon="calendar"
        rightElement={
          <View style={styles.viewToggle}>
            {VIEWS.map((v) => (
              <Pressable
                key={v}
                onPress={() => setView(v)}
                style={[styles.viewBtn, view === v && styles.viewBtnActive]}
              >
                <Text style={[styles.viewBtnText, view === v && styles.viewBtnTextActive]}>
                  {v}
                </Text>
              </Pressable>
            ))}
          </View>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.weekPicker}
        contentContainerStyle={styles.weekPickerContent}
      >
        {WEEK_DAYS.map((day) => (
          <Pressable
            key={day.date}
            onPress={() => setSelectedDay(day.date)}
            style={[styles.dayPill, selectedDay === day.date && styles.dayPillActive]}
          >
            <Text
              style={[styles.dayPillLabel, selectedDay === day.date && styles.dayPillLabelActive]}
            >
              {day.label}
            </Text>
            <Text
              style={[styles.dayPillDate, selectedDay === day.date && styles.dayPillDateActive]}
            >
              {day.date}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timeGrid}>
          {HOURS.map((hour) => {
            const hourTasks = scheduledTasks.filter((t) => {
              const time = t.dueTime ?? "";
              const h = parseInt(time.split(":")[0] ?? "0", 10);
              const isPM = time.includes("PM");
              const hour24 = isPM && h !== 12 ? h + 12 : h;
              return hour24 === hour;
            });

            return (
              <View key={hour} style={styles.timeRow}>
                <Text style={styles.timeLabel}>
                  {hour > 12 ? hour - 12 : hour} {hour >= 12 ? "PM" : "AM"}
                </Text>
                <View style={styles.timeSlot}>
                  {hourTasks.map((task) => (
                    <View
                      key={task.id}
                      style={[
                        styles.taskBlock,
                        { borderLeftColor: getPriorityColor(task.priority) },
                      ]}
                    >
                      <Text style={styles.taskBlockTitle} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text style={styles.taskBlockTime}>{task.dueTime}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
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
  viewToggle: {
    flexDirection: "row",
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.sm,
    padding: 2,
  },
  viewBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm - 2,
  },
  viewBtnActive: {
    backgroundColor: Colors.surface,
  },
  viewBtnText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  viewBtnTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  weekPicker: {
    flexGrow: 0,
    marginBottom: Spacing.lg,
  },
  weekPickerContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  dayPill: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    minWidth: 52,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayPillLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  dayPillLabelActive: {
    color: "rgba(255,255,255,0.8)",
  },
  dayPillDate: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  dayPillDateActive: {
    color: "#fff",
  },
  timeGrid: {
    paddingHorizontal: Spacing.lg,
  },
  timeRow: {
    flexDirection: "row",
    minHeight: 64,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  timeLabel: {
    width: 56,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    paddingTop: Spacing.sm,
  },
  timeSlot: {
    flex: 1,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  taskBlock: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderLeftWidth: 3,
  },
  taskBlockTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  taskBlockTime: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
