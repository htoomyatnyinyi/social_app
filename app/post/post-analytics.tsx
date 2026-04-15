import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useAnalyticsLogic } from "../../hooks/useAnalyticsLogic";
import { StatCard } from "../../components/analytics/StatCard";
import { AnalyticsSkeleton } from "../../components/analytics/AnalyticsSkeleton";
import { formatMetric } from "../../utils/analyticsUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function getMaxBarValue(data: { count: number }[]): number {
  return Math.max(...data.map((d) => d.count), 1);
}

function MiniBarChart({
  data,
  isDark,
  accentColor,
}: {
  data: { date: string; count: number }[];
  isDark: boolean;
  accentColor: string;
}) {
  const maxVal = getMaxBarValue(data);
  const chartHeight = 120;
  const barWidth = (SCREEN_WIDTH - 80) / Math.max(data.length, 1);

  return (
    <View className="mt-4 mb-2">
      <View style={{ height: chartHeight, flexDirection: "row", alignItems: "flex-end" }}>
        {data.map((d, i) => {
          const barH = maxVal > 0 ? (d.count / maxVal) * chartHeight : 0;
          const isToday = i === data.length - 1;
          return (
            <View
              key={d.date}
              style={{
                width: barWidth - 1,
                marginHorizontal: 0.5,
                alignItems: "center",
                justifyContent: "flex-end",
                height: chartHeight,
              }}
            >
              <Animated.View
                entering={FadeInUp.delay(i * 15).springify()}
                style={{
                  width: Math.max(barWidth - 3, 2),
                  height: Math.max(barH, 2),
                  borderRadius: 4,
                  backgroundColor: isToday
                    ? accentColor
                    : d.count > 0
                      ? isDark
                        ? "rgba(56,189,248,0.4)"
                        : "rgba(14,165,233,0.3)"
                      : isDark
                        ? "rgba(51,65,85,0.4)"
                        : "rgba(226,232,240,0.6)",
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", marginTop: 6 }}>
        {data.map((d, i) => (
          <View key={d.date} style={{ width: barWidth, alignItems: "center" }}>
            {i % 4 === 0 && (
              <Text
                className={`text-[8px] font-bold uppercase ${isDark ? "text-slate-500" : "text-gray-400"}`}
              >
                {d.date.slice(5)}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function PostAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, accentColor } = useTheme();

  const {
    overview,
    charts,
    isLoading,
    refetch,
  } = useAnalyticsLogic(id);

  const stats = [
    { label: "Reach", value: overview.formattedImpressions, icon: "eye" as const, color: "#0EA5E9" },
    { label: "Likes", value: formatMetric(overview.likes, 'number'), icon: "heart" as const, color: "#F43F5E" },
    { label: "Replies", value: formatMetric(overview.replies, 'number'), icon: "chatbubble" as const, color: "#8B5CF6" },
    { label: "Reposts", value: formatMetric(overview.reposts, 'number'), icon: "repeat" as const, color: "#10B981" },
  ];

  if (isLoading) {
    return (
      <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        <BlurView
          intensity={90}
          tint={isDark ? "dark" : "light"}
          className="z-50 border-b border-gray-100/50 dark:border-slate-800/50"
          style={{ paddingTop: insets.top + 6 }}
        >
          <View className="flex-row items-center px-5 pb-4">
             <Text className={`text-xl font-black tracking-tighter ${isDark ? "text-white" : "text-gray-900"}`}>
               Post Analytics
             </Text>
          </View>
        </BlurView>
        <AnalyticsSkeleton isDark={isDark} />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      <BlurView
        intensity={90}
        tint={isDark ? "dark" : "light"}
        className="z-50 border-b border-gray-100/50 dark:border-slate-800/50"
        style={{ paddingTop: insets.top + 6 }}
      >
        <View className="flex-row items-center px-5 pb-4">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className={`w-10 h-10 rounded-2xl items-center justify-center border shadow-sm mr-4 ${isDark ? "bg-slate-800 border-slate-700 shadow-black" : "bg-white border-gray-50 shadow-gray-100"}`}
          >
            <Ionicons name="chevron-back" size={20} color={isDark ? "#94A3B8" : "#64748B"} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className={`text-xl font-black tracking-tighter ${isDark ? "text-white" : "text-gray-900"}`}>
              Post Metrics
            </Text>
            <Text className={`text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
              Individual Post Performance
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              refetch();
            }}
            className={`w-10 h-10 rounded-2xl items-center justify-center border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
          >
            <Ionicons name="refresh" size={18} color={accentColor} />
          </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={accentColor}
          />
        }
      >
        <View className="px-3 pt-5">
          <Animated.View entering={FadeInDown.delay(50)} className="px-2 mb-4">
            <Text className={`text-[10px] font-black uppercase tracking-[3px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
              Key Performance Indicators
            </Text>
          </Animated.View>

          <View className="flex-row flex-wrap">
            {stats.map((stat, i) => (
              <StatCard
                key={stat.label}
                {...stat}
                index={i}
                isDark={isDark}
              />
            ))}
          </View>
        </View>

        <View className="px-5 mt-4">
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white border-gray-100/50 shadow-sm shadow-gray-100"}`}
          >
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className={`text-[10px] font-black uppercase tracking-[2px] mb-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                    Post Engagement Rate
                  </Text>
                  <Text className={`text-4xl font-black tracking-tighter ${isDark ? "text-white" : "text-gray-900"}`}>
                    {overview.formattedEngagement}
                  </Text>
                </View>
                <View
                  className="w-14 h-14 rounded-[20px] items-center justify-center"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <Ionicons name="analytics-outline" size={28} color={accentColor} />
                </View>
              </View>

              <View className={`flex-row rounded-2xl p-3 mt-2 ${isDark ? "bg-slate-700/30" : "bg-gray-50"}`}>
                <View className="flex-1 items-center">
                  <Text className={`text-lg font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                    {formatMetric(overview.interactions, 'number')}
                  </Text>
                  <Text className={`text-[8px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                    Interactions
                  </Text>
                </View>
                <View className={`w-[1px] ${isDark ? "bg-slate-600" : "bg-gray-200"}`} />
                <View className="flex-1 items-center">
                  <Text className={`text-lg font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                    {formatMetric(overview.reposts, 'number')}
                  </Text>
                  <Text className={`text-[8px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                    Reposts
                  </Text>
                </View>
                <View className={`w-[1px] ${isDark ? "bg-slate-600" : "bg-gray-200"}`} />
                <View className="flex-1 items-center">
                  <Text className={`text-lg font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                    {overview.formattedImpressions}
                  </Text>
                  <Text className={`text-[8px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                    Views
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>

        {charts.likeTrend && (
          <View className="px-5 mt-6">
            <Animated.View
              entering={FadeInDown.delay(400).springify()}
              className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white border-gray-100/50 shadow-sm shadow-gray-100"}`}
            >
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className={`text-[10px] font-black uppercase tracking-[2px] mb-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                      Likes Over Time
                    </Text>
                    <Text className={`text-2xl font-black tracking-tighter ${isDark ? "text-white" : "text-gray-900"}`}>
                      {formatMetric(overview.likes, 'number')}
                      <Text className={`text-sm ${isDark ? "text-slate-500" : "text-gray-400"}`}> total</Text>
                    </Text>
                  </View>
                </View>

                <MiniBarChart
                  data={charts.likeTrend}
                  isDark={isDark}
                  accentColor={accentColor}
                />

                <Text className={`text-center text-[9px] font-bold uppercase tracking-widest mt-1 ${isDark ? "text-slate-600" : "text-gray-300"}`}>
                  Last 14 Days
                </Text>
              </View>
            </Animated.View>
          </View>
        )}

        <View className="items-center mt-10 mb-6 opacity-20">
          <Text className={`text-[9px] font-black uppercase tracking-[4px] ${isDark ? "text-white" : "text-gray-900"}`}>
            Post Analytics
          </Text>
          <Text className={`text-[8px] font-bold mt-1 uppercase tracking-widest ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            Secure and Private View
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
