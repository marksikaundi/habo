import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/TaskItem";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

const WEEKLY_DATA = [65, 78, 82, 70, 85, 90, 85];
const FOCUS_DATA = [1.5, 2, 1, 2.5, 3, 2, 1.5];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function MiniBarChart({ data, maxValue, color }: { data: number[]; maxValue: number; color: string }) {
  return (
    <View style={chartStyles.container}>
      {data.map((val, i) => (
        <View key={i} style={chartStyles.barGroup}>
          <View
            style={[
              chartStyles.bar,
              {
                height: (val / maxValue) * 60,
                backgroundColor: color,
              },
            ]}
          />
          <Text style={chartStyles.label}>{DAYS[i]}</Text>
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 80,
    marginTop: Spacing.md,
  },
  barGroup: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    minHeight: 4,
  },
  label: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 4,
  },
});

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Analytics"
        showBack
        onBack={() => router.back()}
        rightElement={
          <Pressable style={styles.filterBtn}>
            <Text style={styles.filterText}>This Week</Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40, gap: Spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Text style={styles.cardLabel}>Productivity Score</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>85%</Text>
            <Text style={styles.scoreTrend}>↑ 12% vs last week</Text>
          </View>
          <MiniBarChart data={WEEKLY_DATA} maxValue={100} color={Colors.primary} />
        </Card>

        <Card>
          <Text style={styles.cardLabel}>Focus Time</Text>
          <Text style={styles.metricValue}>12h 30m</Text>
          <MiniBarChart data={FOCUS_DATA} maxValue={3} color={Colors.success} />
        </Card>

        <Card>
          <Text style={styles.cardLabel}>Tasks Completed</Text>
          <Text style={styles.metricValue}>32</Text>
          <MiniBarChart data={[4, 6, 3, 5, 7, 4, 3]} maxValue={8} color={Colors.info} />
        </Card>

        <Card>
          <Text style={styles.cardLabel}>Most Productive Time</Text>
          <Text style={styles.metricValue}>9 AM – 11 AM</Text>
          <View style={styles.heatmap}>
            {Array.from({ length: 28 }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.heatCell,
                  {
                    backgroundColor:
                      i % 5 === 0
                        ? Colors.primary
                        : i % 3 === 0
                          ? Colors.primaryLight
                          : i % 2 === 0
                            ? Colors.primaryMuted
                            : Colors.borderLight,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.heatmapLabel}>Streak calendar (last 4 weeks)</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterBtn: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  filterText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "600",
  },
  cardLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.primary,
  },
  scoreTrend: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: "500",
  },
  metricValue: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  heatmap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: Spacing.lg,
  },
  heatCell: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  heatmapLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
});
