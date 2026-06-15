import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FocusTimerRing } from "@/components/FocusTimerRing";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";

const RING_REFERENCE_SECONDS = 25 * 60;
const POMODOROS_PER_SET = 4;

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const { focusStreak, tasks, saveFocusSession } = useApp();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [savedSessions, setSavedSessions] = useState(0);
  const elapsedRef = useRef(0);

  const activeTask = tasks.find((t) => !t.completed);

  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  const resetTimer = useCallback(() => {
    setRunning(false);
    setElapsedSeconds(0);
  }, []);

  const handleSaveAndReset = useCallback(async () => {
    const seconds = elapsedRef.current;
    if (seconds >= 30) {
      await saveFocusSession(seconds);
      setSavedSessions((n) => Math.min(n + 1, POMODOROS_PER_SET));
    }
    resetTimer();
  }, [resetTimer, saveFocusSession]);

  const handleSkipBack = () => {
    if (elapsedSeconds > 0) {
      Alert.alert("Reset timer?", "This will discard the current session without saving.", [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: resetTimer },
      ]);
      return;
    }
    resetTimer();
  };

  const handleSkipForward = () => {
    if (elapsedSeconds < 30) {
      Alert.alert("Session too short", "Focus for at least 30 seconds before saving.");
      return;
    }
    void handleSaveAndReset();
  };

  const ringProgress =
    elapsedSeconds === 0 ? 0 : (elapsedSeconds % RING_REFERENCE_SECONDS) / RING_REFERENCE_SECONDS;

  const statusText = running
    ? "Time to focus!"
    : elapsedSeconds > 0
      ? "Paused"
      : "Ready to focus";

  const currentPomodoro = Math.min(
    savedSessions + (elapsedSeconds > 0 ? 1 : 0),
    POMODOROS_PER_SET,
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Focus Mode"
        rightIcon="settings-outline"
        onRightPress={() => router.push("/analytics")}
      />

      <View style={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        {activeTask ? (
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle} numberOfLines={1}>
              {activeTask.title}
            </Text>
            <Text style={styles.taskCategory}>{activeTask.category}</Text>
          </View>
        ) : (
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle}>Free Focus</Text>
            <Text style={styles.taskCategory}>No task linked</Text>
          </View>
        )}

        <FocusTimerRing progress={ringProgress}>
          <Text style={styles.timer}>{formatElapsed(elapsedSeconds)}</Text>
          <Text style={styles.status}>{statusText}</Text>
        </FocusTimerRing>

        <Text style={styles.pomodoroCount}>
          {currentPomodoro}/{POMODOROS_PER_SET} Pomodoros
        </Text>

        <View style={styles.controls}>
          <Pressable onPress={handleSkipBack} style={styles.controlBtn} hitSlop={8}>
            <Ionicons name="play-skip-back" size={28} color={Colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => setRunning((r) => !r)}
            style={({ pressed }) => [
              styles.playBtn,
              running && styles.playBtnActive,
              pressed && { opacity: 0.92 },
            ]}
          >
            <Ionicons name={running ? "pause" : "play"} size={32} color="#fff" />
          </Pressable>

          <Pressable onPress={handleSkipForward} style={styles.controlBtn} hitSlop={8}>
            <Ionicons name="play-skip-forward" size={28} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.streak}>
          <Text style={styles.streakText}>Focus Streak 🔥 {focusStreak} days</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  taskInfo: {
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.sm,
  },
  taskTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  taskCategory: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  timer: {
    fontSize: 52,
    fontWeight: "300",
    color: Colors.text,
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },
  status: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  pomodoroCount: {
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xxxl,
    marginTop: Spacing.md,
  },
  controlBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.md,
  },
  playBtnActive: {
    backgroundColor: Colors.primaryDark,
  },
  streak: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.full,
  },
  streakText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
});
