import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { Colors, FontSize, Radius, Shadow, Spacing } from "@/constants/theme";

const PERIODS = ["This Week", "This Month", "This Year"] as const;
type Period = (typeof PERIODS)[number];

const PRODUCTIVITY_TREND = [62, 68, 71, 75, 78, 82, 85];
const FOCUS_BARS = [1.2, 2.5, 1.8, 2.2, 3.0, 2.4, 2.5];
const TASKS_TREND = [18, 22, 20, 25, 28, 30, 32];
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type TrendChartProps = {
  data: number[];
  width: number;
  height?: number;
  color?: string;
};

function TrendChart({
  data,
  width,
  height = 120,
  color = Colors.primary,
}: TrendChartProps) {
  const { linePath, areaPath, dots } = useMemo(() => {
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;
    const padX = 8;
    const padY = 12;

    const coords = data.map((value, index) => {
      const x = padX + (index / Math.max(data.length - 1, 1)) * (width - padX * 2);
      const y = padY + (1 - (value - min) / range) * (height - padY * 2);
      return { x, y };
    });

    const line = coords
      .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
      .join(" ");

    const first = coords[0];
    const last = coords[coords.length - 1];
    const area =
      first && last
        ? `${line} L ${last.x} ${height} L ${first.x} ${height} Z`
        : "";

    return { linePath: line, areaPath: area, dots: coords };
  }, [data, width, height]);

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.22" />
          <Stop offset="1" stopColor={color} stopOpacity="0.02" />
        </SvgGradient>
      </Defs>
      {areaPath ? <Path d={areaPath} fill="url(#trendFill)" /> : null}
      <Path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {dots.map((dot, i) => (
        <Circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r={i === dots.length - 1 ? 5 : 3.5}
          fill={i === dots.length - 1 ? color : Colors.surface}
          stroke={color}
          strokeWidth={i === dots.length - 1 ? 0 : 2}
        />
      ))}
    </Svg>
  );
}

type BarChartProps = {
  data: number[];
  labels?: string[];
  width: number;
  height?: number;
  color?: string;
};

