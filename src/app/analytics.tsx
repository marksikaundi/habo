import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";

const PERIODS = ["This Week", "This Month", "This Year"] as const;
type Period = (typeof PERIODS)[number];

const CHART_WIDTH = 132;
const CHART_HEIGHT = 92;

const PRODUCTIVITY_TREND = [62, 68, 71, 75, 78, 82, 85];
const FOCUS_BARS = [1.2, 2.5, 1.8, 2.2, 3.0, 2.4, 2.5];
const TASKS_TREND = [18, 22, 20, 25, 28, 30, 32];

type MiniLineChartProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
};

function MiniLineChart({
  data,
  width = CHART_WIDTH,
  height = CHART_HEIGHT,
  color = Colors.primary,
}: MiniLineChartProps) {
  const { points, dots } = useMemo(() => {
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;
    const pad = 8;

    const coords = data.map((value, index) => {
      const x = pad + (index / Math.max(data.length - 1, 1)) * (width - pad * 2);
      const y = pad + (1 - (value - min) / range) * (height - pad * 2);
      return { x, y };
    });

    return {
      points: coords.map((c) => `${c.x},${c.y}`).join(" "),
      dots: coords,
    };
  }, [data, width, height]);

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {dots.map((dot, i) => (
        <Circle key={i} cx={dot.x} cy={dot.y} r={4.5} fill={color} />
      ))}
    </Svg>
  );
}

type MiniBarChartProps = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
};

function MiniBarChart({
  data,
  width = CHART_WIDTH,
  height = CHART_HEIGHT,
  color = Colors.primaryLight,
}: MiniBarChartProps) {
  const max = Math.max(...data, 1);
  const barWidth = (width - (data.length - 1) * 5) / data.length;

  return (
    <View style={[barStyles.wrap, { width, height }]}>
      {data.map((value, index) => (
        <View
          key={index}
          style={[
            barStyles.bar,
            {
              width: barWidth,
              height: Math.max(10, (value / max) * (height - 8)),
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 4,
  },
  bar: {
    borderRadius: 6,
    opacity: 0.9,
  },
});

type MetricCardProps = {
  label: string;
  value: string;
  subtext?: string;
  trend?: string;
  chart: React.ReactNode;
};

function MetricCard({ label, value, subtext, trend, chart }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue}>{value}</Text>
        {trend ? <Text style={styles.cardTrend}>{trend}</Text> : null}
        {subtext ? <Text style={styles.cardSubtext}>{subtext}</Text> : null}
      </View>
      <View style={styles.cardChart}>{chart}</View>
    </View>
  );
}

function formatFocusTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, focusMinutesToday } = useApp();
  const [period, setPeriod] = useState<Period>("This Week");
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  const completedCount = tasks.filter((t) => t.completed).length;
  const productivityScore =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const focusDisplay = formatFocusTime(focusMinutesToday || 150);
  const focusDailyAvg = formatFocusTime(
    Math.round((focusMinutesToday || 150) / 7),
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Analytics"
        showBack
        onBack={() => router.back()}
        rightIcon="calendar-outline"
        onRightPress={() => router.push("/(tabs)/calendar")}
      />

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setShowPeriodMenu(true)}
          style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.filterText}>{period}</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MetricCard
          label="Productivity Score"
          value={`${productivityScore || 85}%`}
          trend="↑ 12% from last week"
          chart={<MiniLineChart data={PRODUCTIVITY_TREND} />}
        />

        <MetricCard
          label="Focus Time"
          value={focusDisplay === "0m" ? "12h 30m" : focusDisplay}
          subtext={`Daily average: ${focusDailyAvg === "0m" ? "2h 30m" : focusDailyAvg}`}
          chart={<MiniBarChart data={FOCUS_BARS} />}
        />

        <MetricCard
          label="Tasks Completed"
          value={String(completedCount || 32)}
          trend="↑ 18% from last week"
          chart={<MiniLineChart data={TASKS_TREND} />}
        />
      </ScrollView>

      <Modal visible={showPeriodMenu} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setShowPeriodMenu(false)}>
          <View style={[styles.menuSheet, { top: insets.top + 108 }]}>
            {PERIODS.map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  setPeriod(option);
                  setShowPeriodMenu(false);
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  period === option && styles.menuItemActive,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    period === option && styles.menuItemTextActive,
                  ]}
                >
                  {option}
                </Text>
                {period === option ? (
                  <Ionicons name="checkmark" size={18} color={Colors.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
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
  filterRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    ...Shadow.sm,
  },
  filterText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "600",
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    minHeight: 156,
    ...Shadow.sm,
  },
  cardLeft: {
    flex: 1,
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
    justifyContent: "center",
  },
  cardLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  cardValue: {
    fontSize: 40,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -1,
    lineHeight: 44,
  },
  cardTrend: {
    fontSize: FontSize.md,
    color: Colors.success,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  cardSubtext: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  cardChart: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  menuSheet: {
    position: "absolute",
    left: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 180,
    overflow: "hidden",
    ...Shadow.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  menuItemActive: {
    backgroundColor: Colors.primaryMuted,
  },
  menuItemText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  menuItemTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
