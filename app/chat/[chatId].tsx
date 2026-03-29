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
  TouchableOpacity,
  Platform,
  Alert,
  Pressable,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useMarkMessagesAsReadMutation } from "../../store/chatApi";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";

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
    } catch {
      return {};
    }
  }, [item.metadata]);

  const reactionEmojis = Object.values(reactions);

  return (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: 16,
        marginBottom: 4,
        justifyContent: isMe ? "flex-end" : "flex-start",
        marginTop: !isSameSenderAsPrev ? 16 : 0,
      }}
    >
      {!isMe && !isSameSenderAsPrev && (
        <View style={{ marginRight: 8, justifyContent: "flex-end" }}>
          <Image
            source={{
              uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${item.senderId}`,
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 10,
              backgroundColor: "#F1F5F9",
            }}
            contentFit="cover"
          />
        </View>
      )}
      {isMe && !isSameSenderAsPrev && <View style={{ width: 36 }} />}

      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => onLongPress(item)}
        style={{
          maxWidth: "75%",
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 20,
          backgroundColor: isMe ? "#0EA5E9" : "white",
          borderWidth: isMe ? 0 : 1,
          borderColor: "#F1F5F9",
          opacity: isPending ? 0.7 : 1,
          borderTopRightRadius: isMe && isSameSenderAsPrev ? 4 : isMe ? 2 : 20,
          borderTopLeftRadius: !isMe && isSameSenderAsPrev ? 4 : !isMe ? 2 : 20,
        }}
      >
        {item.replyToId && (
          <View
            style={{
              marginBottom: 6,
              padding: 8,
              borderRadius: 8,
              borderLeftWidth: 3,
              borderLeftColor: isMe ? "rgba(255,255,255,0.4)" : "#0EA5E9",
              backgroundColor: isMe ? "rgba(0,0,0,0.05)" : "#F8FAFC",
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 2,
                color: isMe ? "rgba(255,255,255,0.9)" : "#0EA5E9",
              }}
            >
              {item.replyToName || "Reply"}
            </Text>
            <Text
              style={{
                fontSize: 11,
                lineHeight: 14,
                color: isMe ? "rgba(255, 255, 255, 0.8)" : "#64748B",
              }}
              numberOfLines={2}
            >
              {item.replyToContent}
            </Text>
          </View>
        )}

        {item.mediaUrl && (
          <Image
            source={{ uri: item.mediaUrl }}
            style={{
              width: 200,
              height: 200,
              borderRadius: 12,
              marginBottom: 4,
            }}
            contentFit="cover"
          />
        )}

        {item.content && (
          <Text
            style={{
              fontSize: 15,
              fontWeight: "400",
              lineHeight: 20,
              color: isMe ? "white" : "#1E293B",
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
              fontSize: 8,
              fontWeight: "600",
              color: isMe ? "rgba(255, 255, 255, 0.6)" : "#94A3B8",
              marginRight: 4,
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
              size={11}
              color={
                isPending ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.8)"
              }
            />
          )}
        </View>

        {reactionEmojis.length > 0 && (
          <View
            style={{
              position: "absolute",
              bottom: -6,
              left: -4,
              flexDirection: "row",
              backgroundColor: "white",
              borderRadius: 10,
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderWidth: 1,
              borderColor: "#F1F5F9",
            }}
          >
            {Array.from(new Set(reactionEmojis))
              .slice(0, 3)
              .map((emoji: any, i) => (
                <Text key={i} style={{ fontSize: 9 }}>
                  {emoji}
                </Text>
              ))}
          </View>
        )}
      </TouchableOpacity>
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

  const handleLongPress = useCallback(
    (item: any) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const isMe = item.senderId === user?.id;
      const itemContent =
        item.content ||
        (item.mediaUrl ? "Artifact Reflection" : "Minimal Message");

      Alert.alert(
        "Resonance",
        "Choose an action for this whisper.",
        [
          {
            text: "Reply",
            onPress: () =>
              setReplyContext({
                id: item.id,
                name: isMe ? "You" : (title as string) || "Member",
                content: itemContent,
              }),
          },
          { text: "❤️ Love", onPress: () => sendReaction(item.id, "❤️") },
          { text: "✨ Spark", onPress: () => sendReaction(item.id, "✨") },
          isMe
            ? {
                text: "Dissolve",
                style: "destructive",
                onPress: () => deleteMessage(item.id),
              }
            : null,
          { text: "Keep", style: "cancel" },
        ].filter(Boolean) as any,
      );
    },
    [user?.id, title, sendReaction, deleteMessage],
  );

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const headerContent = useMemo(
    () => (
      <View
        style={{
          backgroundColor: "white",
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#F1F5F9",
          paddingTop: insets.top,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 16,
              backgroundColor: "#F8FAFC",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#F1F5F9",
              marginRight: 16,
            }}
          >
            <Ionicons name="chevron-back" size={20} color="#334155" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: "#0F172A",
                letterSpacing: -0.5,
              }}
              numberOfLines={1}
            >
              {title || "Conversation"}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 2,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  marginRight: 6,
                  backgroundColor: isTyping ? "#38BDF8" : "#10B981",
                }}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "900",
                  color: isTyping ? "#0EA5E9" : "#10B981",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {isTyping ? "Whispering..." : "Synchronized"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    ),
    [insets.top, isTyping, title, router],
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      {headerContent}

      <View style={{ flex: 1 }}>
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
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />

        <View
          style={{
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: "#F1F5F9",
            paddingBottom:
              keyboardHeight > 0
                ? keyboardHeight -
                  (Platform.OS === "ios" ? insets.bottom : 0) +
                  8
                : Math.max(insets.bottom, 12) + 8,
            paddingTop: 10,
          }}
        >
          {replyContext && (
            <View
              style={{
                backgroundColor: "#F8FAFC",
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 1,
                borderBottomColor: "#F1F5F9",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 3,
                  height: 26,
                  backgroundColor: "#0EA5E9",
                  borderRadius: 1.5,
                  marginRight: 12,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "900",
                    color: "#0EA5E9",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Replying to {replyContext.name}
                </Text>
                <Text
                  style={{ color: "#64748B", fontSize: 13 }}
                  numberOfLines={1}
                >
                  {replyContext.content}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReplyContext(null)}
                style={{ padding: 4 }}
              >
                <Ionicons name="close-circle" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          )}

          {selectedImage && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F8FAFC",
                borderBottomWidth: 1,
                borderBottomColor: "#F1F5F9",
                marginBottom: 8,
              }}
            >
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: selectedImage }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                />
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    width: 24,
                    height: 24,
                    backgroundColor: "white",
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#F1F5F9",
                  }}
                >
                  <Ionicons name="close" size={14} color="#64748B" />
                </TouchableOpacity>
              </View>
              <Text
                style={{
                  marginLeft: 16,
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#94A3B8",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Artifact Attached
              </Text>
            </View>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
            }}
          >
            <TouchableOpacity
              onPress={pickImage}
              style={{
                width: 44,
                height: 44,
                borderRadius: 18,
                backgroundColor: "#F8FAFC",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#F1F5F9",
                marginRight: 10,
              }}
            >
              <Ionicons name="image" size={24} color="#64748B" />
            </TouchableOpacity>

            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F8FAFC",
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 28,
                paddingHorizontal: 16,
                paddingVertical: 4,
              }}
            >
              <TextInput
                placeholder="Diffuse a message..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={handleTextChange}
                multiline
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: "#0F172A",
                  paddingVertical: 8,
                  minHeight: 40,
                }}
                selectionColor="#0EA5E9"
              />
              <Pressable
                onPress={handleSend}
                disabled={!inputText.trim() && !selectedImage}
                style={({ pressed }) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    inputText.trim() || selectedImage ? "#0EA5E9" : "#E2E8F0",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons name="arrow-up" size={18} color="white" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
