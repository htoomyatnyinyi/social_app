import React, { useEffect, useState, useRef } from "react";
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { API_URL } from "../../store/api";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as Crypto from "expo-crypto";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { eq, asc } from "drizzle-orm";
import { db } from "../../db/client";
import { messages as messagesTable } from "../../db/schema";
import { syncMessages } from "../../services/sync"; // Ensure this path is correct

export default function ChatScreen() {
  const { chatId, title } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const user = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);

  // Ensure chatId is a string
  const resolvedChatId = Array.isArray(chatId) ? chatId[0] : chatId;
  
  const [messages, setMessages] = useState<typeof messagesTable.$inferSelect[]>([]);
  
  const fetchMessages = async () => {
    if (!resolvedChatId) return;
    try {
      const msgs = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.chatId, resolvedChatId))
        .orderBy(asc(messagesTable.createdAt));
      setMessages(msgs);
    } catch (e) {
      console.error("Failed to fetch messages", e);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [resolvedChatId]);

  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // 2. Initial Sync
  useEffect(() => {
    if (resolvedChatId && token) {
      syncMessages(resolvedChatId as string, token).then(() => {
        fetchMessages(); // Refresh after initial sync
      });
    }
  }, [resolvedChatId, token]);

  // 3. WebSocket Setup
  useEffect(() => {
    if (!token || !resolvedChatId) return;

    const wsUrl = API_URL.replace("http", "ws");
    const socket = new WebSocket(
      `${wsUrl}/chat/ws?chatId=${resolvedChatId}&token=${token}`,
    );

    socket.onopen = () => console.log("WS Connected");

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WS message received:", data);
        if (data.type === "new_message") {
          await db
            .insert(messagesTable)
            .values({
              id: data.id,
              chatId: resolvedChatId as string,
              senderId: data.senderId,
              content: data.content,
              createdAt: new Date(data.createdAt).getTime(),
              status: "synced",
            })
            .onConflictDoNothing();
          console.log("WS message inserted:", data.id);
          fetchMessages(); // Update UI after receiving message
        }
      } catch (e) {
        console.error("WS Message Error", e);
      }
    };

    return () => socket.close();
  }, [resolvedChatId, token]);

  // 4. Robust Scroll to Bottom
  const lastMessageId = messages?.[messages?.length - 1]?.id;
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length, lastMessageId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !resolvedChatId) return;

    const content = inputText.trim();
    const tempId = Crypto.randomUUID();
    setInputText(""); // Clear UI immediately for speed

    try {
      // 1. Optimistic UI Update (Insert into local DB)
      await db.insert(messagesTable).values({
        id: tempId,
        chatId: resolvedChatId,
        senderId: user?.id,
        content: content,
        createdAt: Date.now(),
        status: "pending", // Mark as pending so we can show a clock icon
      });

      console.log("Message inserted locally with tempId:", tempId);
      fetchMessages(); // Update UI immediately

      // 2. Trigger Sync (don't await - let it happen in background)
      syncMessages(resolvedChatId as string, token)
        .then(() => {
            console.log("Sync completed");
            fetchMessages(); // Update UI after sync to show "synced" status
        })
        .catch((e) => console.error("Sync failed", e));

      // If using WS directly:
      // ws.send(JSON.stringify({ ... }));
    } catch (e) {
      console.error("Send failed", e);
      // Optional: Show toast error
    }
  };

  const MessageBubble = ({
    item,
    index,
  }: {
    item: typeof messagesTable.$inferSelect;
    index: number;
  }) => {
    const isMe = item.senderId === user?.id;
    // Fix: Access messages array directly
    const prevMessage = messages ? messages[index - 1] : null;
    const isSameSenderAsPrev = prevMessage?.senderId === item.senderId;
    const isPending = item.status === "pending";

    return (
      <View
        className={`flex-row mb-1 px-4 ${isMe ? "justify-end" : "justify-start"} ${!isSameSenderAsPrev ? "mt-4" : ""}`}
      >
        {!isMe && !isSameSenderAsPrev && (
          // Placeholder for Avatar - In real app, fetch user image based on senderId
          <View className="w-8 h-8 rounded-full bg-gray-200 mr-2 items-center justify-center">
            <Ionicons name="person" size={16} color="gray" />
          </View>
        )}
        {!isMe && isSameSenderAsPrev && <View className="w-10" />}

        <View
          className={`max-w-[75%] px-4 py-3 rounded-2xl ${
            isMe
              ? "bg-[#1d9bf0] rounded-tr-[4px]"
              : "bg-gray-100 rounded-tl-[4px]"
          } ${isSameSenderAsPrev ? (isMe ? "rounded-tr-2xl" : "rounded-tl-2xl") : ""} ${isPending ? "opacity-70" : ""}`}
        >
          <Text
            className={`${isMe ? "text-white" : "text-gray-900"} text-[16px]`}
          >
            {item.content}
          </Text>
          <View className="flex-row items-center justify-end mt-1 gap-1">
            <Text
              className={`text-[10px] ${isMe ? "text-sky-100" : "text-gray-400"}`}
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
                size={12}
                color={isPending ? "#e0e0e0" : item.status === "delivered" ? "#87ceeb" : "#4fc3f7"}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View className="items-center">
              <Text className="font-bold text-[17px] text-gray-900">
                {(title as string) || "Chat"}
              </Text>
              <Text className="text-[12px] text-green-500 font-medium">
                Online
              </Text>
            </View>
          ),
          headerTitleAlign: "center",
          headerShown: true,
        }}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages ?? []} // Handle null/loading state
          renderItem={({ item, index }) => (
            <MessageBubble item={item} index={index} />
          )}
          keyExtractor={(item) => item.id}
          extraData={messages}
          contentContainerStyle={{ paddingVertical: 20 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })} // Scroll on initial load
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Text className="text-gray-400">No messages yet</Text>
            </View>
          }
        />

        {/* Input Area */}
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 10) }}
          className="flex-row items-center p-3 border-t border-gray-100 bg-white"
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 min-h-[40px] text-gray-800"
            multiline
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!inputText.trim()}
            className={`p-3 rounded-full ${inputText.trim() ? "bg-[#1d9bf0]" : "bg-gray-200"}`}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? "white" : "#9ca3af"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// import { useEffect, useState, useRef } from "react";
