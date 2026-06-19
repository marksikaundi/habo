import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { TaskItem } from "@/components/TaskItem";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";
import type { Priority, Task } from "@/types";

const TABS = ["Today", "Upcoming", "Completed", "All"] as const;
type Tab = (typeof TABS)[number];

function todayIso() {
  return new Date().toISOString().split("T")[0] ?? "";
}

function tomorrowIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0] ?? "";
}

function formatDayMonth(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

function sectionTitle(iso: string, today: string, tomorrow: string) {
  if (iso === today) return `Today • ${formatDayMonth(iso)}`;
  if (iso === tomorrow) return `Tomorrow • ${formatDayMonth(iso)}`;
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function filterTasks(tasks: Task[], tab: Tab, today: string): Task[] {
  switch (tab) {
    case "Today":
      return tasks.filter((t) => t.dueDate === today);
    case "Upcoming":
      return tasks.filter((t) => t.dueDate > today && !t.completed);
    case "Completed":
      return tasks.filter((t) => t.completed);
    case "All":
      return tasks;
  }
}

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, toggleTask } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("Today");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const today = todayIso();
  const tomorrow = tomorrowIso();

  const filtered = useMemo(() => {
    return filterTasks(tasks, activeTab, today)
      .filter((t) => {
        if (search && !t.title.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        if (filterPriority && t.priority !== filterPriority) return false;
        return true;
      })
      .sort((a, b) => {
        const dateCmp = a.dueDate.localeCompare(b.dueDate);
        if (dateCmp !== 0) return dateCmp;
        return (a.dueTime ?? "").localeCompare(b.dueTime ?? "");
      });
  }, [tasks, activeTab, today, search, filterPriority]);

  const sections = useMemo(() => {
    const groups = new Map<string, Task[]>();
    for (const task of filtered) {
      const key = task.dueDate;
      const list = groups.get(key) ?? [];
      list.push(task);
      groups.set(key, list);
    }
    return Array.from(groups.entries()).map(([date, data]) => ({
      date,
      title: sectionTitle(date, today, tomorrow),
      data: collapsed[date] ? [] : data,
    }));
  }, [filtered, today, tomorrow, collapsed]);

  const toggleSection = (date: string) => {
    setCollapsed((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Tasks"
        leftIcon="menu"
        onLeftPress={() => router.push("/(tabs)/settings")}
        rightElement={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                setShowSearch((v) => !v);
                if (showSearch) setSearch("");
              }}
              hitSlop={8}
              style={styles.headerIconBtn}
            >
              <Ionicons
                name={showSearch ? "close" : "search"}
                size={22}
                color={Colors.text}
              />
            </Pressable>
            <Pressable
              onPress={() => setShowFilter(true)}
              hitSlop={8}
              style={styles.headerIconBtn}
            >
              <Ionicons
                name="options-outline"
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

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            android_ripple={null}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 120 },
          sections.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Pressable
            onPress={() => toggleSection(section.date)}
            style={styles.sectionHeader}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Ionicons
              name={collapsed[section.date] ? "chevron-down" : "chevron-up"}
              size={18}
              color={Colors.textMuted}
            />
          </Pressable>
        )}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            variant="list"
            onToggle={() => toggleTask(item.id)}
            onPress={() => router.push(`/task/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="checkbox-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === "Completed"
                ? "Completed tasks will appear here"
                : "Tap + to add a new task"}
            </Text>
          </View>
        }
      />

      <Modal visible={showFilter} transparent animationType="fade">
        <Pressable style={styles.filterOverlay} onPress={() => setShowFilter(false)}>
          <Pressable style={styles.filterSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.filterTitle}>Filter by priority</Text>
            {(["high", "medium", "low"] as Priority[]).map((p) => (
              <Pressable
                key={p}
                onPress={() => {
                  setFilterPriority(filterPriority === p ? null : p);
                  setShowFilter(false);
                }}
                style={[
                  styles.filterOption,
                  filterPriority === p && styles.filterOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filterPriority === p && styles.filterOptionTextActive,
                  ]}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
                {filterPriority === p ? (
                  <Ionicons name="checkmark" size={18} color={Colors.primary} />
                ) : null}
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                setFilterPriority(null);
                setShowFilter(false);
              }}
              style={styles.filterClear}
            >
              <Text style={styles.filterClearText}>Clear filter</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    gap: Spacing.xs,
    width: 80,
    justifyContent: "flex-end",
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
  tabs: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: "#fff",
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  listEmpty: {
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  emptyWrap: {
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
    textAlign: "center",
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  filterSheet: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  filterTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
  },
  filterOptionActive: {
    backgroundColor: Colors.primaryMuted,
  },
  filterOptionText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  filterOptionTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  filterClear: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  filterClearText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
});
