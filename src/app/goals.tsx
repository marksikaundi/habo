import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
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

import { ListPageHeader } from "@/components/ListPageHeader";
import { ProgressBar } from "@/components/TaskItem";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";

function formatGoalDue(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return `Due ${d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
}

function defaultDueDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0] ?? "";
}

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const { goals, addGoal } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await addGoal({ title: title.trim(), dueDate });
      setTitle("");
      setDueDate(defaultDueDate());
      setShowAdd(false);
    } catch {
      Alert.alert("Error", "Could not create goal. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ListPageHeader
        title="Goals"
        showBack
        onBack={() => router.back()}
        rightElement={
          <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn} hitSlop={8}>
            <Ionicons name="add" size={28} color={Colors.text} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 },
          goals.length === 0 && styles.scrollEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {goals.map((goal) => (
          <Pressable
            key={goal.id}
            onPress={() => router.push(`/goal/${goal.id}`)}
            style={({ pressed }) => [styles.goalCard, pressed && { opacity: 0.92 }]}
          >
            <Text style={styles.goalTitle}>{goal.title}</Text>

            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <ProgressBar progress={goal.progress} height={10} />
              </View>
              <Text style={styles.goalPercent}>{goal.progress}%</Text>
            </View>

            <Text style={styles.goalDue}>{formatGoalDue(goal.dueDate)}</Text>
          </Pressable>
        ))}

        {goals.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="flag-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to set your first goal</Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAdd(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Goal</Text>
              <Pressable onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Goal title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Launch Habora v1.0"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Due date</Text>
            <Pressable
              onPress={() => {
                const nextMonth = defaultDueDate();
                const nextQuarter = new Date();
                nextQuarter.setMonth(nextQuarter.getMonth() + 3);
                const qIso = nextQuarter.toISOString().split("T")[0] ?? "";
                Alert.alert("Due date", "Choose a due date", [
                  { text: "1 month", onPress: () => setDueDate(nextMonth) },
                  { text: "3 months", onPress: () => setDueDate(qIso) },
                  { text: "End of year", onPress: () => setDueDate(`${new Date().getFullYear()}-12-31`) },
                  { text: "Cancel", style: "cancel" },
                ]);
              }}
              style={styles.dateBtn}
            >
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={styles.dateBtnText}>{formatGoalDue(dueDate).replace("Due ", "")}</Text>
            </Pressable>

            <Pressable
              onPress={handleAdd}
              disabled={!title.trim() || saving}
              style={({ pressed }) => [
                styles.saveBtn,
                (!title.trim() || saving) && styles.saveBtnDisabled,
                pressed && { opacity: 0.92 },
              ]}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Create Goal"}</Text>
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
  addBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  scrollEmpty: {
    flexGrow: 1,
  },
  goalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  goalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 24,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  progressTrack: {
    flex: 1,
  },
  goalPercent: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    minWidth: 40,
    textAlign: "right",
  },
  goalDue: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  empty: {
    alignItems: "center",
    paddingTop: Spacing.xxxl * 2,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
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
    marginBottom: Spacing.xl,
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
});