// import {
//   View,
//   FlatList,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   Image,
// } from "react-native";
// import { useLocalSearchParams, Stack } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { useSelector } from "react-redux";
// import { API_URL } from "../../store/api";
// import { SafeAreaView } from "react-native-safe-area-context";
// import * as Crypto from "expo-crypto";
// import { useLiveQuery } from "drizzle-orm/expo-sqlite";
// import { eq, asc } from "drizzle-orm";
// import { db } from "../../db/client";
// import { messages as messagesTable } from "../../db/schema";
// import { syncMessages } from "../../services/sync";

// export default function ChatScreen() {
//   const { chatId, title } = useLocalSearchParams();
//   const user = useSelector((state: any) => state.auth.user);
//   const token = useSelector((state: any) => state.auth.token);

//   // Use Live Query to fetch messages from SQLite
//   // We need to ensure chatId is string
//   const resolvedChatId = Array.isArray(chatId) ? chatId[0] : chatId;

//   const messages = useLiveQuery(
//     db
//       .select()
//       .from(messagesTable)
//       .where(eq(messagesTable.chatId, resolvedChatId))
//       // sort by created at asc
//       .orderBy(asc(messagesTable.createdAt)),
//   );

//   const [inputText, setInputText] = useState("");
//   const [ws, setWs] = useState<WebSocket | null>(null);
//   const flatListRef = useRef<FlatList>(null);

//   // Sync on mount
//   useEffect(() => {
//     if (resolvedChatId && token) {
//       syncMessages(resolvedChatId, token);
//     }
//   }, [resolvedChatId, token]);

//   // WebSocket Setup
//   useEffect(() => {
//     if (!token || !resolvedChatId) return;

//     const wsUrl = API_URL.replace("http", "ws");
//     const socket = new WebSocket(
//       `${wsUrl}/chat/ws?chatId=${resolvedChatId}&token=${token || ""}`,
//     );

//     socket.onopen = () => {
//       console.log(`Connected to chat WS for room ${resolvedChatId}`);
//     };

//     socket.onmessage = async (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         if (data.type === "new_message") {
//           // Insert into local DB
//           // Check if exists
//           await db
//             .insert(messagesTable)
//             .values({
//               id: data.id,
//               chatId: data.chatId,
//               senderId: data.senderId,
//               content: data.content,
//               createdAt: new Date(data.createdAt).getTime(),
//               status: "synced",
//               // Sender info isn't stored in 'messages' table directly in schema,
//               // but for UI we often need it.
//               // For now, we assume we can fetch user profile or simplify UI.
//               // In a real app we'd join with 'users' table.
//               // The schema I defined only has `senderId`.
//               // The UI expects `item.sender.image`.
//               // We might need to store sender info or fetch it.
//               // For MVP, we'll skip image or assume hardcoded/cached.
//             })
//             .onConflictDoNothing();
//         }
//       } catch (e) {
//         console.error("Error handling WS message", e);
//       }
//     };

