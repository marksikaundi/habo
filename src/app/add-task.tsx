import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { PrioritySelector } from "@/components/TaskItem";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import type { Priority } from "@/types";

export default function AddTaskScreen() {
  const insets = useSafeAreaInsets();
  const { addTask, goals } = useApp();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate] = useState("2024-05-21");
  const [selectedGoal, setSelectedGoal] = useState<string | undefined>();
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [fastMode, setFastMode] = useState(false);

  const handleSave = () => {
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate,
      priority,
      category: "Work",
      goalId: selectedGoal,
      subtasks: subtasks.map((s, i) => ({
        id: `sub-${i}`,
        title: s,
        completed: false,
      })),
    });

    router.back();
  };

  const handleFastAdd = () => {
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      dueDate,
      priority: "medium",
      category: "Personal",
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Task</Text>
        <Pressable onPress={() => setFastMode(!fastMode)}>
          <Text style={styles.fastToggle}>{fastMode ? "Full" : "Fast"}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Task Title"
          value={title}
          onChangeText={setTitle}
          placeholder="What needs to be done?"
        />

        {fastMode ? (
          <Button title="Quick Add" onPress={handleFastAdd} disabled={!title.trim()} />
        ) : (
          <>
            <Input
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Add details..."
              multiline
            />

            <View style={styles.field}>
              <Text style={styles.label}>Due Date</Text>
              <Pressable style={styles.selector}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <Text style={styles.selectorText}>Today, May 21</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Priority</Text>
              <PrioritySelector value={priority} onChange={setPriority} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Subtasks</Text>
              {subtasks.map((s, i) => (
                <View key={i} style={styles.subtaskRow}>
                  <Ionicons name="ellipse-outline" size={16} color={Colors.textMuted} />
                  <Text style={styles.subtaskText}>{s}</Text>
                  <Pressable onPress={() => setSubtasks(subtasks.filter((_, j) => j !== i))}>
                    <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                  </Pressable>
                </View>
              ))}
              <View style={styles.addSubtask}>
                <Input
                  value={newSubtask}
                  onChangeText={setNewSubtask}
                  placeholder="Add subtask..."
                />
                <Pressable
                  onPress={() => {
                    if (newSubtask.trim()) {
                      setSubtasks([...subtasks, newSubtask.trim()]);
                      setNewSubtask("");
                    }
                  }}
                  style={styles.addSubtaskBtn}
                >
                  <Ionicons name="add" size={20} color={Colors.primary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Link to Goal</Text>
              {goals.map((goal) => (
                <Pressable
                  key={goal.id}
                  onPress={() =>
                    setSelectedGoal(selectedGoal === goal.id ? undefined : goal.id)
                  }
                  style={[
                    styles.goalOption,
                    selectedGoal === goal.id && styles.goalOptionActive,
                  ]}
                >
                  <Ionicons
                    name={selectedGoal === goal.id ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={selectedGoal === goal.id ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={styles.goalOptionText}>{goal.title}</Text>
                </Pressable>
              ))}
            </View>

            <Button title="Save Task" onPress={handleSave} disabled={!title.trim()} />
          </>
        )}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  fastToggle: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  container: {
    padding: Spacing.xl,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  selectorText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  subtaskText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  addSubtask: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  addSubtaskBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  goalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  goalOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  goalOptionText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
});
