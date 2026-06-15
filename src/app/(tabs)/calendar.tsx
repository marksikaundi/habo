import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import {
  formatDayHeader,
  formatHourLabel,
  formatMonthYear,
  formatWeekdayShort,
  getTimelineHours,
  getWeekDays,
  isSameDay,
  parseTimeToHour,
  toLocalIso,
} from "@/lib/calendar-utils";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";
import type { Task } from "@/types";

function getCategoryStyle(category: string) {
  const normalized = category.toLowerCase();
  if (normalized === "work") {
    return {
      colors: ["#F3EFFE", "#EDE9FE"] as const,
      borderColor: "#DDD6FE",
    };
  }
  if (normalized === "personal") {
    return {
      colors: ["#ECFDF5", "#D1FAE5"] as const,
      borderColor: "#A7F3D0",
    };
  }
  return {
    colors: ["#F9FAFB", "#F3F4F6"] as const,
    borderColor: Colors.border,
  };
}

function tasksForHour(tasks: Task[], hour: number): Task[] {
  return tasks.filter((task) => {
    if (!task.dueTime) return false;
    return parseTimeToHour(task.dueTime) === hour;
  });
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { tasks } = useApp();
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const selectedIso = toLocalIso(selectedDate);
  const timelineHours = getTimelineHours();

  const dayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.dueDate === selectedIso && t.dueTime && !t.completed)
        .sort((a, b) => (a.dueTime ?? "").localeCompare(b.dueTime ?? "")),
    [tasks, selectedIso],
  );

  const todayNumber = today.getDate();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={formatMonthYear(selectedDate)}
        leftIcon="menu"
        onLeftPress={() => router.push("/(tabs)/settings")}
        rightElement={
          <Pressable
            onPress={() => setSelectedDate(new Date())}
            style={styles.calendarIconBtn}
            hitSlop={8}
          >
            <Ionicons name="calendar-outline" size={24} color={Colors.text} />
            <View style={styles.calendarBadge}>
              <Text style={styles.calendarBadgeText}>{todayNumber}</Text>
            </View>
          </Pressable>
        }
      />

      <View style={styles.weekPicker}>
        {weekDays.map((day) => {
          const selected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);

          return (
            <Pressable
              key={toLocalIso(day)}
              onPress={() => setSelectedDate(day)}
              style={styles.dayItem}
            >
              <Text
                style={[
                  styles.dayLabel,
                  selected && styles.dayLabelActive,
                  isToday && !selected && styles.dayLabelToday,
                ]}
                numberOfLines={1}
              >
                {formatWeekdayShort(day)}
              </Text>
              <View style={[styles.dayCircle, selected && styles.dayCircleActive]}>
                <Text style={[styles.dayNumber, selected && styles.dayNumberActive]}>
                  {day.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.divider} />

      <Text style={styles.dayHeader}>{formatDayHeader(selectedDate)}</Text>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timeline}>
          {timelineHours.map((hour, index) => {
            const hourTasks = tasksForHour(dayTasks, hour);
            const isLast = index === timelineHours.length - 1;

            return (
              <View key={hour} style={styles.timeRow}>
                <Text style={styles.timeLabel}>{formatHourLabel(hour)}</Text>

                <View style={styles.timelineTrack}>
                  <View style={[styles.timelineLine, isLast && styles.timelineLineLast]} />
                </View>

                <View style={styles.slotContent}>
                  {hourTasks.length > 0 ? (
                    hourTasks.map((task) => {
                      const catStyle = getCategoryStyle(task.category);
                      return (
                        <Pressable
                          key={task.id}
                          style={({ pressed }) => [
                            styles.taskCard,
                            { borderColor: catStyle.borderColor },
                            pressed && { opacity: 0.92 },
                          ]}
                        >
                          <LinearGradient
                            colors={catStyle.colors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.taskCardGradient}
                          >
                            <View style={styles.taskCardBody}>
                              <View style={styles.taskCardText}>
                                <Text style={styles.taskTitle} numberOfLines={1}>
                                  {task.title}
                                </Text>
                                <Text style={styles.taskCategory}>{task.category}</Text>
                              </View>
                              <Ionicons
                                name="chevron-forward"
                                size={16}
                                color={Colors.textMuted}
                              />
                            </View>
                          </LinearGradient>
                        </Pressable>
                      );
                    })
                  ) : (
                    <View style={styles.emptySlot} />
                  )}
                </View>
              </View>
            );
          })}

          {dayTasks.length === 0 ? (
            <View style={styles.emptyDay}>
              <Ionicons name="calendar-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyDayText}>No scheduled tasks for this day</Text>
            </View>
          ) : null}
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
  calendarIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarBadge: {
    position: "absolute",
    bottom: 4,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  calendarBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  weekPicker: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 76,
  },
  dayItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  dayLabelActive: {
    color: Colors.primary,
  },
  dayLabelToday: {
    color: Colors.textSecondary,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleActive: {
    backgroundColor: Colors.primary,
    ...Shadow.sm,
  },
  dayNumber: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
  },
  dayNumberActive: {
    color: "#fff",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  dayHeader: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  timeline: {
    paddingHorizontal: Spacing.lg,
  },
  timeRow: {
    flexDirection: "row",
    minHeight: 72,
  },
  timeLabel: {
    width: 52,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
    paddingTop: 2,
    textAlign: "right",
    paddingRight: Spacing.sm,
  },
  timelineTrack: {
    width: 20,
    alignItems: "center",
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: Colors.border,
    minHeight: 72,
  },
  timelineLineLast: {
    minHeight: 48,
  },
  slotContent: {
    flex: 1,
    paddingLeft: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  emptySlot: {
    height: 56,
  },
  taskCard: {
    borderRadius: Radius.md,
    overflow: "hidden",
    borderWidth: 1,
    ...Shadow.sm,
  },
  taskCardGradient: {
    padding: Spacing.md,
  },
  taskCardBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  taskCardText: {
    flex: 1,
    gap: 2,
  },
  taskTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  taskCategory: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  emptyDay: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyDayText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
