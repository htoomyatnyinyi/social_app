import React from "react";
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
import {
  useGetNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "../../store/notificationApi";

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    data: notifications,
    isLoading,
    refetch,
    isFetching,
  } = useGetNotificationsQuery({});
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [markAsRead] = useMarkAsReadMutation();

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
      case "REPLY":
        return {
          icon: "chatbubble-ellipses",
          color: "#1D9BF0",
          text: "replied to your comment",
        };
      default:
        return {
          icon: "notifications",
          color: "#6B7280",
          text: "interacted with you",
        };
    }
  };

  const handleNotificationPress = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.postId) {
      router.push(`/post/${notification.postId}`);
    } else if (notification.issuerId) {
      router.push(`/profile/${notification.issuerId}`);
    }
  };

  const NotificationItem = ({ item }: { item: any }) => {
    const config = getNotificationConfig(item.type);

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        className={`flex-row p-4 border-b border-gray-100 items-start ${item.read ? "bg-white" : "bg-sky-50"}`}
      >
        <View className="mr-3 mt-1">
          <Ionicons name={config.icon as any} size={24} color={config.color} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <TouchableOpacity
              onPress={() => router.push(`/profile/${item.issuer.id}`)}
            >
              <Image
                source={{
                  uri: item.issuer.image || "https://via.placeholder.com/40",
                }}
                className="w-10 h-10 rounded-full mr-2"
              />
            </TouchableOpacity>
          </View>

          <Text className="text-[15px] text-gray-900">
            <Text className="font-bold">{item.issuer.name}</Text> {config.text}
          </Text>

          {item.post && (
            <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
              {item.post.content}
            </Text>
          )}

          {item.comment && (
            <Text
              className="text-gray-500 text-sm mt-1 italic"
              numberOfLines={2}
            >
              "{item.comment.content}"
            </Text>
          )}

          <Text className="text-gray-400 text-xs mt-2">
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
        <Text className="text-xl font-bold">Notifications</Text>
        <TouchableOpacity onPress={() => markAllAsRead({})}>
          <Text className="text-sky-500 font-medium">Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1D9BF0" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem item={item} />}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center mt-20 px-10">
              <Text className="text-xl font-bold text-center mb-2">
                No notifications yet
              </Text>
              <Text className="text-gray-500 text-center">
                When people interact with your posts or follow you, you'll see
                it here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
