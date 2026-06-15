import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";
import type { Priority } from "@/types";

const PRIORITIES: Priority[] = ["high", "medium", "low"];

function todayIso() {
  return new Date().toISOString().split("T")[0] ?? "";
}

function formatDueDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { tasks, goals, updateTask, deleteTask } = useApp();
  const task = tasks.find((t) => t.id === id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState(todayIso());
  const [dueTime, setDueTime] = useState("");
  const [category, setCategory] = useState("Work");
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setDueDate(task.dueDate);
    setDueTime(task.dueTime ?? "");
    setCategory(task.category);
    setSelectedGoalId(task.goalId);
  }, [task]);

  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId),
    [goals, selectedGoalId],
  );

  if (!task) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={26} color={Colors.text} />
          </Pressable>
        </View>
        <Text style={styles.notFound}>Task not found</Text>
      </View>
    );
  }

  const cyclePriority = () => {
    const idx = PRIORITIES.indexOf(priority);
    setPriority(PRIORITIES[(idx + 1) % PRIORITIES.length] ?? "medium");
  };

  const cycleCategory = () => {
    setCategory((c) => (c === "Work" ? "Personal" : "Work"));
  };

  const pickDueDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().split("T")[0] ?? "";
    Alert.alert("Due Date", "Choose when this task is due", [
      { text: "Today", onPress: () => setDueDate(todayIso()) },
      { text: "Tomorrow", onPress: () => setDueDate(tomorrowIso) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickDueTime = () => {
    Alert.alert("Due Time", "Choose a time", [
      { text: "9:00 AM", onPress: () => setDueTime("9:00 AM") },
      { text: "12:00 PM", onPress: () => setDueTime("12:00 PM") },
      { text: "2:00 PM", onPress: () => setDueTime("2:00 PM") },
      { text: "6:00 PM", onPress: () => setDueTime("6:00 PM") },
      { text: "Clear", onPress: () => setDueTime("") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickGoal = () => {
    Alert.alert("Link to Goal", "Select a goal", [
      ...goals.map((g) => ({
        text: g.title,
        onPress: () => setSelectedGoalId(g.id),
      })),
      { text: "None", onPress: () => setSelectedGoalId(undefined) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        dueTime: dueTime || undefined,
        priority,
        category,
        goalId: selectedGoalId,
      });
      router.back();
    } catch {
      setError("Failed to update task.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete task?", `Remove "${task.title}" permanently?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTask(task.id);
            router.back();
          } catch {
            Alert.alert("Error", "Could not delete task.");
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle}>Edit Task</Text>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerSide}>
          <Ionicons name="close" size={26} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.fieldLabel}>Task Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Task title"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder="Add description"
          placeholderTextColor={Colors.textMuted}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.detailsCard}>
          <Pressable onPress={pickDueDate} style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date</Text>
            <Text style={styles.detailValue}>{formatDueDate(dueDate)}</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={pickDueTime} style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Time</Text>
            <Text style={styles.detailValue}>{dueTime || "None"}</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={cyclePriority} style={styles.detailRow}>
            <Text style={styles.detailLabel}>Priority</Text>
            <Text style={styles.detailValue}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={cycleCategory} style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{category}</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable onPress={pickGoal} style={styles.detailRow}>
            <Text style={styles.detailLabel}>Link to Goal</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {selectedGoal?.title ?? "None"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
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

        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          <Text style={styles.deleteBtnText}>Delete Task</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerSide: { width: 40, alignItems: "flex-end" },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  notFound: { textAlign: "center", marginTop: Spacing.xxxl, color: Colors.textMuted },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
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
  textArea: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.xl,
    minHeight: 100,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: "hidden",
    ...Shadow.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  detailLabel: { fontSize: FontSize.md, fontWeight: "500", color: Colors.text },
  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
    flexShrink: 1,
    textAlign: "right",
  },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.lg },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.md,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: FontSize.lg, fontWeight: "600", color: "#fff" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  deleteBtnText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.danger },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
});
