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

          <Text className="text-[15px] text-gray-900 leading-5">
            <Text className="font-extrabold">{item.issuer.name}</Text>{" "}
            {config.text}
          </Text>

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
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            ·{" "}
            {new Date(item.createdAt).toLocaleDateString([], {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
        {!item.read && (
          <View className="w-2 h-2 bg-[#1d9bf0] rounded-full mt-2" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-50">
        <Text className="text-xl font-extrabold text-gray-900">
          Notifications
        </Text>
        <TouchableOpacity onPress={() => markAllAsRead({})} className="p-1">
          <Ionicons name="settings-outline" size={20} color="black" />
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
          data={notifications}
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
    </View>
  );
}
