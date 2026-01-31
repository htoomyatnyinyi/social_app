import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { List, InputItem, Button, WingBlank } from "@ant-design/react-native";

import { API_URL } from "../../store/api";

export default function ChatScreen() {
  const { chatId, userId, receiverId, title } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = API_URL.replace("http", "ws");
    const socket = new WebSocket(`${wsUrl}/chat/ws?chatId=${chatId}`);

    socket.onopen = () => {
      console.log("Connected to chat");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_message") {
        setMessages((prev) => [...prev, data]);
      }
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [chatId]);

  const sendMessage = () => {
    if (ws && inputText.trim()) {
      const messageData = {
        message: inputText,
        senderId: userId as string,
        receiverId: receiverId as string,
        chatId: chatId as string,
      };
      ws.send(JSON.stringify(messageData));
      setInputText("");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <Stack.Screen options={{ title: (title as string) || "Chat" }} />
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <WingBlank size="md" style={{ marginVertical: 5 }}>
            <List.Item
              extra={item.senderId === userId ? "Me" : "Them"}
              multipleLine
              align="top"
              style={{
                borderRadius: 10,
                backgroundColor:
                  item.senderId === userId ? "#e6f7ff" : "#f5f5f5",
              }}
            >
              <Text>{item.content}</Text>
            </List.Item>
          </WingBlank>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
      <View style={styles.inputContainer}>
        <InputItem
          value={inputText}
          onChange={(text) => setInputText(text)}
          placeholder="Type a message..."
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          onPress={sendMessage}
          style={{ marginLeft: 10, borderRadius: 20 }}
          size="small"
        >
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
  },
});
