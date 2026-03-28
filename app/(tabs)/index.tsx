import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useGetPostsQuery,
  useLikePostMutation,
  useReplyPostMutation,
  useRepostPostMutation,
  useBookmarkPostMutation,
  useDeletePostMutation,
  useDeleteRepostMutation,
  useBlockUserMutation,
  useReportPostMutation,
} from "../../store/postApi";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import PostOptionsModal from "../../components/PostOptionsModal";
import PostCard, { Post } from "../../components/PostCard";
import { BlurView } from "expo-blur";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  withTiming
} from "react-native-reanimated";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

const TRENDING_TOPICS = [
  { id: "1", label: "Zen", icon: "leaf", color: "#10B981" },
  { id: "2", label: "Oasis", icon: "water", color: "#0EA5E9" },
  { id: "3", label: "Artifacts", icon: "color-palette", color: "#F59E0B" },
  { id: "4", label: "Code", icon: "code-working", color: "#6366F1" },
  { id: "5", label: "Presence", icon: "pulse", color: "#F43F5E" },
];

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"public" | "private">("public");
  const [cursor, setCursor] = useState<string | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [postForOptions, setPostForOptions] = useState<Post | null>(null);

  const user = useSelector((state: any) => state.auth.user);
  const tabProgress = useSharedValue(0);

  const { data, isLoading, isFetching, refetch } = useGetPostsQuery(
    { type: activeTab, cursor },
    { skip: !user },
  );

  const posts = data?.posts ?? [];
  const nextCursor = data?.nextCursor;

  const [likePost] = useLikePostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [repostPost] = useRepostPostMutation();
  const [deleteRepost] = useDeleteRepostMutation();
  const [deletePost] = useDeletePostMutation();
  const [blockUser] = useBlockUserMutation();
  const [reportPost] = useReportPostMutation();

  const handleTabChange = useCallback((tab: "public" | "private") => {
    if (tab === activeTab) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    setCursor(null);
    tabProgress.value = withSpring(tab === "public" ? 0 : 1, { damping: 20, stiffness: 120 });
  }, [activeTab, tabProgress]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(tabProgress.value, [0, 1], [0, 150]) }
      ],
    };
  });

  const handleLike = useCallback(async (postId: string) => {
    try {
      await likePost({ postId }).unwrap();
    } catch (err) {
      console.error("Like failed", err);
    }
  }, [likePost]);

  const handleBookmark = useCallback(async (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await bookmarkPost(postId).unwrap();
    } catch (err) {
      console.error("Bookmark failed", err);
    }
  }, [bookmarkPost]);

  const handleRepostAction = useCallback((post: Post) => {
    const isRepostItem = !!post.isRepost;
    const realPostId = isRepostItem && post.originalPost ? post.originalPost.id : post.id;
    const alreadyReposted = post.repostedByMe ?? false;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (alreadyReposted) {
      Alert.alert("Undo Repost", "Remove this artifact from your timeline?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRepost(realPostId).unwrap();
            } catch (err) {
              console.error("Delete repost failed", err);
            }
          },
        },
      ]);
    } else {
      Alert.alert("Share Artifact", "How would you like to diffuse this message?", [
        {
          text: "Diffuse Directly",
          onPress: async () => {
            try {
              await repostPost({ id: realPostId }).unwrap();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err: any) {
              if (err?.status === 400) {
                Alert.alert("Already Diffused", "You have already shared this artifact.");
              }
            }
          },
        },
        {
          text: "Quote & Reflect",
          onPress: () => {
            router.push({
              pathname: "/compose/post",
              params: { quoteId: realPostId },
            });
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }, [repostPost, deleteRepost, router]);

  const uniquePosts = useMemo(() => {
    const map = new Map();
    posts.forEach((p: any) => map.set(p.id, p));
    return Array.from(map.values()) as Post[];
  }, [posts]);

  const renderTrending = () => (
    <View className="py-6 border-b border-gray-100/50">
      <View className="px-5 mb-4 flex-row items-center justify-between">
        <Text className="text-[11px] font-black text-gray-400 uppercase tracking-[2px]">Trending Artifacts</Text>
        <TouchableOpacity>
          <Ionicons name="sparkles" size={14} color="#CBD5E1" />
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={TRENDING_TOPICS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            className="bg-white px-5 py-3 rounded-[22px] mr-3 flex-row items-center shadow-sm shadow-gray-200 border border-gray-50"
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/explore?q=${encodeURIComponent(item.label)}`);
            }}
          >
            <View className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: item.color }} />
            <Text className="text-gray-700 font-black text-[13px] tracking-tight">#{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Premium Sticky Header */}
      <BlurView 
        intensity={90} 
        tint="light" 
        className="flex-row items-center justify-between px-5 pb-4 z-50 border-b border-gray-100/50"
        style={{ paddingTop: insets.top + 10 }}
      >
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/profile");
          }}
          className="shadow-md shadow-sky-100"
        >
          <Image
            source={{ uri: user?.image || `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.id}` }}
            className="w-10 h-10 rounded-[16px] bg-white border border-gray-50"
            contentFit="cover"
            transition={300}
          />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-2xl font-black text-gray-900 tracking-[-1.5px] uppercase">Oasis</Text>
        </View>

        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/settings/meditation");
          }}
          className="w-10 h-10 rounded-[16px] bg-white items-center justify-center border border-gray-50 shadow-sm shadow-gray-100"
        >
          <Ionicons name="leaf" size={20} color="#10B981" />
        </TouchableOpacity>
      </BlurView>

      <FlatList
        data={uniquePosts}
        keyExtractor={(item, index) => `${item?.id}-${index}`}
        ListHeaderComponent={() => (
          <View>
            {/* Premium Tab Bar */}
            <View className="px-5 py-5">
              <View className="flex-row bg-gray-100/30 p-1.5 rounded-[24px] h-[52px] relative border border-gray-100/80">
                <Animated.View 
                  style={[
                    {
                      position: 'absolute',
                      top: 4,
                      bottom: 4,
                      left: 4,
                      width: '48%',
                      backgroundColor: '#fff',
                      borderRadius: 20,
                      shadowColor: '#0EA5E9',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 4,
                    },
                    indicatorStyle
                  ]}
                />
                <TouchableOpacity
                  className="flex-1 items-center justify-center z-10"
                  onPress={() => handleTabChange("public")}
                >
                  <Text
                    className={`font-black uppercase tracking-widest text-[10px] ${
                      activeTab === "public" ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    Discovery
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 items-center justify-center z-10"
                  onPress={() => handleTabChange("private")}
                >
                  <Text
                    className={`font-black uppercase tracking-widest text-[10px] ${
                      activeTab === "private" ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    Resonance
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {activeTab === "public" && renderTrending()}
          </View>
        )}
        renderItem={({ item }) => (
          <View className="px-3">
             <PostCard
                item={item as Post}
                user={user}
                onPressPost={(id) => router.push(`/post/${id}`)}
                onPressProfile={(id) => router.push(`/profile/${id}`)}
                onPressOptions={(p) => {
                setPostForOptions(p);
                setOptionsModalVisible(true);
                }}
                onPressComment={(id) => router.push(`/post/${id}`)}
                onPressRepost={handleRepostAction}
                onLike={handleLike}
                onBookmark={handleBookmark}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !cursor}
            onRefresh={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCursor(null);
              refetch();
            }}
            tintColor="#0EA5E9"
            colors={["#0EA5E9"]}
          />
        }
        onEndReached={() => {
          if (nextCursor && !isFetching) {
            setCursor(nextCursor);
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetching && cursor ? (
            <ActivityIndicator className="py-8" color="#0EA5E9" />
          ) : (
            <View className="py-20 items-center opacity-20">
               <Ionicons name="infinite" size={24} color="#94A3B8" />
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Premium Floating Manifest Button */}
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

      <PostOptionsModal
        isVisible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        isOwner={postForOptions?.author?.id === user?.id}
        onDelete={async () => {
          if (!postForOptions?.id) return;
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deletePost({ id: postForOptions.id }).unwrap();
            setOptionsModalVisible(false);
          } catch (err) {
            console.error("Delete failed", err);
          }
        }}
        onReport={async () => {
          if (!postForOptions?.id) return;
          try {
            await reportPost({
              id: postForOptions.id,
              reason: "SPAM",
            }).unwrap();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setOptionsModalVisible(false);
          } catch (error: any) {
            console.error("Error reporting post:", error);
          }
        }}
        onBlock={async () => {
          if (!postForOptions?.author?.id) return;
          try {
            await blockUser({ id: postForOptions.author.id }).unwrap();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setOptionsModalVisible(false);
            refetch();
          } catch (error: any) {
            console.error("Error blocking user:", error);
          }
        }}
      />
    </View>
  );
}
