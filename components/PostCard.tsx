import React, { useState, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

const ActionButton = ({
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
);

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
    const router = useRouter();
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
    const handleLike = () => {
      if (!displayPost.isLiked)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onLike(displayId);
    };

    const handleRepost = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPressRepost(item);
    };

    if (!displayPost) return null;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPressPost(displayId)}
        className="bg-white border border-gray-100 rounded-[32px] p-4 shadow-sm shadow-gray-200 mb-2"
      >
        {/* Repost Indicator */}
        {isRepostAction && item.author && (
          <View className="flex-row items-center mb-3 ml-2">
            <Ionicons name="repeat" size={14} color="#10B981" />
            <Text className="ml-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
              {item.author.id === user?.id ? "You" : item.author.name} Shared
            </Text>
          </View>
        )}

        <View className="flex-row">
          {/* Avatar */}
          <TouchableOpacity
            onPress={() => displayAuthor.id && onPressProfile(displayAuthor.id)}
            className="mr-3 shadow-md shadow-sky-100"
          >
            <Image
              source={{
                uri:
                  displayAuthor.image ||
                  `https://api.dicebear.com/7.x/avataaars/png?seed=${displayAuthor.id}`,
              }}
              className="w-12 h-12 rounded-2xl bg-gray-100"
              contentFit="cover"
              transition={300}
            />
          </TouchableOpacity>

          <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-1 mr-2">
                <View className="flex-row items-center">
                  <Text
                    className="font-black text-[15px] text-gray-900 tracking-tighter"
                    numberOfLines={1}
                  >
                    {displayAuthor.name || "Member"}
                  </Text>
                  {displayAuthor.username === "oasis" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#0EA5E9"
                      className="ml-0.5"
                    />
                  )}
                </View>
                <Text className="text-gray-400 text-[11px] font-bold uppercase tracking-tight">
                  @{displayAuthor.username} · {createdAtFormatted}
                </Text>
              </View>
              <TouchableOpacity
                className="w-8 h-8 items-center justify-center rounded-xl bg-gray-50"
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
            <View className="mb-3">
              {displayPost.parentPost && !isRepostAction && (
                <View className="mb-2 bg-sky-50 px-2 py-1 rounded-lg self-start">
                  <Text className="text-[11px] font-bold text-sky-600">
                    Replying to @{displayPost.parentPost.author?.username}
                  </Text>
                </View>
              )}
              {renderContent(displayPost.content)}
              {showSeeMore && !isExpanded && (
                <TouchableOpacity
                  onPress={() => setIsExpanded(true)}
                  className="mt-1"
                >
                  <Text className="text-sky-500 font-bold text-[14px]">
                    Read full story
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
            <View className="flex-row justify-between items-center mt-1">
              <ActionButton
                icon="chatbubble-outline"
                count={displayPost._count?.replies}
                activeColor="#64748B"
                activeBg="bg-gray-50"
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

// Helper component for Media
const MediaGallery = ({ images }: { images: string[] }) => {
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
};

PostCard.displayName = "PostCard";
export default PostCard;

// // same code with above .
// import React, { useState, useMemo, useCallback } from "react";
// import { View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { Image } from "expo-image";
// import * as Haptics from "expo-haptics";
// import { BlurView } from "expo-blur";

// // ────────────────────────────────────────────────
// // Types
// // ────────────────────────────────────────────────
// export interface User {
//   id: string;
//   name: string;
//   username?: string;
//   image?: string;
// }

// export interface Post {
//   id: string;
//   content: string;
//   image?: string;
//   images?: string[];
//   createdAt: string;
//   author: User;
//   authorId?: string;
//   isRepost?: boolean;
//   originalPost?: Post;
//   // Computed booleans from backend
//   isLiked?: boolean;
//   isBookmarked?: boolean;
//   repostedByMe?: boolean;
//   isAuthor?: boolean;
//   hasMoreReplies?: boolean;
//   isDeleted?: boolean;
//   isReply?: boolean;
//   parentPost?: Post;
//   _count: {
//     replies: number;
//     reposts: number;
//     likes: number;
//     quotes: number;
//   };
//   viewCount?: number;
//   repostsCount?: number;
//   previewReplies?: Post[];
// }

// export interface PostCardProps {
//   item: Post;
//   user: User | null;
//   onPressPost: (postId: string) => void;
//   onPressProfile: (authorId: string) => void;
//   onPressOptions: (post: Post) => void;
//   onPressComment: (postId: string) => void;
//   onPressRepost: (post: Post) => void;
//   onLike: (postId: string) => Promise<void>;
//   onBookmark: (postId: string) => Promise<void>;
// }

// // ────────────────────────────────────────────────
// // Post Card (Memoized)
// // ────────────────────────────────────────────────
// const PostCard = React.memo(
//   ({
//     item,
//     user,
//     onPressPost,
//     onPressProfile,
//     onPressOptions,
//     onPressComment,
//     onPressRepost,
//     onLike,
//     onBookmark,
//   }: PostCardProps) => {
//     const router = useRouter();
//     // State for handling "See more" text expansion
//     const [isExpanded, setIsExpanded] = useState(false);
//     const [showSeeMore, setShowSeeMore] = useState(false);

//     const isRepost = !!item.isRepost || !!item.repostedByMe;
//     const displayPost =
//       isRepost && item.originalPost ? item.originalPost : item;

//     const displayAuthor = displayPost.author;
//     const displayId = displayPost.id;

//     const hasLiked = displayPost.isLiked ?? false;
//     const isBookmarked = displayPost.isBookmarked ?? false;
//     const hasReposted = item.repostedByMe ?? false;

//     const createdAtFormatted = useMemo(() => {
//       if (!displayPost.createdAt) return "";
//       const date = new Date(displayPost.createdAt);
//       const now = new Date();
//       const diff = now.getTime() - date.getTime();
//       const mins = Math.floor(diff / 60000);
//       const hrs = Math.floor(mins / 60);
//       const days = Math.floor(hrs / 24);

//       if (mins < 60) return `${mins}m`;
//       if (hrs < 24) return `${hrs}h`;
//       if (days < 7) return `${days}d`;

//       return new Intl.DateTimeFormat("en-US", {
//         month: "short",
//         day: "numeric",
//       }).format(date);
//     }, [displayPost.createdAt]);

//     // Check text layout to determine if "See more" is needed
//     const handleTextLayout = useCallback(
//       (e: any) => {
//         if (!showSeeMore && e.nativeEvent.lines.length > 5) {
//           setShowSeeMore(true);
//         }
//       },
//       [showSeeMore],
//     );

//     if (!displayPost) return null;

//     const renderContent = (text: string) => {
//       if (!text) return null;
//       const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
//       return (
//         <Text
//           className="text-[15px] leading-[22px] text-gray-800 font-medium"
//           numberOfLines={isExpanded ? undefined : showSeeMore ? 5 : undefined}
//           onTextLayout={handleTextLayout}
//         >
//           {parts.map((part, i) => {
//             if (part.startsWith("#")) {
//               return (
//                 <Text
//                   key={i}
//                   className="text-sky-500 font-black"
//                   onPress={(e) => {
//                     e.stopPropagation();
//                     router.push(`/explore?q=${encodeURIComponent(part)}`);
//                   }}
//                 >
//                   {part}
//                 </Text>
//               );
//             }
//             return <Text key={i}>{part}</Text>;
//           })}
//         </Text>
//       );
//     };

//     const handleActionLike = useCallback(() => {
//       if (!hasLiked) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//       onLike(displayId);
//     }, [hasLiked, onLike, displayId]);

//     const handleActionRepost = useCallback(() => {
//       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//       onPressRepost(item);
//     }, [onPressRepost, item]);

//     const handleActionBookmark = useCallback(() => {
//       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//       onBookmark(displayId);
//     }, [onBookmark, displayId]);

//     return (
//       <TouchableOpacity
//         activeOpacity={0.9}
//         onPress={() => onPressPost(displayId)}
//         className="bg-white border border-gray-100 rounded-[32px] p-4 shadow-sm shadow-gray-200 mb-2"
//       >
//         {/* Repost header */}
//         {isRepost && item.author && (
//           <View className="flex-row items-center mb-3 ml-2">
//             <Ionicons name="repeat" size={14} color="#10B981" />
//             <Text className="ml-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
//               {item.author.name === user?.name ? "You" : item.author.name} Shared
//             </Text>
//           </View>
//         )}

//         <View className="flex-row">
//           {/* Avatar Area */}
//           <View className="mr-3">
//             <TouchableOpacity
//               onPress={() => displayAuthor.id && onPressProfile(displayAuthor.id)}
//               className="shadow-md shadow-sky-100"
//             >
//               <Image
//                 source={{
//                   uri: displayAuthor.image || "https://api.dicebear.com/7.x/avataaars/png?seed=" + displayAuthor.id,
//                 }}
//                 className="w-12 h-12 rounded-2xl bg-gray-50 bg-white"
//                 contentFit="cover"
//                 transition={300}
//               />
//             </TouchableOpacity>
//           </View>

//           <View className="flex-1">
//             {/* Header: Name + Username + Time */}
//             <View className="flex-row items-center justify-between mb-1">
//               <View className="flex-1 mr-2">
//                 <View className="flex-row items-center">
//                   <Text
//                     className="font-black text-[15px] text-gray-900 tracking-tighter"
//                     numberOfLines={1}
//                   >
//                     {displayAuthor.name || "Member"}
//                   </Text>
//                   {displayAuthor.username === 'oasis' && (
//                      <Ionicons name="checkmark-seal" size={16} color="#0EA5E9" className="ml-0.5" />
//                   )}
//                 </View>
//                 <Text className="text-gray-400 text-[11px] font-bold uppercase tracking-tight" numberOfLines={1}>
//                   @{displayAuthor.username || "user"} · {createdAtFormatted}
//                 </Text>
//               </View>

//               <TouchableOpacity
//                 className="w-8 h-8 items-center justify-center rounded-xl bg-gray-50"
//                 onPress={() => onPressOptions(item)}
//               >
//                 <Ionicons name="ellipsis-horizontal" size={16} color="#94A3B8" />
//               </TouchableOpacity>
//             </View>

//             {/* Replying Context */}
//             {displayPost.parentPost && !isRepost && (
//               <View className="mb-2 bg-sky-50 px-2 py-1 rounded-lg self-start">
//                 <Text className="text-[11px] font-bold text-sky-600">
//                   Replying to @{displayPost.parentPost.author?.username || "oasis"}
//                 </Text>
//               </View>
//             )}

//             {/* Content Body */}
//             <View className="mb-3">
//               {renderContent(displayPost.content)}

//               {showSeeMore && !isExpanded && (
//                 <TouchableOpacity
//                   onPress={() => setIsExpanded(true)}
//                   className="mt-1"
//                 >
//                   <Text className="text-sky-500 font-bold text-[14px]">Read full story</Text>
//                 </TouchableOpacity>
//               )}
//             </View>

//             {/* Visual Media (Optimized for Pinterest-like corners) */}
//             {(() => {
//               const imgs = displayPost.images?.length
//                 ? displayPost.images
//                 : displayPost.image
//                   ? [displayPost.image]
//                   : [];
//               if (imgs.length === 0) return null;

//               if (imgs.length === 1) {
//                 return (
//                   <Image
//                     source={{ uri: imgs[0] }}
//                     className="w-full h-64 rounded-3xl mb-3 border border-gray-50 bg-gray-50"
//                     contentFit="cover"
//                     transition={400}
//                   />
//                 );
//               }

//               return (
//                 <ScrollView
//                   horizontal
//                   showsHorizontalScrollIndicator={false}
//                   className="mb-3 flex-row"
//                   snapToInterval={264}
//                   decelerationRate="fast"
//                 >
//                   {imgs.map((uri: string, idx: number) => (
//                     <Image
//                       key={idx}
//                       source={{ uri }}
//                       className="w-64 h-64 rounded-3xl border border-gray-50 bg-gray-50 mr-3"
//                       contentFit="cover"
//                       transition={400}
//                     />
//                   ))}
//                 </ScrollView>
//               );
//             })()}

//             {/* Glassy Action Bar */}
//             <View className="flex-row justify-between items-center pr-2 mt-1">
//               <TouchableOpacity
//                 className="flex-row items-center px-3 py-1.5 rounded-xl bg-gray-50/50"
//                 onPress={() => onPressComment(displayId)}
//               >
//                 <Ionicons name="chatbubble-outline" size={17} color="#64748B" />
//                 <Text className="text-[11px] font-black text-gray-500 ml-1.5">
//                   {displayPost._count?.replies ?? 0}
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 className={`flex-row items-center px-3 py-1.5 rounded-xl ${hasReposted ? 'bg-emerald-50' : 'bg-gray-50/50'}`}
//                 onPress={handleActionRepost}
//               >
//                 <Ionicons
//                   name="repeat"
//                   size={18}
//                   color={hasReposted ? "#10B981" : "#64748B"}
//                 />
//                 <Text
//                   className={`text-[11px] font-black ml-1.5 ${hasReposted ? "text-emerald-500" : "text-gray-500"}`}
//                 >
//                    {item.repostsCount ?? displayPost._count?.reposts ?? 0}
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 className={`flex-row items-center px-3 py-1.5 rounded-xl ${hasLiked ? 'bg-rose-50' : 'bg-gray-50/50'}`}
//                 onPress={handleActionLike}
//               >
//                 <Ionicons
//                   name={hasLiked ? "heart" : "heart-outline"}
//                   size={18}
//                   color={hasLiked ? "#F43F5E" : "#64748B"}
//                 />
//                 <Text
//                   className={`text-[11px] font-black ml-1.5 ${hasLiked ? "text-rose-500" : "text-gray-500"}`}
//                 >
//                   {displayPost._count?.likes ?? 0}
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 onPress={handleActionBookmark}
//                 className={`w-9 h-9 items-center justify-center rounded-xl ${isBookmarked ? 'bg-sky-50' : 'bg-gray-50/50'}`}
//               >
//                 <Ionicons
//                   name={isBookmarked ? "bookmark" : "bookmark-outline"}
//                   size={17}
//                   color={isBookmarked ? "#0EA5E9" : "#64748B"}
//                 />
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </TouchableOpacity>
//     );
//   },
// );

// PostCard.displayName = "PostCard";
// export default PostCard;
