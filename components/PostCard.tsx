import React, { useState, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// ────────────────────────────────────────────────
// Types
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
  // Computed booleans from backend
  isLiked?: boolean;
  isBookmarked?: boolean;
  repostedByMe?: boolean;
  isAuthor?: boolean;
  hasMoreReplies?: boolean;
  isDeleted?: boolean;
  _count: {
    replies: number;
    reposts: number;
    likes: number;
    quotes: number;
  };
  viewCount?: number;
  repostsCount?: number;
  previewReplies?: Post[];
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
  onBookmark: (postId: string) => Promise<void>;
}

// ────────────────────────────────────────────────
// Post Card (Memoized)
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
    const router = useRouter();
    // State for handling "See more" text expansion
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSeeMore, setShowSeeMore] = useState(false);

    const isRepost = !!item.isRepost || !!item.repostedByMe;
    const displayPost =
      isRepost && item.originalPost ? item.originalPost : item;

    const displayAuthor = displayPost.author;
    const displayId = displayPost.id;

    const hasLiked = displayPost.isLiked ?? false;

    const isBookmarked = displayPost.isBookmarked ?? false;

    const hasReposted = item.repostedByMe ?? false;

    const createdAtFormatted = useMemo(() => {
      if (!displayPost.createdAt) return "";
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(displayPost.createdAt));
    }, [displayPost.createdAt]);

    // Check text layout to determine if "See more" is needed
    const handleTextLayout = useCallback(
      (e: any) => {
        if (!showSeeMore && e.nativeEvent.lines.length > 5) {
          setShowSeeMore(true);
        }
      },
      [showSeeMore],
    );

    if (!displayPost) return null;

    const renderContent = (text: string) => {
      if (!text) return null;
      const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
      return (
        <Text
          className="text-[15px] leading-[23px] text-gray-800"
          numberOfLines={isExpanded ? undefined : showSeeMore ? 5 : undefined}
          onTextLayout={handleTextLayout}
        >
          {parts.map((part, i) => {
            if (part.startsWith("#")) {
              return (
                <Text
                  key={i}
                  className="text-[#1D9BF0]"
                  onPress={() =>
                    router.push(`/explore?q=${encodeURIComponent(part)}`)
                  }
                >
                  {part}
                </Text>
              );
            }
            return <Text key={i}>{part}</Text>;
          })}
        </Text>
      );
    };

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onPressPost(displayId)}
        className="bg-white border-b border-gray-100/80 px-4 pt-4 pb-2"
      >
        {/* Repost header */}
        {isRepost && item.author && (
          <View className="flex-row items-center mb-2 ml-14">
            <Ionicons name="repeat" size={16} color="#6B7280" />
            <Text className="ml-2 text-xs font-semibold text-gray-500">
              {item.author.name} reposted
            </Text>
          </View>
        )}

        <View className="flex-row">
          {/* Avatar */}
          <TouchableOpacity
            onPress={() => displayAuthor.id && onPressProfile(displayAuthor.id)}
          >
            <Image
              source={{
                uri: displayAuthor.image || "https://via.placeholder.com/48",
              }}
              className="w-12 h-12 rounded-full bg-gray-100 mr-3"
            />
          </TouchableOpacity>

          <View className="flex-1">
            {/* Name + username + time + options */}
            <View className="flex-row items-center mb-0.5">
              <Text
                className="font-bold text-[15px] text-gray-900 flex-shrink"
                numberOfLines={1}
              >
                {displayAuthor.name || "User"}
              </Text>
              <Text className="text-gray-500 text-[13.5px] ml-1.5 flex-shrink" numberOfLines={1}>
                @{displayAuthor.username || "user"} · {createdAtFormatted}
              </Text>
              <TouchableOpacity
                className="ml-auto p-1.5"
                onPress={() => onPressOptions(item)}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {/* Content with See More Logic */}
            <View className="mb-3">
              {renderContent(displayPost.content)}

              {/* See More Button */}
              {showSeeMore && !isExpanded && (
                <TouchableOpacity
                  onPress={() => setIsExpanded(true)}
                  className="mt-1"
                >
                  <Text className="text-[#1D9BF0] text-[15px]">See more</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Images */}
            {(() => {
              const imgs = displayPost.images?.length
                ? displayPost.images
                : displayPost.image
                  ? [displayPost.image]
                  : [];
              if (imgs.length === 0) return null;

              if (imgs.length === 1) {
                return (
                  <Image
                    source={{ uri: imgs[0] }}
                    className="w-full h-56 rounded-2xl mb-3 border border-gray-100 bg-gray-50"
                    resizeMode="cover"
                  />
                );
              }

              return (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-3 flex-row"
                >
                  {imgs.map((uri: string, idx: number) => (
                    <Image
                      key={idx}
                      source={{ uri }}
                      className="w-64 h-56 rounded-2xl border border-gray-100 bg-gray-50 mr-2"
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              );
            })()}

            {/* Action row */}
            <View className="flex-row justify-between items-center pr-2 mt-1">
              {/* Comment */}
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => onPressComment(displayId)}
              >
                <Ionicons name="chatbubble-outline" size={19} color="#6B7280" />
                <Text className="text-xs text-gray-500 ml-1.5">
                  {displayPost._count?.replies ?? 0}
                </Text>
              </TouchableOpacity>

              {/* Repost */}
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => onPressRepost(item)}
              >
                <Ionicons
                  name="repeat-outline"
                  size={21}
                  color={hasReposted ? "#00BA7C" : "#6B7280"}
                />
                <Text
                  className={`text-xs ml-1.5 ${hasReposted ? "text-[#00BA7C] font-medium" : "text-gray-500"}`}
                >
                  {item.repostsCount ?? displayPost._count?.reposts ?? 0}
                </Text>
              </TouchableOpacity>

              {/* Like */}
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => onLike(displayId)}
              >
                <Ionicons
                  name={hasLiked ? "heart" : "heart-outline"}
                  size={20}
                  color={hasLiked ? "#F91880" : "#6B7280"}
                />
                <Text
                  className={`text-xs ml-1.5 ${hasLiked ? "text-[#F91880] font-medium" : "text-gray-500"}`}
                >
                  {displayPost._count?.likes ?? 0}
                </Text>
              </TouchableOpacity>

              {/* Views */}
              <View className="flex-row items-center">
                <Ionicons
                  name="stats-chart-outline"
                  size={18}
                  color="#6B7280"
                />
                <Text className="text-xs text-gray-500 ml-1.5">
                  {displayPost.viewCount ?? 0}
                </Text>
              </View>

              {/* Bookmark */}
              <TouchableOpacity onPress={() => onBookmark(displayId)}>
                <Ionicons
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={19}
                  color={isBookmarked ? "#1D9BF0" : "#6B7280"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

PostCard.displayName = "PostCard";
export default PostCard;
