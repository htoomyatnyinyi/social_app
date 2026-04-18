import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { useSelector } from "react-redux";
import {
  useGetChatRoomsQuery,
  useGetPublicChatQuery,
} from "../../store/chatApi";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const ChatItem = React.memo(function ChatItem({
  item,
  index,
  currentUserId,
  onPress,
}: {
  item: any;
  index: number;
  currentUserId: string;
  onPress: (item: any) => void;
}) {
  const { isDark, accentColor } = useTheme();
  const otherUser = item.users.find((u: any) => u.id !== currentUserId);
  const lastMessage = item.messages?.[0];
  const isOnline = Boolean(otherUser?.isOnline);

  const formatLastMessageTime = (dateString: string) => {
    if (!dateString) return "";
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.8}
        className={`flex-row mx-5 mb-3 p-4 items-center rounded-[32px] border ${
          isDark
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-gray-50 shadow-sm shadow-slate-200"
        }`}
      >
        <View className="relative">
          <Image
            source={{
              uri:
                otherUser?.image ||
                `https://api.dicebear.com/7.x/avataaars/png?seed=${otherUser?.username}`,
            }}
            className="w-[60px] h-[60px] rounded-[22px] bg-slate-100 dark:bg-slate-800"
            contentFit="cover"
            transition={200}
          />
          {isOnline && (
            <View
              style={{ borderColor: isDark ? "#0F172A" : "white" }}
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 rounded-full"
            />
          )}
        </View>

        <View className="flex-1 ml-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text
              className={`font-black text-[16px] tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
              numberOfLines={1}
            >
              {otherUser?.name || "Member"}
            </Text>
            {lastMessage && (
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                {formatLastMessageTime(lastMessage.createdAt)}
              </Text>
            )}
          </View>

          <View className="flex-row justify-between items-center">
            <Text
              className={`text-[13px] leading-5 flex-1 mr-3 ${
                item.unreadCount > 0
                  ? isDark
                    ? "text-slate-100 font-bold"
                    : "text-slate-900 font-bold"
                  : "text-slate-500 font-medium"
              }`}
              numberOfLines={1}
            >
              {lastMessage?.senderId === currentUserId && (
                <Text style={{ color: accentColor }} className="font-black">
                  You:{" "}
                </Text>
              )}
              {lastMessage?.content || "No messages yet..."}
            </Text>
            {item.unreadCount > 0 && (
              <View
                style={{ backgroundColor: accentColor }}
                className="min-w-[20px] h-[20px] rounded-full px-1.5 items-center justify-center shadow-md shadow-sky-900/20"
              >
                <Text className="text-white text-[9px] font-black">
                  {item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function ChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, accentColor } = useTheme();
  const user = useSelector((state: any) => state.auth.user);
  const [search, setSearch] = useState("");

  const {
    data: rooms,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetChatRoomsQuery({}, { refetchOnFocus: true });

  const { data: publicRoom } = useGetPublicChatQuery({});

  const handleChatItemPress = useCallback(
    (item: any) => {
      const otherUser = item.users.find((u: any) => u.id !== user?.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/chat/${item.id}?title=${otherUser?.name || "Chat"}`);
    },
    [user?.id, router],
  );

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return rooms;
    return rooms?.filter((room: any) => {
      const otherUser = room.users.find((u: any) => u.id !== user?.id);
      return (
        otherUser?.name.toLowerCase().includes(search.toLowerCase()) ||
        otherUser?.username?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [rooms, search, user?.id]);

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      <BlurView
        intensity={20}
        tint={isDark ? "dark" : "light"}
        className="px-5 pb-4 z-50 border-b border-slate-800/10"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row justify-between items-end h-16">
          <View>
            <Text
              className={`text-2xl font-black tracking-tighter uppercase ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Messages
            </Text>
            {/* {isFetching && !isLoading && (
              <Text
                style={{ color: accentColor }}
                className="text-[10px] font-black uppercase tracking-[2px] mt-1"
              >
                Syncing Rituals...
              </Text>

            )} */}
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              {isFetching && !isLoading ? "Syncing..." : "Let's whisper!  "}
            </Text>
          </View>
          {/* <TouchableOpacity
            onPress={() => router.push("/chat/search")}
            className={`w-10 h-10 rounded-xl items-center justify-center border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100 shadow-sm"}`}
          >
            <Ionicons
              name="search"
              size={18}
              color={isDark ? "#94A3B8" : "#64748B"}
            />
          </TouchableOpacity> */}
        </View>
      </BlurView>

      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ChatItem
            item={item}
            index={index}
            currentUserId={user?.id}
            onPress={handleChatItemPress}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={accentColor}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 20, paddingBottom: 150 }}
        ListHeaderComponent={
          <>
            {publicRoom && !search && (
              <Animated.View entering={FadeInRight.delay(200)}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/chat/${publicRoom?.id}?title=Public`);
                  }}
                  activeOpacity={0.9}
                  className="mx-5 mb-6 rounded-[32px] overflow-hidden h-32 border border-slate-800/50"
                >
                  <Image
                    source={require("../../assets/svg/icon.png")}
                    className="w-full h-full absolute bg-black opacity-60"
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    className="absolute inset-0"
                  />
                  <View className="flex-1 justify-end p-6">
                    <Text className="font-black text-[22px] text-white tracking-tight uppercase">
                      The Oasis
                    </Text>
                    <Text className="text-white/60 text-[10px] font-black uppercase tracking-[3px] mt-1">
                      Public Sanctuary
                    </Text>
                  </View>
                  <View className="absolute top-6 right-6 bg-white/20 px-3 py-1 rounded-full border border-white/20">
                    <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                      Live
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        }
        ListEmptyComponent={
          isError ? (
            <View className="items-center justify-center mt-24 px-10">
              <View className="w-20 h-20 rounded-[32px] bg-rose-500/10 items-center justify-center mb-6">
                <Ionicons name="cloud-offline" size={32} color="#F43F5E" />
              </View>
              <Text
                className={`text-sm font-black text-center uppercase tracking-widest ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Sanctuary Offline
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                className="mt-6 px-8 py-4 rounded-2xl bg-slate-800"
              >
                <Text className="text-white font-black text-[10px] uppercase tracking-widest">
                  Reconnect
                </Text>
              </TouchableOpacity>
            </View>
          ) : isLoading ? (
            <View className="items-center justify-center mt-24">
              <ActivityIndicator size="small" color={accentColor} />
            </View>
          ) : (
            <View className="items-center justify-center mt-32 opacity-20">
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color={isDark ? "white" : "black"}
              />
              <Text
                className={`text-xs font-black text-center mt-4 uppercase tracking-[4px] ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Silence
              </Text>
            </View>
          )
        }
      />

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push("/chat/new")}
        style={{ backgroundColor: accentColor }}
        className="absolute bottom-32 right-6 w-16 h-16 rounded-[24px] items-center justify-center shadow-xl shadow-sky-500/40 border-2 border-white/20"
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}
// // oroginal ode
// import React, { useState, useCallback, useMemo } from "react";
// import {
//   View,
//   FlatList,
//   Text,
//   TouchableOpacity,
//   TextInput,
//   RefreshControl,
//   Platform,
//   ActivityIndicator,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useTheme } from "../../context/ThemeContext";
// import { useSelector } from "react-redux";
// import {
//   useGetChatRoomsQuery,
//   useGetPublicChatQuery,
// } from "../../store/chatApi";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { BlurView } from "expo-blur";
// import { Image } from "expo-image";
// import * as Haptics from "expo-haptics";
// import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

// /**
//  * OPTIMIZATION: Moved ChatItem outside of the screen component.
//  * This ensures React.memo actually works and doesn't re-create
//  * the component on every parent render.
//  */
// const ChatItem = React.memo(function ChatItem({
//   item,
//   index,
//   currentUserId,
//   onPress,
// }: {
//   item: any;
//   index: number;
//   currentUserId: string;
//   onPress: (item: any) => void;
// }) {
//   const otherUser = item.users.find((u: any) => u.id !== currentUserId);
//   const lastMessage = item.messages?.[0];
//   const isOnline = Boolean(otherUser?.isOnline);

//   const formatLastMessageTime = (dateString: string) => {
//     if (!dateString) return "";
//     const now = new Date();
//     const date = new Date(dateString);
//     const diffMs = now.getTime() - date.getTime();
//     const diffMins = Math.floor(diffMs / (1000 * 60));
//     const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
//     const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

//     if (diffMins < 1) return "now";
//     if (diffMins < 60) return `${diffMins}m`;
//     if (diffHours < 24) return `${diffHours}h`;
//     if (diffDays < 7) return `${diffDays}d`;
//     return date.toLocaleDateString([], { month: "short", day: "numeric" });
//   };

//   return (
//     <Animated.View entering={FadeInDown.delay(index * 50)}>
//       <TouchableOpacity
//         onPress={() => onPress(item)}
//         activeOpacity={0.8}
//         className="flex-row px-5 py-4 items-center bg-white dark:bg-[#0F172A] border-b border-gray-100/50 dark:border-slate-800/50"
//       >
//         <View className="relative">
//           <Image
//             source={{
//               uri:
//                 otherUser?.image ||
//                 `https://api.dicebear.com/7.x/avataaars/png?seed=${otherUser?.id}`,
//             }}
//             className="w-[64px] h-[64px] rounded-[24px] bg-gray-100 dark:bg-slate-800 border border-gray-50 dark:border-slate-700"
//             contentFit="cover"
//             transition={200}
//           />
//           {isOnline && (
//             <View className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-4 border-white dark:border-[#0F172A] rounded-full" />
//           )}
//         </View>

//         <View className="flex-1 ml-5 justify-center">
//           <View className="flex-row justify-between items-center mb-1.5">
//             <Text
//               className="font-black text-[17px] text-gray-900 dark:text-white tracking-tight"
//               numberOfLines={1}
//             >
//               {otherUser?.name || "Member"}
//             </Text>
//             {lastMessage && (
//               <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
//                 {formatLastMessageTime(lastMessage.createdAt)}
//               </Text>
//             )}
//           </View>

//           <View className="flex-row justify-between items-center">
//             <Text
//               className={`text-[14px] leading-5 flex-1 mr-3 ${
//                 item.unreadCount > 0
//                   ? "text-gray-900 dark:text-slate-100 font-bold"
//                   : "text-gray-500 dark:text-slate-400 font-medium"
//               }`}
//               numberOfLines={1}
//             >
//               {lastMessage?.senderId === currentUserId && (
//                 <Text className="text-sky-500 font-black">You </Text>
//               )}
//               {lastMessage?.content || "No messages yet..."}
//             </Text>
//             {item.unreadCount > 0 && (
//               <View className="bg-sky-500 min-w-[22px] h-[22px] rounded-[11px] px-1.5 items-center justify-center shadow-md shadow-sky-200">
//                 <Text className="text-white text-[10px] font-black">
//                   {item.unreadCount}
//                 </Text>
//               </View>
//             )}
//           </View>
//         </View>
//       </TouchableOpacity>
//     </Animated.View>
//   );
// });

// export default function ChatListScreen() {
//   const router = useRouter();
//   const insets = useSafeAreaInsets();
//   const { isDark } = useTheme();
//   const user = useSelector((state: any) => state.auth.user);
//   const [search, setSearch] = useState("");

//   const {
//     data: rooms,
//     isLoading, // Initial loading state
//     isFetching, // Refetch loading state
//     isError,
//     refetch,
//   } = useGetChatRoomsQuery(
//     {},
//     {
//       refetchOnFocus: true, // Auto refetch when app returns from background
//       refetchOnReconnect: true,
//     },
//   );

//   const { data: publicRoom } = useGetPublicChatQuery({});

//   const handleChatItemPress = useCallback(
//     (item: any) => {
//       const otherUser = item.users.find((u: any) => u.id !== user?.id);
//       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//       router.push(`/chat/${item.id}?title=${otherUser?.name || "Chat"}`);
//     },
//     [user?.id, router],
//   );

//   const filteredRooms = useMemo(() => {
//     if (!search.trim()) return rooms;
//     return rooms?.filter((room: any) => {
//       const otherUser = room.users.find((u: any) => u.id !== user?.id);
//       return (
//         otherUser?.name.toLowerCase().includes(search.toLowerCase()) ||
//         otherUser?.username?.toLowerCase().includes(search.toLowerCase())
//       );
//     });
//   }, [rooms, search, user?.id]);

//   return (
//     <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
//       <BlurView
//         intensity={90}
//         tint={isDark ? "dark" : "light"}
//         className="px-5 pb-5 z-50 border-b border-gray-100/50 dark:border-slate-800/50 shadow-sm"
//         style={{ paddingTop: insets.top + 10 }}
//       >
//         <View className="flex-row justify-between items-center mb-0">
//           <View>
//             <Text className="text-2xl font-black text-gray-900 dark:text-white tracking-[-1px] uppercase">
//               Messages
//             </Text>
//             <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
//               {isFetching && !isLoading ? "Syncing..." : "Direct Chats"}
//             </Text>
//           </View>
//         </View>

//         {/* Search Bar */}
//         {/* <View className="flex-row items-center bg-white dark:bg-slate-800 border border-gray-100/80 dark:border-slate-700 rounded-[20px] px-4 py-2.5 shadow-sm">
//           <Ionicons name="search" size={18} color="#94A3B8" />
//           <TextInput
//             placeholder="Search messages..."
//             placeholderTextColor="#CBD5E1"
//             className="flex-1 ml-3 text-[15px] text-gray-900 dark:text-white font-bold"
//             value={search}
//             onChangeText={setSearch}
//             autoCorrect={false}
//           />
//           {search.length > 0 && (
//             <TouchableOpacity onPress={() => setSearch("")}>
//               <Ionicons name="close-circle" size={18} color="#CBD5E1" />
//             </TouchableOpacity>
//           )}
//         </View> */}
//       </BlurView>

//       <FlatList
//         data={filteredRooms}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item, index }) => (
//           <ChatItem
//             item={item}
//             index={index}
//             currentUserId={user?.id}
//             onPress={handleChatItemPress}
//           />
//         )}
//         refreshControl={
//           <RefreshControl
//             refreshing={isFetching}
//             onRefresh={refetch}
//             tintColor="#0EA5E9"
//           />
//         }
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 120 }}
//         initialNumToRender={8}
//         maxToRenderPerBatch={10}
//         windowSize={5}
//         removeClippedSubviews={Platform.OS === "android"}
//         ListHeaderComponent={
//           <>
//             {publicRoom && !search && (
//               <Animated.View entering={FadeInRight.delay(200)}>
//                 <TouchableOpacity
//                   onPress={() => {
//                     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//                     router.push(`/chat/${publicRoom?.id}?title=Public`);
//                   }}
//                   activeOpacity={0.9}
//                   className="mx-2 my-2 rounded-[40px] overflow-hidden border border-slate-800 dark:border-white shadow-2xl"
//                 >
//                   <Image
//                     // source={{
//                     //   uri: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1000",
//                     // }}
//                     source={require("../../assets/svg/icon.png")}
//                     className="w-full h-32 absolute bg-black"
//                   />
//                   <BlurView
//                     intensity={70}
//                     tint="dark"
//                     className="p-4 flex-row items-center h-12"
//                     // className="p-6 flex-row items-center h-24 bg-black/30"
//                   >
//                     {/* <View className="w-14 h-14 rounded-[22px] bg-white/20 items-center justify-center border border-white/40">
//                       <Ionicons name="infinite" size={32} color="white" />
//                     </View> */}
//                     <View className="ml-5 flex-1">
//                       <Text className="font-black text-[20px] text-white tracking-tight uppercase">
//                         Public
//                       </Text>
//                       <Text className="text-white/80 text-[12px] font-bold uppercase tracking-widest mt-1">
//                         Community Chat
//                       </Text>
//                     </View>
//                   </BlurView>
//                 </TouchableOpacity>
//               </Animated.View>
//             )}
//           </>
//         }
//         ListEmptyComponent={
//           isError ? (
//             <View className="items-center justify-center mt-24 px-10">
//               <Ionicons name="cloud-offline" size={44} color="#94A3B8" />
//               <Text className="text-lg font-black text-center mt-4 text-gray-900 dark:text-white uppercase">
//                 Couldn’t load chats
//               </Text>
//               <Text className="text-[12px] text-gray-400 font-bold text-center mt-2">
//                 Pull to refresh, or tap retry.
//               </Text>
//               <TouchableOpacity
//                 onPress={() => refetch()}
//                 activeOpacity={0.85}
//                 className="mt-6 px-5 py-3 rounded-full bg-sky-500"
//               >
//                 <Text className="text-white font-black text-[12px] uppercase tracking-widest">
//                   Retry
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           ) : isLoading ? (
//             <View className="items-center justify-center mt-24 px-10">
//               <ActivityIndicator size="small" color="#0EA5E9" />
//               <Text className="text-[12px] text-gray-400 font-bold text-center mt-3 uppercase tracking-widest">
//                 Loading…
//               </Text>
//             </View>
//           ) : (
//             <View className="items-center justify-center mt-32 px-14 opacity-20">
//               <Ionicons name="chatbubbles" size={48} color="#94A3B8" />
//               <Text className="text-xl font-black text-center mt-4 text-gray-900 dark:text-white uppercase">
//                 No Messages
//               </Text>
//             </View>
//           )
//         }
//       />

//       <TouchableOpacity
//         activeOpacity={0.9}
//         onPress={() => router.push("/chat/new")}
//         className="absolute bottom-28 right-6 w-16 h-16 bg-sky-500 rounded-[28px] items-center justify-center shadow-lg border-2 border-white/20"
//       >
//         <Ionicons name="add" size={32} color="white" />
//       </TouchableOpacity>
//     </View>
//   );
// }

// // import React, { useState, useCallback, useMemo } from "react";
// // import {
// //   View,
// //   FlatList,
// //   Text,
// //   TouchableOpacity,
// //   TextInput,
// //   // ScrollView,
// //   RefreshControl,
// //   // ActivityIndicator,
// //   Platform,
// // } from "react-native";
// // import { Ionicons } from "@expo/vector-icons";
// // import { useRouter } from "expo-router";
// // import { useTheme } from "../../context/ThemeContext";
// // import { useSelector } from "react-redux";
// // // import { useFocusEffect } from "@react-navigation/native";
// // import {
// //   useGetChatRoomsQuery,
// //   useGetPublicChatQuery,
// // } from "../../store/chatApi";
// // import {
// //   // SafeAreaView,
// //   useSafeAreaInsets,
// // } from "react-native-safe-area-context";
// // import { BlurView } from "expo-blur";
// // import { Image } from "expo-image";
// // import * as Haptics from "expo-haptics";
// // import Animated, {
// //   FadeInDown,
// //   FadeInRight,
// //   // ZoomIn,
// // } from "react-native-reanimated";

// // export default function ChatListScreen() {
// //   const router = useRouter();
// //   const insets = useSafeAreaInsets();
// //   const { isDark } = useTheme();
// //   const user = useSelector((state: any) => state.auth.user);
// //   const [search, setSearch] = useState("");

// //   const {
// //     data: rooms,
// //     // isLoading,
// //     isFetching,
// //     refetch,
// //   } = useGetChatRoomsQuery({});
// //   const { data: publicRoom } = useGetPublicChatQuery({});

// //   // useFocusEffect(
// //   //   useCallback(() => {
// //   //     refetch();
// //   //   }, [refetch]),
// //   // );

// //   const ChatItem = React.memo(
// //     ({
// //       item,
// //       index,
// //       user,
// //       onPress,
// //     }: {
// //       item: any;
// //       index: number;
// //       user: any;
// //       onPress: (item: any) => void;
// //     }) => {
// //       const otherUser = item.users.find((u: any) => u.id !== user?.id);
// //       const lastMessage = item.messages?.[0];

// //       const formatLastMessageTime = (dateString: string) => {
// //         const now = new Date();
// //         const date = new Date(dateString);
// //         const diffMs = now.getTime() - date.getTime();
// //         const diffMins = Math.floor(diffMs / (1000 * 60));
// //         const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
// //         const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

// //         if (diffMins < 1) return "now";
// //         if (diffMins < 60) return `${diffMins}m`;
// //         if (diffHours < 24) return `${diffHours}h`;
// //         if (diffDays < 7) return `${diffDays}d`;
// //         return date.toLocaleDateString([], { month: "short", day: "numeric" });
// //       };

// //       return (
// //         <Animated.View entering={FadeInDown.delay(index * 50)}>
// //           <TouchableOpacity
// //             onPress={() => onPress(item)}
// //             activeOpacity={0.8}
// //             className="flex-row px-5 py-4 items-center bg-[#F8FAFC] dark:bg-[#0F172A] border-b border-gray-100/50 dark:border-slate-800/50"
// //           >
// //             <View className="relative shadow-md shadow-sky-100 dark:shadow-none">
// //               <Image
// //                 source={{
// //                   uri:
// //                     otherUser?.image ||
// //                     `https://api.dicebear.com/7.x/avataaars/png?seed=${otherUser?.id}`,
// //                 }}
// //                 className="w-[64px] h-[64px] rounded-[24px] bg-white dark:bg-slate-800 border border-gray-50 dark:border-slate-700"
// //                 contentFit="cover"
// //                 transition={300}
// //               />
// //               <View className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-4 border-white dark:border-[#0F172A] rounded-full shadow-sm" />
// //             </View>

// //             <View className="flex-1 ml-5 justify-center">
// //               <View className="flex-row justify-between items-center mb-1.5">
// //                 <Text
// //                   className="font-black text-[17px] text-gray-900 dark:text-white tracking-tight"
// //                   numberOfLines={1}
// //                 >
// //                   {otherUser?.name || "Member"}
// //                 </Text>
// //                 {lastMessage && (
// //                   <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
// //                     {formatLastMessageTime(lastMessage.createdAt)}
// //                   </Text>
// //                 )}
// //               </View>

// //               <View className="flex-row justify-between items-center">
// //                 <Text
// //                   className={`text-[14px] leading-5 flex-1 mr-3 ${item.unreadCount > 0 ? "text-gray-900 dark:text-slate-100 font-bold" : "text-gray-500 dark:text-slate-400 font-medium"}`}
// //                   numberOfLines={1}
// //                 >
// //                   {lastMessage?.senderId === user?.id && (
// //                     <Text className="text-sky-500 font-black">You </Text>
// //                   )}
// //                   {lastMessage?.content || "No messages yet..."}
// //                 </Text>
// //                 {item.unreadCount > 0 && (
// //                   <View className="bg-sky-500 min-w-[22px] h-[22px] rounded-[11px] px-1.5 items-center justify-center shadow-md shadow-sky-200">
// //                     <Text className="text-white text-[10px] font-black">
// //                       {item.unreadCount}
// //                     </Text>
// //                   </View>
// //                 )}
// //               </View>
// //             </View>
// //           </TouchableOpacity>
// //         </Animated.View>
// //       );
// //     },
// //   );

// //   const handleChatItemPress = useCallback(
// //     (item: any) => {
// //       const otherUser = item.users.find((u: any) => u.id !== user?.id);
// //       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
// //       router.push(`/chat/${item.id}?title=${otherUser?.name || "Chat"}`);
// //     },
// //     [user?.id, router],
// //   );

// //   const filteredRooms = useMemo(() => {
// //     if (!search.trim()) return rooms;
// //     return rooms?.filter((room: any) => {
// //       const otherUser = room.users.find((u: any) => u.id !== user?.id);
// //       return (
// //         otherUser?.name.toLowerCase().includes(search.toLowerCase()) ||
// //         otherUser?.username?.toLowerCase().includes(search.toLowerCase())
// //       );
// //     });
// //   }, [rooms, search, user?.id]);

// //   return (
// //     <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
// //       {/* Premium Sticky Header */}
// //       <BlurView
// //         intensity={90}
// //         tint={isDark ? "dark" : "light"}
// //         className="px-5 pb-5 z-50 border-b border-gray-100/50 dark:border-slate-800/50 shadow-sm shadow-gray-100 dark:shadow-none"
// //         style={{ paddingTop: insets.top + 10 }}
// //       >
// //         <View className="flex-row justify-between items-center mb-5">
// //           <View>
// //             <Text className="text-2xl font-black text-gray-900 dark:text-white tracking-[-1px] uppercase">
// //               Messages
// //             </Text>
// //             <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
// //               Direct Chats
// //             </Text>
// //           </View>
// //         </View>

// //         {/* Search Bar */}
// //         <View className="flex-row items-center bg-white dark:bg-slate-800 border border-gray-100/80 dark:border-slate-700 rounded-[20px] px-4 py-2.5 shadow-sm shadow-gray-50 dark:shadow-none">
// //           <Ionicons name="search" size={18} color="#94A3B8" />
// //           <TextInput
// //             placeholder="Search messages..."
// //             placeholderTextColor="#CBD5E1"
// //             className="flex-1 ml-3 text-[15px] text-gray-900 dark:text-white font-bold"
// //             value={search}
// //             onChangeText={setSearch}
// //             autoCorrect={false}
// //           />
// //           {search.length > 0 && (
// //             <TouchableOpacity
// //               onPress={() => {
// //                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
// //                 setSearch("");
// //               }}
// //             >
// //               <Ionicons name="close-circle" size={18} color="#CBD5E1" />
// //             </TouchableOpacity>
// //           )}
// //         </View>
// //       </BlurView>

// //       <FlatList
// //         data={filteredRooms}
// //         keyExtractor={(item) => item.id}
// //         renderItem={({ item, index }) => (
// //           <ChatItem
// //             item={item}
// //             index={index}
// //             user={user}
// //             onPress={handleChatItemPress}
// //           />
// //         )}
// //         refreshControl={
// //           <RefreshControl
// //             refreshing={isFetching}
// //             onRefresh={() => {
// //               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
// //               refetch();
// //             }}
// //             tintColor="#0EA5E9"
// //           />
// //         }
// //         showsVerticalScrollIndicator={false}
// //         contentContainerStyle={{ paddingTop: 0, paddingBottom: 120 }}
// //         initialNumToRender={10}
// //         maxToRenderPerBatch={10}
// //         windowSize={5}
// //         removeClippedSubviews={Platform.OS === "android"}
// //         ListHeaderComponent={
// //           <>
// //             {publicRoom && !search && (
// //               <Animated.View entering={FadeInRight.delay(200)}>
// //                 <TouchableOpacity
// //                   onPress={() => {
// //                     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
// //                     router.push(`/chat/${publicRoom?.id}?title=Public Lounge`);
// //                   }}
// //                   activeOpacity={0.9}
// //                   className="mx-5 my-8 rounded-[40px] overflow-hidden shadow-xl shadow-sky-100 dark:shadow-none border border-white dark:border-slate-800"
// //                 >
// //                   <Image
// //                     source={{
// //                       uri: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1000",
// //                     }}
// //                     className="w-full h-32 absolute"
// //                   />
// //                   <BlurView
// //                     intensity={70}
// //                     tint="dark"
// //                     className="p-6 flex-row items-center h-24 bg-black/30"
// //                   >
// //                     <View className="w-14 h-14 rounded-[22px] bg-white/20 items-center justify-center border border-white/40">
// //                       <Ionicons name="infinite" size={32} color="white" />
// //                     </View>
// //                     <View className="ml-5 flex-1">
// //                       <Text className="font-black text-[20px] text-white tracking-tight uppercase">
// //                         Public Lounge
// //                       </Text>
// //                       <Text className="text-white/80 text-[12px] font-bold uppercase tracking-widest mt-1">
// //                         Community Chat
// //                       </Text>
// //                     </View>
// //                   </BlurView>
// //                 </TouchableOpacity>
// //               </Animated.View>
// //             )}
// //           </>
// //         }
// //         ListEmptyComponent={
// //           <View className="items-center justify-center mt-32 px-14 opacity-20">
// //             <View className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[40px] items-center justify-center mb-10 shadow-sm border border-gray-100 dark:border-slate-700">
// //               <Ionicons name="chatbubbles" size={48} color="#94A3B8" />
// //             </View>
// //             <Text className="text-xl font-black text-center mb-2 text-gray-900 dark:text-white uppercase tracking-widest">
// //               No Messages
// //             </Text>
// //             <Text className="text-gray-400 text-center text-[13px] font-bold uppercase tracking-wider leading-5">
// //               No conversations started yet. Connect with someone to begin.
// //             </Text>
// //           </View>
// //         }
// //       />

// //       <TouchableOpacity
// //         activeOpacity={0.9}
// //         onPress={() => {
// //           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
// //           router.push("/chat/new");
// //         }}
// //         style={{
// //           shadowColor: "#0EA5E9",
// //           shadowOffset: { width: 0, height: 10 },
// //           shadowOpacity: 0.3,
// //           shadowRadius: 15,
// //           elevation: 10,
// //         }}
// //         className="absolute bottom-28 right-6 w-16 h-16 bg-sky-500 rounded-[28px] items-center justify-center border-2 border-white/20"
// //       >
// //         <Ionicons name="add" size={32} color="white" />
// //       </TouchableOpacity>
// //     </View>
// //   );
// // }
