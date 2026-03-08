import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSearchUsersQuery } from "../../store/authApi";
import { useCreateChatRoomMutation } from "../../store/chatApi";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

export default function NewChatScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const user = useSelector((state: any) => state.auth.user);

  // RTK Query for searching
  const {
    data: searchedUsers,
    isLoading,
    isFetching,
  } = useSearchUsersQuery(search, {
    skip: search.length < 1, // Don't search for empty strings
  });

  const [createChatRoom, { isLoading: isCreating }] =
    useCreateChatRoomMutation();

  const handleStartChat = async (
    otherUserId: string,
    otherUserName: string,
  ) => {
    // X-style selection feedback
    Haptics.selectionAsync();

    try {
      const room = await createChatRoom(otherUserId).unwrap();
      // Use replace to prevent user from coming back to search screen when clicking "back" from chat
      router.replace({
        pathname: `/chat/${room.id}` as any,
        params: {
          title: otherUserName,
          // You can also pass the avatar if your Chat screen needs it immediately
        },
      });
    } catch (e) {
      console.error(e);
      // Optional: Show a toast or alert
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-1 -ml-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-outline" size={28} color="black" />
          </TouchableOpacity>
          <Text className="text-[19px] font-bold ml-6">New message</Text>
        </View>

        {/* X usually has a "Next" button here, but for instant chat, we skip it */}
      </View>

      {/* Search Input Area */}
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <Text className="text-gray-500 font-medium mr-4">To</Text>
        <TextInput
          placeholder="Search people"
          placeholderTextColor="#9CA3AF"
          className="flex-1 text-[16px] text-gray-900 h-10"
          value={search}
          onChangeText={setSearch}
          autoFocus
          selectionColor="#1d9bf0" // X-style Blue cursor
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#1d9bf0" />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {/* Loading Indicator */}
          {(isLoading || isFetching) && search.length > 0 && (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color="#1d9bf0" />
            </View>
          )}

          {/* User Results */}
          {searchedUsers?.map(
            (u: any) =>
              u.id !== user?.id && (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => handleStartChat(u.id, u.name)}
                  activeOpacity={0.6}
                  className="flex-row items-center px-4 py-3 active:bg-gray-50"
                >
                  <Image
                    source={{
                      uri: u.image || "https://via.placeholder.com/100",
                    }}
                    className="w-12 h-12 rounded-full bg-gray-100"
                  />
                  <View className="ml-3 flex-1 border-b border-gray-50 pb-3 mt-3">
                    <View className="flex-row items-center">
                      <Text
                        className="font-bold text-gray-900 text-[15px] mr-1"
                        numberOfLines={1}
                      >
                        {u.name}
                      </Text>
                      {u.isVerified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#1d9bf0"
                        />
                      )}
                    </View>
                    <Text className="text-gray-500 text-[14px]">
                      @{u.username}
                    </Text>
                  </View>
                </TouchableOpacity>
              ),
          )}

          {/* Empty Search State */}
          {!search && (
            <View className="px-8 pt-12 items-center">
              <Text className="text-gray-900 font-bold text-2xl text-center mb-2">
                Search for people
              </Text>
              <Text className="text-gray-500 text-[15px] text-center px-4">
                Find anyone by name or @username to start a conversation.
              </Text>
            </View>
          )}

          {/* No Results Found */}
          {search.length > 0 && searchedUsers?.length === 0 && !isLoading && (
            <View className="px-8 pt-12 items-center">
              <Text className="text-gray-500 text-[15px] text-center">
                No results for {search}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Global Activity Overlay when creating room */}
      {isCreating && (
        <View className="absolute inset-0 bg-white/50 items-center justify-center">
          <ActivityIndicator size="large" color="#1d9bf0" />
        </View>
      )}
    </SafeAreaView>
  );
}

// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Image,
//   ActivityIndicator,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { useSearchUsersQuery } from "../../store/authApi";
// import { useCreateChatRoomMutation } from "../../store/chatApi";
// import { useSelector } from "react-redux";
// import { SafeAreaView } from "react-native-safe-area-context";

// export default function NewChatScreen() {
//   const router = useRouter();
//   const [search, setSearch] = useState("");
//   const user = useSelector((state: any) => state.auth.user);

//   const { data: searchedUsers, isLoading } = useSearchUsersQuery(search, {
//     skip: !search,
//   });
//   const [createChatRoom] = useCreateChatRoomMutation();

//   const handleStartChat = async (
//     otherUserId: string,
//     otherUserName: string,
//   ) => {
//     try {
//       const room = await createChatRoom(otherUserId).unwrap();
//       // Replace to avoid going back to "New Chat" screen
//       router.replace({
//         pathname: `/chat/${room.id}`,
//         params: { title: otherUserName },
//       });
//     } catch (e) {
//       console.error(e);
//       alert("Failed to start chat");
//     }
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       {/* Header */}
//       <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
//         <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
//           <Ionicons name="arrow-back" size={24} color="black" />
//         </TouchableOpacity>
//         <Text className="text-lg font-bold ml-4">New Message</Text>
//       </View>

//       {/* Search Input */}
//       <View className="px-4 py-3 border-b border-gray-50">
//         <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-2">
//           <Ionicons name="search" size={20} color="#6B7280" />
//           <TextInput
//             placeholder="Search for people"
//             placeholderTextColor="#9CA3AF"
//             className="flex-1 ml-3 text-[16px] text-gray-900 h-10"
//             value={search}
//             onChangeText={setSearch}
//             autoFocus
//           />
//           {search.length > 0 && (
//             <TouchableOpacity onPress={() => setSearch("")}>
//               <Ionicons name="close-circle" size={18} color="#6B7280" />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       <ScrollView className="flex-1">
//         {isLoading && (
//           <View className="py-10">
//             <ActivityIndicator size="small" color="#1d9bf0" />
//           </View>
//         )}

//         {searchedUsers?.map(
//           (u: any) =>
//             u.id !== user?.id && (
//               <TouchableOpacity
//                 key={u.id}
//                 onPress={() => handleStartChat(u.id, u.name)}
//                 className="flex-row items-center px-4 py-3 border-b border-gray-50 active:bg-gray-50"
//               >
//                 <Image
//                   source={{ uri: u.image || "https://via.placeholder.com/50" }}
//                   className="w-12 h-12 rounded-full bg-gray-200"
//                 />
//                 <View className="ml-3 flex-1">
//                   <Text className="font-bold text-gray-900 text-base">
//                     {u.name}
//                   </Text>
//                   <Text className="text-gray-500 text-sm">@{u.username}</Text>
//                 </View>
//               </TouchableOpacity>
//             ),
//         )}

//         {!search && (
//           <View className="p-8 items-center justify-center">
//             <Text className="text-gray-400 text-center">
//               Search for a user to start a conversation
//             </Text>
//           </View>
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// }
