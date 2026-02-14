import React, { useEffect, useRef, memo, useCallback } from "react";
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

// Memoized Message Bubble Component
const MessageBubble = memo(({
  item,
  prevMessage,
  user,
}: {
  item: typeof messagesTable.$inferSelect;
  prevMessage: typeof messagesTable.$inferSelect | null;
  user: any;
}) => {
  const isMe = item.senderId === user?.id;
  const isSameSenderAsPrev = prevMessage?.senderId === item.senderId;
  const isPending = item.status === "pending";

  return (
    <View
      className={`flex-row mb-1 px-4 ${isMe ? "justify-end" : "justify-start"} ${!isSameSenderAsPrev ? "mt-4" : ""}`}
    >
      {!isMe && !isSameSenderAsPrev && (
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
});

export default function ChatScreen() {
  const { chatId, title } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // Selectors
  const user = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);

  // Ensure chatId is a string
  const resolvedChatId = Array.isArray(chatId) ? chatId[0] : chatId;
  
  // Custom Hooks
  const { messages, loading, fetchMessages, sendMessage } = useChatMessages(resolvedChatId, token, user);
  
  // WebSocket - triggers fetchMessages on new message
  useChatWebSocket({
    chatId: resolvedChatId,
    token,
    onMessageReceived: fetchMessages
  });

  const [inputText, setInputText] = React.useState("");
  const flatListRef = useRef<FlatList>(null);

  // Robust Scroll to Bottom
  const lastMessageId = messages?.[messages?.length - 1]?.id;
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length, lastMessageId]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText("");
  };

  const renderItem = useCallback(({ item, index }: { item: typeof messagesTable.$inferSelect; index: number }) => {
    const prevMessage = messages && index > 0 ? messages[index - 1] : null;
    return <MessageBubble item={item} prevMessage={prevMessage} user={user} />;
  }, [messages, user]);

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
          data={messages ?? []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          extraData={messages}
          contentContainerStyle={{ paddingVertical: 20 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
            onPress={handleSend}
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