//     socket.onerror = (e) => {
//       console.log("Chat WS error", e);
//     };

//     setWs(socket);

//     return () => {
//       socket.close();
//     };
//   }, [resolvedChatId, token]);

//   const sendMessage = async () => {
//     if (inputText.trim() && resolvedChatId) {
//       const tempId = Crypto.randomUUID();
//       const content = inputText.trim();

//       try {
//         // 1. Insert locally
//         await db.insert(messagesTable).values({
//           id: tempId,
//           chatId: resolvedChatId,
//           senderId: user?.id,
//           content: content,
//           createdAt: Date.now(),
//           status: "pending",
//         });

//         setInputText("");

//         // 2. Trigger Sync
//         syncMessages(resolvedChatId, token);
//       } catch (e) {
//         console.error("Failed to send message locally", e);
//       }
//     }
//   };

//   const MessageBubble = ({ item, index }: { item: any; index: number }) => {
//     const isMe = item.senderId === user?.id;
//     const prevMessage = messages.data
//       ? messages.data[index - 1]
//       : messages[index - 1]; // specific check for array
//     const isSameSenderAsPrev = prevMessage?.senderId === item.senderId;
//     const isPending = item.status === "pending";

//     return (
//       <View
//         className={`flex-row mb-1 px-4 ${isMe ? "justify-end" : "justify-start"} ${!isSameSenderAsPrev ? "mt-4" : ""}`}
//       >
//         {!isMe && (
//           <View className="w-8 mr-2 justify-end">
//             {/* Avatar placeholder or fetched logic */}
//             <View className="w-8 h-8 rounded-full bg-gray-200" />
//           </View>
//         )}
//         <View
//           className={`max-w-[75%] px-4 py-3 rounded-2xl ${
//             isMe
//               ? "bg-[#1d9bf0] rounded-tr-[4px]"
//               : "bg-gray-100 rounded-tl-[4px]"
//           } ${isSameSenderAsPrev ? (isMe ? "rounded-tr-2xl" : "rounded-tl-2xl") : ""} ${isPending ? "opacity-70" : ""}`}
//         >
//           <Text
//             className={`${isMe ? "text-white" : "text-gray-900"} text-[16px] leading-[22px]`}
//           >
//             {item.content}
//           </Text>
//           <View className="flex-row items-center justify-end mt-1">
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
//                 name={isPending ? "time-outline" : "checkmark-done-outline"}
//                 size={12}
//                 color={isPending ? "#e0e0e0" : "white"}
//                 style={{ marginLeft: 4 }}
//               />
//             )}
//           </View>
//         </View>
//       </View>
//     );
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
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
//           headerBackTitle: "Back",
//         }}
//       />

//       <KeyboardAvoidingView
//         className="flex-1"
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
//       >
//         <FlatList
//           ref={flatListRef}
//           data={messages}
//           renderItem={({ item, index }) => (
//             <MessageBubble item={item} index={index} />
//           )}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={{ paddingVertical: 20 }}
//           onContentSizeChange={() =>
//             flatListRef.current?.scrollToEnd({ animated: true })
//           }
//           ListEmptyComponent={
//             <View className="flex-1 items-center justify-center mt-20 px-10">
//               <Text className="text-gray-400 text-center">
//                 Start messaging...
//               </Text>
//             </View>
//           }
//         />

//         <View className="flex-row items-center p-3 border-t border-gray-50 bg-white pb-6">
//           <TextInput
//             value={inputText}
//             onChangeText={setInputText}
//             placeholder="Message..."
//             className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 mr-2 min-h-[40px]"
//             multiline
//           />
//           <TouchableOpacity
//             onPress={sendMessage}
//             disabled={!inputText.trim()}
//             className={`p-2 rounded-full ${inputText.trim() ? "bg-[#1d9bf0]" : "bg-gray-200"}`}
//           >
//             <Ionicons name="send" size={20} color="white" />
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// // // #####
// // import React, { useEffect, useState, useRef } from "react";
// // import {
// //   View,
// //   FlatList,
// //   Text,
// //   TextInput,
// //   TouchableOpacity,
// //   KeyboardAvoidingView,
// //   Platform,
// //   ActivityIndicator,
// // } from "react-native";
// // import { useLocalSearchParams, Stack } from "expo-router";
// // import { Ionicons } from "@expo/vector-icons";
// // import { useSelector } from "react-redux";
// // import { API_URL } from "../../store/api";
// // import {
// //   SafeAreaView,
// //   useSafeAreaInsets,
// // } from "react-native-safe-area-context";
// // import * as Crypto from "expo-crypto";
// // import { useLiveQuery } from "drizzle-orm/expo-sqlite";
// // import { eq, asc } from "drizzle-orm";
// // import { db } from "../../db/client";
// // import { messages as messagesTable } from "../../db/schema";
// // // import { syncMessages } from "../../services/sync"; // Ensure this path is correct

