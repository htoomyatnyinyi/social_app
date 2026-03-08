import React, { memo, useCallback, useState, useMemo } from "react";
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useChatMessages } from "../../hooks/useChatMessages";
import { useChatWebSocket } from "../../hooks/useChatWebSocket";
import { messages as messagesTable } from "../../db/schema";
import * as Haptics from "expo-haptics";

// ────────────────────────────────────────────────
// Memoized Message Bubble
// ────────────────────────────────────────────────
const MessageBubble = memo(
  ({
    item,
    prevMessage,
    user,
  }: {
    item: typeof messagesTable.$inferSelect;
    prevMessage: typeof messagesTable.$inferSelect | null;
    user: any;
  }) => {
    const isMe = item.senderId === user?.id;
    // Because the list is inverted, 'prevMessage' conceptually means the message chronologically BEFORE this one
    const isSameSenderAsPrev = prevMessage?.senderId === item.senderId;
    const isPending = item.status === "pending";

    return (
      <View
        className={`flex-row mb-1 px-4 ${isMe ? "justify-end" : "justify-start"} ${!isSameSenderAsPrev ? "mb-4" : ""}`}
      >
        <View
          className={`max-w-[75%] px-4 py-3 ${
            isMe
              ? "bg-[#1d9bf0] rounded-2xl rounded-tr-sm"
              : "bg-[#eff3f4] rounded-2xl rounded-tl-sm"
          } ${isPending ? "opacity-70" : ""}`}
        >
          <Text
            className={`${isMe ? "text-white" : "text-gray-900"} text-[15px] leading-5`}
          >
            {item.content}
          </Text>

          <View className="flex-row items-center justify-end mt-1 gap-1">
            <Text
              className={`text-[10px] ${isMe ? "text-sky-200" : "text-gray-400"}`}
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
                    : item.status === "delivered"
                      ? "checkmark-outline"
                      : "checkmark-done-outline"
                }
                size={14}
                color={isPending ? "#e0e0e0" : "#ffffff"}
              />
            )}
          </View>
        </View>
      </View>
    );
  },
);

