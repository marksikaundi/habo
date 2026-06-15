import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/TaskItem";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

const TEAM_MEMBERS = [
  { name: "Sarah K.", role: "Designer", avatar: "S" },
  { name: "James L.", role: "Developer", avatar: "J" },
  { name: "Emma W.", role: "PM", avatar: "E" },
];

const SHARED_TASKS = [
  { title: "Design system update", assignee: "Sarah K.", status: "In Progress" },
  { title: "API integration", assignee: "James L.", status: "Todo" },
  { title: "User testing plan", assignee: "Emma W.", status: "Done" },
];

const ACTIVITY = [
  { user: "Sarah K.", action: "completed Design system update", time: "2h ago" },
  { user: "James L.", action: "commented on API integration", time: "4h ago" },
  { user: "Emma W.", action: "assigned User testing plan", time: "Yesterday" },
];

export default function CollaborationScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Collaboration"
        showBack
        onBack={() => router.back()}
        rightIcon="add"
      />

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40, gap: Spacing.xl }}
      >
        <Card>
          <Text style={styles.boardTitle}>Habora Launch Board</Text>
          <Text style={styles.boardSubtitle}>3 members · 5 shared tasks</Text>
          <View style={styles.memberRow}>
            {TEAM_MEMBERS.map((member) => (
              <View key={member.name} style={styles.memberChip}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{member.avatar}</Text>
                </View>
                <View>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <View>
          <Text style={styles.sectionTitle}>Team Tasks</Text>
          {SHARED_TASKS.map((task) => (
            <Card key={task.title} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    task.status === "Done" && { backgroundColor: Colors.success + "20" },
                    task.status === "In Progress" && { backgroundColor: Colors.warning + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      task.status === "Done" && { color: Colors.success },
                      task.status === "In Progress" && { color: Colors.warning },
                    ]}
                  >
                    {task.status}
                  </Text>
                </View>
              </View>
              <View style={styles.assigneeRow}>
                <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.assigneeText}>{task.assignee}</Text>
              </View>
            </Card>
          ))}
        </View>

        <View>
          <Text style={styles.sectionTitle}>Activity Feed</Text>
          {ACTIVITY.map((item, i) => (
            <View key={i} style={styles.activityRow}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  <Text style={styles.activityUser}>{item.user}</Text> {item.action}
                </Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  boardTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  boardSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  memberRow: {
    gap: Spacing.md,
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  memberName: {
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.text,
  },
  memberRole: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  taskCard: {
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: Colors.borderLight,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  assigneeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  assigneeText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  activityRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  activityUser: {
    fontWeight: "600",
    color: Colors.text,
  },
  activityTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
