import React, { useCallback, useEffect } from "react";
import {
  View,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    data: notifications,
    isLoading,
    refetch,
    isFetching,
  } = useGetNotificationsQuery({});

  // const {
  //   data: notifications,
  //   isLoading,
  //   refetch,
  //   isFetching,
  // } = useGetNotificationsQuery(
  //   {},
  //   {
  //     refetchOnMountOrArgChange: true,
  //   },
  // );
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [markAsRead] = useMarkAsReadMutation();
  const [createChatRoom] = useCreateChatRoomMutation();

  // Refetch notifications when screen is focused (e.g., navigating back from a post)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  useEffect(() => {
    if (notifications) {
      console.log("--- API DATA DEBUG ---");
      console.log("Type of notifications:", typeof notifications);
      console.log("Is Array?:", Array.isArray(notifications));
      console.log("Full Data:", JSON.stringify(notifications, null, 2));
    }
  }, [notifications]);

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case "LIKE":
        return { icon: "heart", color: "#F91880", text: "liked your post" };
      case "COMMENT":
        return {
          icon: "chatbubble",
          color: "#1D9BF0",
          text: "commented on your post",
        };
      case "FOLLOW":
        return { icon: "person-add", color: "#00BA7C", text: "followed you" };
      case "REPOST":
        return { icon: "repeat", color: "#00BA7C", text: "reposted your post" };
      case "QUOTE":
        return { icon: "repeat", color: "#00BA7C", text: "quoted your post" };
      case "REPLY":
        return {
          icon: "chatbubble-ellipses",
          color: "#1D9BF0",
          text: "replied to your comment",
        };
      case "MENTION":
        return {
          icon: "at",
          color: "#1D9BF0",
          text: "mentioned you",
        };
      case "MESSAGE":
        return {
          icon: "mail",
          color: "#1D9BF0",
          text: "sent you a message",
        };
      default:
        return {
          icon: "notifications",
          color: "#6B7280",
          text: "interacted with you",
        };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const handleNotificationPress = async (notification: any) => {
    // Determine if the group contains any unread notifications
    // Note: notification object here could be the "latest" representing a group
    // In grouped mode, we'll mark it read and the backend will handle marking all matching ones read!
    if (
      !notification.read ||
      (notification._groupUnreadCount && notification._groupUnreadCount > 0)
    ) {
      markAsRead(notification.id);
    }

    if (notification.type === "MESSAGE" && notification.issuerId) {
      try {
        const room = await createChatRoom(notification.issuerId).unwrap();
        router.push(`/chat/${room.id}`);
        return;
      } catch (e) {
        console.error("Failed to find chat room", e);
      }
    }

    if (notification.postId) {
      router.push(`/post/${notification.postId}`);
    } else if (notification.issuerId) {
      router.push(`/profile/${notification.issuerId}`);
    }
  };

  // Grouping logic for notifications
  const groupedNotifications = React.useMemo(() => {
    if (!notifications || !Array.isArray(notifications)) return [];

    const groups: Record<string, any[]> = {};

    notifications.forEach((n) => {
      // Create a unique key based on Type + Issuer + Target Entity
      const targetId = n.postId || n.commentId || "none";
      const key = `${n.type}-${n.issuerId}-${targetId}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(n);
    });

    // Map each group to its latest notification, but attach group metadata
    return Object.values(groups)
      .map((group) => {
        // Sort descending by date just in case
        group.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        const latest = { ...group[0] };
        latest._groupCount = group.length;
        latest._groupUnreadCount = group.filter((n) => !n.read).length;

        // If the group has unread messages, ensure the visual row looks unread
        if (latest._groupUnreadCount > 0) {
          latest.read = false;
        }

        return latest;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [notifications]);

  const NotificationItem = ({ item }: { item: any }) => {
    const config = getNotificationConfig(item.type);

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
        className={`flex-row p-4 border-b border-gray-50 items-start ${item.read ? "bg-white" : "bg-sky-50/50"}`}
      >
        <View className="mr-3 pt-1">
          <Ionicons name={config.icon as any} size={26} color={config.color} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <TouchableOpacity
              onPress={() => router.push(`/profile/${item.issuer.id}`)}
            >
              <Image
                source={{
                  uri: item.issuer.image || "https://via.placeholder.com/48",
                }}
                className="w-10 h-10 rounded-full mr-2 bg-gray-100"
              />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-baseline min-w-0 pr-2">
            <Text className="text-[15px] text-gray-900 leading-5 flex-shrink">
              <Text className="font-extrabold">{item.issuer.name}</Text>{" "}
              {config.text}
            </Text>
            {item._groupCount > 1 && (
              <View className="bg-sky-100 px-1.5 py-0.5 rounded-md ml-1.5 flex-row items-center self-center">
                <Text className="text-sky-600 text-[10px] font-bold">
                  +{item._groupCount - 1}
                </Text>
              </View>
            )}
          </View>

          {item.post && (
            <Text
              className="text-gray-500 text-[14px] mt-2 leading-4"
              numberOfLines={2}
            >
              {item.post.content}
            </Text>
          )}

          {item.comment && (
            <View className="mt-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
              <Text
                className="text-gray-600 text-[13px] leading-4"
                numberOfLines={2}
              >
                &quot;{item.comment.content}&quot;
              </Text>
            </View>
          )}

          <Text className="text-gray-400 text-xs mt-3">
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
        {!item.read && (
          <View className="w-2 h-2 bg-[#1d9bf0] rounded-full mt-2" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-50">
        <Text className="text-xl font-extrabold text-gray-900">
          Notifications
        </Text>
        <TouchableOpacity onPress={() => markAllAsRead({})} className="p-1">
          <View className="flex-row items-center space-x-2">
            <Ionicons name="checkmark-done-outline" size={22} color="#1d9bf0" />
            <Text className="text-[15px] text-gray-900">Mark all as read</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tabs Placeholder */}
      <View className="flex-row border-b border-gray-50">
        <TouchableOpacity className="flex-1 items-center py-3 border-b-4 border-[#1d9bf0]">
          <Text className="font-bold text-[15px] text-gray-900">All</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 items-center py-3">
          <Text className="font-bold text-[15px] text-gray-500">Mentions</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1D9BF0" />
        </View>
      ) : (
        <FlatList
          data={groupedNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem item={item} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor="#1D9BF0"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center mt-20 px-10">
              <View className="w-24 h-24 bg-gray-50 rounded-full items-center justify-center mb-6">
                <Ionicons
                  name="notifications-off-outline"
                  size={48}
                  color="#D1D5DB"
                />
              </View>
              <Text className="text-2xl font-extrabold text-center mb-2 text-gray-900">
                Nothing to see yet
              </Text>
              <Text className="text-gray-500 text-center text-lg leading-6">
                From likes to reposts and a whole lot more, this is where all
                the action happens.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
