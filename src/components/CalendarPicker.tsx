import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  addMonths,
  formatMonthYear,
  getMonthGrid,
  isSameDay,
  isSameMonth,
  toLocalIso,
} from "@/lib/calendar-utils";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarPickerProps = {
  visible: boolean;
  selectedDate: Date;
  datesWithTasks?: Set<string>;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
};

export function CalendarPicker({
  visible,
  selectedDate,
  datesWithTasks = new Set(),
  onClose,
  onSelectDate,
}: CalendarPickerProps) {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate));

  useEffect(() => {
    if (visible) {
      setViewMonth(new Date(selectedDate));
    }
  }, [visible, selectedDate]);

  const weeks = useMemo(() => getMonthGrid(viewMonth), [viewMonth]);

  const handleSelect = (date: Date) => {
    onSelectDate(date);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Pressable
              onPress={() => setViewMonth((m) => addMonths(m, -1))}
              style={styles.navBtn}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={22} color={Colors.text} />
            </Pressable>

            <Text style={styles.monthTitle}>{formatMonthYear(viewMonth)}</Text>

            <Pressable
              onPress={() => setViewMonth((m) => addMonths(m, 1))}
              style={styles.navBtn}
              hitSlop={8}
            >
              <Ionicons name="chevron-forward" size={22} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_HEADERS.map((day) => (
              <Text key={day} style={styles.weekdayHeader}>
                {day}
              </Text>
            ))}
          </View>

          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((day) => {
                const iso = toLocalIso(day);
                const selected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, today);
                const inMonth = isSameMonth(day, viewMonth);
                const hasTasks = datesWithTasks.has(iso);

                return (
                  <Pressable
                    key={iso}
                    onPress={() => handleSelect(day)}
                    style={styles.dayCell}
                  >
                    <View
                      style={[
                        styles.dayButton,
                        selected && styles.dayButtonSelected,
                        isToday && !selected && styles.dayButtonToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !inMonth && styles.dayTextMuted,
                          selected && styles.dayTextSelected,
                          isToday && !selected && styles.dayTextToday,
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                    </View>
                    {hasTasks ? (
                      <View
                        style={[styles.taskDot, selected && styles.taskDotSelected]}
                      />
                    ) : (
                      <View style={styles.taskDotPlaceholder} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}

          <Pressable
            onPress={() => handleSelect(new Date())}
            style={styles.todayBtn}
          >
            <Ionicons name="today-outline" size={18} color={Colors.primary} />
            <Text style={styles.todayBtnText}>Go to today</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    ...Shadow.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
  },
  monthTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  weekdayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: Spacing.xs,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 2,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayButtonSelected: {
    backgroundColor: Colors.primary,
  },
  dayButtonToday: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  dayTextMuted: {
    color: Colors.textMuted,
  },
  dayTextSelected: {
    color: "#fff",
  },
  dayTextToday: {
    color: Colors.primary,
  },
  taskDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
  taskDotSelected: {
    backgroundColor: "#fff",
  },
  taskDotPlaceholder: {
    height: 7,
  },
  todayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
  },
  todayBtnText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.primary,
  },
});