function BarChart({
  data,
  labels = DAY_LABELS,
  width,
  height = 120,
  color = Colors.primary,
}: BarChartProps) {
  const max = Math.max(...data, 1);
  const gap = 8;
  const labelSpace = 18;
  const chartHeight = height - labelSpace;
  const barWidth = (width - gap * (data.length - 1)) / data.length;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={chartHeight}>
        {data.map((value, index) => {
          const barHeight = Math.max(8, (value / max) * (chartHeight - 4));
          const x = index * (barWidth + gap);
          const y = chartHeight - barHeight;
          const isLatest = index === data.length - 1;

          return (
            <Rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={6}
              ry={6}
              fill={color}
              opacity={isLatest ? 1 : 0.35}
            />
          );
        })}
      </Svg>
      <View style={styles.barLabels}>
        {labels.slice(0, data.length).map((label, index) => (
          <Text
            key={`${label}-${index}`}
            style={[
              styles.barLabel,
              { width: barWidth },
              index === data.length - 1 && styles.barLabelActive,
            ]}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

type MetricCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  meta?: string;
  trendPositive?: boolean;
  chart: React.ReactNode;
};

function MetricCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  meta,
  trendPositive,
  chart,
}: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.metricHeaderText}>
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={styles.metricValue}>{value}</Text>
        </View>
        {meta ? (
          <View
            style={[
              styles.trendPill,
              trendPositive === false && styles.trendPillNegative,
            ]}
          >
            <Text
              style={[
                styles.trendPillText,
                trendPositive === false && styles.trendPillTextNegative,
              ]}
            >
              {meta}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.metricChart}>{chart}</View>
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
  const { width: windowWidth } = useWindowDimensions();
  const { tasks, focusMinutesToday } = useApp();
  const [period, setPeriod] = useState<Period>("This Week");

  const chartWidth = Math.max(200, windowWidth - Spacing.lg * 2 - Spacing.xl * 2);

  const completedCount = tasks.filter((t) => t.completed).length;
  const productivityScore =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 85;
  const displayScore = productivityScore || 85;
  const displayCompleted = completedCount || 32;

  const focusMinutes = focusMinutesToday || 150;
  const focusDisplay = formatFocusTime(focusMinutes);
  const focusDailyAvg = formatFocusTime(Math.round(focusMinutes / 7));

  const pendingCount = Math.max(tasks.length - completedCount, 0);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Analytics"
        showBack
        onBack={() => router.back()}
        rightIcon="calendar-outline"
        onRightPress={() => router.push("/(tabs)/calendar")}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.periodRow}>
          {PERIODS.map((option) => {
            const active = period === option;
            return (
              <Pressable
                key={option}
                onPress={() => setPeriod(option)}
                style={({ pressed }) => [
                  styles.periodChip,
                  active && styles.periodChipActive,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text
                  style={[styles.periodChipText, active && styles.periodChipTextActive]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <LinearGradient
          colors={["#6C3CE0", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroEyebrow}>Productivity score</Text>
              <Text style={styles.heroValue}>{displayScore}%</Text>
            </View>
            <View style={styles.heroTrend}>
              <Ionicons name="trending-up" size={16} color="#fff" />
              <Text style={styles.heroTrendText}>+12%</Text>
            </View>
          </View>
          <Text style={styles.heroSubtext}>
            Strong finish this period — keep the momentum going.
          </Text>
          <View style={styles.heroChart}>
            <TrendChart
              data={PRODUCTIVITY_TREND}
              width={chartWidth}
              height={88}
              color="#FFFFFF"
            />
          </View>
        </LinearGradient>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: "#EEF2FF" }]}>
              <Ionicons name="timer-outline" size={18} color={Colors.info} />
            </View>
            <Text style={styles.summaryValue}>
              {focusDisplay === "0m" ? "12h 30m" : focusDisplay}
            </Text>
            <Text style={styles.summaryLabel}>Focus time</Text>
            <Text style={styles.summaryMeta}>
              Avg {focusDailyAvg === "0m" ? "2h 30m" : focusDailyAvg}/day
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: "#ECFDF5" }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.success} />
            </View>
            <Text style={styles.summaryValue}>{displayCompleted}</Text>
            <Text style={styles.summaryLabel}>Tasks done</Text>
            <Text style={styles.summaryMeta}>
              {pendingCount > 0 ? `${pendingCount} remaining` : "All caught up"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Trends</Text>

        <MetricCard
          icon="flash-outline"
          iconColor={Colors.primary}
          iconBg={Colors.primaryMuted}
          label="Focus sessions"
          value={focusDisplay === "0m" ? "12h 30m" : focusDisplay}
          meta="↑ 8%"
          trendPositive
          chart={
            <BarChart
              data={FOCUS_BARS}
              width={chartWidth}
              height={128}
              color={Colors.primary}
            />
          }
        />

        <MetricCard
          icon="checkbox-outline"
          iconColor={Colors.success}
          iconBg="#ECFDF5"
          label="Tasks completed"
          value={String(displayCompleted)}
          meta="↑ 18%"
          trendPositive
          chart={
            <TrendChart
              data={TASKS_TREND}
              width={chartWidth}
              height={120}
              color={Colors.success}
            />
          }
        />

        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
          </View>
          <View style={styles.insightBody}>
            <Text style={styles.insightTitle}>Insight</Text>
            <Text style={styles.insightText}>
              Your best focus days land mid-week. Schedule deep work on Wed–Fri for
              the biggest gains.
            </Text>
          </View>
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
  scroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  periodRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 4,
  },
  periodChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
  },
  periodChipActive: {
    backgroundColor: Colors.primary,
    ...Shadow.sm,
  },
  periodChipText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  periodChipTextActive: {
    color: "#fff",
  },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.md,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heroEyebrow: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 44,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  heroTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  heroTrendText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: "#fff",
  },
  heroSubtext: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 20,
  },
  heroChart: {
    marginTop: Spacing.xs,
    marginHorizontal: -4,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    gap: 4,
    ...Shadow.sm,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  summaryMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  metricCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Shadow.sm,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  metricHeaderText: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  trendPill: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  trendPillNegative: {
    backgroundColor: "#FEF2F2",
  },
  trendPillText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.success,
  },
  trendPillTextNegative: {
    color: Colors.danger,
  },
  metricChart: {
    alignItems: "center",
  },
  barLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 8,
  },
  barLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: "center",
    fontWeight: "500",
  },
  barLabelActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  insightBody: {
    flex: 1,
    gap: 4,
  },
  insightTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
  },
  insightText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
