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

import { ListPageHeader } from "@/components/ListPageHeader";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";

const TAGS = ["All", "Work", "Personal", "Ideas"] as const;
const NOTE_TAGS = ["Work", "Personal", "Ideas"] as const;

function formatNoteDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function notePreview(content: string): string {
  const line = content.split("\n").find((l) => l.trim())?.trim() ?? content.trim();
  if (line.length <= 80) return line.startsWith("•") ? line : `• ${line}`;
  return `• ${line.slice(0, 77)}...`;
}

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const { notes, addNote } = useApp();
  const [activeTag, setActiveTag] = useState<(typeof TAGS)[number]>("All");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState<(typeof NOTE_TAGS)[number]>("Work");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return notes
      .filter((n) => {
        if (activeTag !== "All" && n.tag !== activeTag) return false;
        if (search && !`${n.title} ${n.content}`.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [notes, activeTag, search]);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await addNote({
        title: title.trim(),
        content: content.trim() || " ",
        tag,
      });
      setTitle("");
      setContent("");
      setTag("Work");
      setShowAdd(false);
    } catch {
      Alert.alert("Error", "Could not save note. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ListPageHeader
        title="Notes"
        showBack
        onBack={() => router.back()}
        rightElement={
          <>
            <Pressable
              onPress={() => {
                setShowSearch((v) => !v);
                if (showSearch) setSearch("");
              }}
              style={styles.headerIconBtn}
              hitSlop={8}
            >
              <Ionicons
                name={showSearch ? "close" : "search"}
                size={22}
                color={Colors.text}
              />
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert("Sort notes", "Choose sort order", [
                  { text: "Newest first", onPress: () => {} },
                  { text: "Oldest first", onPress: () => {} },
                  { text: "Cancel", style: "cancel" },
                ])
              }
              style={styles.headerIconBtn}
              hitSlop={8}
            >
              <Ionicons name="options-outline" size={22} color={Colors.text} />
            </Pressable>
          </>
        }
      />

      {showSearch ? (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search notes..."
            placeholderTextColor={Colors.textMuted}
            autoFocus
          />
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tags}
        contentContainerStyle={styles.tagsContent}
      >
        {TAGS.map((t) => (
          <Pressable
            key={t}
            onPress={() => setActiveTag(t)}
            style={[styles.tag, activeTag === t && styles.tagActive]}
          >
            <Text style={[styles.tagText, activeTag === t && styles.tagTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
          filtered.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((note) => (
          <View key={note.id} style={styles.noteCard}>
            <Text style={styles.noteTitle} numberOfLines={1}>
              {note.title}
            </Text>
            <Text style={styles.noteDate}>{formatNoteDate(note.createdAt)}</Text>
            <Text style={styles.notePreview} numberOfLines={2}>
              {notePreview(note.content)}
            </Text>
          </View>
        ))}

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No notes found</Text>
            <Text style={styles.emptySubtitle}>Tap + to create a note</Text>
          </View>
        ) : null}
      </ScrollView>

      <Pressable
        onPress={() => setShowAdd(true)}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 24 },
          pressed && { opacity: 0.92 },
        ]}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <Modal visible={showAdd} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAdd(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Note</Text>
              <Pressable onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Project Ideas 💡"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Write your note..."
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Tag</Text>
            <View style={styles.tagPicker}>
              {NOTE_TAGS.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTag(t)}
                  style={[styles.tagOption, tag === t && styles.tagOptionActive]}
                >
                  <Text style={[styles.tagOptionText, tag === t && styles.tagOptionTextActive]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleAdd}
              disabled={!title.trim() || saving}
              style={({ pressed }) => [
                styles.saveBtn,
                (!title.trim() || saving) && styles.saveBtnDisabled,
                pressed && { opacity: 0.92 },
              ]}
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Note"}</Text>
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
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  tags: {
    flexGrow: 0,
    marginBottom: Spacing.lg,
  },
  tagsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
  },
  tagActive: {
    backgroundColor: Colors.primary,
  },
  tagText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  tagTextActive: {
    color: "#fff",
  },
  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  listEmpty: {
    flexGrow: 1,
  },
  noteCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    gap: Spacing.xs,
    ...Shadow.sm,
  },
  noteTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  noteDate: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  notePreview: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.md,
    zIndex: 10,
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
    maxHeight: "90%",
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
  textArea: {
    minHeight: 120,
  },
  tagPicker: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  tagOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
  },
  tagOptionActive: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tagOptionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  tagOptionTextActive: {
    color: Colors.primary,
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