// // export default function ChatScreen() {
// //   const { chatId, title } = useLocalSearchParams();
// //   const insets = useSafeAreaInsets();
// //   const user = useSelector((state: any) => state.auth.user);
// //   const token = useSelector((state: any) => state.auth.token);

// //   // Ensure chatId is a string
// //   const resolvedChatId = Array.isArray(chatId) ? chatId[0] : chatId;

// //   // 1. FIX: Correct useLiveQuery usage
// //   // useLiveQuery returns the array of data directly.
// //   const { data: messages } = useLiveQuery(
// //     db
// //       .select()
// //       .from(messagesTable)
// //       .where(eq(messagesTable.chatId, resolvedChatId as string))
// //       .orderBy(asc(messagesTable.createdAt)),
// //   );

// //   const [inputText, setInputText] = useState("");
// //   const flatListRef = useRef<FlatList>(null);

// //   // 2. Initial Sync
// //   useEffect(() => {
// //     if (resolvedChatId && token) {
// //       // syncMessages(resolvedChatId, token); // Uncomment when sync service is ready
// //     }
// //   }, [resolvedChatId, token]);

// //   // 3. WebSocket Setup
// //   useEffect(() => {
// //     if (!token || !resolvedChatId) return;

// //     const wsUrl = API_URL.replace("http", "ws");
// //     const socket = new WebSocket(
// //       `${wsUrl}/chat/ws?chatId=${resolvedChatId}&token=${token}`,
// //     );

// //     socket.onopen = () => console.log("WS Connected");

// //     socket.onmessage = async (event) => {
// //       try {
// //         const data = JSON.parse(event.data);
// //         if (data.type === "new_message") {
// //           // Drizzle insert. The LiveQuery will automatically update the UI.
// //           await db
// //             .insert(messagesTable)
// //             .values({
// //               id: data.id,
// //               chatId: resolvedChatId,
// //               senderId: data.senderId,
// //               content: data.content,
// //               createdAt: new Date(data.createdAt).getTime(), // Ensure backend sends ISO string
// //               status: "synced",
// //             })
// //             .onConflictDoNothing();
// //         }
// //       } catch (e) {
// //         console.error("WS Message Error", e);
// //       }
// //     };

// //     return () => socket.close();
// //   }, [resolvedChatId, token]);

// //   const sendMessage = async () => {
// //     if (!inputText.trim() || !resolvedChatId) return;

// //     const content = inputText.trim();
// //     const tempId = Crypto.randomUUID();
// //     setInputText(""); // Clear UI immediately for speed

// //     try {
// //       // 1. Optimistic UI Update (Insert into local DB)
// //       await db.insert(messagesTable).values({
// //         id: tempId,
// //         chatId: resolvedChatId,
// //         senderId: user?.id,
// //         content: content,
// //         createdAt: Date.now(),
// //         status: "pending", // Mark as pending so we can show a clock icon
// //       });

// //       // 2. Trigger Sync (Or send via WS if you prefer real-time first)
// //       // If using HTTP Sync:
// //       // await syncMessages(resolvedChatId, token);

// //       // If using WS directly:
// //       // ws.send(JSON.stringify({ ... }));
// //     } catch (e) {
// //       console.error("Send failed", e);
// //       // Optional: Show toast error
// //     }
// //   };

// //   const MessageBubble = ({
// //     item,
// //     index,
// //   }: {
// //     item: typeof messagesTable.$inferSelect;
// //     index: number;
// //   }) => {
// //     const isMe = item.senderId === user?.id;
// //     // Fix: Access messages array directly
// //     const prevMessage = messages ? messages[index - 1] : null;
// //     const isSameSenderAsPrev = prevMessage?.senderId === item.senderId;
// //     const isPending = item.status === "pending";

