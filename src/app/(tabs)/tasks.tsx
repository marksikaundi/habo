import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { TaskItem } from "@/components/TaskItem";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import type { Priority } from "@/types";

const TODAY = "2024-05-21";
const TABS = ["Today", "Upcoming", "Completed", "All"] as const;
type Tab = (typeof TABS)[number];

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, toggleTask } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("Today");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);

  const filtered = tasks
    .filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (activeTab === "Today") return t.dueDate === TODAY;
      if (activeTab === "Upcoming") return t.dueDate > TODAY && !t.completed;
      if (activeTab === "Completed") return t.completed;
      return true;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, task) => {
    const label =
      task.dueDate === TODAY
        ? "Today - 21 May"
        : task.dueDate === "2024-05-22"
          ? "Tomorrow - 22 May"
          : task.dueDate;
    if (!acc[label]) acc[label] = [];
    acc[label].push(task);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Tasks"
        rightIcon={showSearch ? "close" : "search"}
        onRightPress={() => setShowSearch(!showSearch)}
        rightElement={
          <View style={styles.headerActions}>
            <Pressable onPress={() => setShowSearch(!showSearch)} hitSlop={8}>
              <Ionicons
                name={showSearch ? "close" : "search"}
                size={22}
                color={Colors.text}
              />
            </Pressable>
            <Pressable
              onPress={() =>
                setFilterPriority(
                  filterPriority === "high"
                    ? null
                    : filterPriority === "medium"
                      ? "high"
                      : filterPriority === "low"
                        ? "medium"
                        : "low",
                )
              }
              hitSlop={8}
            >
              <Ionicons
                name="filter"
                size={22}
                color={filterPriority ? Colors.primary : Colors.text}
              />
            </Pressable>
          </View>
        }
      />

      {showSearch ? (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(grouped).map(([date, dateTasks]) => (
          <View key={date} style={styles.group}>
            <Text style={styles.groupTitle}>{date}</Text>
            {dateTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task.id)}
              />
            ))}
          </View>
        ))}
        {filtered.length === 0 ? (
          <Text style={styles.empty}>No tasks found</Text>
        ) : null}
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
  tabs: {
    flexGrow: 0,
    marginBottom: Spacing.md,
  },
  tabsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: "#fff",
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  group: {
    marginBottom: Spacing.xl,
  },
  groupTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  empty: {
    textAlign: "center",
    color: Colors.textMuted,
    marginTop: Spacing.xxxl,
  },
});
