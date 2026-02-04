import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/authSlice";
import { useRouter } from "expo-router";
import {
  useGetProfileQuery,
  useGetUserPostsQuery,
  useGetUserLikesQuery,
} from "../../store/profileApi";
import {
  useLikePostMutation,
  useRepostPostMutation,
} from "../../store/postApi";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("posts");

  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetProfileQuery(user?.id, {
    skip: !user?.id,
  });

  const {
    data: userPosts,
    isLoading: isPostsLoading,
    refetch: refetchPosts,
  } = useGetUserPostsQuery(user?.id, {
    skip: !user?.id || activeTab !== "posts",
  });

  const {
    data: userLikes,
    isLoading: isLikesLoading,
    refetch: refetchLikes,
  } = useGetUserLikesQuery(user?.id, {
    skip: !user?.id || activeTab !== "likes",
  });

  const [likePost] = useLikePostMutation();
  const [repostPost] = useRepostPostMutation();

  const handleLogout = () => {
    dispatch(logout());
    router.replace("/auth");
  };

  const onRefresh = () => {
    refetchProfile();
    if (activeTab === "posts") refetchPosts();
    if (activeTab === "likes") refetchLikes();
  };

  const PostCard = ({ item }: { item: any }) => {
    const isRepost = item.isRepost && item.originalPost;
    const displayItem = isRepost ? item.originalPost : item;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/post/${displayItem.id}`)}
        activeOpacity={0.9}
        className="p-4 border-b border-gray-100 bg-white"
      >
        <View className="flex-row">
          <View className="mr-3">
            <Image
              source={{
                uri:
                  displayItem.author?.image || "https://via.placeholder.com/48",
              }}
              className="w-12 h-12 rounded-full"
            />
          </View>

          <View className="flex-1">
            <View className="flex-row items-center mb-0.5">
              <Text
                className="font-bold text-[15px] text-gray-900"
                numberOfLines={1}
              >
                {displayItem.author?.name || "Anonymous"}
              </Text>
              <Text className="text-gray-500 text-[14px] ml-1">
                @{displayItem.author?.name?.toLowerCase().replace(/\s/g, "")} ·{" "}
                {new Date(displayItem.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <Text className="text-[15px] leading-[22px] text-gray-800 mb-3">
              {displayItem.content}
            </Text>

            {displayItem.image && (
              <Image
                source={{ uri: displayItem.image }}
                className="w-full h-48 rounded-2xl mb-3"
                resizeMode="cover"
              />
            )}

            <View className="flex-row justify-between pr-4 mt-2">
              <TouchableOpacity className="flex-row items-center">
                <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
                <Text className="text-gray-500 text-xs ml-1.5">
                  {displayItem._count?.comments || 0}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => repostPost({ id: displayItem.id })}
              >
                <Ionicons name="repeat-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => likePost({ postId: displayItem.id })}
              >
                {(() => {
                  const hasLiked = displayItem.likes?.some(
                    (l: any) => l.userId === user?.id,
                  );
                  return (
                    <>
                      <Ionicons
                        name={hasLiked ? "heart" : "heart-outline"}
                        size={18}
                        color={hasLiked ? "#F91880" : "#6B7280"}
                      />
                      <Text
                        className={`text-xs ml-1.5 ${hasLiked ? "text-[#F91880]" : "text-gray-500"}`}
                      >
                        {displayItem._count?.likes || 0}
                      </Text>
                    </>
                  );
                })()}
              </TouchableOpacity>
              <Ionicons name="share-outline" size={18} color="#6B7280" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const Header = () => (
    <View className="bg-white">
      {/* Banner */}
      <View className="h-32 bg-sky-100" />

      {/* Profile Header */}
      <View className="px-4 -mt-12">
        <View className="flex-row justify-between items-end">
          <Image
            source={{
              uri:
                profile?.image ||
                user?.image ||
                "https://via.placeholder.com/100",
            }}
            className="w-24 h-24 rounded-full border-4 border-white bg-gray-100"
          />
          <View className="flex-row items-center mb-1">
            <TouchableOpacity onPress={() => router.push("/settings")}>
              <Ionicons
                name="settings-outline"
                size={20}
                color="#6B7280"
                className="mr-2"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/profile/update")}
              className="border border-gray-300 px-4 py-2 rounded-full mr-2"
            >
              <Text className="font-bold text-gray-900">Edit profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              className="w-10 h-10 border border-gray-300 items-center justify-center rounded-full"
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-3">
          <Text className="text-2xl font-extrabold text-gray-900">
            {profile?.name || user?.name || "User Name"}
          </Text>
          <Text className="text-gray-500 text-[15px]">
            @{profile?.name?.toLowerCase().replace(/\s/g, "") || "handle"}
          </Text>
        </View>

        <Text className="mt-3 text-[16px] text-gray-800 leading-5">
          {profile?.bio || "Building the future of social networking. 🚀"}
        </Text>

        <View className="flex-row mt-3 items-center">
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text className="text-gray-500 ml-1.5 text-[15px]">
            Joined{" "}
            {profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
              : "January 2026"}
          </Text>
        </View>

        <View className="flex-row mt-4 mb-6">
          <TouchableOpacity className="flex-row mr-5">
            <Text className="font-bold text-gray-900">
              {profile?._count?.following || 0}
            </Text>
            <Text className="text-gray-500 ml-1">Following</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row">
            <Text className="font-bold text-gray-900">
              {profile?._count?.followers || 0}
            </Text>
            <Text className="text-gray-500 ml-1">Followers</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-100">
        <TouchableOpacity
          onPress={() => setActiveTab("posts")}
          className={`flex-1 items-center py-4 ${activeTab === "posts" ? "border-b-4 border-[#1d9bf0]" : ""}`}
        >
          <Text
            className={`font-bold text-[15px] ${activeTab === "posts" ? "text-gray-900" : "text-gray-500"}`}
          >
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("replies")}
          className={`flex-1 items-center py-4 ${activeTab === "replies" ? "border-b-4 border-[#1d9bf0]" : ""}`}
        >
          <Text
            className={`font-bold text-[15px] ${activeTab === "replies" ? "text-gray-900" : "text-gray-500"}`}
          >
            Replies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("likes")}
          className={`flex-1 items-center py-4 ${activeTab === "likes" ? "border-b-4 border-[#1d9bf0]" : ""}`}
        >
          <Text
            className={`font-bold text-[15px] ${activeTab === "likes" ? "text-gray-900" : "text-gray-500"}`}
          >
            Likes
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const data =
    activeTab === "posts" ? userPosts : activeTab === "likes" ? userLikes : [];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        data={data}
        ListHeaderComponent={Header}
        renderItem={({ item }) => <PostCard item={item} />}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isProfileLoading || isPostsLoading || isLikesLoading}
            onRefresh={onRefresh}
            tintColor="#1d9bf0"
          />
        }
        // ListEmptyComponent={
        //   !isProfileLoading &&
        //   !isPostsLoading && (
        //     <View className="items-center py-10 opacity-50">
        //       <Text className="text-lg font-bold">No {activeTab} yet</Text>
        //       <Text className="text-center px-10 mt-1">
        //         When you {activeTab === "posts" ? "post content" : "like posts"}
        //         , it will appear here.
        //       </Text>
        //     </View>
        //   )
        // }
        ListEmptyComponent={
          <View className="items-center py-10 opacity-50">
            <Text className="text-lg font-bold">No {activeTab} yet</Text>
            <Text className="text-center px-10 mt-1">
              When you {activeTab === "posts" ? "post content" : "like posts"},
              it will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
