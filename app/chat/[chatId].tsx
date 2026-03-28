import React, {
  memo,
  useCallback,
  useState,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  View,
  FlatList,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
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
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import Animated, {
  FadeInUp,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

type ReplyContext = {
  id: string;
  name: string;
  content: string;
};

const MessageBubble = memo(function MessageBubble({
  item,
  prevMessage,
  user,
  onReply,
  onLongPress,
}: {
  item: any;
  prevMessage: any;
  user: any;
  onReply: (reply: ReplyContext) => void;
  onLongPress: (item: any) => void;
}) {
  const isMe = item.senderId === user?.id;
  const isSameSenderAsPrev = prevMessage?.senderId === item.senderId;
  const isPending = item.status === "pending";
  const isRead = item.read === 1;

  const reactions = useMemo(() => {
    try {
      const meta = item.metadata ? JSON.parse(item.metadata) : {};
      return meta.reactions || {};
    } catch (e) {
      return {};
    }
  }, [item.metadata]);

  const reactionEmojis = Object.values(reactions);

  return (
    <View
      style={{
        flexDirection: "row",
        marginBottom: 4,
        paddingHorizontal: 20,
        justifyContent: isMe ? "flex-end" : "flex-start",
        marginTop: !isSameSenderAsPrev ? 16 : 0,
      }}
    >
      <Pressable
        onLongPress={() => onLongPress(item)}
        style={{
          maxWidth: "85%",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: isMe ? "#0EA5E9" : "white",
          borderRadius: 24,
          borderTopRightRadius: isMe ? 4 : 24,
          borderTopLeftRadius: !isMe ? 4 : 24,
          borderWidth: isMe ? 0 : 1,
          borderColor: "#F1F5F9",
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {item.replyToId && (
          <View
            style={{
              marginBottom: 8,
              padding: 8,
              borderRadius: 12,
              backgroundColor: isMe ? "rgba(3, 105, 161, 0.5)" : "#F9FAFB",
              borderLeftWidth: 4,
              borderLeftColor: isMe ? "#BAE6FD" : "#0EA5E9",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "900",
                color: isMe ? "#BAE6FD" : "#0284C7",
              }}
            >
              {item.replyToName || "Reply"}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isMe ? "rgba(255, 255, 255, 0.8)" : "#6B7280",
              }}
              numberOfLines={1}
            >
              {item.replyToContent}
            </Text>
          </View>
        )}

        {item.mediaUrl && (
          <Image
            source={{ uri: item.mediaUrl }}
            style={{
              width: 208,
              height: 208,
              borderRadius: 16,
              marginBottom: 8,
              backgroundColor: "#F3F4F6",
            }}
            resizeMode="cover"
          />
        )}

        {item.content && (
          <Text
            style={{
              color: isMe ? "white" : "#111827",
              fontSize: 16,
              fontWeight: "500",
              lineHeight: 20,
            }}
          >
            {item.content}
          </Text>
        )}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            marginTop: 4,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontWeight: "700",
              letterSpacing: -0.5,
              color: isMe ? "#BAE6FD" : "#9CA3AF",
            }}
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
                    ? "checkmark-done"
                    : "checkmark"
              }
              size={12}
              color={isPending ? "#e0e0e0" : isRead ? "#bae6fd" : "#ffffff"}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>

        {reactionEmojis.length > 0 && (
          <View
            style={{
              position: "absolute",
              bottom: -8,
              left: -8,
              flexDirection: "row",
              backgroundColor: "white",
              borderRadius: 99,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderWidth: 1,
              borderColor: "#F1F5F9",
            }}
          >
            {Array.from(new Set(reactionEmojis))
              .slice(0, 3)
              .map((emoji: any, i) => (
                <Text key={i} style={{ fontSize: 10 }}>
                  {emoji}
                </Text>
              ))}
            {reactionEmojis.length > 1 && (
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "900",
                  color: "#9CA3AF",
                  marginLeft: 4,
                }}
              >
                {reactionEmojis.length}
              </Text>
            )}
          </View>
        )}
      </Pressable>
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

  useEffect(() => {
    if (resolvedChatId) markAsRead(resolvedChatId);
  }, [resolvedChatId, messages?.length, markAsRead]);

  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { sendTyping, deleteMessage, sendReaction } = useChatWebSocket({
    chatId: resolvedChatId,
    token,
    currentUserId: user?.id,
    onMessageReceived: () => {
      fetchMessages();
      setIsTyping(false);
    },
    onTypingStatus: () => {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
    },
  });

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (text.length > 0) sendTyping();
  };

  const reversedMessages = useMemo(
    () => (messages ? [...messages].reverse() : []),
    [messages],
  );

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      const mimeType = result.assets[0].mimeType || "image/jpeg";
      setSelectedImage(`data:${mimeType};base64,${result.assets[0].base64}`);
    }
  }, []);

  const handleSend = useCallback(() => {
    if (!inputText.trim() && !selectedImage) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(
      inputText.trim(),
      selectedImage || undefined,
      replyContext || undefined,
    );
    setInputText("");
    setSelectedImage(null);
    setReplyContext(null);
  }, [inputText, selectedImage, sendMessage, replyContext]);

  const handleLongPress = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isMe = item.senderId === user?.id;

    Alert.alert(
      "Message Options",
      "Breathe and choose an action.",
      [
        {
          text: "Reply",
          onPress: () =>
            setReplyContext({
              id: item.id,
              name: isMe ? "You" : (title as string) || "Member",
              content: item.content,
            }),
        },
        { text: "Heart React", onPress: () => sendReaction(item.id, "❤️") },
        { text: "Laugh React", onPress: () => sendReaction(item.id, "😂") },
        isMe
          ? {
              text: "Delete",
              style: "destructive",
              onPress: () => deleteMessage(item.id),
            }
          : {},
        { text: "Cancel", style: "cancel" },
      ].filter((o) => Object.keys(o).length > 0) as any,
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            paddingTop: insets.top + 8,
            paddingBottom: 16,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: "#F1F5F9",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 16,
              backgroundColor: "white",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#F1F5F9",
              marginRight: 16,
            }}
          >
            <Ionicons name="chevron-back" size={20} color="#64748B" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: "#111827",
                letterSpacing: -0.5,
              }}
            >
              {title || "Conversation"}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: "#10B981",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginTop: 2,
              }}
            >
              {isTyping ? "Typing serenity..." : "Active in Oasis"}
            </Text>
          </View>
          <Pressable
            style={{
              width: 40,
              height: 40,
              borderRadius: 16,
              backgroundColor: "#F0F9FF",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#E0F2FE",
            }}
          >
            <Ionicons name="call-outline" size={18} color="#0EA5E9" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                onReply={(rep) => setReplyContext(rep)}
                onLongPress={handleLongPress}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{
              paddingTop: 110,
              paddingBottom: 20,
            }}
            showsVerticalScrollIndicator={false}
          />

          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: Platform.OS === "ios" ? 0 : 12,
            }}
          >
            {replyContext && (
              <Animated.View
                entering={SlideInDown}
                exiting={SlideOutDown}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderWidth: 1,
                  borderColor: "#F1F5F9",
                  padding: 12,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  borderBottomWidth: 0,
                }}
              >
                <View
                  style={{
                    width: 4,
                    height: 40,
                    backgroundColor: "#0EA5E9",
                    borderRadius: 99,
                    marginRight: 12,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "900",
                      color: "#0EA5E9",
                      textTransform: "uppercase",
                    }}
                  >
                    Replying to {replyContext.name}
                  </Text>
                  <Text
                    style={{ color: "#6B7280", fontSize: 12 }}
                    numberOfLines={1}
                  >
                    {replyContext.content}
                  </Text>
                </View>
                <Pressable onPress={() => setReplyContext(null)}>
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </Pressable>
              </Animated.View>
            )}

            {selectedImage && (
              <Animated.View
                entering={FadeInUp}
                style={{
                  backgroundColor: "white",
                  padding: 8,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#F1F5F9",
                  marginBottom: 8,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: 64, height: 64, borderRadius: 12 }}
                />
                <Text
                  style={{
                    marginLeft: 12,
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#9CA3AF",
                  }}
                >
                  Image attached
                </Text>
                <Pressable
                  onPress={() => setSelectedImage(null)}
                  style={{
                    marginLeft: "auto",
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#F9FAFB",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="close" size={16} color="#64748B" />
                </Pressable>
              </Animated.View>
            )}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "white",
                borderRadius: 28,
                borderWidth: 1,
                borderColor: "#F1F5F9",
                paddingHorizontal: 8,
                paddingVertical: 8,
                marginBottom: 12,
                borderTopLeftRadius: replyContext ? 0 : 28,
                borderTopRightRadius: replyContext ? 0 : 28,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <Pressable
                onPress={pickImage}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F8FAFC",
                }}
              >
                <Ionicons name="image" size={20} color="#64748B" />
              </Pressable>

              <TextInput
                placeholder="Message..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={handleTextChange}
                multiline
                style={{
                  flex: 1,
                  paddingHorizontal: 12,
                  fontSize: 16,
                  color: "#111827",
                  fontWeight: "500",
                  maxHeight: 120,
                }}
              />

              <Pressable
                onPress={handleSend}
                disabled={!inputText.trim() && !selectedImage}
                style={({ pressed }) => [
                  {
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      inputText.trim() || selectedImage ? "#0EA5E9" : "#E2E8F0",
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <Ionicons name="send" size={30} color="skyblue" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
