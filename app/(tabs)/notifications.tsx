import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreateChatRoomMutation } from "../../store/chatApi";
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "../../store/notificationApi";

const { width } = Dimensions.get('window');

const getNotificationConfig = (type: string) => {
  switch (type) {
    case "LIKE":
      return { icon: "heart", color: "#F43F5E", text: "resonated with your artifact", bg: "bg-rose-50/50" };
    case "FOLLOW":
      return { icon: "person", color: "#10B981", text: "is now bound to your frequency", bg: "bg-emerald-50/50" };
    case "REPOST":
      return { icon: "repeat", color: "#0EA5E9", text: "diffused your artifact", bg: "bg-sky-50/50" };
    case "QUOTE":
      return { icon: "code-working", color: "#8B5CF6", text: "reflected on your artifact", bg: "bg-violet-50/50" };
    case "REPLY":
      return { icon: "chatbubble", color: "#6366F1", text: "sent an echo to your artifact", bg: "bg-indigo-50/50" };
    case "MENTION":
      return { icon: "at", color: "#F59E0B", text: "called your presence", bg: "bg-amber-50/50" };
    case "MESSAGE":
      return { icon: "mail", color: "#0EA5E9", text: "sent you a direct whisper", bg: "bg-sky-50/50" };
    case "SYSTEM":
      return { icon: "sparkles", color: "#0EA5E9", text: "sent a Zen coordinate update", bg: "bg-sky-50/50" };
    default:
      return { icon: "notifications", color: "#64748B", text: "interacted with your existence", bg: "bg-gray-50/50" };
  }
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const NotificationItem = React.memo(function NotificationItem({
  item,
  index,
  onPress,
  onPressProfile,
}: {
  item: any;
  index: number;
  onPress: (item: any) => void;
  onPressProfile: (issuerId: string) => void;
}) {
  const config = getNotificationConfig(item.type);

  return (
    <Animated.View entering={FadeInDown.delay(index * 40)}>
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.8}
        className={`flex-row px-5 py-4 mb-2 mx-3 rounded-[32px] border ${item.read ? "bg-white border-gray-50/50" : `${config.bg} border-gray-100/50`} items-start shadow-sm shadow-gray-100`}
      >
        <View className="mr-4 pt-1">
          <View
            className="w-12 h-12 rounded-[20px] items-center justify-center bg-white border border-gray-100 shadow-sm"
          >
            <Ionicons name={config.icon as any} size={22} color={config.color} />
          </View>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <TouchableOpacity
              onPress={() => onPressProfile(item.issuer?.id)}
              className="flex-row items-center"
            >
              <Image
                source={{ uri: item.issuer?.image || `https://api.dicebear.com/7.x/avataaars/png?seed=${item.issuer?.id}` }}
                className="w-6 h-6 rounded-xl mr-2 bg-white border border-gray-50 shadow-sm"
              />
              <Text className="font-black text-gray-900 text-[14px] tracking-tight">{item.issuer?.name || "Member"}</Text>
            </TouchableOpacity>
            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>

          <Text className="text-[14px] text-gray-700 font-medium leading-[20px] pr-4">
            {config.text}
            {item._groupCount > 1 && (
              <Text className="text-sky-500 font-black"> & {item._groupCount - 1} others</Text>
            )}
          </Text>

          {item.post && (
            <View className="mt-4 bg-white/60 p-4 rounded-[22px] border border-gray-100 shadow-sm shadow-gray-50">
              <Text className="text-gray-500 text-[13px] leading-[18px] font-medium italic" numberOfLines={2}>
                &quot;{item.post.content}&quot;
              </Text>
            </View>
          )}
        </View>

        {!item.read && (
          <View className="w-2.5 h-2.5 rounded-full absolute top-6 right-6 shadow-sm" style={{ backgroundColor: config.color }} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"all" | "mentions" | "verified">("all");

  const {
    data: notificationsData,
    isLoading,
    refetch,
    isFetching,
  } = useGetNotificationsQuery({});

  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [markAsRead] = useMarkAsReadMutation();
  const [createChatRoom] = useCreateChatRoomMutation();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleNotificationPress = useCallback(
    async (notification: any) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (!notification.read || (notification._groupUnreadCount && notification._groupUnreadCount > 0)) {
        markAsRead(notification.id);
      }

      if (notification.type === "MESSAGE" && notification.issuerId) {
        try {
          const room = await createChatRoom(notification.issuerId).unwrap();
          router.push(`/chat/${room.id}`);
          return;
        } catch (e) {
          console.error(e);
        }
      }

      if (notification.postId) router.push(`/post/${notification.postId}`);
      else if (notification.link) Linking.openURL(notification.link);
      else if (notification.issuerId) router.push(`/profile/${notification.issuerId}`);
    },
    [markAsRead, createChatRoom, router],
  );

  const groupedNotifications = useMemo(() => {
    const notifications = notificationsData?.notifications || [];
    if (!Array.isArray(notifications)) return [];

    let filtered = notifications;
    if (activeTab === "mentions") {
      filtered = notifications.filter(n => n.type === "MENTION" || n.type === "REPLY");
    } else if (activeTab === "verified") {
      filtered = notifications.filter(n => n.issuer?.username === "ananta");
    }

    const groups: Record<string, any[]> = {};
    filtered.forEach((n) => {
      const targetId = n.postId || n.commentId || "none";
      const key = `${n.type}-${n.issuerId}-${targetId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });

    return Object.values(groups)
      .map((group) => {
        const latest = { ...group[0] };
        latest._groupCount = group.length;
        latest._groupUnreadCount = group.filter((n) => !n.read).length;
        if (latest._groupUnreadCount > 0) latest.read = false;
        return latest;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notificationsData, activeTab]);

  const tabProgress = useSharedValue(0);
  const handleTabChange = (tab: any, index: number) => {
    if (tab === activeTab) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    tabProgress.value = withSpring(index * (1 / 3), { damping: 20 });
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${interpolate(tabProgress.value, [0, 1], [0, 100])}%`,
  }));

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Premium Sticky Header */}
      <BlurView intensity={90} tint="light" className="px-5 pb-5 z-50 border-b border-gray-100/50" style={{ paddingTop: insets.top + 10 }}>
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-2xl font-black text-gray-900 tracking-[-1px] uppercase">Presence</Text>
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Your Temporal Frequency</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              markAllAsRead({});
            }}
            className="w-10 h-10 rounded-[16px] bg-white items-center justify-center border border-gray-50 shadow-sm shadow-gray-100"
          >
            <Ionicons name="checkmark-done" size={20} color="#0EA5E9" />
          </TouchableOpacity>
        </View>

        {/* Minimalist Tabs */}
        <View className="flex-row bg-gray-100/50 p-1 rounded-2xl h-11 relative">
          <Animated.View
            style={[{ position: 'absolute', top: 4, bottom: 4, width: '33.33%', backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 }, indicatorStyle]}
          />
          {["all", "mentions", "verified"].map((tab, index) => (
            <TouchableOpacity
              key={tab}
              className="flex-1 items-center justify-center"
              onPress={() => handleTabChange(tab as any, index)}
            >
              <Text className={`font-black uppercase text-[10px] tracking-widest ${activeTab === tab ? 'text-gray-900' : 'text-gray-400'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BlurView>

      {isLoading && !isFetching ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <FlatList
          data={groupedNotifications}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <NotificationItem
              item={item}
              index={index}
              onPress={handleNotificationPress}
              onPressProfile={(id) => router.push(`/profile/${id}`)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                refetch();
              }}
              tintColor="#0EA5E9"
            />
          }
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
          ListEmptyComponent={
            <View className="items-center justify-center mt-32 px-14 opacity-20">
              <View className="w-24 h-24 bg-white rounded-[40px] items-center justify-center mb-10 border border-gray-100">
                <Ionicons name="leaf" size={48} color="#94A3B8" />
              </View>
              <Text className="text-xl font-black text-center mb-2 text-gray-900 uppercase tracking-widest">Peaceful Stillness</Text>
              <Text className="text-gray-400 text-center text-[13px] font-bold uppercase tracking-wider leading-5">
                No temporal echoes have reached your coordinate yet.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/compose/post");
        }}
        style={{
          shadowColor: "#0EA5E9",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 15,
          elevation: 10,
        }}
        className="absolute bottom-28 right-6 bg-sky-500 w-16 h-16 rounded-[24px] items-center justify-center border-2 border-white/20"
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}
