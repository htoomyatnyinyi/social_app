import React, { useEffect, useState, useRef } from "react";
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { API_URL } from "../../store/api";
import { useGetMessagesQuery } from "../../store/chatApi";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  const { chatId, title } = useLocalSearchParams();
  const user = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);
  const { data: initialMessages } = useGetMessagesQuery(chatId);

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    const wsUrl = API_URL.replace("http", "ws");
    const socket = new WebSocket(
      `${wsUrl}/chat/ws?chatId=${chatId}&token=${token || ""}`,
    );

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_message") {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    };

    setWs(socket);
    return () => socket.close();
  }, [chatId]);

  const sendMessage = () => {
    if (ws && inputText.trim()) {
      const messageData = {
        message: inputText,
        chatId: chatId as string,
      };
      ws.send(JSON.stringify(messageData));
      setInputText("");
    }
  };

  const MessageBubble = ({ item, index }: { item: any; index: number }) => {
    const isMe = item.senderId === user?.id;
    const prevMessage = messages[index - 1];
    const isSameSenderAsPrev = prevMessage?.senderId === item.senderId;

    return (
      <View
        className={`flex-row mb-1 px-4 ${isMe ? "justify-end" : "justify-start"} ${!isSameSenderAsPrev ? "mt-4" : ""}`}
      >
        {!isMe && (
          <View className="w-8 mr-2 justify-end">
            {!isSameSenderAsPrev && (
              <Image
                source={{
                  uri: item.sender?.image || "https://via.placeholder.com/32",
                }}
                className="w-8 h-8 rounded-full bg-gray-100"
              />
            )}
          </View>
        )}
        <View
          className={`max-w-[75%] px-4 py-3 rounded-2xl ${
            isMe
              ? "bg-[#1d9bf0] rounded-tr-[4px]"
              : "bg-gray-100 rounded-tl-[4px]"
          } ${isSameSenderAsPrev ? (isMe ? "rounded-tr-2xl" : "rounded-tl-2xl") : ""}`}
        >
          <Text
            className={`${isMe ? "text-white" : "text-gray-900"} text-[16px] leading-[22px]`}
          >
            {item.content}
          </Text>
          <Text
            className={`text-[10px] mt-1 self-end ${isMe ? "text-sky-100" : "text-gray-400"}`}
          >
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
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
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "white" },
          headerRight: () => (
            <TouchableOpacity className="mr-4 p-2">
              <Ionicons name="call-outline" size={22} color="#1d9bf0" />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item, index }) => (
            <MessageBubble item={item} index={index} />
          )}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={{ paddingVertical: 20 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20 px-10">
              <View className="w-16 h-16 bg-gray-50 rounded-full items-center justify-center mb-4">
                <Ionicons
                  name="chatbubbles-outline"
                  size={32}
                  color="#D1D5DB"
                />
              </View>
              <Text className="text-gray-400 text-center">
                No messages yet. Send a message to start the conversation!
              </Text>
            </View>
          }
        />

        {/* Input Area */}
        <SafeAreaView edges={["bottom"]}>
          <View className="flex-row items-center p-3 border-t border-gray-50 bg-white">
            <TouchableOpacity className="p-2">
              <Ionicons name="camera-outline" size={26} color="#1d9bf0" />
            </TouchableOpacity>

            <View className="flex-1 flex-row items-center bg-gray-100 rounded-3xl px-4 py-2 mx-1 border border-gray-100">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Message..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-[16px] max-h-32 text-gray-900 py-1"
                multiline
              />
              <TouchableOpacity className="ml-2">
                <Ionicons name="happy-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim()}
              className={`p-2 rounded-full ${inputText.trim() ? "bg-[#1d9bf0]" : "bg-transparent"}`}
            >
              <Ionicons
                name="arrow-up"
                size={22}
                color={inputText.trim() ? "white" : "#bae6fd"}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
