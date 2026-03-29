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
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
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
      className={`flex-row px-5 mb-1 ${isMe ? "justify-end" : "justify-start"} ${!isSameSenderAsPrev ? "mt-5" : "mt-0"}`}
    >
      {!isMe && !isSameSenderAsPrev && (
        <View className="mr-3 justify-end pb-1">
          <Image
            source={{
              uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${item.senderId}`,
            }}
            className="w-8 h-8 rounded-[12px] bg-gray-100 border border-gray-50"
            contentFit="cover"
          />
        </View>
      )}
      {isMe && !isSameSenderAsPrev && <View className="w-11" />}

      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => onLongPress(item)}
        className={`max-w-[75%] px-4 py-3 rounded-[24px] shadow-sm ${
          isMe ? "bg-[#0EA5E9] border-0" : "bg-white border border-gray-100"
        } ${isMe ? (isSameSenderAsPrev ? "rounded-tr-[8px]" : "rounded-tr-[4px]") : isSameSenderAsPrev ? "rounded-tl-[8px]" : "rounded-tl-[4px]"} ${isPending ? "opacity-70" : "opacity-100"}`}
      >
        {item.replyToId && (
          <View
            className={`mb-2 p-2.5 rounded-[12px] border-l-4 ${
              isMe
                ? "bg-sky-700/30 border-sky-200"
                : "bg-gray-50 border-sky-500"
            }`}
          >
            <Text
              className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${
                isMe ? "text-sky-100" : "text-sky-600"
              }`}
            >
              {item.replyToName || "Reply"}
            </Text>
            <Text
              className={`text-[12px] font-medium leading-4 ${
                isMe ? "text-white/80" : "text-gray-500"
              }`}
              numberOfLines={2}
            >
              {item.replyToContent}
            </Text>
          </View>
        )}

        {item.mediaUrl && (
          <Image
            source={{ uri: item.mediaUrl }}
            className="w-52 h-52 rounded-[16px] mb-2 bg-gray-100 shadow-inner"
            contentFit="cover"
          />
        )}

        {item.content && (
          <Text
            className={`text-[15px] font-medium leading-[20px] ${
              isMe ? "text-white" : "text-gray-800"
            }`}
          >
            {item.content}
          </Text>
        )}

        <View className="flex-row items-center justify-end mt-1.5 space-x-1">
          <Text
            className={`text-[9px] font-bold tracking-tighter ${
              isMe ? "text-sky-100/70" : "text-gray-400"
            }`}
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
              color={isPending ? "#BAE6FD" : isRead ? "#BAE6FD" : "#FFFFFF"}
            />
          )}
        </View>

        {reactionEmojis.length > 0 && (
          <View className="absolute -bottom-2 -left-2 flex-row bg-white rounded-full px-2 py-0.5 border border-gray-100 shadow-sm">
            {Array.from(new Set(reactionEmojis))
              .slice(0, 3)
              .map((emoji: any, i) => (
                <Text key={i} className="text-[10px]">
                  {emoji}
                </Text>
              ))}
            {reactionEmojis.length > 1 && (
              <Text className="text-[9px] font-black text-gray-400 ml-1">
                {reactionEmojis.length}
              </Text>
            )}
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

  const handleLongPress = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isMe = item.senderId === user?.id;

    Alert.alert(
      "Message Resilience",
      "Breathe and choose an action.",
      [
        {
          text: "Diffuse Reply",
          onPress: () =>
            setReplyContext({
              id: item.id,
              name: isMe ? "You" : (title as string) || "Member",
              content: item.content,
            }),
        },
        { text: "❤️ Echo", onPress: () => sendReaction(item.id, "❤️") },
        { text: "✨ Spark", onPress: () => sendReaction(item.id, "✨") },
        isMe
          ? {
              text: "Dissolve",
              style: "destructive",
              onPress: () => deleteMessage(item.id),
            }
          : {},
        { text: "Keep", style: "cancel" },
      ].filter((o) => Object.keys(o).length > 0) as any,
    );
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Stabilized Header */}
      <View
        className="bg-white px-5 pb-4 border-b border-gray-100/50 shadow-sm"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-10 h-10 rounded-2xl bg-gray-50 items-center justify-center border border-gray-100 mr-4"
          >
            <Ionicons name="chevron-back" size={20} color="#334155" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text
              className="text-lg font-black text-gray-900 tracking-tight"
              numberOfLines={1}
            >
              {title || "Conversation"}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <View
                className={`w-2 h-2 rounded-full mr-1.5 ${isTyping ? "bg-sky-400" : "bg-emerald-500 shadow-sm shadow-emerald-200"}`}
              />
              <Text
                className={`text-[10px] font-black uppercase tracking-widest ${isTyping ? "text-sky-500" : "text-emerald-500"}`}
              >
                {isTyping ? "Whispering..." : "Synchronized"}
              </Text>
            </View>
          </View>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-sky-50 items-center justify-center border border-sky-100">
            <Ionicons name="call" size={18} color="#0EA5E9" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          inverted
          data={reversedMessages}
          renderItem={({ item, index }) => (
            <View>
              <MessageBubble
                item={item}
                prevMessage={reversedMessages[index + 1] || null}
                user={user}
                onReply={(rep) => setReplyContext(rep)}
                onLongPress={handleLongPress}
              />
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
        />

        {/* Stable Footer Logic */}
        <View
          className="bg-white border-t border-gray-100"
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          {replyContext && (
            <View className="bg-sky-50 px-4 py-3 flex-row items-center border-b border-sky-100">
              <View className="w-1 h-8 bg-sky-500 rounded-full mr-3" />
              <View className="flex-1">
                <Text className="text-[10px] font-black text-sky-600 uppercase tracking-widest">
                  Replying to {replyContext.name}
                </Text>
                <Text
                  className="text-gray-500 text-[12px] font-medium"
                  numberOfLines={1}
                >
                  {replyContext.content}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyContext(null)}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          )}

          {selectedImage && (
            <View className="px-4 py-3 flex-row items-center bg-gray-50 border-b border-gray-100">
              <View className="relative">
                <Image
                  source={{ uri: selectedImage }}
                  className="w-16 h-16 rounded-[16px] border border-gray-200"
                />
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full items-center justify-center shadow-md border border-gray-100"
                >
                  <Ionicons name="close" size={14} color="#64748B" />
                </TouchableOpacity>
              </View>
              <Text className="ml-4 text-[12px] font-bold text-gray-400 uppercase tracking-widest">
                Media Aura Attached
              </Text>
            </View>
          )}

          <View className="flex-row items-center px-4 py-3">
            <TouchableOpacity
              onPress={pickImage}
              className="w-11 h-11 rounded-[18px] bg-gray-50 items-center justify-center border border-gray-100 mr-3"
            >
              <Ionicons name="image" size={20} color="#64748B" />
            </TouchableOpacity>

            <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-[28px] px-4 py-1.5">
              <TextInput
                placeholder="Diffuse an artifact..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={handleTextChange}
                multiline
                className="flex-1 text-[16px] text-gray-900 py-1.5"
                selectionColor="#0EA5E9"
              />
              <Pressable
                onPress={() => {
                  try {
                    handleSend();
                  } catch (e) {
                    console.error("Send failed:", e);
                  }
                }}
                disabled={!inputText.trim() && !selectedImage}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  inputText.trim() || selectedImage
                    ? "bg-sky-500"
                    : "bg-gray-200"
                }`}
              >
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={
                    inputText.trim() || selectedImage ? "white" : "#94A3B8"
                  }
                />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

