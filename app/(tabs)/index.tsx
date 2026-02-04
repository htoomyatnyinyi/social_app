import React, { useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useGetPostsQuery,
  useLikePostMutation,
  useCreatePostMutation,
  useCommentPostMutation,
  useRepostPostMutation,
} from "../../store/postApi";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState("public");
  const [commentContent, setCommentContent] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isCommenting, setIsCommenting] = useState(false);

  const user = useSelector((state: any) => state.auth.user);
  const router = useRouter();

  const {
    data: posts,
    isLoading,
    refetch,
    isFetching,
  } = useGetPostsQuery(activeTab);
  const [likePost] = useLikePostMutation();
  const [commentPost] = useCommentPostMutation();
  const [repostPost] = useRepostPostMutation();

  const handleRepost = async (id: string) => {
    try {
      await repostPost({ id }).unwrap();
    } catch (e) {
      console.error(e);
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim() || !selectedPostId) return;
    try {
      await commentPost({
        id: selectedPostId,
        content: commentContent,
      }).unwrap();
      setCommentContent("");
      setIsCommenting(false);
    } catch (e) {
      console.error(e);
    }
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
        {isRepost && (
          <View className="flex-row items-center mb-2 ml-10">
            <Ionicons name="repeat" size={16} color="#6B7280" />
            <Text className="text-gray-500 text-[13px] font-bold ml-2">
              {item.author?.name} reposted
            </Text>
          </View>
        )}
        <View className="flex-row">
          <View className="mr-3">
            <TouchableOpacity
              onPress={() => router.push(`/profile/${displayItem.author?.id}`)}
              onPressIn={(e) => e.stopPropagation()}
            >
              <Image
                source={{
                  uri:
                    displayItem.author?.image ||
                    "https://via.placeholder.com/48",
                }}
                className="w-12 h-12 rounded-full bg-gray-100"
              />
            </TouchableOpacity>
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
              <TouchableOpacity
                className="ml-auto p-1"
                onPressIn={(e) => e.stopPropagation()}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <Text className="text-[15px] leading-[22px] text-gray-800 mb-3">
              {displayItem.content}
            </Text>

            {displayItem.image && (
              <Image
                source={{ uri: displayItem.image }}
                className="w-full h-56 rounded-2xl mb-3 border border-gray-100"
                resizeMode="cover"
              />
            )}

            <View className="flex-row justify-between pr-4 mt-1">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => {
                  setSelectedPostId(displayItem.id);
                  setIsCommenting(true);
                }}
                onPressIn={(e) => e.stopPropagation()}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
                <Text className="text-gray-500 text-xs ml-1.5">
                  {displayItem._count?.comments || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => handleRepost(displayItem.id)}
                onPressIn={(e) => e.stopPropagation()}
              >
                <Ionicons
                  name="repeat-outline"
                  size={20}
                  color={item.isRepost ? "#00BA7C" : "#6B7280"}
                />
                <Text
                  className={`text-xs ml-1.5 ${item.isRepost ? "text-[#00BA7C]" : "text-gray-500"}`}
                >
                  {displayItem._count?.reposts || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => likePost(displayItem.id)}
                onPressIn={(e) => e.stopPropagation()}
              >
                {(() => {
                  const hasLiked = displayItem.likes?.some(
                    (l: any) => l.userId === user?.id,
                  );
                  return (
                    <>
                      <Ionicons
                        name={hasLiked ? "heart" : "heart-outline"}
                        size={19}
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

              <TouchableOpacity
                className="flex-row items-center"
                onPressIn={(e) => e.stopPropagation()}
              >
                <Ionicons
                  name="stats-chart-outline"
                  size={17}
                  color="#6B7280"
                />
                <Text className="text-gray-500 text-xs ml-1.5">
                  {displayItem._count?.shares || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="p-1"
                onPressIn={(e) => e.stopPropagation()}
              >
                <Ionicons name="share-outline" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Comment Preview */}
            {displayItem.comments?.length > 0 && (
              <View className="mt-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                {displayItem.comments.slice(0, 2).map((comment: any) => (
                  <View key={comment.id} className="flex-row mb-1.5 last:mb-0">
                    <Text
                      className="font-bold text-[13px] text-gray-900"
                      numberOfLines={1}
                    >
                      {comment.user?.name}{" "}
                    </Text>
                    <Text className="text-[13px] text-gray-600 flex-1 leading-4">
                      {comment.content}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1">
      {/* Premium Header */}
      <View className="px-4 py-2 flex-row items-center justify-between border-b border-gray-50">
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
          <Image
            source={{ uri: user?.image || "https://via.placeholder.com/32" }}
            className="w-8 h-8 rounded-full"
          />
        </TouchableOpacity>
        {/* <Ionicons name="logo-twitter" size={24} color="#1d9bf0" /> */}
        <Text className="text-[24px] font-bold">Oasis</Text>
        <TouchableOpacity>
          {/* MCP Call Here */}
          <Ionicons name="sparkles-outline" size={20} color="black" />
        </TouchableOpacity>
      </View>

      <View className="flex-row border-b border-gray-100">
        <TouchableOpacity
          onPress={() => setActiveTab("public")}
          className="flex-1 items-center pt-3 pb-3"
        >
          <Text
            className={`text-[15px] font-bold ${activeTab === "public" ? "text-gray-900" : "text-gray-500"}`}
          >
            For you
          </Text>
          {activeTab === "public" && (
            <View className="absolute bottom-0 w-14 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("private")}
          className="flex-1 items-center pt-3 pb-3"
        >
          <Text
            className={`text-[15px] font-bold ${activeTab === "private" ? "text-gray-900" : "text-gray-500"}`}
          >
            Following
          </Text>
          {activeTab === "private" && (
            <View className="absolute bottom-0 w-16 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={({ item }) => <PostCard item={item} />}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isFetching}
            onRefresh={refetch}
            tintColor="#1d9bf0"
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="items-center justify-center p-10 mt-10">
            <Text className="text-gray-400 text-center text-lg font-medium">
              No posts to show right now.
            </Text>
          </View>
        }
        // ListEmptyComponent={
        //   !isLoading && (
        //     <View className="items-center justify-center p-10 mt-10">
        //       <Text className="text-gray-400 text-center text-lg font-medium">
        //         No posts to show right now.
        //       </Text>
        //     </View>
        //   )
        // }
      />

      {/* Floating Action Button */}
      {!isCommenting && (
        <TouchableOpacity
          onPress={() => router.push("/compose/post")}
          className="absolute bottom-6 right-6 w-14 h-14 bg-[#1d9bf0] rounded-full items-center justify-center shadow-xl shadow-sky-500/40"
          style={{ elevation: 8 }}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      )}

      {/* Compose Reply Modal-like View */}
      {isCommenting && (
        <View className="absolute inset-0 bg-white z-[100]">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-50">
            <TouchableOpacity onPress={() => setIsCommenting(false)}>
              <Text className="text-[17px] text-gray-800">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleComment}
              disabled={!commentContent.trim()}
              className={`px-6 py-2 rounded-full ${commentContent.trim() ? "bg-[#1d9bf0]" : "bg-sky-200"}`}
            >
              <Text className="text-white font-bold text-[15px]">Reply</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row p-4">
            <Image
              source={{ uri: user?.image || "https://via.placeholder.com/40" }}
              className="w-11 h-11 rounded-full mr-3"
            />
            <TextInput
              autoFocus
              multiline
              placeholder="Post your reply"
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-[19px] leading-6 pt-1 text-gray-900"
              value={commentContent}
              onChangeText={setCommentContent}
              textAlignVertical="top"
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
