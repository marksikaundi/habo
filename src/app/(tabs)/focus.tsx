import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Spacing } from "@/constants/theme";

const DEFAULT_SECONDS = 25 * 60;
const RING_SIZE = 260;
const STROKE = 8;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const { focusStreak, tasks } = useApp();
  const [seconds, setSeconds] = useState(DEFAULT_SECONDS);
  const [running, setRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const linkedTask = tasks.find((t) => !t.completed);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          setIsBreak((b) => !b);
          return isBreak ? DEFAULT_SECONDS : 5 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, isBreak]);

  const elapsed = isBreak
    ? 1 - seconds / (5 * 60)
    : 1 - seconds / DEFAULT_SECONDS;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  const strokeDashoffset = CIRCUMFERENCE * (1 - elapsed);

  return (
    <View style={[styles.container, running && styles.dimmed]}>
      <ScreenHeader
        title="Focus Mode"
        rightIcon="settings-outline"
        transparent
      />

      <View style={styles.content}>
        {linkedTask ? (
          <View style={styles.linkedTask}>
            <Ionicons name="link" size={14} color={Colors.primary} />
            <Text style={styles.linkedTaskText} numberOfLines={1}>
              {linkedTask.title}
            </Text>
          </View>
        ) : null}

        <Text style={styles.modeLabel}>{isBreak ? "Break Time" : "Focus Session"}</Text>

        <View style={styles.timerContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={Colors.borderLight}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={isBreak ? Colors.success : Colors.primary}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          <Text style={styles.timer}>{timeStr}</Text>
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={() => setSeconds(isBreak ? 5 * 60 : DEFAULT_SECONDS)}
            style={styles.controlBtn}
          >
            <Ionicons name="play-skip-back" size={28} color={Colors.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => setRunning(!running)}
            style={[styles.playBtn, running && styles.playBtnActive]}
          >
            <Ionicons
              name={running ? "pause" : "play"}
              size={36}
              color="#fff"
            />
          </Pressable>

          <Pressable
            onPress={() => {
              setRunning(false);
              setIsBreak(!isBreak);
              setSeconds(isBreak ? DEFAULT_SECONDS : 5 * 60);
            }}
            style={styles.controlBtn}
          >
            <Ionicons name="play-skip-forward" size={28} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.streak}>
          <Text style={styles.streakText}>
            Focus Streak 🔥 {focusStreak} days
          </Text>
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
  dimmed: {
    backgroundColor: "#F0EDF8",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  linkedTask: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginBottom: Spacing.xl,
    maxWidth: "80%",
  },
  linkedTaskText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "500",
  },
  modeLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  timerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xxxl,
  },
  timer: {
    position: "absolute",
    fontSize: 48,
    fontWeight: "300",
    color: Colors.text,
    letterSpacing: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xxxl,
  },
  controlBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  playBtnActive: {
    backgroundColor: Colors.primaryDark,
  },
  streak: {
    marginTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 20,
  },
  streakText: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.streak,
  },
});
