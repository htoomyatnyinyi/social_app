import React from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  useGetBookmarksQuery,
  useLikePostMutation,
  useBookmarkPostMutation,
  useRepostPostMutation,
  useDeleteRepostMutation,
} from "@/store/postApi";
import { useSelector } from "react-redux";
import PostCard, { Post } from "@/components/PostCard";
import PostOptionsModal from "@/components/PostOptionsModal";

export default function BookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useSelector((state: any) => state.auth.user);

  const {
    data: bookmarks,
    isLoading,
    refetch,
    isFetching,
  } = useGetBookmarksQuery({}, { skip: !user });

  const [likePost] = useLikePostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();
  const [repostPost] = useRepostPostMutation();
  const [deleteRepost] = useDeleteRepostMutation();

  const [optionsModalVisible, setOptionsModalVisible] = React.useState(false);
  const [postForOptions, setPostForOptions] = React.useState<Post | null>(null);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (isLoading && !isFetching) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Premium Header */}
      <BlurView
        intensity={90}
        tint="light"
        className="px-5 pb-5 z-50 border-b border-gray-100/50"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-2xl bg-white items-center justify-center border border-gray-50 shadow-sm shadow-gray-100 mr-4"
          >
            <Ionicons name="chevron-back" size={20} color="#64748B" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-black text-gray-900 tracking-[-1.5px] uppercase">
              Vault
            </Text>
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Preserved Artifacts
            </Text>
          </View>
        </View>
      </BlurView>

      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-3">
            <PostCard
              item={item}
              user={user}
              onPressPost={(id) => router.push(`/post/${id}`)}
              onPressProfile={(id) => router.push(`/profile/${id}`)}
              onPressOptions={(p) => {
                setPostForOptions(p);
                setOptionsModalVisible(true);
              }}
              onPressComment={(id) => router.push(`/post/${id}`)}
              onPressRepost={(p) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                repostPost({ id: p.id });
              }}
              onLike={(id) => likePost({ postId: id }).unwrap()}
              onBookmark={(id) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                return bookmarkPost(id).unwrap();
              }}
            />
          </View>
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
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-32 px-14 opacity-20">
            <View className="w-24 h-24 bg-white rounded-[40px] items-center justify-center mb-10 border border-gray-100">
              <Ionicons name="bookmark" size={48} color="#94A3B8" />
            </View>
            <Text className="text-xl font-black text-center mb-2 text-gray-900 uppercase tracking-widest">
              Empty Vault
            </Text>
            <Text className="text-gray-400 text-center text-[13px] font-bold uppercase tracking-wider leading-5">
              No artifacts have been preserved in your coordinate yet.
            </Text>
          </View>
        }
      />

      <PostOptionsModal
        isVisible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        isOwner={postForOptions?.author?.id === user?.id}
        onDelete={() => {}} // Handle delete in bookmarks if needed
      />
    </View>
  );
}
