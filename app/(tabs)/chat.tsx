import React from "react";
import { View, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import {
  List,
  Button,
  Icon,
  WhiteSpace,
  WingBlank,
} from "@ant-design/react-native";
import { useRouter } from "expo-router";
import {
  useGetChatRoomsQuery,
  useGetPublicChatQuery,
} from "../../store/chatApi";
import { useSelector } from "react-redux";

export default function ChatListScreen() {
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);
  const { data: rooms, isLoading, refetch } = useGetChatRoomsQuery(user?.id);
  const { data: publicRoom } = useGetPublicChatQuery({});

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#108ee9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WingBlank size="lg">
        <WhiteSpace size="lg" />
        <Button
          type="primary"
          onPress={() =>
            router.push({
              pathname: "/chat/[chatId]",
              params: { chatId: publicRoom?.id, title: "Public Chat" },
            })
          }
        >
          <Icon name="global" size="sm" /> Join Public Chat
        </Button>
      </WingBlank>

      <WhiteSpace size="lg" />

      <List renderHeader="Private Chats">
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const otherUser = item.users.find((u: any) => u.id !== user?.id);
            return (
              <List.Item
                thumb={otherUser?.image || "https://via.placeholder.com/40"}
                onPress={() =>
                  router.push({
                    pathname: "/chat/[chatId]",
                    params: {
                      chatId: item.id,
                      title: otherUser?.name || "Chat",
                    },
                  })
                }
                extra={
                  item.messages?.[0]?.createdAt
                    ? new Date(item.messages[0].createdAt).toLocaleTimeString()
                    : ""
                }
              >
                {otherUser?.name || "Unknown"}
                <List.Item.Brief>
                  {item.messages?.[0]?.content || "No messages yet"}
                </List.Item.Brief>
              </List.Item>
            );
          }}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      </List>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f9",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
