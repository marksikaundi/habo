import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
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

type TaskStatus = "todo" | "in_progress" | "done";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  online: boolean;
};

type SharedTask = {
  id: string;
  title: string;
  assigneeId: string;
  status: TaskStatus;
  dueLabel: string;
};

type ActivityItem = {
  id: string;
  userId: string;
  action: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const TEAM_MEMBERS: TeamMember[] = [
  { id: "m1", name: "Sarah K.", role: "Designer", initials: "SK", color: "#8B5CF6", online: true },
  { id: "m2", name: "James L.", role: "Developer", initials: "JL", color: "#3B82F6", online: true },
  { id: "m3", name: "Emma W.", role: "PM", initials: "EW", color: "#10B981", online: false },
];

const SHARED_TASKS: SharedTask[] = [
  { id: "t1", title: "Design system update", assigneeId: "m1", status: "in_progress", dueLabel: "Due Fri" },
  { id: "t2", title: "API integration", assigneeId: "m2", status: "todo", dueLabel: "Due Mon" },
  { id: "t3", title: "User testing plan", assigneeId: "m3", status: "done", dueLabel: "Completed" },
  { id: "t4", title: "Launch checklist review", assigneeId: "m1", status: "todo", dueLabel: "Due next week" },
  { id: "t5", title: "Analytics dashboard", assigneeId: "m2", status: "in_progress", dueLabel: "Due Thu" },
];

const ACTIVITY: ActivityItem[] = [
  { id: "a1", userId: "m1", action: "completed Design system update", time: "2h ago", icon: "checkmark-circle" },
  { id: "a2", userId: "m2", action: "commented on API integration", time: "4h ago", icon: "chatbubble-outline" },
  { id: "a3", userId: "m3", action: "assigned User testing plan", time: "Yesterday", icon: "person-add-outline" },
  { id: "a4", userId: "m2", action: "updated Analytics dashboard", time: "Yesterday", icon: "create-outline" },
];

const FILTERS: { key: "all" | TaskStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in_progress", label: "Active" },
  { key: "todo", label: "To Do" },
  { key: "done", label: "Done" },
];

function statusMeta(status: TaskStatus) {
  switch (status) {
    case "done":
      return { label: "Done", color: Colors.success, bg: "#D1FAE5" };
    case "in_progress":
      return { label: "Active", color: Colors.warning, bg: "#FEF3C7" };
    default:
      return { label: "To Do", color: Colors.textSecondary, bg: Colors.borderLight };
  }
}

function memberById(id: string) {
  return TEAM_MEMBERS.find((m) => m.id === id);
}

type AvatarProps = {
  initials: string;
  color: string;
  size?: number;
  online?: boolean;
};

function Avatar({ initials, color, size = 40, online }: AvatarProps) {
  return (
    <View style={{ position: "relative" }}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color + "33",
          },
        ]}
      >
        <Text style={[styles.avatarText, { color, fontSize: size * 0.35 }]}>{initials}</Text>
      </View>
      {online !== undefined ? (
        <View
          style={[
            styles.onlineDot,
            { backgroundColor: online ? Colors.success : Colors.textMuted },
          ]}
        />
      ) : null}
    </View>
  );
}

type MemberCardProps = {
  member: TeamMember;
};

function MemberCard({ member }: MemberCardProps) {
  return (
    <View style={styles.memberCard}>
      <Avatar initials={member.initials} color={member.color} online={member.online} />
      <Text style={styles.memberName} numberOfLines={1}>
        {member.name}
      </Text>
      <Text style={styles.memberRole} numberOfLines={1}>
        {member.role}
      </Text>
    </View>
  );
}

type SharedTaskCardProps = {
  task: SharedTask;
};