// ────────────────────────────────────────────────
// Main Chat Screen
// ────────────────────────────────────────────────
export default function ChatScreen() {
  const { chatId, title } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const resolvedChatId = Array.isArray(chatId) ? chatId[0] : chatId;

  const user = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);

  const { messages, fetchMessages, sendMessage } = useChatMessages(
    resolvedChatId,
    token,
    user,
  );

  useChatWebSocket({
    chatId: resolvedChatId,
    token,
    onMessageReceived: fetchMessages,
  });

  const [inputText, setInputText] = useState("");

  // 1. REVERSE THE MESSAGES FOR THE INVERTED FLATLIST
  const reversedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].reverse();
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    sendMessage(inputText.trim());
    setInputText("");
  }, [inputText, sendMessage]);

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: typeof messagesTable.$inferSelect;
      index: number;
    }) => {
      // In an inverted list, index + 1 is the chronologically previous message
      const prevMessage =
        reversedMessages && index + 1 < reversedMessages.length
          ? reversedMessages[index + 1]
          : null;

      return (
        <MessageBubble item={item} prevMessage={prevMessage} user={user} />
      );
    },
    [reversedMessages, user],
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View className="items-center">
              <Text className="font-bold text-[17px] text-gray-900">
                {title || "Message"}
              </Text>
            </View>
          ),
          headerTitleAlign: "center",
          headerShown: true,
          headerShadowVisible: false, // X style flat header
        }}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          inverted // <--- THIS IS THE MAGIC BULLET FOR CHAT UIs
          data={reversedMessages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingVertical: 10 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20 transform rotate-180">
              <Text className="text-gray-500 text-[15px]">No messages yet</Text>
            </View>
          }
        />

        {/* X-Style Input Area */}
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 10) }}
          className="flex-row items-end p-2 border-t border-gray-100 bg-white"
        >
          {/* Media Attach Button */}
          <TouchableOpacity className="p-2 mb-1">
            <Ionicons name="image-outline" size={24} color="#1d9bf0" />
          </TouchableOpacity>

          <View className="flex-1 bg-[#eff3f4] rounded-2xl flex-row items-center px-4 py-1.5 min-h-[40px] max-h-[120px]">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Start a message"
              placeholderTextColor="#536471"
              className="flex-1 text-[16px] text-gray-900 pt-2 pb-2"
              multiline
            />
            {inputText.trim().length > 0 && (
              <TouchableOpacity onPress={handleSend} className="ml-2">
                <Ionicons name="send" size={20} color="#1d9bf0" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// import React, { useEffect, useRef, memo, useCallback, useState } from "react";
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

// // Memoized Message Bubble Component
// const MessageBubble = memo(
//   ({
//     item,
//     prevMessage,
//     user,
//   }: {
//     item: typeof messagesTable.$inferSelect;
//     prevMessage: typeof messagesTable.$inferSelect | null;
//     user: any;
//   }) => {
//     const isMe = item.senderId === user?.id;
//     const isSameSenderAsPrev = prevMessage?.senderId === item.senderId;
//     const isPending = item.status === "pending";

//     return (
//       <View
//         className={`flex-row mb-1 px-4 ${isMe ? "justify-end" : "justify-start"} ${!isSameSenderAsPrev ? "mt-4" : ""}`}
//       >
//         {!isMe && !isSameSenderAsPrev && (
//           <View className="w-8 h-8 rounded-full bg-gray-200 mr-2 items-center justify-center">
//             <Ionicons name="person" size={16} color="gray" />
//           </View>
//         )}
//         {!isMe && isSameSenderAsPrev && <View className="w-10" />}

//         <View
//           className={`max-w-[75%] px-4 py-3 rounded-2xl ${
//             isMe
//               ? "bg-[#1d9bf0] rounded-tr-[4px]"
//               : "bg-gray-100 rounded-tl-[4px]"
//           } ${isSameSenderAsPrev ? (isMe ? "rounded-tr-2xl" : "rounded-tl-2xl") : ""} ${isPending ? "opacity-70" : ""}`}
//         >
//           <Text
//             className={`${isMe ? "text-white" : "text-gray-900"} text-[16px]`}
//           >
//             {item.content}
//           </Text>
//           <View className="flex-row items-center justify-end mt-1 gap-1">
//             <Text
//               className={`text-[10px] ${isMe ? "text-sky-100" : "text-gray-400"}`}
//             >
//               {new Date(item.createdAt).toLocaleTimeString([], {
//                 hour: "2-digit",
//                 minute: "2-digit",
//               })}
//             </Text>
//             {isMe && (
//               <Ionicons
//                 name={
//                   isPending
//                     ? "time-outline"
//                     : item.status === "delivered"
//                       ? "checkmark-outline"
//                       : "checkmark-done-outline"
//                 }
//                 size={12}
//                 color={
//                   isPending
//                     ? "#e0e0e0"
//                     : item.status === "delivered"
//                       ? "#87ceeb"
//                       : "#4fc3f7"
//                 }
//               />
//             )}
//           </View>
//         </View>
//       </View>
//     );
//   },
// );

// export default function ChatScreen() {
//   const { chatId, title } = useLocalSearchParams();
//   const insets = useSafeAreaInsets();

//   // Selectors
//   const user = useSelector((state: any) => state.auth.user);
//   const token = useSelector((state: any) => state.auth.token);

//   // Ensure chatId is a string
//   const resolvedChatId = Array.isArray(chatId) ? chatId[0] : chatId;

//   // Custom Hooks
//   const { messages, loading, fetchMessages, sendMessage } = useChatMessages(
//     resolvedChatId,
//     token,
//     user,
//   );

//   // WebSocket — uses ref internally so no reconnection loops
//   useChatWebSocket({
//     chatId: resolvedChatId,
//     token,
//     onMessageReceived: fetchMessages,
//   });

//   const [inputText, setInputText] = useState("");
//   const flatListRef = useRef<FlatList>(null);

//   // Scroll to bottom when new messages arrive
//   const scrollToBottom = useCallback((animated = true) => {
//     setTimeout(() => {
//       flatListRef.current?.scrollToEnd({ animated });
//     }, 100);
//   }, []);

//   // Scroll on new messages
//   const prevMessageCount = useRef(0);
//   useEffect(() => {
//     if (messages && messages.length > prevMessageCount.current) {
//       scrollToBottom();
//     }
//     prevMessageCount.current = messages?.length ?? 0;
//   }, [messages?.length, scrollToBottom]);

//   const handleSend = useCallback(() => {
//     if (!inputText.trim()) return;
//     sendMessage(inputText.trim());
//     setInputText("");
//     // Scroll to bottom immediately for the optimistic message
//     scrollToBottom();
//   }, [inputText, sendMessage, scrollToBottom]);

//   const renderItem = useCallback(
//     ({
//       item,
//       index,
//     }: {
//       item: typeof messagesTable.$inferSelect;
//       index: number;
//     }) => {
//       const prevMessage = messages && index > 0 ? messages[index - 1] : null;
//       return (
//         <MessageBubble item={item} prevMessage={prevMessage} user={user} />
//       );
//     },
//     [messages, user],
//   );

//   const keyExtractor = useCallback(
//     (item: typeof messagesTable.$inferSelect) => item.id,
//     [],
//   );

//   return (
//     <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
//       <Stack.Screen
//         options={{
//           headerTitle: () => (
//             <View className="items-center">
//               <Text className="font-bold text-[17px] text-gray-900">
//                 {(title as string) || "Chat"}
//               </Text>
//               <Text className="text-[12px] text-green-500 font-medium">
//                 Online
//               </Text>
//             </View>
//           ),
//           headerTitleAlign: "center",
//           headerShown: true,
//         }}
//       />

//       <KeyboardAvoidingView
//         className="flex-1"
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
//       >
//         <FlatList
//           ref={flatListRef}
//           data={messages ?? []}
//           renderItem={renderItem}
//           keyExtractor={keyExtractor}
//           contentContainerStyle={{ paddingVertical: 20 }}
//           onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
//           ListEmptyComponent={
//             <View className="flex-1 items-center justify-center mt-20">
//               <Text className="text-gray-400">No messages yet</Text>
//             </View>
//           }
//         />

//         {/* Input Area */}
//         <View
//           style={{ paddingBottom: Math.max(insets.bottom, 10) }}
//           className="flex-row items-center p-3 border-t border-gray-100 bg-white"
//         >
//           <TextInput
//             value={inputText}
//             onChangeText={setInputText}
//             placeholder="Message..."
//             className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 min-h-[40px] text-gray-800"
//             multiline
//             onSubmitEditing={handleSend}
//           />
//           <TouchableOpacity
//             onPress={handleSend}
//             disabled={!inputText.trim()}
//             className={`p-3 rounded-full ${inputText.trim() ? "bg-[#1d9bf0]" : "bg-gray-200"}`}
//           >
//             <Ionicons
//               name="send"
//               size={20}
//               color={inputText.trim() ? "white" : "#9ca3af"}
//             />
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }
