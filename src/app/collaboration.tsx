import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ListPageHeader } from "@/components/ListPageHeader";
import { getPriorityColor, useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";
import {
  formatActivityTime,
  memberColor,
  memberInitials,
} from "@/services/appwrite-collaboration";
import type { SharedTask, WorkspaceActivity, WorkspaceMember } from "@/types";

type TaskFilter = "all" | "active" | "todo" | "done";

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "todo", label: "To Do" },
  { key: "done", label: "Done" },
];

function taskStatus(task: SharedTask): "todo" | "active" | "done" {
  if (task.completed) return "done";
  const today = new Date().toISOString().split("T")[0] ?? "";
  if (task.dueDate <= today) return "active";
  return "todo";
}

function formatDueLabel(dueDate: string, completed: boolean): string {
  if (completed) return "Completed";
  const today = new Date().toISOString().split("T")[0] ?? "";
  if (dueDate === today) return "Due today";
  const due = new Date(dueDate + "T12:00:00");
  return `Due ${due.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

function activityIcon(type: WorkspaceActivity["activityType"]): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "task_completed":
      return "checkmark-circle";
    case "task_shared":
      return "share-social-outline";
    case "task_assigned":
      return "person-add-outline";
    default:
      return "mail-outline";
  }
}

function activityIconColor(type: WorkspaceActivity["activityType"]): string {
  switch (type) {
    case "task_completed":
      return Colors.success;
    case "task_shared":
      return Colors.info;
    case "task_assigned":
      return Colors.warning;
    default:
      return Colors.primary;
  }
}

type AvatarProps = {
  name: string;
  seed: string;
  size?: number;
  online?: boolean;
  borderColor?: string;
};

function Avatar({ name, seed, size = 40, online, borderColor }: AvatarProps) {
  const color = memberColor(seed);
  return (
    <View style={{ position: "relative" }}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color + "28",
            borderWidth: borderColor ? 2 : 0,
            borderColor: borderColor ?? "transparent",
          },
        ]}
      >
        <Text style={[styles.avatarText, { color, fontSize: size * 0.35 }]}>
          {memberInitials(name)}
        </Text>
      </View>
      {online !== undefined ? (
        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: online ? Colors.success : Colors.textMuted,
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size * 0.14,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

type QuickActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  onPress: () => void;
};

function QuickAction({ icon, label, subtitle, onPress }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={22} color={Colors.primary} />
      </View>
      <View style={styles.quickActionText}>
        <Text style={styles.quickActionLabel}>{label}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

type MemberRowProps = {
  member: WorkspaceMember;
};

function MemberRow({ member }: MemberRowProps) {
  const isInvited = member.status === "invited";
  const roleLabel =
    member.role === "owner" ? "Owner" : isInvited ? "Pending invite" : "Member";

  return (
    <View style={[styles.memberRow, isInvited && styles.memberRowInvited]}>
      <Avatar name={member.name} seed={member.email} size={44} online={!isInvited} />
      <View style={styles.memberRowBody}>
        <View style={styles.memberRowTop}>
          <Text style={styles.memberRowName} numberOfLines={1}>
            {member.name}
          </Text>
          <View
            style={[
              styles.rolePill,
              member.role === "owner" && styles.rolePillOwner,
              isInvited && styles.rolePillInvited,
            ]}
          >
            <Text
              style={[
                styles.rolePillText,
                member.role === "owner" && styles.rolePillTextOwner,
                isInvited && styles.rolePillTextInvited,
              ]}
            >
              {roleLabel}
            </Text>
          </View>
        </View>
        <Text style={styles.memberRowEmail} numberOfLines={1}>
          {member.email}
        </Text>
      </View>
      {isInvited ? (
        <Ionicons name="time-outline" size={18} color={Colors.warning} />
      ) : (
        <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
      )}
    </View>
  );
}

type SharedTaskCardProps = {
  task: SharedTask;
  onToggle: () => void;
};

function SharedTaskCard({ task, onToggle }: SharedTaskCardProps) {
  const status = taskStatus(task);
  const priorityColor = getPriorityColor(task.priority);

  return (
    <Pressable
      style={({ pressed }) => [styles.taskCard, pressed && { opacity: 0.94 }]}
    >
      <Pressable onPress={onToggle} hitSlop={10} style={styles.taskCheckbox}>
        <View style={[styles.checkboxInner, task.completed && styles.checkboxChecked]}>
          {task.completed ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
        </View>
      </Pressable>

      <View style={styles.taskBody}>
        <View style={styles.taskTop}>
          <Text
            style={[styles.taskTitle, task.completed && styles.taskTitleDone]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
        </View>

        <View style={styles.taskMetaRow}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{task.category}</Text>
          </View>
          <Text style={styles.dueText}>{formatDueLabel(task.dueDate, task.completed)}</Text>
        </View>

        <View style={styles.taskFooter}>
          {task.assigneeName ? (
            <View style={styles.assigneeRow}>
              <Avatar name={task.assigneeName} seed={task.assigneeName} size={20} />
              <Text style={styles.assigneeText}>{task.assigneeName}</Text>
            </View>
          ) : (
            <Text style={styles.unassignedText}>Unassigned</Text>
          )}
          {status !== "done" ? (
            <View
              style={[
                styles.statusPill,
                status === "active" ? styles.statusPillActive : styles.statusPillTodo,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  status === "active" ? styles.statusTextActive : styles.statusTextTodo,
                ]}
              >
                {status === "active" ? "Active" : "To Do"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

type ActivityRowProps = {
  item: WorkspaceActivity;
  isLast: boolean;
};

function ActivityRow({ item, isLast }: ActivityRowProps) {
  const iconColor = activityIconColor(item.activityType);

  return (
    <View style={styles.activityRow}>
      <View style={styles.activityTimeline}>
        <View style={[styles.activityIconWrap, { backgroundColor: iconColor + "18" }]}>
          <Ionicons name={activityIcon(item.activityType)} size={15} color={iconColor} />
        </View>
        {!isLast ? <View style={styles.activityLine} /> : null}
      </View>
      <View style={[styles.activityContent, !isLast && styles.activityContentSpaced]}>
        <Text style={styles.activityText}>
          <Text style={styles.activityUser}>{item.actorName}</Text> {item.action}
        </Text>
        <Text style={styles.activityTime}>{formatActivityTime(item.createdAt)}</Text>
      </View>
    </View>
  );
}

export default function CollaborationScreen() {
  const insets = useSafeAreaInsets();
  const {
    tasks,
    workspace,
    workspaceMembers,
    sharedTasks,
    sharedTaskIds,
    workspaceActivity,
    collaborationLoading,
    refreshCollaboration,
    inviteMember,
    shareTask,
    toggleTask,
    schemaError,
  } = useApp();

  const [filter, setFilter] = useState<TaskFilter>("all");
  const [showInvite, setShowInvite] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [sharing, setSharing] = useState(false);

  const privateTasks = useMemo(
    () => tasks.filter((t) => !sharedTaskIds.includes(t.id)),
    [tasks, sharedTaskIds],
  );

  const filterCounts = useMemo(
    () => ({
      all: sharedTasks.length,
      active: sharedTasks.filter((t) => taskStatus(t) === "active").length,
      todo: sharedTasks.filter((t) => taskStatus(t) === "todo").length,
      done: sharedTasks.filter((t) => t.completed).length,
    }),
    [sharedTasks],
  );

  const filteredTasks = useMemo(() => {
    if (filter === "all") return sharedTasks;
    if (filter === "done") return sharedTasks.filter((t) => t.completed);
    if (filter === "active") return sharedTasks.filter((t) => taskStatus(t) === "active");
    return sharedTasks.filter((t) => taskStatus(t) === "todo");
  }, [sharedTasks, filter]);

  const doneCount = filterCounts.done;
  const activeCount = filterCounts.active;
  const progressPct =
    sharedTasks.length > 0 ? Math.round((doneCount / sharedTasks.length) * 100) : 0;
  const activeMembers = workspaceMembers.filter((m) => m.status === "active").length;
  const invitedCount = workspaceMembers.filter((m) => m.status === "invited").length;

  const handleRefresh = useCallback(() => {
    void refreshCollaboration();
  }, [refreshCollaboration]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteMember(inviteEmail.trim());
      setInviteEmail("");
      setShowInvite(false);
    } catch (error) {
      Alert.alert(
        "Could not invite",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setInviting(false);
    }
  };

  const handleShareTask = async (taskId: string) => {
    setSharing(true);
    try {
      await shareTask(taskId);
      setShowShare(false);
    } catch (error) {
      Alert.alert(
        "Could not share task",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSharing(false);
    }
  };

  if (collaborationLoading && !workspace) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading workspace…</Text>
      </View>
    );
  }

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
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={collaborationLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {schemaError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{schemaError}</Text>
          </View>
        ) : null}

        <LinearGradient
          colors={["#5B21B6", "#6C3CE0", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroDecor} pointerEvents="none">
            <Ionicons name="people" size={120} color="rgba(255,255,255,0.06)" />
          </View>

          <View style={styles.heroTop}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="briefcase-outline" size={22} color="#fff" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroLabel}>Workspace</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {workspace?.name ?? "Your Workspace"}
              </Text>
            </View>
            <View style={styles.progressRing}>
              <Text style={styles.progressValue}>{progressPct}%</Text>
            </View>
          </View>

          <View style={styles.heroProgressTrack}>
            <View style={[styles.heroProgressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.heroProgressCaption}>
            {doneCount} of {sharedTasks.length} shared tasks complete
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{activeCount}</Text>
              <Text style={styles.heroStatLabel}>Active</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{activeMembers}</Text>
              <Text style={styles.heroStatLabel}>Members</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{invitedCount}</Text>
              <Text style={styles.heroStatLabel}>Invited</Text>
            </View>
          </View>

          <View style={styles.avatarStack}>
            {workspaceMembers.slice(0, 6).map((member, i) => (
              <View
                key={member.id}
                style={[
                  styles.stackedAvatar,
                  { marginLeft: i === 0 ? 0 : -12, zIndex: workspaceMembers.length - i },
                ]}
              >
                <Avatar
                  name={member.name}
                  seed={member.email}
                  size={34}
                  online={member.status === "active"}
                  borderColor="rgba(255,255,255,0.6)"
                />
              </View>
            ))}
            {workspaceMembers.length > 6 ? (
              <View style={styles.moreAvatar}>
                <Text style={styles.moreAvatarText}>+{workspaceMembers.length - 6}</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>

        <View style={styles.quickActions}>
          <QuickAction
            icon="mail-outline"
            label="Invite teammate"
            subtitle="Add by email"
            onPress={() => setShowInvite(true)}
          />
          <QuickAction
            icon="share-outline"
            label="Share a task"
            subtitle={`${privateTasks.length} available`}
            onPress={() => setShowShare(true)}
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Text style={styles.sectionTitle}>Team</Text>
            <Text style={styles.sectionMeta}>{workspaceMembers.length} people</Text>
          </View>

          {workspaceMembers.length === 0 ? (
            <View style={styles.inlineEmpty}>
              <Text style={styles.inlineEmptyText}>Invite someone to collaborate with you.</Text>
            </View>
          ) : (
            workspaceMembers.map((member, i) => (
              <View key={member.id}>
                <MemberRow member={member} />
                {i < workspaceMembers.length - 1 ? <View style={styles.memberDivider} /> : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Text style={styles.sectionTitle}>Shared Tasks</Text>
            <Pressable onPress={() => setShowShare(true)} hitSlop={8}>
              <Text style={styles.shareLink}>+ Share</Text>
            </Pressable>
          </View>

          <View style={styles.filterWrap}>
            {FILTERS.map((f) => {
              const count = filterCounts[f.key];
              const active = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                  {count > 0 ? (
                    <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                      <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>
                        {count}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {filteredTasks.length === 0 ? (
            <View style={styles.inlineEmpty}>
              <Ionicons name="layers-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {sharedTasks.length === 0 ? "No shared tasks yet" : "No tasks in this filter"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {sharedTasks.length === 0
                  ? "Share a personal task so your team can track progress together."
                  : "Try a different filter to see more tasks."}
              </Text>
              {sharedTasks.length === 0 ? (
                <Pressable
                  style={styles.emptyBtn}
                  onPress={() =>
                    privateTasks.length > 0 ? setShowShare(true) : router.push("/add-task")
                  }
                >
                  <Text style={styles.emptyBtnText}>
                    {privateTasks.length > 0 ? "Share a task" : "Create a task"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.taskList}>
              {filteredTasks.map((task, i) => (
                <View key={task.id}>
                  <SharedTaskCard task={task} onToggle={() => void toggleTask(task.id)} />
                  {i < filteredTasks.length - 1 ? <View style={styles.taskGap} /> : null}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {workspaceActivity.length > 0 ? (
              <Text style={styles.sectionMeta}>{workspaceActivity.length} events</Text>
            ) : null}
          </View>

          {workspaceActivity.length === 0 ? (
            <View style={styles.inlineEmpty}>
              <Ionicons name="pulse-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.emptySubtitle}>
                Invites, shared tasks, and completions will appear here.
              </Text>
            </View>
          ) : (
            workspaceActivity.map((item, i) => (
              <ActivityRow
                key={item.id}
                item={item}
                isLast={i === workspaceActivity.length - 1}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showInvite}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInvite(false)}
      >
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowInvite(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetIconWrap}>
                <Ionicons name="mail-outline" size={22} color={Colors.primary} />
              </View>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle}>Invite teammate</Text>
                <Text style={styles.sheetSubtitle}>
                  They join {workspace?.name ?? "your workspace"} when they sign up with this email.
                </Text>
              </View>
            </View>
            <TextInput
              style={styles.sheetInput}
              placeholder="teammate@email.com"
              placeholderTextColor={Colors.textMuted}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <Pressable
              style={[styles.sheetPrimaryBtn, (!inviteEmail.trim() || inviting) && styles.btnDisabled]}
              onPress={() => void handleInvite()}
            >
              <Text style={styles.sheetPrimaryBtnText}>
                {inviting ? "Sending…" : "Send invite"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showShare}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShare(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowShare(false)} />
          <View style={[styles.sheet, styles.shareSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetIconWrap}>
                <Ionicons name="share-outline" size={22} color={Colors.primary} />
              </View>
              <View style={styles.sheetHeaderText}>
                <Text style={styles.sheetTitle}>Share a task</Text>
                <Text style={styles.sheetSubtitle}>
                  Choose a personal task for {workspace?.name ?? "your workspace"}.
                </Text>
              </View>
            </View>
            {privateTasks.length === 0 ? (
              <View style={styles.inlineEmpty}>
                <Text style={styles.emptySubtitle}>Create a task first, then share it here.</Text>
                <Pressable style={styles.emptyBtn} onPress={() => router.push("/add-task")}>
                  <Text style={styles.emptyBtnText}>Create task</Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={privateTasks}
                keyExtractor={(item) => item.id}
                style={styles.shareList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.shareItem}
                    onPress={() => void handleShareTask(item.id)}
                    disabled={sharing}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
                    <View style={styles.shareItemBody}>
                      <Text style={styles.shareItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.shareItemMeta}>{item.category}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
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
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "#FEE2E2",
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.danger,
    lineHeight: 18,
  },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    overflow: "hidden",
    ...Shadow.md,
  },
  heroDecor: {
    position: "absolute",
    right: -20,
    bottom: -20,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  heroLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 26,
  },
  progressRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressValue: {
    fontSize: FontSize.sm,
    fontWeight: "800",
    color: "#fff",
  },
  heroProgressTrack: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  heroProgressFill: {
    height: "100%",
    borderRadius: Radius.full,
    backgroundColor: "#fff",
  },
  heroProgressCaption: {
    fontSize: FontSize.xs,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  heroStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
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
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },
  heroDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 4,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  stackedAvatar: {
    borderRadius: 20,
  },
  moreAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  moreAvatarText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  quickActions: {
    gap: Spacing.sm,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    flex: 1,
    gap: 2,
  },
  quickActionLabel: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
  },
  quickActionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  shareLink: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  memberRowInvited: {
    opacity: 0.9,
  },
  memberRowBody: {
    flex: 1,
    gap: 3,
  },
  memberRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  memberRowName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  memberRowEmail: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  memberDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 56,
  },
  rolePill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
  },
  rolePillOwner: {
    backgroundColor: Colors.primaryMuted,
  },
  rolePillInvited: {
    backgroundColor: "#FEF3C7",
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  rolePillTextOwner: {
    color: Colors.primary,
  },
  rolePillTextInvited: {
    color: Colors.warning,
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
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
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
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  filterBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  filterBadgeTextActive: {
    color: "#fff",
  },
  taskList: {
    marginTop: Spacing.xs,
  },
  taskGap: {
    height: Spacing.sm,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  taskCheckbox: {
    paddingTop: 2,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  taskBody: {
    flex: 1,
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
    lineHeight: 21,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: Colors.textMuted,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  taskMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  categoryChip: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  categoryText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.primary,
  },
  dueText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  taskFooter: {
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
  unassignedText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusPillActive: {
    backgroundColor: "#FEF3C7",
  },
  statusPillTodo: {
    backgroundColor: Colors.borderLight,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
  },
  statusTextActive: {
    color: Colors.warning,
  },
  statusTextTodo: {
    color: Colors.textSecondary,
  },
  inlineEmpty: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  inlineEmptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: FontSize.sm,
  },
  activityRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  activityTimeline: {
    alignItems: "center",
    width: 32,
  },
  activityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activityLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
    minHeight: 20,
  },
  activityContent: {
    flex: 1,
    paddingTop: 6,
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
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
    ...Shadow.md,
  },
  shareSheet: {
    maxHeight: "72%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
  },
  sheetHeader: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  sheetIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHeaderText: {
    flex: 1,
    gap: 4,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  sheetSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sheetInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  sheetPrimaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  sheetPrimaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#fff",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  shareList: {
    maxHeight: 320,
  },
  shareItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  shareItemBody: {
    flex: 1,
    gap: 2,
  },
  shareItemTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  shareItemMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
