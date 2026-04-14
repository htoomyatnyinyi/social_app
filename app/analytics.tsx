import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { useGetUserAnalyticsQuery } from "../store/profileApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Helpers ──────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

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
  const barWidth = (SCREEN_WIDTH - 80) / data.length;

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
      {/* X-axis labels — show every 5th day */}
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

// ─── Stat Card Component ──────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  subtitle,
  gradient,
  isDark,
  delay = 0,
}: {
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
  gradient: [string, string];
  isDark: boolean;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      className="flex-1 mx-1.5"
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-[28px] p-5 min-h-[140px] justify-between"
      >
        <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center mb-3">
          <Ionicons name={icon as any} size={20} color="white" />
        </View>
        <View>
          <Text className="text-white/70 font-black text-[9px] uppercase tracking-[2px] mb-1">
            {label}
          </Text>
          <Text className="text-white font-black text-[28px] tracking-tighter leading-8">
            {value}
          </Text>
          {subtitle && (
            <Text className="text-white/50 font-bold text-[10px] uppercase tracking-wider mt-1">
              {subtitle}
            </Text>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────
export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, accentColor } = useTheme();

  const {
    data: analytics,
    isLoading,
    refetch,
    isFetching,
  } = useGetUserAnalyticsQuery({});

  const overview = analytics?.overview;
  const followerGrowth = analytics?.followerGrowth || [];
  const topPost = analytics?.topPost;

  // Recent follower gain (last 7 days)
  const recentFollowerGain = useMemo(() => {
    if (!followerGrowth.length) return 0;
    return followerGrowth.slice(-7).reduce((s: number, d: any) => s + d.count, 0);
  }, [followerGrowth]);

  if (isLoading) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text className={`mt-4 font-black text-xs uppercase tracking-widest ${isDark ? "text-slate-500" : "text-gray-400"}`}>
          Crunching your data...
        </Text>
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
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={accentColor}
          />
        }
      >
        {/* ── Overview Cards Row 1 ───────────────────────── */}
        <View className="px-3 pt-5">
          <Animated.View entering={FadeInDown.delay(50)} className="px-2 mb-4">
            <Text className={`text-[10px] font-black uppercase tracking-[3px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
              Performance
            </Text>
          </Animated.View>

          <View className="flex-row mb-3">
            <StatCard
              icon="eye"
              label="Impressions"
              value={formatNumber(overview?.totalImpressions || 0)}
              subtitle="All time views"
              gradient={["#0EA5E9", "#38BDF8"]}
              isDark={isDark}
              delay={100}
            />
            <StatCard
              icon="heart"
              label="Total Likes"
              value={formatNumber(overview?.totalLikes || 0)}
              subtitle={`+${overview?.recentLikes || 0} this week`}
              gradient={["#F43F5E", "#FB7185"]}
              isDark={isDark}
              delay={150}
            />
          </View>

          <View className="flex-row mb-3">
            <StatCard
              icon="chatbubble"
              label="Replies"
              value={formatNumber(overview?.totalReplies || 0)}
              gradient={["#8B5CF6", "#A78BFA"]}
              isDark={isDark}
              delay={200}
            />
            <StatCard
              icon="repeat"
              label="Reposts"
              value={formatNumber(overview?.totalReposts || 0)}
              gradient={["#10B981", "#34D399"]}
              isDark={isDark}
              delay={250}
            />
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
                    {overview?.engagementRate || 0}%
                  </Text>
                </View>
                <View
                  className="w-14 h-14 rounded-[20px] items-center justify-center"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <Ionicons name="pulse" size={28} color={accentColor} />
                </View>
              </View>

              {/* Mini engagement breakdown */}
              <View className={`flex-row rounded-2xl p-3 mt-2 ${isDark ? "bg-slate-700/30" : "bg-gray-50"}`}>
                <View className="flex-1 items-center">
                  <Text className={`text-lg font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                    {formatNumber(overview?.totalInteractions || 0)}
                  </Text>
                  <Text className={`text-[8px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                    Interactions
                  </Text>
                </View>
                <View className={`w-[1px] ${isDark ? "bg-slate-600" : "bg-gray-200"}`} />
                <View className="flex-1 items-center">
                  <Text className={`text-lg font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                    {formatNumber(overview?.totalPosts || 0)}
                  </Text>
                  <Text className={`text-[8px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                    Posts
                  </Text>
                </View>
                <View className={`w-[1px] ${isDark ? "bg-slate-600" : "bg-gray-200"}`} />
                <View className="flex-1 items-center">
                  <Text className={`text-lg font-black ${isDark ? "text-white" : "text-gray-900"}`}>
                    {formatNumber(overview?.totalImpressions || 0)}
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
                    {formatNumber(overview?.totalFollowers || 0)}
                    <Text className={`text-sm ${isDark ? "text-slate-500" : "text-gray-400"}`}> total</Text>
                  </Text>
                </View>
                <View
                  className={`px-3 py-1.5 rounded-xl ${recentFollowerGain > 0
                    ? isDark ? "bg-emerald-500/10" : "bg-emerald-50"
                    : isDark ? "bg-slate-700/50" : "bg-gray-50"
                    }`}
                >
                  <Text
                    className={`text-[11px] font-black ${recentFollowerGain > 0 ? "text-emerald-500" : isDark ? "text-slate-500" : "text-gray-400"}`}
                  >
                    {recentFollowerGain > 0 ? "+" : ""}{recentFollowerGain} this week
                  </Text>
                </View>
              </View>

              <MiniBarChart
                data={followerGrowth}
                isDark={isDark}
                accentColor={accentColor}
              />

              <Text className={`text-center text-[9px] font-bold uppercase tracking-widest mt-1 ${isDark ? "text-slate-600" : "text-gray-300"}`}>
                Last 30 Days
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* ── Audience ───────────────────────────────────── */}
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
                  {formatNumber(overview?.totalFollowers || 0)}
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
                  {formatNumber(overview?.totalFollowing || 0)}
                </Text>
                <Text className={`text-[9px] font-black uppercase tracking-[2px] mt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                  Following
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ── Top Performing Post ────────────────────────── */}
        {topPost && (
          <View className="px-5 mt-6">
            <Animated.View entering={FadeInDown.delay(550)} className="mb-4">
              <Text className={`text-[10px] font-black uppercase tracking-[3px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                Best Performing Post
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(600).springify()}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/post/${topPost.id}`);
                }}
                className={`rounded-[32px] border overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white border-gray-100/50 shadow-sm shadow-gray-100"}`}
              >
                <View className="p-6">
                  <Text
                    className={`text-[15px] font-bold leading-[22px] mb-4 ${isDark ? "text-slate-200" : "text-gray-700"}`}
                    numberOfLines={3}
                  >
                    {topPost.content || "No content"}
                  </Text>

                  <View className={`flex-row rounded-2xl p-3 ${isDark ? "bg-slate-700/30" : "bg-gray-50"}`}>
                    <View className="flex-1 flex-row items-center justify-center">
                      <Ionicons name="heart" size={14} color="#F43F5E" />
                      <Text className={`ml-2 font-black text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                        {formatNumber(topPost.likeCount || 0)}
                      </Text>
                    </View>
                    <View className={`w-[1px] ${isDark ? "bg-slate-600" : "bg-gray-200"}`} />
                    <View className="flex-1 flex-row items-center justify-center">
                      <Ionicons name="eye" size={14} color={accentColor} />
                      <Text className={`ml-2 font-black text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                        {formatNumber(topPost.viewCount || 0)}
                      </Text>
                    </View>
                    <View className={`w-[1px] ${isDark ? "bg-slate-600" : "bg-gray-200"}`} />
                    <View className="flex-1 flex-row items-center justify-center">
                      <Ionicons name="chatbubble" size={14} color="#8B5CF6" />
                      <Text className={`ml-2 font-black text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                        {formatNumber(topPost.replyCount || 0)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-4">
                    <Text className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                      {topPost.createdAt
                        ? new Date(topPost.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                        : ""}
                    </Text>
                    <View className="flex-row items-center">
                      <Text style={{ color: accentColor }} className="text-[10px] font-black uppercase tracking-widest mr-1">
                        View Post
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={accentColor} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
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