function SharedTaskCard({ task }: SharedTaskCardProps) {
  const assignee = memberById(task.assigneeId);
  const meta = statusMeta(task.status);

  return (
    <Pressable style={({ pressed }) => [styles.taskCard, pressed && { opacity: 0.92 }]}>
      <View style={[styles.taskAccent, { backgroundColor: meta.color }]} />
      <View style={styles.taskBody}>
        <View style={styles.taskTop}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        <View style={styles.taskMeta}>
          {assignee ? (
            <View style={styles.assigneeRow}>
              <Avatar initials={assignee.initials} color={assignee.color} size={22} />
              <Text style={styles.assigneeText}>{assignee.name}</Text>
            </View>
          ) : null}
          <Text style={styles.dueText}>{task.dueLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

type ActivityRowProps = {
  item: ActivityItem;
  isLast: boolean;
};

function ActivityRow({ item, isLast }: ActivityRowProps) {
  const member = memberById(item.userId);

  return (
    <View style={styles.activityRow}>
      <View style={styles.activityTimeline}>
        <View style={styles.activityIconWrap}>
          <Ionicons name={item.icon} size={14} color={Colors.primary} />
        </View>
        {!isLast ? <View style={styles.activityLine} /> : null}
      </View>
      <View style={[styles.activityContent, !isLast && styles.activityContentSpaced]}>
        <Text style={styles.activityText}>
          <Text style={styles.activityUser}>{member?.name ?? "Someone"}</Text> {item.action}
        </Text>
        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
    </View>
  );
}

export default function CollaborationScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const filteredTasks = useMemo(() => {
    if (filter === "all") return SHARED_TASKS;
    return SHARED_TASKS.filter((t) => t.status === filter);
  }, [filter]);

  const doneCount = SHARED_TASKS.filter((t) => t.status === "done").length;
  const activeCount = SHARED_TASKS.filter((t) => t.status === "in_progress").length;
  const progressPct = Math.round((doneCount / SHARED_TASKS.length) * 100);

  const boardName = user?.name ? `${user.name.split(" ")[0]}'s Team` : "Habora Launch Board";

  return (
    <View style={styles.container}>
      <ListPageHeader
        title="Collaboration"
        showBack
        onBack={() => router.back()}
        rightElement={
          <Pressable onPress={() => setShowInvite(true)} style={styles.headerBtn} hitSlop={8}>
            <Ionicons name="person-add-outline" size={24} color={Colors.text} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#6C3CE0", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroText}>
              <Text style={styles.heroLabel}>Shared workspace</Text>
              <Text style={styles.heroTitle}>{boardName}</Text>
              <Text style={styles.heroSubtitle}>
                {TEAM_MEMBERS.length} members · {SHARED_TASKS.length} shared tasks
              </Text>
            </View>
            <View style={styles.progressRing}>
              <Text style={styles.progressValue}>{progressPct}%</Text>
              <Text style={styles.progressLabel}>done</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{activeCount}</Text>
              <Text style={styles.heroStatLabel}>Active</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{doneCount}</Text>
              <Text style={styles.heroStatLabel}>Completed</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{TEAM_MEMBERS.filter((m) => m.online).length}</Text>
              <Text style={styles.heroStatLabel}>Online</Text>
            </View>
          </View>

          <View style={styles.avatarStack}>
            {TEAM_MEMBERS.map((member, i) => (
              <View
                key={member.id}
                style={[styles.stackedAvatar, { marginLeft: i === 0 ? 0 : -10, zIndex: TEAM_MEMBERS.length - i }]}
              >
                <Avatar initials={member.initials} color={member.color} size={36} online={member.online} />
              </View>
            ))}
            <Pressable style={styles.addMemberBtn} onPress={() => setShowInvite(true)}>
              <Ionicons name="add" size={18} color="#fff" />
            </Pressable>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Team</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.memberScroll}
        >
          {TEAM_MEMBERS.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shared Tasks</Text>
          <Text style={styles.sectionMeta}>{filteredTasks.length} tasks</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.taskList}>
          {filteredTasks.map((task) => (
            <SharedTaskCard key={task.id} task={task} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          {ACTIVITY.map((item, i) => (
            <ActivityRow key={item.id} item={item} isLast={i === ACTIVITY.length - 1} />
          ))}
        </View>

        <Pressable style={styles.inviteCard} onPress={() => setShowInvite(true)}>
          <View style={styles.inviteIcon}>
            <Ionicons name="mail-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.inviteBody}>
            <Text style={styles.inviteTitle}>Invite teammates</Text>
            <Text style={styles.inviteSubtitle}>Share your board and assign tasks together</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </Pressable>
      </ScrollView>

      <Modal visible={showInvite} transparent animationType="fade" onRequestClose={() => setShowInvite(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowInvite(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Invite to workspace</Text>
            <Text style={styles.modalSubtitle}>
              Collaboration is in preview. Enter an email to save for when invites go live.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="teammate@email.com"
              placeholderTextColor={Colors.textMuted}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setShowInvite(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirm, !inviteEmail.trim() && styles.modalConfirmDisabled]}
                onPress={() => {
                  setInviteEmail("");
                  setShowInvite(false);
                }}
              >
                <Text style={styles.modalConfirmText}>Send Invite</Text>
              </Pressable>
            </View>
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
  scroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Shadow.md,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  heroText: {
    flex: 1,
    gap: 4,
  },
  heroLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: "#fff",
  },
  heroSubtitle: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  progressRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressValue: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: "#fff",
  },
  progressLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  heroStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  heroStatValue: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: "#fff",
  },
  heroStatLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  heroDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginVertical: 4,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackedAvatar: {
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 20,
  },
  addMemberBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  sectionMeta: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  memberScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  memberCard: {
    width: 108,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  memberName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  memberRole: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: "center",
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "700",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  filterRow: {
    gap: Spacing.sm,
    marginTop: -Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: "#fff",
  },
  taskList: {
    gap: Spacing.sm,
    marginTop: -Spacing.sm,
  },
  taskCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: "hidden",
    ...Shadow.sm,
  },
  taskAccent: {
    width: 4,
  },
  taskBody: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  taskTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  taskTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 20,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  assigneeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  assigneeText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  dueText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  activityRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  activityTimeline: {
    alignItems: "center",
    width: 28,
  },
  activityIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  activityLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
    minHeight: 24,
  },
  activityContent: {
    flex: 1,
    paddingTop: 4,
  },
  activityContentSpaced: {
    paddingBottom: Spacing.lg,
  },
  activityText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  activityUser: {
    fontWeight: "700",
    color: Colors.text,
  },
  activityTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
  },
  inviteIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteBody: {
    flex: 1,
    gap: 2,
  },
  inviteTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  inviteSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.md,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
  },
  modalCancelText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
  modalConfirmDisabled: {
    opacity: 0.5,
  },
  modalConfirmText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: "#fff",
  },
});