// //     return (
// //       <View
// //         className={`flex-row mb-1 px-4 ${isMe ? "justify-end" : "justify-start"} ${!isSameSenderAsPrev ? "mt-4" : ""}`}
// //       >
// //         {!isMe && !isSameSenderAsPrev && (
// //           // Placeholder for Avatar - In real app, fetch user image based on senderId
// //           <View className="w-8 h-8 rounded-full bg-gray-200 mr-2 items-center justify-center">
// //             <Ionicons name="person" size={16} color="gray" />
// //           </View>
// //         )}
// //         {!isMe && isSameSenderAsPrev && <View className="w-10" />}

// //         <View
// //           className={`max-w-[75%] px-4 py-3 rounded-2xl ${
// //             isMe
// //               ? "bg-[#1d9bf0] rounded-tr-[4px]"
// //               : "bg-gray-100 rounded-tl-[4px]"
// //           } ${isSameSenderAsPrev ? (isMe ? "rounded-tr-2xl" : "rounded-tl-2xl") : ""} ${isPending ? "opacity-70" : ""}`}
// //         >
// //           <Text
// //             className={`${isMe ? "text-white" : "text-gray-900"} text-[16px]`}
// //           >
// //             {item.content}
// //           </Text>
// //           <View className="flex-row items-center justify-end mt-1 gap-1">
// //             <Text
// //               className={`text-[10px] ${isMe ? "text-sky-100" : "text-gray-400"}`}
// //             >
// //               {new Date(item.createdAt).toLocaleTimeString([], {
// //                 hour: "2-digit",
// //                 minute: "2-digit",
// //               })}
// //             </Text>
// //             {isMe && (
// //               <Ionicons
// //                 name={isPending ? "time-outline" : "checkmark-done-outline"}
// //                 size={12}
// //                 color={isPending ? "#e0e0e0" : "white"}
// //               />
// //             )}
// //           </View>
// //         </View>
// //       </View>
// //     );
// //   };

// //   return (
// //     <SafeAreaView className="flex-1 bg-white" edges={["left", "right"]}>
// //       <Stack.Screen
// //         options={{
// //           headerTitle: () => (
// //             <View className="items-center">
// //               <Text className="font-bold text-[17px] text-gray-900">
// //                 {(title as string) || "Chat"}
// //               </Text>
// //               <Text className="text-[12px] text-green-500 font-medium">
// //                 Online
// //               </Text>
// //             </View>
// //           ),
// //           headerTitleAlign: "center",
// //           headerShown: true,
// //         }}
// //       />

// //       <KeyboardAvoidingView
// //         className="flex-1"
// //         behavior={Platform.OS === "ios" ? "padding" : undefined}
// //         keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
// //       >
// //         <FlatList
// //           ref={flatListRef}
// //           data={messages ?? []} // Handle null/loading state
// //           renderItem={({ item, index }) => (
// //             <MessageBubble item={item} index={index} />
// //           )}
// //           keyExtractor={(item) => item.id}
// //           contentContainerStyle={{ paddingVertical: 20 }}
// //           onContentSizeChange={() =>
// //             flatListRef.current?.scrollToEnd({ animated: true })
// //           }
// //           onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })} // Scroll on initial load
// //           ListEmptyComponent={
// //             <View className="flex-1 items-center justify-center mt-20">
// //               <Text className="text-gray-400">No messages yet</Text>
// //             </View>
// //           }
// //         />

// //         {/* Input Area */}
// //         <View
// //           style={{ paddingBottom: Math.max(insets.bottom, 10) }}
// //           className="flex-row items-center p-3 border-t border-gray-100 bg-white"
// //         >
// //           <TextInput
// //             value={inputText}
// //             onChangeText={setInputText}
// //             placeholder="Message..."
// //             className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 min-h-[40px] text-gray-800"
// //             multiline
// //           />
// //           <TouchableOpacity
// //             onPress={sendMessage}
// //             disabled={!inputText.trim()}
// //             className={`p-3 rounded-full ${inputText.trim() ? "bg-[#1d9bf0]" : "bg-gray-200"}`}
// //           >
// //             <Ionicons
// //               name="send"
// //               size={20}
// //               color={inputText.trim() ? "white" : "#9ca3af"}
// //             />
// //           </TouchableOpacity>
// //         </View>
// //       </KeyboardAvoidingView>
// //     </SafeAreaView>
// //   );
// // }
