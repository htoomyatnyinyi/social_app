import React, { useCallback, useState } from "react";
import * as Linking from "expo-linking";
import {
  View,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "../../store/notificationApi";
import { useCreateChatRoomMutation } from "../../store/chatApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Animated, { 
    FadeInDown, 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring 
} from "react-native-reanimated";

const { width } = Dimensions.get('window');

const getNotificationConfig = (type: string) => {
  switch (type) {
    case "LIKE":
      return { icon: "heart", color: "#F43F5E", text: "liked your post", bg: "rgba(244, 63, 94, 0.05)" };
    case "FOLLOW":
      return { icon: "person-add", color: "#10B981", text: "followed you", bg: "rgba(16, 185, 129, 0.05)" };
    case "REPOST":
      return { icon: "repeat", color: "#0EA5E9", text: "reposted your post", bg: "rgba(14, 165, 233, 0.05)" };
    case "QUOTE":
      return { icon: "repeat", color: "#8B5CF6", text: "quoted your post", bg: "rgba(139, 92, 246, 0.05)" };
    case "REPLY":
      return { icon: "chatbubble-ellipses", color: "#0EA5E9", text: "replied to your post", bg: "rgba(14, 165, 233, 0.05)" };
    case "MENTION":
      return { icon: "at", color: "#F59E0B", text: "mentioned you", bg: "rgba(245, 158, 11, 0.05)" };
    case "MESSAGE":
      return { icon: "mail", color: "#0EA5E9", text: "sent you a message", bg: "rgba(14, 165, 233, 0.05)" };
    case "SYSTEM":
      return { icon: "sparkles", color: "#0EA5E9", text: "sent you a zen update", bg: "rgba(14, 165, 233, 0.05)" };
    default:
      return { icon: "notifications", color: "#64748B", text: "interacted with you", bg: "rgba(100, 116, 139, 0.05)" };
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
            activeOpacity={0.7}
            className={`flex-row p-5 mb-1 ${item.read ? "bg-white" : config.bg} items-start`}
            style={{ borderLeftWidth: item.read ? 0 : 4, borderLeftColor: config.color }}
        >
            <View className="mr-4 pt-1">
                <View 
                    className="w-10 h-10 rounded-2xl items-center justify-center shadow-sm"
                    style={{ backgroundColor: 'white', shadowColor: config.color, shadowOpacity: 0.1, shadowRadius: 10 }}
                >
                    <Ionicons name={config.icon as any} size={22} color={config.color} />
                </View>
            </View>

            <View className="flex-1">
                <View className="flex-row items-center justify-between mb-2">
                    <TouchableOpacity 
                        onPress={() => onPressProfile(item.issuer.id)}
                        className="flex-row items-center"
                    >
                        <Image
                            source={{ uri: item.issuer.image || "https://via.placeholder.com/48" }}
                            className="w-6 h-6 rounded-full mr-2 bg-gray-100"
                        />
                        <Text className="font-black text-gray-900 text-[14px]">{item.issuer.name}</Text>
                    </TouchableOpacity>
                    <Text className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                        {formatTimeAgo(item.createdAt)}
                    </Text>
                </View>

                <Text className="text-[15px] text-gray-700 leading-5">
                    {config.text}
                    {item._groupCount > 1 && (
                        <Text className="text-sky-500 font-black"> & {item._groupCount - 1} others</Text>
                    )}
                </Text>

                {item.post && (
                    <View className="mt-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                        <Text className="text-gray-500 text-[13px] leading-4 italic" numberOfLines={2}>
                        &quot;{item.post.content}&quot;
                        </Text>
                    </View>
                )}
            </View>

            {!item.read && (
                <View className="w-2 h-2 rounded-full absolute top-5 right-5" style={{ backgroundColor: config.color }} />
            )}
        </TouchableOpacity>
    </Animated.View>
  );
});

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "verified" | "mentions">("all");
  
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

  const groupedNotifications = React.useMemo(() => {
    const notifications = notificationsData?.notifications || [];
    if (!Array.isArray(notifications)) return [];

    const groups: Record<string, any[]> = {};
    notifications.forEach((n) => {
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
  }, [notificationsData]);

  const indicatorPos = useSharedValue(0);
  const handleTabChange = (tab: any, index: number) => {
      setActiveTab(tab);
      indicatorPos.value = withSpring(index * (width / 3));
  };

  const indicatorStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: indicatorPos.value }],
  }));

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <BlurView intensity={90} tint="light" className="absolute top-0 left-0 right-0 z-50 pt-12 pb-4 px-5 border-b border-gray-100 flex-row justify-between items-center bg-white/80">
          <View>
              <Text className="text-2xl font-black text-gray-900 tracking-tighter">Activity</Text>
              <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Your Zen Pulse</Text>
          </View>
          <TouchableOpacity 
            onPress={() => markAllAsRead({})} 
            className="w-10 h-10 rounded-2xl bg-sky-50 items-center justify-center border border-sky-100"
          >
              <Ionicons name="checkmark-done" size={20} color="#0EA5E9" />
          </TouchableOpacity>
      </BlurView>

      <View className="mt-28 flex-row relative bg-white border-b border-gray-100">
           {["all", "verified", "mentions"].map((tab, index) => (
               <TouchableOpacity 
                key={tab} 
                className="flex-1 py-4 items-center" 
                onPress={() => handleTabChange(tab as any, index)}
               >
                   <Text className={`font-black uppercase text-[11px] tracking-widest ${activeTab === tab ? 'text-sky-500' : 'text-gray-400'}`}>
                       {tab}
                   </Text>
               </TouchableOpacity>
           ))}
           <Animated.View 
            style={[{ position: 'absolute', bottom: 0, width: width / 3, height: 3, backgroundColor: '#0EA5E9', borderRadius: 3 }, indicatorStyle]} 
           />
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <FlatList
          data={groupedNotifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <NotificationItem
              item={item}
              index={index}
              onPress={handleNotificationPress}
              onPressProfile={(id) => router.push(`/profile/${id}`)}
            />
          )}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#0EA5E9" />}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center justify-center mt-32 px-12">
              <View className="w-24 h-24 bg-white rounded-3xl items-center justify-center mb-8 shadow-sm border border-gray-100">
                <Ionicons name="leaf-outline" size={48} color="#CBD5E1" />
              </View>
              <Text className="text-2xl font-black text-center mb-1 text-gray-900 tracking-tighter">Breathe Deeply</Text>
              <Text className="text-gray-400 text-center text-[15px] font-medium leading-5">
                Notifications are currently quiet. Enjoy the silence or start a new conversation.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
