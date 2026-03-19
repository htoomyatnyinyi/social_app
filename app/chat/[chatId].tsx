import React, { memo, useCallback, useState, useMemo } from "react";
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useMarkMessagesAsReadMutation } from "../../store/chatApi";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";

// Fixed: Named function to solve "Missing Display Name"
const MessageBubble = memo(function MessageBubble({
  item,
  prevMessage,
  user,
}: {
  item: any;
  prevMessage: any;
  user: any;
}) {
  const isMe = item.senderId === user?.id;
  const isSameSenderAsPrev = prevMessage?.senderId === item.senderId;
  const isPending = item.status === "pending";
  const isRead = item.read === 1;

  return (
    <View
      className={`flex-row mb-1 px-4 ${isMe ? "justify-end" : "justify-start"} ${
        !isSameSenderAsPrev ? "mb-4" : ""
      }`}
    >
      <View
        className={`max-w-[75%] px-4 py-3 ${
          isMe
            ? "bg-[#1d9bf0] rounded-2xl rounded-tr-sm"
            : "bg-[#262626] rounded-2xl rounded-tl-sm"
        } ${isPending ? "opacity-70" : ""}`}
      >
        {/* Image */}
        {item.mediaUrl ? (
          <Image
            source={{ uri: item.mediaUrl }}
            style={{
              width: 200,
              height: 200,
              borderRadius: 12,
              marginBottom: item.content ? 8 : 0,
            }}
            resizeMode="cover"
          />
        ) : null}

        {/* Text content */}
        {item.content ? (
          <Text
            className={`${isMe ? "text-white" : "text-gray-100"} text-[15px] leading-5`}
          >
            {item.content}
          </Text>
        ) : null}

        {/* Timestamp + delivery ticks */}
        <View className="flex-row items-center justify-end mt-1 gap-1">
          <Text
            className={`text-[10px] ${isMe ? "text-sky-200" : "text-gray-500"}`}
          >
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {isMe && (
            <Ionicons
              name={
                isPending
                  ? "time-outline"
                  : isRead
                    ? "checkmark-done-outline"
                    : "checkmark-outline"
              }
              size={14}
              color={isPending ? "#e0e0e0" : isRead ? "#60a5fa" : "#ffffff"}
            />
          )}
        </View>
      </View>
    </View>
  );
});

