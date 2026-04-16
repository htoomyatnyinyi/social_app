import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  interpolate,
  withSequence,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

const SkeletonPulse = ({ style, isDark }: { style?: any; isDark: boolean }) => {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        style,
        animatedStyle,
        {
          backgroundColor: isDark
            ? "rgba(56, 189, 248, 0.1)"
            : "rgba(14, 165, 233, 0.1)",
        },
      ]}
    />
  );
};

export const AnalyticsSkeleton = ({ isDark }: { isDark: boolean }) => {
  return (
    <View className="p-5">
      {/* Chart Skeleton */}
      <View className="mb-8 rounded-[32px] overflow-hidden p-6 border border-gray-100 dark:border-slate-800">
        <SkeletonPulse
          style={{ height: 20, width: 120, borderRadius: 10, marginBottom: 20 }}
          isDark={isDark}
        />
        <View
          style={{
            height: 120,
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <SkeletonPulse
              key={i}
              style={{
                height: [40, 80, 60, 100, 70, 90, 50][i - 1],
                width: (width - 100) / 7 - 4,
                borderRadius: 4,
              }}
              isDark={isDark}
            />
          ))}
        </View>
      </View>

      {/* Grid Skeleton */}
      <View className="flex-row flex-wrap -m-1.5">
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            className="flex-1 min-w-[45%] m-1.5 h-[120px] rounded-[28px] overflow-hidden border border-gray-100 dark:border-slate-800 p-4"
          >
            <View className="flex-row justify-between mb-2">
              <SkeletonPulse
                style={{ width: 40, height: 40, borderRadius: 16 }}
                isDark={isDark}
              />
              <SkeletonPulse
                style={{ width: 50, height: 20, borderRadius: 10 }}
                isDark={isDark}
              />
            </View>
            <SkeletonPulse
              style={{
                width: 80,
                height: 12,
                borderRadius: 6,
                marginBottom: 8,
              }}
              isDark={isDark}
            />
            <SkeletonPulse
              style={{ width: 100, height: 24, borderRadius: 8 }}
              isDark={isDark}
            />
          </View>
        ))}
      </View>
    </View>
  );
};
