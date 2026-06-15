import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ONBOARDING_SLIDES } from "@/constants/mock-data";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

const { width } = Dimensions.get("window");

const SLIDE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  checkbox: "checkbox-outline",
  timer: "timer-outline",
  analytics: "bar-chart-outline",
};

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xxl }]}>
      <View style={styles.illustration}>
        <View style={styles.illustrationInner}>
          <Ionicons name="clipboard-outline" size={48} color={Colors.primary} />
          <Ionicons
            name="calendar-outline"
            size={36}
            color={Colors.primaryLight}
            style={styles.calendarIcon}
          />
        </View>
      </View>

      <Text style={styles.heading}>Welcome to Habora</Text>
      <Text style={styles.subheading}>Your all-in-one productivity partner</Text>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.title}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        style={styles.carousel}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: width - Spacing.xxl * 2 }]}>
            <View style={styles.slideIcon}>
              <Ionicons
                name={SLIDE_ICONS[item.icon] ?? "star-outline"}
                size={28}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {ONBOARDING_SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Button title="Get Started" onPress={() => router.push("/(auth)/signup")} />
        <Pressable onPress={() => router.push("/(auth)/login")} style={styles.loginLink}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginBold}>Login</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xxl,
  },
  illustration: {
    alignItems: "center",
    marginBottom: Spacing.xxxl,
  },
  illustrationInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarIcon: {
    position: "absolute",
    bottom: 20,
    right: 10,
  },
  heading: {
    fontSize: FontSize.xxl,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  subheading: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  carousel: {
    flexGrow: 0,
  },
  slide: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  slideIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  slideTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  slideSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  actions: {
    marginTop: "auto",
    gap: Spacing.lg,
  },
  loginLink: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  loginText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  loginBold: {
    color: Colors.primary,
    fontWeight: "600",
  },
});
