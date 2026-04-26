import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { useAnalyticsLogic } from "../hooks/useAnalyticsLogic";
import { StatCard } from "../components/analytics/StatCard";
import { AnalyticsSkeleton } from "../components/analytics/AnalyticsSkeleton";
import { formatMetric } from "../utils/analyticsUtils";
import { useCallMcpToolMutation } from "../store/mcpApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Helpers ──────────────────────────────────────────────
function getMaxBarValue(data: { count: number }[]): number {
  return Math.max(...data.map((d) => d.count), 1);
}

// ─── Mini Bar Chart Component ─────────────────────────────
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
      {/* X-axis labels — show every 7th day */}
      <View style={{ flexDirection: "row", marginTop: 6 }}>
        {data.map((d, i) => (
          <View key={d.date} style={{ width: barWidth, alignItems: "center" }}>
            {i % 7 === 0 && (
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

// ─── Main Screen ──────────────────────────────────────────
export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, accentColor } = useTheme();

  const {
    overview,
    charts,
    isLoading,
    refetch,
  } = useAnalyticsLogic();

  const [callMcpTool, { data: mcpData }] = useCallMcpToolMutation();
  const globalStats = useMemo(() => {
    if (!mcpData?.content?.[0]?.text) return null;
    try {
      return JSON.parse(mcpData.content[0].text);
    } catch {
      return null;
    }
  }, [mcpData]);

  React.useEffect(() => {
    callMcpTool({ tool: "get_system_stats" });
  }, [callMcpTool]);

  const stats = [
    { label: "Impressions", value: overview.formattedImpressions, icon: "eye" as const, color: "#0EA5E9" },
    { label: "Total Likes", value: formatMetric(overview.likes, 'number'), icon: "heart" as const, color: "#F43F5E" },
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
               Analytics
             </Text>
          </View>
        </BlurView>
        <AnalyticsSkeleton isDark={isDark} />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {/* Header */}
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
              Analytics
            </Text>
            <Text className={`text-[10px] font-black uppercase tracking-[2px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
              Account Overview
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
        {/* ── Stat Grid ────────────────────────────────── */}
        <View className="px-3 pt-5">
          <Animated.View entering={FadeInDown.delay(50)} className="px-2 mb-4">
            <Text className={`text-[10px] font-black uppercase tracking-[3px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
              Account Performance
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

        {/* ── Engagement Rate ────────────────────────────── */}
        <View className="px-5 mt-4">
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white border-gray-100/50 shadow-sm shadow-gray-100"}`}
          >
            <View className="p-6">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className={`text-[10px] font-black uppercase tracking-[2px] mb-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                    Engagement Rate
                  </Text>
                  <Text className={`text-4xl font-black tracking-tighter ${isDark ? "text-white" : "text-gray-900"}`}>
                    {overview.formattedEngagement}
                  </Text>
                </View>
                <View
                  className="w-14 h-14 rounded-[20px] items-center justify-center"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <Ionicons name="pulse" size={28} color={accentColor} />
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
                    {formatMetric(overview.totalPosts || 0, 'number')}
                  </Text>
                  <Text className={`text-[8px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                    Posts
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

        {/* ── Follower Growth Chart ──────────────────────── */}
        {charts.followerGrowth && (
          <View className="px-5 mt-6">
            <Animated.View
              entering={FadeInDown.delay(400).springify()}
              className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white border-gray-100/50 shadow-sm shadow-gray-100"}`}
            >
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-2">
                  <View>
                    <Text className={`text-[10px] font-black uppercase tracking-[2px] mb-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                      Follower Growth
                    </Text>
                    <Text className={`text-2xl font-black tracking-tighter ${isDark ? "text-white" : "text-gray-900"}`}>
                      {formatMetric(overview.totalFollowers || 0, 'number')}
                      <Text className={`text-sm ${isDark ? "text-slate-500" : "text-gray-400"}`}> total</Text>
                    </Text>
                  </View>
                </View>

                <MiniBarChart
                  data={charts.followerGrowth}
                  isDark={isDark}
                  accentColor={accentColor}
                />

                <Text className={`text-center text-[9px] font-bold uppercase tracking-widest mt-1 ${isDark ? "text-slate-600" : "text-gray-300"}`}>
                  Last 30 Days
                </Text>
              </View>
            </Animated.View>
          </View>
        )}

        {/* ── Audience Summary ─────────────────────────── */}
        <View className="px-5 mt-6">
          <Animated.View entering={FadeInDown.delay(450)} className="mb-4">
            <Text className={`text-[10px] font-black uppercase tracking-[3px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
              Audience
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(500).springify()}
            className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white border-gray-100/50 shadow-sm shadow-gray-100"}`}
          >
            <View className="flex-row">
              <View className={`flex-1 p-5 items-center border-r ${isDark ? "border-slate-700/50" : "border-gray-100/50"}`}>
                <View className="w-12 h-12 rounded-[18px] items-center justify-center mb-3"
                  style={{ backgroundColor: `${accentColor}15` }}>
                  <Ionicons name="people" size={24} color={accentColor} />
                </View>
                <Text className={`text-2xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                  {formatMetric(overview.totalFollowers || 0, 'number')}
                </Text>
                <Text className={`text-[9px] font-black uppercase tracking-[2px] mt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                  Followers
                </Text>
              </View>
              <View className="flex-1 p-5 items-center">
                <View className="w-12 h-12 rounded-[18px] items-center justify-center mb-3 bg-violet-500/10">
                  <Ionicons name="person-add" size={24} color="#8B5CF6" />
                </View>
                <Text className={`text-2xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                  {formatMetric(overview.totalFollowing || 0, 'number')}
                </Text>
                <Text className={`text-[9px] font-black uppercase tracking-[2px] mt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                  Following
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ── Global System Metrics (MCP) ────────────────── */}
        {globalStats && (
          <View className="px-5 mt-8">
            <Animated.View
              entering={FadeInDown.delay(600).springify()}
              className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/80 border-slate-700" : "bg-white border-gray-100 shadow-xl shadow-gray-100"}`}
            >
              <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <View>
                    <Text className={`text-[10px] font-black uppercase tracking-[3px] mb-1 ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>
                      Live Platform Data
                    </Text>
                    <Text className={`text-xl font-black tracking-tighter ${isDark ? "text-white" : "text-gray-900"}`}>
                      Global System Metrics
                    </Text>
                  </View>
                  <View className="w-12 h-12 rounded-2xl bg-cyan-500/10 items-center justify-center">
                    <Ionicons name="globe" size={24} color="#06B6D4" />
                  </View>
                </View>

                <View className="flex-row space-x-4">
                  <View className="flex-1">
                    <Text className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                      Total Users
                    </Text>
                    <Text className={`text-xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                      {formatMetric(globalStats.totalUsers, 'number')}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                      Total Posts
                    </Text>
                    <Text className={`text-xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                      {formatMetric(globalStats.totalPosts, 'number')}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                      Platform Likes
                    </Text>
                    <Text className={`text-xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                      {formatMetric(globalStats.totalLikes, 'number')}
                    </Text>
                  </View>
                </View>

                <View className={`mt-6 pt-4 border-t ${isDark ? "border-slate-700" : "border-gray-50"}`}>
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                    <Text className={`text-[10px] font-bold ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                      MCP Server Connected & Active
                    </Text>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          </View>
        )}

        {/* Footer */}
        <View className="items-center mt-10 mb-6 opacity-20">
          <Text className={`text-[9px] font-black uppercase tracking-[4px] ${isDark ? "text-white" : "text-gray-900"}`}>
            Analytics Dashboard
          </Text>
          <Text className={`text-[8px] font-bold mt-1 uppercase tracking-widest ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            Data refreshes in real-time
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
