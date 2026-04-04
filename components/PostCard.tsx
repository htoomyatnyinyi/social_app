import React, { useState, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

// ────────────────────────────────────────────────
// Types & Interfaces
// ────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  username?: string;
  image?: string;
}

export interface Post {
  id: string;
  content: string;
  image?: string;
  images?: string[];
  createdAt: string;
  author: User;
  authorId?: string;
  isRepost?: boolean;
  originalPost?: Post;
  isLiked?: boolean;
  isBookmarked?: boolean;
  repostedByMe?: boolean;
  parentPost?: Post;
  _count: {
    replies: number;
    reposts: number;
    likes: number;
    quotes: number;
  };
  repostsCount?: number;
}

export interface PostCardProps {
  item: Post;
  user: User | null;
  onPressPost: (postId: string) => void;
  onPressProfile: (authorId: string) => void;
  onPressOptions: (post: Post) => void;
  onPressComment: (postId: string) => void;
  onPressRepost: (post: Post) => void;
  onLike: (postId: string) => Promise<void>;
  onBookmark: (postId: string) => Promise<any>;
}

// ────────────────────────────────────────────────
// Helper Utilities
// ────────────────────────────────────────────────

const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (mins < 60) return `${Math.max(1, mins)}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

// ────────────────────────────────────────────────
// Sub-Components
// ────────────────────────────────────────────────

const ActionButton = React.memo(({
  icon,
  count,
  active,
  activeColor,
  onPress,
  activeBg,
}: {
  icon: string;
  count?: number;
  active?: boolean;
  activeColor: string;
  onPress: () => void;
  activeBg: string;
}) => (
  <TouchableOpacity
    className={`flex-row items-center px-3 py-1.5 rounded-xl ${active ? activeBg : "bg-gray-50/50"}`}
    onPress={onPress}
  >
    <Ionicons
      name={icon as any}
      size={18}
      color={active ? activeColor : "#64748B"}
    />
    {count !== undefined && (
      <Text
        className={`text-[11px] font-black ml-1.5 ${active ? `text-[${activeColor}]` : "text-gray-500"}`}
      >
        {count}
      </Text>
    )}
  </TouchableOpacity>
));

const MediaGallery = React.memo(({ images }: { images: string[] }) => {
  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <Image
        source={{ uri: images[0] }}
        className="w-full h-64 rounded-3xl mb-3 border border-gray-50 bg-gray-50"
        contentFit="cover"
        transition={400}
      />
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-3"
      snapToInterval={264}
      decelerationRate="fast"
    >
      {images.map((uri, idx) => (
        <Image
          key={idx}
          source={{ uri }}
          className="w-64 h-64 rounded-3xl border border-gray-50 bg-gray-50 mr-3"
          contentFit="cover"
          transition={400}
        />
      ))}
    </ScrollView>
  );
});

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────

const PostCard = React.memo(
  ({
    item,
    user,
    onPressPost,
    onPressProfile,
    onPressOptions,
    onPressComment,
    onPressRepost,
    onLike,
    onBookmark,
  }: PostCardProps) => {

    const [isExpanded, setIsExpanded] = useState(false);
    const [showSeeMore, setShowSeeMore] = useState(false);

    // Logic: Determine if we are showing the original post or a repost
    const isRepostAction = !!item.isRepost || !!item.repostedByMe;
    const displayPost =
      isRepostAction && item.originalPost ? item.originalPost : item;
    const { author: displayAuthor, id: displayId } = displayPost;

    const createdAtFormatted = useMemo(
      () => formatRelativeTime(displayPost.createdAt),
      [displayPost.createdAt],
    );

    const handleTextLayout = useCallback(
      (e: any) => {
        if (!showSeeMore && e.nativeEvent.lines.length > 5) {
          setShowSeeMore(true);
        }
      },
      [showSeeMore],
    );

    const renderContent = (text: string) => {
      if (!text) return null;
      const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
      return (
        <Text
          className="text-[15px] leading-[22px] text-gray-800 font-medium"
          numberOfLines={isExpanded ? undefined : 5}
          onTextLayout={handleTextLayout}
        >
          {parts.map((part, i) =>
            part.startsWith("#") ? (
              <Text
                key={i}
                className="text-sky-500 font-black"
                onPress={(e) => {
                  e.stopPropagation();
                  router.push(`/explore?q=${encodeURIComponent(part)}`);
                }}
              >
                {part}
              </Text>
            ) : (
              <Text key={i}>{part}</Text>
            ),
          )}
        </Text>
      );
    };

    // Interactions
    const handleLike = useCallback(() => {
      if (!displayPost.isLiked)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onLike(displayId);
    }, [displayPost.isLiked, displayId, onLike]);

    const handleRepost = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPressRepost(item);
    }, [item, onPressRepost]);

    if (!displayPost) return null;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPressPost(displayId)}
        className="bg-white border border-gray-100 rounded-[32px] p-5 shadow-sm shadow-gray-200/50 mb-3"
      >
        {/* Repost Indicator */}
        {isRepostAction && item.author && (
          <View className="flex-row items-center mb-4 ml-1">
            <View className="bg-emerald-50 px-2 py-1 rounded-lg flex-row items-center border border-emerald-100">
              <Ionicons name="repeat" size={12} color="#10B981" />
              <Text className="ml-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                {item.author.id === user?.id ? "You" : item.author.name} Shared
              </Text>
            </View>
          </View>
        )}

        <View className="flex-row">
          {/* Avatar */}
          <TouchableOpacity
            onPress={() => displayAuthor.id && onPressProfile(displayAuthor.id)}
            className="mr-4"
          >
            <View className="shadow-lg shadow-sky-500/10">
              <Image
                source={{
                  uri:
                    displayAuthor.image ||
                    `https://api.dicebear.com/7.x/avataaars/png?seed=${displayAuthor.id}`,
                }}
                className="w-13 h-13 rounded-[22px] bg-gray-50 border border-gray-100"
                contentFit="cover"
                transition={400}
                style={{ width: 52, height: 52 }}
              />
            </View>
          </TouchableOpacity>

          <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-1 mr-2">
                <View className="flex-row items-center">
                  <Text
                    className="font-black text-[16px] text-gray-900 tracking-tight"
                    numberOfLines={1}
                  >
                    {displayAuthor.name || "Member"}
                  </Text>
                  {(displayAuthor.username === "official" || displayAuthor.id === "system") && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#0EA5E9"
                      className="ml-1"
                    />
                  )}
                </View>
                <Text className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mt-0.5">
                  @{displayAuthor.username} · {createdAtFormatted}
                </Text>
              </View>
              <TouchableOpacity
                className="w-9 h-9 items-center justify-center rounded-2xl bg-gray-50/80 border border-gray-100/50"
                onPress={() => onPressOptions(item)}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <View className="mb-4">
              {displayPost.parentPost && !isRepostAction && (
                <View className="mb-2 bg-sky-50/50 px-2.5 py-1.5 rounded-xl self-start border border-sky-100/50">
                  <Text className="text-[11px] font-black text-sky-600 uppercase tracking-tight">
                    Replying to <Text className="text-sky-400">@{displayPost.parentPost.author?.username}</Text>
                  </Text>
                </View>
              )}
              {renderContent(displayPost.content)}
              {showSeeMore && !isExpanded && (
                <TouchableOpacity
                  onPress={() => setIsExpanded(true)}
                  className="mt-1"
                >
                  <Text className="text-sky-500 font-black text-[13px] uppercase tracking-wider">
                    Show more
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Media Section */}
            <MediaGallery
              images={
                displayPost.images ||
                (displayPost.image ? [displayPost.image] : [])
              }
            />

            {/* Action Bar */}
            <View className="flex-row justify-between items-center mt-2 pr-2">
              <ActionButton
                icon="chatbubble-outline"
                count={displayPost._count?.replies}
                activeColor="#64748B"
                activeBg="bg-gray-100/50"
                onPress={() => onPressComment(displayId)}
              />
              <ActionButton
                icon="repeat"
                count={item.repostsCount ?? displayPost._count?.reposts}
                active={!!item.repostedByMe}
                activeColor="#10B981"
                activeBg="bg-emerald-50"
                onPress={handleRepost}
              />
              <ActionButton
                icon={displayPost.isLiked ? "heart" : "heart-outline"}
                count={displayPost._count?.likes}
                active={displayPost.isLiked}
                activeColor="#F43F5E"
                activeBg="bg-rose-50"
                onPress={handleLike}
              />
              <ActionButton
                icon={
                  displayPost.isBookmarked ? "bookmark" : "bookmark-outline"
                }
                active={displayPost.isBookmarked}
                activeColor="#0EA5E9"
                activeBg="bg-sky-50"
                onPress={() => onBookmark(displayId)}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

PostCard.displayName = "PostCard";
export default PostCard;