export default function ChatScreen() {
  const { chatId, title } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const resolvedChatId = Array.isArray(chatId) ? chatId[0] : chatId;

  const user = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);
  const [markAsRead] = useMarkMessagesAsReadMutation();

  const { messages, fetchMessages, sendMessage } = useChatMessages(
    resolvedChatId,
    token,
    user,
  );

  React.useEffect(() => {
    if (resolvedChatId) {
      markAsRead(resolvedChatId);
    }
  }, [resolvedChatId, messages?.length, markAsRead]);
  useChatWebSocket({
    chatId: resolvedChatId,
    token,
    currentUserId: user?.id,
    onMessageReceived: fetchMessages,
  });

  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const reversedMessages = useMemo(
    () => (messages ? [...messages].reverse() : []),
    [messages],
  );

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      // Convert to base64 for upload
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.Base64,
        // encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = result.assets[0].mimeType || "image/jpeg";
      setSelectedImage(`data:${mimeType};base64,${base64}`);
    }
  }, []);

  const handleSend = useCallback(() => {
    if (!inputText.trim() && !selectedImage) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(inputText.trim(), selectedImage || undefined);
    setInputText("");
    setSelectedImage(null);
  }, [inputText, selectedImage, sendMessage]);

  return (
    // 1. Root Container
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        {/* 2. Custom Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-zinc-900 bg-black">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-lg font-bold ml-4 text-white">
            {title || "Chat"}
          </Text>
        </View>

        {/* 3. The Keyboard Wrapper */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          // If the header is visible, this offset prevents the input from being too low
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <FlatList
            inverted
            data={reversedMessages}
            renderItem={({ item, index }) => (
              <MessageBubble
                item={item}
                prevMessage={reversedMessages[index + 1] || null}
                user={user}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingVertical: 10 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />

          {/* 4. Input Area */}
          <View className="bg-black border-t border-zinc-900">
            {/* Image Preview */}
            {selectedImage && (
              <View className="px-4 pt-3 pb-1">
                <View style={{ position: "relative", alignSelf: "flex-start" }}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={{ width: 80, height: 80, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => setSelectedImage(null)}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      backgroundColor: "#1d9bf0",
                      borderRadius: 10,
                      width: 20,
                      height: 20,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View
              className="flex-row items-center px-3 py-2"
              style={{
                paddingBottom:
                  Platform.OS === "ios" ? Math.max(insets.bottom, 8) : 8,
              }}
            >
              <TouchableOpacity className="p-2" onPress={pickImage}>
                <Ionicons name="image-outline" size={26} color="#1d9bf0" />
              </TouchableOpacity>

              <View className="flex-1 bg-[#16181c] rounded-2xl px-4 py-1.5 ml-1">
                <TextInput
                  placeholder="Start a message"
                  placeholderTextColor="#71767b"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  className="text-[16px] text-white min-h-[38px] max-h-[100px]"
                  cursorColor="#1d9bf0"
                />
              </View>

              <TouchableOpacity
                onPress={handleSend}
                disabled={!inputText.trim() && !selectedImage}
                className="ml-2 p-2"
              >
                <Ionicons
                  name="send"
                  size={22}
                  color={
                    inputText.trim() || selectedImage ? "#1d9bf0" : "#074c7a"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// import React, { memo, useCallback, useState, useMemo } from "react";
// import {
//   View,
//   FlatList,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import { useLocalSearchParams, Stack } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { useSelector } from "react-redux";
// import {
//   SafeAreaView,
//   useSafeAreaInsets,
// } from "react-native-safe-area-context";
// import { useChatMessages } from "../../hooks/useChatMessages";
// import { useChatWebSocket } from "../../hooks/useChatWebSocket";
// import { messages as messagesTable } from "../../db/schema";
// import * as Haptics from "expo-haptics";

// // ────────────────────────────────────────────────
// // Memoized Message Bubble
// // ────────────────────────────────────────────────
// const MessageBubble = memo(function MessageBubble({
//   item,
//   prevMessage,
//   user,
// }: {
//   item: typeof messagesTable.$inferSelect;
//   prevMessage: typeof messagesTable.$inferSelect | null;
//   user: any;
// }) {
//   const isMe = item.senderId === user?.id;
//   const isSameSenderAsPrev = prevMessage?.senderId === item.senderId;
//   const isPending = item.status === "pending";

//   return (
//     <View
//       className={`flex-row mb-1 px-4 ${isMe ? "justify-end" : "justify-start"} ${
//         !isSameSenderAsPrev ? "mb-4" : ""
//       }`}
//     >
//       <View
//         className={`max-w-[75%] px-4 py-3 ${
//           isMe
//             ? "bg-[#1d9bf0] rounded-2xl rounded-tr-sm"
//             : "bg-[#eff3f4] rounded-2xl rounded-tl-sm"
//         } ${isPending ? "opacity-70" : ""}`}
//       >
//         <Text
//           className={`${isMe ? "text-white" : "text-gray-900"} text-[15px] leading-5`}
//         >
//           {item.content}
//         </Text>

//         <View className="flex-row items-center justify-end mt-1 gap-1">
//           <Text
//             className={`text-[10px] ${isMe ? "text-sky-200" : "text-gray-400"}`}
//           >
//             {new Date(item.createdAt).toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             })}
//           </Text>
//           {isMe && (
//             <Ionicons
//               name={
//                 isPending
//                   ? "time-outline"
//                   : item.status === "delivered"
//                     ? "checkmark-outline"
//                     : "checkmark-done-outline"
//               }
//               size={14}
//               color={isPending ? "#e0e0e0" : "#ffffff"}
//             />
//           )}
//         </View>
//       </View>
//     </View>
//   );
// });

// // ────────────────────────────────────────────────
// // Main Chat Screen
// // ────────────────────────────────────────────────
// export default function ChatScreen() {
//   const { chatId, title } = useLocalSearchParams();
//   const insets = useSafeAreaInsets();
//   const resolvedChatId = Array.isArray(chatId) ? chatId[0] : chatId;

//   const user = useSelector((state: any) => state.auth.user);
//   const token = useSelector((state: any) => state.auth.token);

//   const { messages, fetchMessages, sendMessage } = useChatMessages(
//     resolvedChatId,
//     token,
//     user,
//   );

//   useChatWebSocket({
//     chatId: resolvedChatId,
//     token,
//     onMessageReceived: fetchMessages,
//   });

//   const [inputText, setInputText] = useState("");

//   const reversedMessages = useMemo(() => {
//     if (!messages) return [];
//     return [...messages].reverse();
//   }, [messages]);

//   const handleSend = useCallback(() => {
//     if (!inputText.trim()) return;
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

//     sendMessage(inputText.trim());
//     setInputText("");
//   }, [inputText, sendMessage]);

//   const renderItem = useCallback(
//     ({
//       item,
//       index,
//     }: {
//       item: typeof messagesTable.$inferSelect;
//       index: number;
//     }) => {
//       const prevMessage =
//         reversedMessages && index + 1 < reversedMessages.length
//           ? reversedMessages[index + 1]
//           : null;

//       return (
//         <MessageBubble item={item} prevMessage={prevMessage} user={user} />
//       );
//     },
//     [reversedMessages, user],
//   );

//   return (
//     <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
//       <Stack.Screen
//         options={{
//           headerTitle: () => (
//             <View className="items-center">
//               <Text className="font-bold text-[17px] text-gray-900">
//                 {title || "Message"}
//               </Text>
//             </View>
//           ),
//           headerTitleAlign: "center",
//           headerShown: true,
//           headerShadowVisible: false,
//         }}
//       />

//       <KeyboardAvoidingView
//         className="flex-1"
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//         // If you have a tab bar, adjust this offset (usually 60-90)
//         keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
//       >
//         <FlatList
//           inverted
//           data={reversedMessages}
//           renderItem={renderItem}
//           keyExtractor={(item) => item.id.toString()}
//           contentContainerStyle={{ paddingVertical: 10 }}
//           showsVerticalScrollIndicator={false}
//           ListEmptyComponent={
//             <View className="flex-1 items-center justify-center mt-20 transform rotate-180">
//               <Text className="text-gray-500 text-[15px]">No messages yet</Text>
//             </View>
//           }
//         />

//         {/* Input Area */}
//         <View className="border-t border-gray-100 bg-white">
//           <View
//             className="flex-row items-end p-2"
//             // We use insets.bottom only when the keyboard is NOT visible
//             // Tailwind doesn't handle dynamic insets well, so we use style
//             style={{ marginBottom: insets.bottom > 0 ? insets.bottom : 10 }}
//           >
//             {/* Media Attach Button */}
//             <TouchableOpacity className="p-2 mb-1">
//               <Ionicons name="image-outline" size={24} color="#1d9bf0" />
//             </TouchableOpacity>

//             <View className="flex-1 bg-[#eff3f4] rounded-2xl flex-row items-center px-4 py-1 min-h-[40px] max-h-[120px]">
//               <TextInput
//                 value={inputText}
//                 onChangeText={setInputText}
//                 placeholder="Start a message"
//                 placeholderTextColor="#536471"
//                 className="flex-1 text-[16px] text-gray-900 py-2"
//                 multiline
//               />
//               {inputText.trim().length > 0 && (
//                 <TouchableOpacity onPress={handleSend} className="ml-2 mb-1">
//                   <Ionicons name="send" size={20} color="#1d9bf0" />
//                 </TouchableOpacity>
//               )}
//             </View>
//           </View>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// // import React, { memo, useCallback, useState, useMemo } from "react";
// // import {
// //   View,
// //   FlatList,
// //   Text,
// //   TextInput,
// //   TouchableOpacity,
// //   KeyboardAvoidingView,
// //   Platform,
// // } from "react-native";
// // import { useLocalSearchParams, Stack } from "expo-router";
// // import { Ionicons } from "@expo/vector-icons";
// // import { useSelector } from "react-redux";
// // import {
// //   SafeAreaView,
// //   useSafeAreaInsets,
// // } from "react-native-safe-area-context";
// // import { useChatMessages } from "../../hooks/useChatMessages";
// // import { useChatWebSocket } from "../../hooks/useChatWebSocket";
// // import { messages as messagesTable } from "../../db/schema";
// // import * as Haptics from "expo-haptics";

// // // ────────────────────────────────────────────────
// // // Memoized Message Bubble
// // // ────────────────────────────────────────────────
// // // ────────────────────────────────────────────────
// // // Fixed: Named function to solve "Missing Display Name"
// // // ────────────────────────────────────────────────
// // const MessageBubble = memo(function MessageBubble({
// //   item,
// //   prevMessage,
// //   user,
// // }: {
// //   item: typeof messagesTable.$inferSelect;
// //   prevMessage: typeof messagesTable.$inferSelect | null;
// //   user: any;
// // }) {
// //   const isMe = item.senderId === user?.id;
// //   const isSameSenderAsPrev = prevMessage?.senderId === item.senderId;
// //   const isPending = item.status === "pending";

// //   return (
// //     <View
// //       className={`flex-row mb-1 px-4 ${isMe ? "justify-end" : "justify-start"} ${
// //         !isSameSenderAsPrev ? "mb-4" : ""
// //       }`}
// //     >
// //       <View
// //         className={`max-w-[75%] px-4 py-3 ${
// //           isMe
// //             ? "bg-[#1d9bf0] rounded-2xl rounded-tr-sm"
// //             : "bg-[#262626] rounded-2xl rounded-tl-sm"
// //         } ${isPending ? "opacity-70" : ""}`}
// //       >
// //         <Text
// //           className={`${isMe ? "text-white" : "text-gray-100"} text-[15px] leading-5`}
// //         >
// //           {item.content}
// //         </Text>

// //         <View className="flex-row items-center justify-end mt-1 gap-1">
// //           <Text
// //             className={`text-[10px] ${isMe ? "text-sky-200" : "text-gray-500"}`}
// //           >
// //             {new Date(item.createdAt).toLocaleTimeString([], {
// //               hour: "2-digit",
// //               minute: "2-digit",
// //             })}
// //           </Text>
// //           {isMe && (
// //             <Ionicons
// //               name={
// //                 isPending
// //                   ? "time-outline"
// //                   : item.status === "delivered"
// //                     ? "checkmark-outline"
// //                     : "checkmark-done-outline"
// //               }
// //               size={14}
// //               color={isPending ? "#e0e0e0" : "#ffffff"}
// //             />
// //           )}
// //         </View>
// //       </View>
// //     </View>
// //   );
// // });

// // // ────────────────────────────────────────────────
// // // Main Chat Screen
// // // ────────────────────────────────────────────────
// // export default function ChatScreen() {
// //   const { chatId, title } = useLocalSearchParams();
// //   const insets = useSafeAreaInsets();
// //   const resolvedChatId = Array.isArray(chatId) ? chatId[0] : chatId;

// //   const user = useSelector((state: any) => state.auth.user);
// //   const token = useSelector((state: any) => state.auth.token);

// //   const { messages, fetchMessages, sendMessage } = useChatMessages(
// //     resolvedChatId,
// //     token,
// //     user,
// //   );

// //   useChatWebSocket({
// //     chatId: resolvedChatId,
// //     token,
// //     onMessageReceived: fetchMessages,
// //   });

// //   const [inputText, setInputText] = useState("");

// //   // 1. REVERSE THE MESSAGES FOR THE INVERTED FLATLIST
// //   const reversedMessages = useMemo(() => {
// //     if (!messages) return [];
// //     return [...messages].reverse();
// //   }, [messages]);

// //   const handleSend = useCallback(() => {
// //     if (!inputText.trim()) return;
// //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// //     sendMessage(inputText.trim());
// //     setInputText("");
// //   }, [inputText, sendMessage]);

// //   const renderItem = useCallback(
// //     ({
// //       item,
// //       index,
// //     }: {
// //       item: typeof messagesTable.$inferSelect;
// //       index: number;
// //     }) => {
// //       // In an inverted list, index + 1 is the chronologically previous message
// //       const prevMessage =
// //         reversedMessages && index + 1 < reversedMessages.length
// //           ? reversedMessages[index + 1]
// //           : null;

// //       return (
// //         <MessageBubble item={item} prevMessage={prevMessage} user={user} />
// //       );
// //     },
// //     [reversedMessages, user],
// //   );

// //   return (
// //     <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
// //       <Stack.Screen
// //         options={{
// //           headerTitle: () => (
// //             <View className="items-center">
// //               <Text className="font-bold text-[17px] text-gray-900">
// //                 {title || "Message"}
// //               </Text>
// //             </View>
// //           ),
// //           headerTitleAlign: "center",
// //           headerShown: true,
// //           headerShadowVisible: false, // X style flat header
// //         }}
// //       />

// //       <KeyboardAvoidingView
// //         className="flex-1"
// //         behavior={Platform.OS === "ios" ? "padding" : undefined}
// //         keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
// //       >
// //         <FlatList
// //           inverted // <--- THIS IS THE MAGIC BULLET FOR CHAT UIs
// //           data={reversedMessages}
// //           renderItem={renderItem}
// //           keyExtractor={(item) => item.id.toString()}
// //           contentContainerStyle={{ paddingVertical: 10 }}
// //           showsVerticalScrollIndicator={false}
// //           ListEmptyComponent={
// //             <View className="flex-1 items-center justify-center mt-20 transform rotate-180">
// //               <Text className="text-gray-500 text-[15px]">No messages yet</Text>
// //             </View>
// //           }
// //         />

// //         {/* X-Style Input Area */}
// //         <View
// //           style={{ paddingBottom: Math.max(insets.bottom, 10) }}
// //           className="flex-row items-end p-2 border-t border-gray-100 bg-white"
// //         >
// //           {/* Media Attach Button */}
// //           <TouchableOpacity className="p-2 mb-1">
// //             <Ionicons name="image-outline" size={24} color="#1d9bf0" />
// //           </TouchableOpacity>

// //           <View className="flex-1 bg-[#eff3f4] rounded-2xl flex-row items-center px-4 py-1.5 min-h-[40px] max-h-[120px]">
// //             <TextInput
// //               value={inputText}
// //               onChangeText={setInputText}
// //               placeholder="Start a message"
// //               placeholderTextColor="#536471"
// //               className="flex-1 text-[16px] text-gray-900 pt-2 pb-2"
// //               multiline
// //             />
// //             {inputText.trim().length > 0 && (
// //               <TouchableOpacity onPress={handleSend} className="ml-2">
// //                 <Ionicons name="send" size={20} color="#1d9bf0" />
// //               </TouchableOpacity>
// //             )}
// //           </View>
// //         </View>
// //       </KeyboardAvoidingView>
// //     </SafeAreaView>
// //   );
// // }

// // // import React, { useEffect, useRef, memo, useCallback, useState } from "react";
// // // import {
// // //   View,
// // //   FlatList,
// // //   Text,
// // //   TextInput,
// // //   TouchableOpacity,
// // //   KeyboardAvoidingView,
// // //   Platform,
// // // } from "react-native";
// // // import { useLocalSearchParams, Stack } from "expo-router";
// // // import { Ionicons } from "@expo/vector-icons";
// // // import { useSelector } from "react-redux";
// // // import {
// // //   SafeAreaView,
// // //   useSafeAreaInsets,
// // // } from "react-native-safe-area-context";
// // // import { useChatMessages } from "../../hooks/useChatMessages";
// // // import { useChatWebSocket } from "../../hooks/useChatWebSocket";
// // // import { messages as messagesTable } from "../../db/schema";

// // // // Memoized Message Bubble Component
// // // const MessageBubble = memo(
// // //   ({
// // //     item,
// // //     prevMessage,
// // //     user,
// // //   }: {
// // //     item: typeof messagesTable.$inferSelect;
// // //     prevMessage: typeof messagesTable.$inferSelect | null;
// // //     user: any;
// // //   }) => {
// // //     const isMe = item.senderId === user?.id;
// // //     const isSameSenderAsPrev = prevMessage?.senderId === item.senderId;
// // //     const isPending = item.status === "pending";

// // //     return (
// // //       <View
// // //         className={`flex-row mb-1 px-4 ${isMe ? "justify-end" : "justify-start"} ${!isSameSenderAsPrev ? "mt-4" : ""}`}
// // //       >
// // //         {!isMe && !isSameSenderAsPrev && (
// // //           <View className="w-8 h-8 rounded-full bg-gray-200 mr-2 items-center justify-center">
// // //             <Ionicons name="person" size={16} color="gray" />
// // //           </View>
// // //         )}
// // //         {!isMe && isSameSenderAsPrev && <View className="w-10" />}

// // //         <View
// // //           className={`max-w-[75%] px-4 py-3 rounded-2xl ${
// // //             isMe
// // //               ? "bg-[#1d9bf0] rounded-tr-[4px]"
// // //               : "bg-gray-100 rounded-tl-[4px]"
// // //           } ${isSameSenderAsPrev ? (isMe ? "rounded-tr-2xl" : "rounded-tl-2xl") : ""} ${isPending ? "opacity-70" : ""}`}
// // //         >
// // //           <Text
// // //             className={`${isMe ? "text-white" : "text-gray-900"} text-[16px]`}
// // //           >
// // //             {item.content}
// // //           </Text>
// // //           <View className="flex-row items-center justify-end mt-1 gap-1">
// // //             <Text
// // //               className={`text-[10px] ${isMe ? "text-sky-100" : "text-gray-400"}`}
// // //             >
// // //               {new Date(item.createdAt).toLocaleTimeString([], {
// // //                 hour: "2-digit",
// // //                 minute: "2-digit",
// // //               })}
// // //             </Text>
// // //             {isMe && (
// // //               <Ionicons
// // //                 name={
// // //                   isPending
// // //                     ? "time-outline"
// // //                     : item.status === "delivered"
// // //                       ? "checkmark-outline"
// // //                       : "checkmark-done-outline"
// // //                 }
// // //                 size={12}
// // //                 color={
// // //                   isPending
// // //                     ? "#e0e0e0"
// // //                     : item.status === "delivered"
// // //                       ? "#87ceeb"
// // //                       : "#4fc3f7"
// // //                 }
// // //               />
// // //             )}
// // //           </View>
// // //         </View>
// // //       </View>
// // //     );
// // //   },
// // // );

// // // export default function ChatScreen() {
// // //   const { chatId, title } = useLocalSearchParams();
// // //   const insets = useSafeAreaInsets();

// // //   // Selectors
// // //   const user = useSelector((state: any) => state.auth.user);
// // //   const token = useSelector((state: any) => state.auth.token);

// // //   // Ensure chatId is a string
// // //   const resolvedChatId = Array.isArray(chatId) ? chatId[0] : chatId;

// // //   // Custom Hooks
// // //   const { messages, loading, fetchMessages, sendMessage } = useChatMessages(
// // //     resolvedChatId,
// // //     token,
// // //     user,
// // //   );

// // //   // WebSocket — uses ref internally so no reconnection loops
// // //   useChatWebSocket({
// // //     chatId: resolvedChatId,
// // //     token,
// // //     onMessageReceived: fetchMessages,
// // //   });

// // //   const [inputText, setInputText] = useState("");
// // //   const flatListRef = useRef<FlatList>(null);

// // //   // Scroll to bottom when new messages arrive
// // //   const scrollToBottom = useCallback((animated = true) => {
// // //     setTimeout(() => {
// // //       flatListRef.current?.scrollToEnd({ animated });
// // //     }, 100);
// // //   }, []);

// // //   // Scroll on new messages
// // //   const prevMessageCount = useRef(0);
// // //   useEffect(() => {
// // //     if (messages && messages.length > prevMessageCount.current) {
// // //       scrollToBottom();
// // //     }
// // //     prevMessageCount.current = messages?.length ?? 0;
// // //   }, [messages?.length, scrollToBottom]);

// // //   const handleSend = useCallback(() => {
// // //     if (!inputText.trim()) return;
// // //     sendMessage(inputText.trim());
// // //     setInputText("");
// // //     // Scroll to bottom immediately for the optimistic message
// // //     scrollToBottom();
// // //   }, [inputText, sendMessage, scrollToBottom]);

// // //   const renderItem = useCallback(
// // //     ({
// // //       item,
// // //       index,
// // //     }: {
// // //       item: typeof messagesTable.$inferSelect;
// // //       index: number;
// // //     }) => {
// // //       const prevMessage = messages && index > 0 ? messages[index - 1] : null;
// // //       return (
// // //         <MessageBubble item={item} prevMessage={prevMessage} user={user} />
// // //       );
// // //     },
// // //     [messages, user],
// // //   );

// // //   const keyExtractor = useCallback(
// // //     (item: typeof messagesTable.$inferSelect) => item.id,
// // //     [],
// // //   );

// // //   return (
// // //     <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
// // //       <Stack.Screen
// // //         options={{
// // //           headerTitle: () => (
// // //             <View className="items-center">
// // //               <Text className="font-bold text-[17px] text-gray-900">
// // //                 {(title as string) || "Chat"}
// // //               </Text>
// // //               <Text className="text-[12px] text-green-500 font-medium">
// // //                 Online
// // //               </Text>
// // //             </View>
// // //           ),
// // //           headerTitleAlign: "center",
// // //           headerShown: true,
// // //         }}
// // //       />

// // //       <KeyboardAvoidingView
// // //         className="flex-1"
// // //         behavior={Platform.OS === "ios" ? "padding" : undefined}
// // //         keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
// // //       >
// // //         <FlatList
// // //           ref={flatListRef}
// // //           data={messages ?? []}
// // //           renderItem={renderItem}
// // //           keyExtractor={keyExtractor}
// // //           contentContainerStyle={{ paddingVertical: 20 }}
// // //           onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
// // //           ListEmptyComponent={
// // //             <View className="flex-1 items-center justify-center mt-20">
// // //               <Text className="text-gray-400">No messages yet</Text>
// // //             </View>
// // //           }
// // //         />

// // //         {/* Input Area */}
// // //         <View
// // //           style={{ paddingBottom: Math.max(insets.bottom, 10) }}
// // //           className="flex-row items-center p-3 border-t border-gray-100 bg-white"
// // //         >
// // //           <TextInput
// // //             value={inputText}
// // //             onChangeText={setInputText}
// // //             placeholder="Message..."
// // //             className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 min-h-[40px] text-gray-800"
// // //             multiline
// // //             onSubmitEditing={handleSend}
// // //           />
// // //           <TouchableOpacity
// // //             onPress={handleSend}
// // //             disabled={!inputText.trim()}
// // //             className={`p-3 rounded-full ${inputText.trim() ? "bg-[#1d9bf0]" : "bg-gray-200"}`}
// // //           >
// // //             <Ionicons
// // //               name="send"
// // //               size={20}
// // //               color={inputText.trim() ? "white" : "#9ca3af"}
// // //             />
// // //           </TouchableOpacity>
// // //         </View>
// // //       </KeyboardAvoidingView>
// // //     </SafeAreaView>
// // //   );
// // // }
