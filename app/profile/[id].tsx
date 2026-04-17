import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useSelector } from "react-redux";
import PostCard, { Post } from "../../components/PostCard";
import PostOptionsModal from "../../components/PostOptionsModal";
import { useCreateChatRoomMutation } from "../../store/chatApi";
import {
  useBookmarkPostMutation,
  useDeletePostMutation,
  useLikePostMutation,
} from "../../store/postApi";
import {
  useBlockUserMutation,
  useFollowUserMutation,
  useGetProfileQuery,
  useGetUserLikesQuery,
  useGetUserPostsQuery,
  useGetUserRepliesQuery,
  useMuteUserMutation,
} from "../../store/profileApi";
import UserActionModal from "@/components/UserActionModal";

export default function UserProfileScreen() {
  const { id, tab } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const user = useSelector((state: any) => state.auth.user);

  const [muteUser] = useMuteUserMutation();
  const [blockUser] = useBlockUserMutation();

  // Theme Sync
  const isDark = theme?.isDark ?? true;
  const accentColor = theme?.accentColor ?? "#6366F1";

  const [activeTab, setActiveTab] = useState<"posts" | "replies" | "likes">(
    (tab as any) || "posts",
  );
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [postForOptions, setPostForOptions] = useState<Post | null>(null);

  // API Queries
  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetProfileQuery(id as string, { skip: !id });
  const { data: postData, refetch: refetchPosts } = useGetUserPostsQuery(
    { id: id as string },
    { skip: !id || activeTab !== "posts" },
  );
  const { data: likeData, refetch: refetchLikes } = useGetUserLikesQuery(
    { id: id as string },
    { skip: !id || activeTab !== "likes" },
  );
  const { data: replyData, refetch: refetchReplies } = useGetUserRepliesQuery(
    { id: id as string },
    { skip: !id || activeTab !== "replies" },
  );

  // Mutations
  const [followUser] = useFollowUserMutation();
  // const [createChatRoom] = useCreateChatRoomMutation();
  const [likePost] = useLikePostMutation();
  const [deletePost] = useDeletePostMutation();
  const [bookmarkPost] = useBookmarkPostMutation();

  useEffect(() => {
    if (profile) {
      console.log("--- PROFILE DATA CHECK ---");
      console.log("Name:", profile.name);
      console.log("I follow them:", profile.isFollowing);
      // This will print EVERY key available in the profile object
      console.log("Available Keys:", Object.keys(profile));
      console.log("--------------------------");
    }
  }, [profile]);

  // Handlers
  const handleLike = useCallback(
    async (postId: string) => {
      try {
        await likePost({ postId }).unwrap();
      } catch (err) {
        console.error(err);
      }
    },
    [likePost],
  );

  const handleFollow = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await followUser(id as string).unwrap();
    } catch (e) {
      console.error(e);
    }
  };

  // Add the bookmark handler
  const handleBookmark = useCallback(
    async (postId: string) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await bookmarkPost(postId).unwrap();
      } catch (err) {
        console.error("Bookmark failed", err);
      }
    },
    [bookmarkPost],
  );

  const [createChatRoom, { isLoading: isCreatingChat }] =
    useCreateChatRoomMutation();

  const handleMessage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const room = await createChatRoom(id as string).unwrap();
      router.push(`/chat/${room.id}?title=${profile.name}`);
    } catch (e) {
      console.error(e);
      Alert.alert("Chat", "Follow each other to start a conversation.");
    }
  };

  // const handleMoreActions = () => {
  //   Alert.alert(
  //     "Privacy Actions",
  //     "Choose how you interact with this member.",
  //     [
  //       {
  //         text: "Mute Member",
  //         onPress: async () => {
  //           await muteUser(id as string).unwrap();
  //           Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  //           Alert.alert(
  //             "User Muted",
  //             "You won't see their posts in your feed anymore.",
  //           );
  //         },
  //       },
  //       {
  //         text: "Block Member",
  //         onPress: async () => {
  //           await blockUser(id as string).unwrap();
  //           Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  //           router.back();
  //         },
  //         style: "destructive",
  //       },
  //       { text: "Cancel", style: "cancel" },
  //     ],
  //   );
  // };
  // 1. Add state at the top of UserProfileScreen
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  // 2. Updated handleMoreActions function
  const handleMoreActions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPrivacyModalVisible(true);
  };

  // 3. Define the actual Logic functions
  const onMuteUser = async () => {
    try {
      await muteUser(id as string).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Muted", "You won't see posts from this user anymore.");
    } catch (err) {
      console.error(err);
    }
  };

  const onBlockUser = async () => {
    try {
      await blockUser(id as string).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.back();
    } catch (err) {
      console.error(err);
    }
  };

  // const handleMessage = async () => {
  //   try {
  //     // 1. Provide physical feedback
  //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  //     // 2. Call the API to get or create a room with this user
  //     // We unwrap() so we can catch errors immediately
  //     const room = await createChatRoom(id as string).unwrap();

  //     // 3. Navigate to the chat screen with the room ID
  //     // We pass the profile name as a title for the header
  //     router.push({
  //       pathname: `/chat/${room.id}`,
  //       params: { title: profile.name },
  //     });
  //   } catch (e: any) {
  //     console.error("Chat Room Error:", e);

  //     // Friendly error if something goes wrong
  //     Alert.alert(
  //       "Connection Error",
  //       e?.data?.message ||
  //         "We couldn't start a conversation right now. Please try again later.",
  //     );
  //   }
  // };

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetchProfile();
    if (activeTab === "posts") refetchPosts();
    if (activeTab === "likes") refetchLikes();
    if (activeTab === "replies") refetchReplies();
  };

  const currentData = useMemo(() => {
    if (activeTab === "posts") return postData?.posts || [];
    if (activeTab === "likes") return likeData?.posts || [];
    if (activeTab === "replies") return replyData?.posts || [];
    return [];
  }, [activeTab, postData, likeData, replyData]);

  if (isProfileLoading) {
    return (
      <View
        className={`flex-1 justify-center items-center ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}
      >
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  const isMe = user?.id === id;

  const Header = () => (
    <View>
      {/* Floating Header */}
      <BlurView
        intensity={20}
        tint={isDark ? "dark" : "light"}
        className="absolute top-0 left-0 right-0 z-50 flex-row items-center px-5 h-24"
        style={{ paddingTop: insets.top }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className={`w-10 h-10 items-center justify-center rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100 shadow-sm"}`}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={isDark ? "#94A3B8" : "#64748B"}
          />
        </TouchableOpacity>
        <View className="ml-4 flex-1">
          <Text
            className={`text-sm font-black tracking-widest uppercase ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {profile?.name}
          </Text>
          <Text
            style={{ color: accentColor }}
            className="font-black text-[9px] uppercase tracking-[2px]"
          >
            {profile?._count?.posts || 0} Moments
          </Text>
        </View>
      </BlurView>

      {/* Cover Area */}
      <View className="h-64 bg-slate-200 dark:bg-slate-800">
        {profile?.coverImage ? (
          <Image
            source={{ uri: profile.coverImage }}
            className="w-full h-full"
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[accentColor, "#818CF8", "#A5B4FC"]}
            className="w-full h-full opacity-40"
          />
        )}
      </View>

      {/* Profile Details Card */}
      <View
        className={`mx-5 -mt-16 rounded-[40px] border p-6 mb-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-xl shadow-slate-200"}`}
      >
        <View className="flex-row justify-between items-start">
          <Image
            source={{
              uri:
                profile?.image ||
                "https://api.dicebear.com/7.x/avataaars/png?seed=" +
                  profile?.username,
            }}
            className={`w-24 h-24 rounded-[32px] border-4 ${isDark ? "border-slate-900" : "border-white"}`}
            contentFit="cover"
          />
          {/* <View className="flex-row mt-2">
            {!isMe && (
              <>
                <TouchableOpacity
                  onPress={handleFollow}
                  style={{
                    backgroundColor: profile?.isFollowing
                      ? isDark
                        ? "#1E293B"
                        : "#F1F5F9"
                      : accentColor,
                  }}
                  className="px-6 py-3 rounded-2xl mr-2"
                >
                  <Text
                    className={`font-black uppercase tracking-widest text-[10px] ${profile?.isFollowing ? "text-slate-500" : "text-white"}`}
                  >
                    {profile?.isFollowing ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
                {profile.isFollowing && profile.isFollowedBy && (
                  <TouchableOpacity
                    onPress={handleMessage}
                    className={`w-11 h-11 items-center justify-center rounded-2xl mr-2 border ${
                      isDark
                        ? "bg-slate-800 border-slate-700"
                        : "bg-white border-gray-100 shadow-sm"
                    }`}
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={18}
                      color={accentColor}
                    />
                  </TouchableOpacity>
                )}
                {profile.isFollowing ||
                  (profile.isFollowedBy && (
                    <TouchableOpacity
                      onPress={handleMessage}
                      className={`w-11 h-11 bg- items-center justify-center rounded-2xl mr-2 border ${
                        isDark
                          ? "bg-slate-800 border-slate-700"
                          : "bg-white border-gray-100 shadow-sm"
                      }`}
                    >
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={18}
                        color={accentColor}
                      />
                    </TouchableOpacity>
                  ))}
                {profile.isFollowing ||
                  (profile.isFollowedBy && (
                    <TouchableOpacity
                      onPress={() => router.push(`/chat/${profile.username}`)}
                      className={`w-11 h-11 bg-pink-500 items-center justify-center rounded-2xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
                    >
                      <Ionicons
                        name="mail-outline"
                        size={18}
                        color={accentColor}
                      />
                    </TouchableOpacity>
                  ))}
                {profile.isFollowing &&
                  (profile.isFollowedBy ||
                    profile.followsMe ||
                    profile.isFollowingMe) && (
                    <TouchableOpacity
                      onPress={handleMessage}
                      disabled={isCreatingChat}
                      className={`w-11 h-11 items-center justify-center rounded-2xl mr-2 border ${
                        isDark
                          ? "bg-slate-800 border-slate-700"
                          : "bg-white border-gray-100 shadow-sm"
                      }`}
                    >
                      {isCreatingChat ? (
                        <ActivityIndicator size="small" color={accentColor} />
                      ) : (
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={18}
                          color={accentColor}
                        />
                      )}
                    </TouchableOpacity>
                  )}
              </>
            )}
            {isMe && (
              <TouchableOpacity
                onPress={() => router.push("/profile/update")}
                className={`px-6 py-3 rounded-2xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
              >
                <Text
                  className={`font-black uppercase tracking-widest text-[10px] ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Edit Profile
                </Text>
              </TouchableOpacity>
            )}
          </View> */}
          <View className="flex-row mt-2">
            {!isMe && (
              <>
                {/* 1. FOLLOW BUTTON */}
                <TouchableOpacity
                  onPress={handleFollow}
                  style={{
                    backgroundColor: profile?.isFollowing
                      ? isDark
                        ? "#1E293B"
                        : "#F1F5F9"
                      : accentColor,
                  }}
                  className="px-6 py-3 rounded-2xl mr-2"
                >
                  <Text
                    className={`font-black uppercase tracking-widest text-[10px] ${
                      profile?.isFollowing ? "text-slate-500" : "text-white"
                    }`}
                  >
                    {profile?.isFollowing ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>

                {/* 1. MESSAGE ICON - Shows as long as YOU follow THEM */}
                {profile?.isFollowing && (
                  <TouchableOpacity
                    onPress={handleMessage}
                    disabled={isCreatingChat}
                    className={`w-11 h-11 items-center justify-center rounded-2xl mr-2 border ${
                      isDark
                        ? "bg-slate-800 border-slate-700"
                        : "bg-white border-gray-100 shadow-sm"
                    }`}
                  >
                    {isCreatingChat ? (
                      <ActivityIndicator size="small" color={accentColor} />
                    ) : (
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={18}
                        color={accentColor}
                      />
                    )}
                  </TouchableOpacity>
                )}
                {/* 3. SECURITY/OPTIONS BUTTON */}
                <TouchableOpacity
                  onPress={handleMoreActions}
                  className={`w-11 h-11 items-center justify-center rounded-2xl border ${
                    isDark
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <Ionicons name="shield-outline" size={18} color="#F43F5E" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View className="mt-4">
          <View className="flex-row items-center">
            <Text
              className={`text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {profile?.name}
            </Text>
            {profile?.isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={accentColor}
                className="ml-1"
              />
            )}
          </View>
          <Text className="text-slate-500 font-bold text-xs">
            @{profile?.username}
          </Text>
        </View>

        <Text
          className={`mt-3 text-sm font-medium leading-5 ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          {profile?.bio || "Practicing mindfulness and creating peace."}
        </Text>

        {/* Stats Row */}
        <View className="flex-row mt-6 pt-6 border-t border-slate-800/10">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/profile/following",
                params: { userId: profile.id },
              })
            }
            className="flex-row items-baseline"
          >
            <View className="mr-8">
              <Text
                className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {profile?._count?.following || 0}
              </Text>
              <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Following
              </Text>
            </View>
          </TouchableOpacity>
          {/*  */}
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/profile/followers",
                params: { userId: profile.id },
              })
            }
            className="flex-row items-baseline"
          >
            <View>
              <Text
                className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {profile?._count?.followers || 0}
              </Text>
              <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Followers
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-5 mb-4">
        <View
          className={`flex-row p-1 rounded-2xl ${isDark ? "bg-slate-900" : "bg-gray-100"}`}
        >
          {(["posts", "replies", "likes"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(t);
              }}
              className={`flex-1 py-3 rounded-xl items-center ${activeTab === t ? (isDark ? "bg-slate-800" : "bg-white shadow-sm") : ""}`}
            >
              <Text
                className={`text-[10px] font-black uppercase tracking-widest ${activeTab === t ? (isDark ? "text-white" : "text-slate-900") : "text-slate-500"}`}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {/* <Stack.Screen options={{ headerShown: false }} /> */}
      <FlatList
        data={currentData}
        ListHeaderComponent={Header}
        renderItem={({ item }) => (
          <View className="px-5 mb-4">
            <PostCard
              item={item}
              user={user}
              onPressPost={(pid) => router.push(`/post/${pid}`)}
              onPressProfile={(aid) =>
                aid !== id && router.push(`/profile/${aid}`)
              }
              onLike={handleLike}
              onPressOptions={(p) => {
                setPostForOptions(p);
                setOptionsModalVisible(true);
              }}
              // --- ADD THESE MISSING PROPS ---
              onPressComment={(pid) => router.push(`/post/${pid}`)} // Usually same as pressing post
              onPressRepost={(p) => {
                // If you have a repost modal, trigger it here
                // For now, we can just log it or call your existing logic
                console.log("Repost pressed for:", p.id);
              }}
              onBookmark={handleBookmark}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isProfileLoading}
            onRefresh={onRefresh}
            tintColor={accentColor}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      />

      <PostOptionsModal
        isVisible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        isOwner={postForOptions?.author?.id === user?.id}
        onDelete={async () => {
          if (!postForOptions?.id) return;
          await deletePost({ id: postForOptions.id }).unwrap();
          setOptionsModalVisible(false);
        }}
      />

      <UserActionModal
        isVisible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
        onMute={onMuteUser}
        onBlock={onBlockUser}
        isDark={isDark}
        username={profile?.username || ""}
      />
    </View>
  );
}

// ORIGINAL CODE
// import { Ionicons } from "@expo/vector-icons";
// import { BlurView } from "expo-blur";
// import * as Haptics from "expo-haptics";
// import { Image } from "expo-image";
// import { LinearGradient } from "expo-linear-gradient";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useCallback, useMemo, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   Platform,
//   RefreshControl,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useTheme } from "../../context/ThemeContext";
// import { useSelector } from "react-redux";
// import PostCard, { Post } from "../../components/PostCard";
// import PostOptionsModal from "../../components/PostOptionsModal";
// import RepostModal from "../../components/RepostModal";
// import { useCreateChatRoomMutation } from "../../store/chatApi";
// import {
//   useBookmarkPostMutation,
//   useDeletePostMutation,
//   useLikePostMutation,
//   useRepostPostMutation,
//   useDeleteRepostMutation,
// } from "../../store/postApi";
// import {
//   useBlockUserMutation,
//   useFollowUserMutation,
//   useGetProfileQuery,
//   useGetUserLikesQuery,
//   useGetUserPostsQuery,
//   useGetUserRepliesQuery,
//   useMuteUserMutation,
// } from "../../store/profileApi";
// import { Animated } from "react-native";

// export default function UserProfileScreen() {
//   const { id, tab, title: searchTitle } = useLocalSearchParams();
//   const router = useRouter();
//   const insets = useSafeAreaInsets();
//   const { isDark } = useTheme();
//   const user = useSelector((state: any) => state.auth.user);

//   const [activeTab, setActiveTab] = useState<"posts" | "replies" | "likes">(
//     (tab as any) || "posts",
//   );
//   const [tabProgress] = useState(
//     new Animated.Value(
//       activeTab === "posts" ? 0 : activeTab === "replies" ? 1 : 2,
//     ),
//   ); // Not used in this snippet but for context
//   const [optionsModalVisible, setOptionsModalVisible] = useState(false);
//   const [repostModalVisible, setRepostModalVisible] = useState(false);
//   const [postForOptions, setPostForOptions] = useState<Post | null>(null);
//   const [postForRepost, setPostForRepost] = useState<Post | null>(null);

//   const {
//     data: profile,
//     isLoading: isProfileLoading,
//     refetch: refetchProfile,
//   } = useGetProfileQuery(id as string, { skip: !id });

//   const { data: postData, refetch: refetchPosts } = useGetUserPostsQuery(
//     { id: id as string },
//     {
//       skip: !id || activeTab !== "posts",
//     },
//   );

//   const { data: likeData, refetch: refetchLikes } = useGetUserLikesQuery(
//     { id: id as string },
//     {
//       skip: !id || activeTab !== "likes",
//     },
//   );

//   const { data: replyData, refetch: refetchReplies } = useGetUserRepliesQuery(
//     { id: id as string },
//     {
//       skip: !id || activeTab !== "replies",
//     },
//   );

//   const [followUser] = useFollowUserMutation();
//   const [muteUser] = useMuteUserMutation();
//   const [blockUser] = useBlockUserMutation();
//   const [createChatRoom] = useCreateChatRoomMutation();
//   const [likePost] = useLikePostMutation();
//   const [repostPost] = useRepostPostMutation();
//   const [deleteRepost] = useDeleteRepostMutation();
//   const [deletePost] = useDeletePostMutation();
//   const [bookmarkPost] = useBookmarkPostMutation();

//   const handleLike = useCallback(
//     async (postId: string) => {
//       try {
//         await likePost({ postId }).unwrap();
//       } catch (err) {
//         console.error("Like failed", err);
//       }
//     },
//     [likePost],
//   );

//   const handleBookmark = useCallback(
//     async (postId: string) => {
//       try {
//         await bookmarkPost(postId).unwrap();
//         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//       } catch (err) {
//         console.error("Bookmark failed", err);
//       }
//     },
//     [bookmarkPost],
//   );

//   const handleRepostAction = useCallback((post: Post) => {
//     setPostForRepost(post);
//     setRepostModalVisible(true);
//   }, []);

//   const onDirectRepost = useCallback(async () => {
//     if (!postForRepost) return;
//     const isRepostItem =
//       !!postForRepost.isRepost || !!postForRepost.repostedByMe;
//     const realPostId =
//       isRepostItem && postForRepost.originalPost
//         ? postForRepost.originalPost.id
//         : postForRepost.id;

//     try {
//       if (postForRepost.repostedByMe) {
//         await deleteRepost({ id: realPostId }).unwrap();
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       } else {
//         await repostPost({ id: realPostId }).unwrap();
//         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       }
//     } catch (err: any) {
//       console.error("Repost action failed", err);
//     }
//   }, [postForRepost, repostPost, deleteRepost]);

//   const onQuote = useCallback(() => {
//     if (!postForRepost) return;
//     const isRepostItem =
//       !!postForRepost.isRepost || !!postForRepost.repostedByMe;
//     const displayPost =
//       isRepostItem && postForRepost.originalPost
//         ? postForRepost.originalPost
//         : postForRepost;

//     router.push({
//       pathname: "/compose/post",
//       params: {
//         quoteId: displayPost.id,
//         quoteContent: displayPost.content,
//         quoteAuthor: displayPost.author?.name || "Member",
//       },
//     });
//   }, [postForRepost, router]);

//   const handlePressPost = useCallback(
//     (id: string) => {
//       router.push(`/post/${id}`);
//     },
//     [router],
//   );

//   const handlePressProfile = useCallback(
//     (authorId: string) => {
//       if (authorId !== profile?.id) {
//         router.push(`/profile/${authorId}`);
//       }
//     },
//     [router, profile?.id],
//   );

//   const handlePressOptions = useCallback((p: Post) => {
//     setPostForOptions(p);
//     setOptionsModalVisible(true);
//   }, []);

//   const handleFollow = async () => {
//     try {
//       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//       await followUser(id as string).unwrap();
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const handleMessage = async () => {
//     try {
//       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//       const room = await createChatRoom(id as string).unwrap();
//       router.push(`/chat/${room.id}?title=${profile.name}`);
//     } catch (e) {
//       console.error(e);
//       Alert.alert("Chat", "Follow each other to start a conversation.");
//     }
//   };

//   const onRefresh = () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     refetchProfile();
//     if (activeTab === "posts") refetchPosts();
//     if (activeTab === "likes") refetchLikes();
//     if (activeTab === "replies") refetchReplies();
//   };

//   const currentData = useMemo(() => {
//     const posts = postData?.posts || [];
//     const likes = likeData?.posts || [];
//     const replies = replyData?.posts || [];

//     if (activeTab === "posts") {
//       return posts.filter((post: any) => {
//         const isActuallyAReply =
//           !!post.parentPost ||
//           !!post.parentId ||
//           !!post.replyToId ||
//           !!post.parent ||
//           post.type === "REPLY";
//         return !isActuallyAReply;
//       });
//     }

//     if (activeTab === "likes") return likes;

//     if (activeTab === "replies") {
//       return replies.filter((post: any) => {
//         const isActuallyAReply =
//           !!post.parentPost ||
//           !!post.parentId ||
//           !!post.replyToId ||
//           !!post.parent ||
//           post.type === "REPLY";
//         return isActuallyAReply;
//       });
//     }
//     return [];
//   }, [activeTab, postData, likeData, replyData]);

//   if (isProfileLoading) {
//     return (
//       <View className="flex-1 justify-center items-center bg-[#F8FAFC] dark:bg-[#0F172A]">
//         <ActivityIndicator size="large" color="#0ea5e9" />
//       </View>
//     );
//   }

//   if (!profile) {
//     return (
//       <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] items-center justify-center px-10">
//         <View className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-3xl items-center justify-center mb-6">
//           <Ionicons name="person-outline" size={40} color="#94A3B8" />
//         </View>
//         <Text className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter text-center uppercase">
//           User Not Found
//         </Text>
//         <Text className="text-gray-400 dark:text-slate-400 text-center mt-2 font-medium">
//           The user you are looking for does not exist or has been removed.
//         </Text>
//         <TouchableOpacity
//           onPress={() => router.back()}
//           className="mt-8 px-8 py-3 bg-sky-500 rounded-2xl shadow-lg shadow-sky-200 dark:shadow-none"
//         >
//           <Text className="text-white font-black uppercase tracking-widest text-xs">
//             Return Home
//           </Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   const isMe = user?.id === id;

//   const handleMoreActions = () => {
//     Alert.alert(
//       "Privacy Actions",
//       "Choose how you interact with this member.",
//       [
//         {
//           text: "Mute Member",
//           onPress: async () => {
//             await muteUser(id as string).unwrap();
//             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//             Alert.alert(
//               "User Muted",
//               "You won't see their posts in your feed anymore.",
//             );
//           },
//         },
//         {
//           text: "Block Member",
//           onPress: async () => {
//             await blockUser(id as string).unwrap();
//             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
//             router.back();
//           },
//           style: "destructive",
//         },
//         { text: "Cancel", style: "cancel" },
//       ],
//     );
//   };

//   const Header = () => (
//     <View className="bg-[#F8FAFC] dark:bg-[#0F172A]">
//       <BlurView
//         intensity={80}
//         tint={isDark ? "dark" : "light"}
//         className="absolute top-0 left-0 right-0 z-50 flex-row items-center px-5 py-4 border-b border-gray-100/50 dark:border-slate-800/50"
//         style={{ paddingTop: insets.top }}
//       >
//         <TouchableOpacity
//           onPress={() => router.back()}
//           className="w-10 h-10 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm dark:shadow-none"
//         >
//           <Ionicons name="chevron-back" size={24} color="#64748B" />
//         </TouchableOpacity>
//         <View className="ml-4 flex-1">
//           <Text
//             className="text-lg font-black pt-2 text-gray-900 dark:text-white tracking-tighter"
//             numberOfLines={1}
//           >
//             {profile.name}
//           </Text>
//           <Text className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">
//             {profile._count?.posts || 0} Posts
//           </Text>
//         </View>
//         <TouchableOpacity
//           onPress={() => router.push("/settings")}
//           className="w-10 h-10 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm dark:shadow-none"
//         >
//           <Ionicons name="ellipsis-horizontal" size={20} color="#64748B" />
//         </TouchableOpacity>
//       </BlurView>

//       <View className="h-56 bg-sky-100 dark:bg-sky-900/30">
//         {profile.coverImage ? (
//           <Image
//             source={{ uri: profile.coverImage }}
//             className="w-full h-full"
//             contentFit="cover"
//             transition={500}
//           />
//         ) : (
//           <LinearGradient
//             colors={["#0EA5E9", "#38BDF8", "#7DD3FC"]}
//             className="w-full h-full opacity-100 dark:opacity-80"
//           />
//         )}
//       </View>

//       <View className="px-5 -mt-20 pb-6">
//         <View className="flex-row justify-between items-end">
//           <View className="shadow-2xl shadow-sky-400 dark:shadow-none">
//             <Image
//               source={{
//                 uri:
//                   profile.image ||
//                   "https://api.dicebear.com/7.x/avataaars/png?seed=" +
//                     profile.username,
//               }}
//               className="w-32 h-32 rounded-[44px] border-4 border-white dark:border-[#0F172A] bg-white dark:bg-slate-800"
//               contentFit="cover"
//               transition={300}
//             />
//           </View>

//           <View className="flex-row mb-1 space-x-2">
//             {!isMe && (
//               <>
//                 <TouchableOpacity
//                   onPress={handleMessage}
//                   className="bg-white dark:bg-slate-800 w-12 h-12 border mr-3 border-gray-100 dark:border-slate-700 items-center justify-center rounded-2xl shadow-sm dark:shadow-none"
//                 >
//                   <Ionicons
//                     name="chatbubble-ellipses-outline"
//                     size={22}
//                     color="#0EA5E9"
//                   />
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   onPress={handleFollow}
//                   className={`px-8 py-3 rounded-2xl mr-3 shadow-sm ${profile.isFollowing ? "bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700" : "bg-sky-500 shadow-sky-200 dark:shadow-none"}`}
//                 >
//                   <Text
//                     className={`font-black uppercase tracking-wider text-xs ${profile.isFollowing ? "text-gray-400 dark:text-slate-400" : "text-white"}`}
//                   >
//                     {profile.isFollowing ? "Following" : "Follow"}
//                   </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   onPress={handleMoreActions}
//                   className="bg-rose-50 dark:bg-rose-500/10 w-12 h-12 border border-rose-100 dark:border-rose-500/20 items-center justify-center rounded-2xl"
//                 >
//                   <Ionicons name="shield-outline" size={20} color="#F43F5E" />
//                 </TouchableOpacity>
//               </>
//             )}
//             {isMe && (
//               <TouchableOpacity
//                 onPress={() => router.push("/profile/update")}
//                 className="bg-white dark:bg-slate-800 px-8 py-3 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm dark:shadow-none"
//               >
//                 <Text className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider">
//                   Edit Profile
//                 </Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>

//         <View className="mt-5">
//           <View className="flex-row items-center">
//             <Text className="text-3xl font-black pt-5 text-gray-900 dark:text-white tracking-tighter mr-1">
//               {profile.name}
//             </Text>
//             {profile.isVerified && (
//               <Ionicons name="checkmark-circle" size={24} color="#0EA5E9" />
//             )}
//           </View>
//           <Text className="text-sky-600 font-bold text-[16px] -mt-1">
//             @{profile.username}
//           </Text>
//         </View>

//         <Text className="mt-4 text-[16px] text-gray-700 dark:text-slate-300 font-medium leading-6">
//           {profile.bio || "Crafting moments on the platform. ✨"}
//         </Text>

//         <View className="flex-row flex-wrap mt-5">
//           {profile.location && (
//             <View className="flex-row items-center mr-4 mb-2 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-slate-700">
//               <Ionicons name="location-outline" size={14} color="#64748B" />
//               <Text className="text-gray-500 ml-1.5 text-xs font-bold">
//                 {profile.location}
//               </Text>
//             </View>
//           )}
//           <View className="flex-row items-center mr-4 mb-2 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-slate-700">
//             <Ionicons name="calendar-outline" size={14} color="#64748B" />
//             <Text className="text-gray-500 ml-1.5 text-xs font-bold">
//               Joined{" "}
//               {new Date(profile.createdAt).toLocaleDateString("en-US", {
//                 month: "short",
//                 year: "numeric",
//               })}
//             </Text>
//           </View>
//         </View>

//         <View className="flex-row mt-6 space-x-8">
//           <TouchableOpacity
//             onPress={() =>
//               router.push({
//                 pathname: "/profile/following",
//                 params: { userId: profile.id },
//               })
//             }
//             className="flex-row items-baseline"
//           >
//             <Text className="text-2xl font-black text-gray-900 dark:text-white">
//               {profile._count?.following || 0}
//             </Text>
//             <Text className="text-gray-400 dark:text-slate-500 ml-1 font-bold text-xs uppercase tracking-widest">
//               Following
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={() =>
//               router.push({
//                 pathname: "/profile/followers",
//                 params: { userId: profile.id },
//               })
//             }
//             className="flex-row items-baseline"
//           >
//             <Text className="text-2xl font-black text-gray-900 dark:text-white">
//               {profile._count?.followers || 0}
//             </Text>
//             <Text className="text-gray-400 dark:text-slate-500 ml-1 font-bold text-xs uppercase tracking-widest">
//               Followers
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <View className="px-5 py-2">
//         <View className="flex-row bg-gray-100/50 dark:bg-slate-800/50 rounded-2xl p-1">
//           {(["posts", "replies", "likes"] as const).map((tabName) => (
//             <TouchableOpacity
//               key={tabName}
//               onPress={() => {
//                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//                 setActiveTab(tabName);
//               }}
//               className={`flex-1 items-center py-2.5 rounded-xl ${activeTab === tabName ? "bg-white dark:bg-slate-700 shadow-sm dark:shadow-none" : ""}`}
//             >
//               <Text
//                 className={`font-black text-[12px] uppercase tracking-widest ${activeTab === tabName ? "text-[#0EA5E9]" : "text-gray-400 dark:text-slate-500"}`}
//               >
//                 {tabName}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </View>
//     </View>
//   );

//   return (
//     <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
//       <FlatList
//         data={currentData}
//         ListHeaderComponent={Header}
//         renderItem={({ item }) => (
//           <View className="px-5 mt-4">
//             <PostCard
//               item={item}
//               user={user}
//               onPressPost={handlePressPost}
//               onPressProfile={handlePressProfile}
//               onPressOptions={handlePressOptions}
//               onPressComment={handlePressPost}
//               onPressRepost={handleRepostAction}
//               onLike={handleLike}
//               onBookmark={handleBookmark}
//             />
//           </View>
//         )}
//         keyExtractor={(item, index) => `${item.id}-${index}`}
//         refreshControl={
//           <RefreshControl
//             refreshing={isProfileLoading}
//             onRefresh={onRefresh}
//             tintColor="#0EA5E9"
//           />
//         }
//         contentContainerStyle={{ paddingBottom: 100 }}
//         showsVerticalScrollIndicator={false}
//         initialNumToRender={10}
//         maxToRenderPerBatch={10}
//         windowSize={5}
//         removeClippedSubviews={Platform.OS === "android"}
//         ListEmptyComponent={
//           <View className="items-center py-20 px-10">
//             <View className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-3xl items-center justify-center mb-4">
//               <Ionicons name="layers-outline" size={32} color="#94A3B8" />
//             </View>
//             <Text className="text-lg font-black text-gray-900 dark:text-white tracking-tight text-center uppercase">
//               No {activeTab} yet
//             </Text>
//           </View>
//         }
//       />

//       <PostOptionsModal
//         isVisible={optionsModalVisible}
//         onClose={() => setOptionsModalVisible(false)}
//         isOwner={postForOptions?.author?.id === user?.id}
//         onDelete={async () => {
//           if (!postForOptions?.id) return;
//           try {
//             await deletePost({ id: postForOptions.id }).unwrap();
//             setOptionsModalVisible(false);
//             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//           } catch (err) {
//             console.error("Delete failed", err);
//           }
//         }}
//       />
//     </View>
//   );
// }
