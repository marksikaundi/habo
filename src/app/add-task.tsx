import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
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

import { useApp } from "@/context/AppContext";
import { getPriorityColor } from "@/context/AppContext";
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

type DetailRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
};

function DetailRow({ icon, label, value, onPress }: DetailRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.detailRow, pressed && { opacity: 0.85 }]}>
      <View style={styles.detailLeft}>
        <View style={styles.detailIconWrap}>
          <Ionicons name={icon} size={18} color={Colors.primary} />
        </View>
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <View style={styles.detailRight}>
        <Text style={styles.detailValue} numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </View>
    </Pressable>
  );
}

export default function AddTaskScreen() {
  const insets = useSafeAreaInsets();
  const { addTask, goals } = useApp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("high");
  const [dueDate, setDueDate] = useState(todayIso());
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(
    goals[0]?.id,
  );
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskModal, setSubtaskModal] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId),
    [goals, selectedGoalId],
  );

  const cyclePriority = () => {
    const idx = PRIORITIES.indexOf(priority);
    setPriority(PRIORITIES[(idx + 1) % PRIORITIES.length] ?? "medium");
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

  const pickGoal = () => {
    if (goals.length === 0) {
      Alert.alert("No goals", "Create a goal first from the Goals screen.");
      return;
    }
    Alert.alert(
      "Link to Goal",
      "Select a goal for this task",
      [
        ...goals.map((g) => ({
          text: g.title,
          onPress: () => setSelectedGoalId(g.id),
        })),
        { text: "None", onPress: () => setSelectedGoalId(undefined) },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        priority,
        category: "Work",
        goalId: selectedGoalId,
        subtasks: subtasks.map((s, i) => ({
          id: `sub-${i}`,
          title: s,
          completed: false,
        })),
      });
      router.back();
    } catch {
      setError("Failed to save task. Check your Appwrite connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle}>Add Task</Text>
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
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Finish design"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.fieldLabel}>Description (optional)</Text>
        <TextInput
          style={styles.descInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Add description"
          placeholderTextColor={Colors.textMuted}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.detailsCard}>
          <DetailRow
            icon="calendar-outline"
            label="Due Date"
            value={formatDueDate(dueDate)}
            onPress={pickDueDate}
          />
          <View style={styles.rowDivider} />
          <DetailRow
            icon="flag-outline"
            label="Priority"
            value={priority.charAt(0).toUpperCase() + priority.slice(1)}
            onPress={cyclePriority}
          />
          <View style={styles.rowDivider} />
          <DetailRow
            icon="grid-outline"
            label="Add Subtasks"
            value={String(subtasks.length)}
            onPress={() => setSubtaskModal(true)}
          />
          <View style={styles.rowDivider} />
          <DetailRow
            icon="locate-outline"
            label="Link to Goal"
            value={selectedGoal?.title ?? "None"}
            onPress={pickGoal}
          />
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
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Task"}</Text>
        </Pressable>
      </View>

      <Modal visible={subtaskModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Subtasks</Text>
              <Pressable onPress={() => setSubtaskModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            {subtasks.map((s, i) => (
              <View key={i} style={styles.subtaskItem}>
                <Text style={styles.subtaskText}>{s}</Text>
                <Pressable onPress={() => setSubtasks(subtasks.filter((_, j) => j !== i))}>
                  <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
                </Pressable>
              </View>
            ))}

            <View style={styles.subtaskAddRow}>
              <TextInput
                style={styles.subtaskInput}
                value={newSubtask}
                onChangeText={setNewSubtask}
                placeholder="New subtask"
                placeholderTextColor={Colors.textMuted}
              />
              <Pressable
                onPress={() => {
                  if (newSubtask.trim()) {
                    setSubtasks([...subtasks, newSubtask.trim()]);
                    setNewSubtask("");
                  }
                }}
                style={styles.subtaskAddBtn}
              >
                <Ionicons name="add" size={22} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  headerSide: {
    width: 40,
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  titleInput: {
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
  descInput: {
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
    overflow: "hidden",
    ...Shadow.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.text,
  },
  detailRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    maxWidth: "45%",
  },
  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.lg + 32 + Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.md,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: "#fff",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  subtaskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  subtaskText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  subtaskAddRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  subtaskInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  subtaskAddBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
