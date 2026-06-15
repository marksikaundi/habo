import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/TaskItem";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

const TAGS = ["All", "Work", "Personal", "Ideas"];

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const { notes } = useApp();
  const [activeTag, setActiveTag] = useState("All");
  const [gridView, setGridView] = useState(false);

  const filtered =
    activeTag === "All" ? notes : notes.filter((n) => n.tag === activeTag);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Notes"
        showBack
        onBack={() => router.back()}
        rightElement={
          <View style={styles.headerActions}>
            <Pressable hitSlop={8}>
              <Ionicons name="search" size={22} color={Colors.text} />
            </Pressable>
            <Pressable onPress={() => setGridView(!gridView)} hitSlop={8}>
              <Ionicons
                name={gridView ? "list" : "grid"}
                size={22}
                color={Colors.text}
              />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tags}
        contentContainerStyle={styles.tagsContent}
      >
        {TAGS.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => setActiveTag(tag)}
            style={[styles.tag, activeTag === tag && styles.tagActive]}
          >
            <Text style={[styles.tagText, activeTag === tag && styles.tagTextActive]}>
              {tag}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[
          gridView ? styles.grid : styles.list,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {filtered.map((note) => (
          <Card key={note.id} style={gridView ? styles.gridCard : styles.listCard}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle} numberOfLines={1}>
                {note.title}
              </Text>
              <View style={styles.noteTag}>
                <Text style={styles.noteTagText}>{note.tag}</Text>
              </View>
            </View>
            <Text style={styles.noteDate}>{note.createdAt}</Text>
            <Text style={styles.notePreview} numberOfLines={gridView ? 3 : 2}>
              {note.content}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.lg,
    width: 80,
    justifyContent: "flex-end",
  },
  tags: {
    flexGrow: 0,
    marginBottom: Spacing.md,
  },
  tagsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  tagTextActive: {
    color: "#fff",
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  grid: {
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  listCard: {
    marginBottom: Spacing.md,
  },
  gridCard: {
    width: "47%",
    marginBottom: 0,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  noteTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
  },
  noteTag: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  noteTagText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: "500",
  },
  noteDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  notePreview: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
