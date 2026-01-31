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

  const MessageBubble = ({ item }: { item: any }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View
        className={`flex-row mb-4 px-4 ${isMe ? "justify-end" : "justify-start"}`}
      >
        {!isMe && (
          <Image
            source={{
              uri: item.sender?.image || "https://via.placeholder.com/30",
            }}
            className="w-8 h-8 rounded-full mr-2 self-end"
          />
        )}
        <View
          className={`max-w-[80%] px-4 py-2 rounded-2xl ${
            isMe ? "bg-sky-500 rounded-tr-none" : "bg-gray-100 rounded-tl-none"
          }`}
        >
          <Text className={`${isMe ? "text-white" : "text-black"} text-[16px]`}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: (title as string) || "Chat",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity className="mr-4">
              <Ionicons
                name="information-circle-outline"
                size={24}
                color="black"
              />
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => <MessageBubble item={item} />}
        keyExtractor={(item, index) => item.id || index.toString()}
        contentContainerStyle={{ paddingVertical: 20 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {/* Input Area */}
      <View className="flex-row items-center p-3 border-t border-gray-100">
        <TouchableOpacity className="mr-2">
          <Ionicons name="image-outline" size={26} color="#0ea5e9" />
        </TouchableOpacity>
        <TouchableOpacity className="mr-2">
          <Ionicons name="gift-outline" size={26} color="#0ea5e9" />
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center bg-gray-100 rounded-2xl px-4 py-1.5">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Start a message"
            className="flex-1 text-[16px] max-h-32"
            multiline
          />
          <TouchableOpacity onPress={sendMessage} disabled={!inputText.trim()}>
            <Ionicons
              name="send"
              size={22}
              color={inputText.trim() ? "#0ea5e9" : "#bae6fd"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
