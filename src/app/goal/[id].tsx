import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { ProgressBar, TaskItem } from "@/components/TaskItem";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";

function formatGoalDue(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function defaultDueDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0] ?? "";
}

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { goals, tasks, toggleTask, updateGoal, deleteGoal } = useApp();
  const goal = goals.find((g) => g.id === id);
  const linkedTasks = tasks.filter((t) => t.goalId === id);

  const [showEdit, setShowEdit] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [progress, setProgress] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!goal) return;
    setTitle(goal.title);
    setDueDate(goal.dueDate);
    setProgress(String(goal.progress));
  }, [goal]);

  if (!goal) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Goal" showBack onBack={() => router.back()} />
        <Text style={styles.notFound}>Goal not found</Text>
      </View>
    );
  }

  const handleSave = async () => {
    const progressNum = Math.min(100, Math.max(0, parseInt(progress, 10) || 0));
    setSaving(true);
    try {
      await updateGoal(goal.id, {
        title: title.trim(),
        dueDate,
        progress: progressNum,
      });
      setShowEdit(false);
    } catch {
      Alert.alert("Error", "Could not update goal.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete goal?",
      `Remove "${goal.title}"? Linked tasks will be kept but unlinked.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
              router.back();
            } catch {
              Alert.alert("Error", "Could not delete goal.");
            }
          },
        },
      ],
    );
  };

  const pickDueDate = () => {
    const nextMonth = defaultDueDate();
    const endYear = `${new Date().getFullYear()}-12-31`;
    Alert.alert("Due date", "Choose a due date", [
      { text: "1 month", onPress: () => setDueDate(nextMonth) },
      { text: "End of year", onPress: () => setDueDate(endYear) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={goal.title}
        showBack
        onBack={() => router.back()}
        rightIcon="create-outline"
        onRightPress={() => setShowEdit(true)}
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
            <Text style={styles.metaValue}>{formatGoalDue(goal.dueDate)}</Text>
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
              variant="list"
              onToggle={() => toggleTask(task.id)}
              onPress={() => router.push(`/task/${task.id}`)}
            />
          ))
        ) : (
          <Text style={styles.empty}>No tasks linked yet</Text>
        )}

        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          <Text style={styles.deleteBtnText}>Delete Goal</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={showEdit} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEdit(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Goal</Text>
              <Pressable onPress={() => setShowEdit(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Goal title"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Due date</Text>
            <Pressable onPress={pickDueDate} style={styles.dateBtn}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={styles.dateBtnText}>{formatGoalDue(dueDate)}</Text>
            </Pressable>

            <Text style={styles.fieldLabel}>Progress (%)</Text>
            <TextInput
              style={styles.input}
              value={progress}
              onChangeText={setProgress}
              keyboardType="number-pad"
              placeholder="0-100"
              placeholderTextColor={Colors.textMuted}
            />

            <Pressable
              onPress={handleSave}
              disabled={!title.trim() || saving}
              style={({ pressed }) => [
                styles.saveBtn,
                (!title.trim() || saving) && styles.saveBtnDisabled,
                pressed && { opacity: 0.92 },
              ]}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xxxl,
    paddingVertical: Spacing.lg,
  },
  deleteBtnText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.danger,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.overlay,
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.lg,
    minHeight: 52,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  dateBtnText: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: "500",
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
    ...Shadow.md,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: FontSize.lg, fontWeight: "600", color: "#fff" },
});
