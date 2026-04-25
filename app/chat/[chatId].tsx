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
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useMarkMessagesAsReadMutation } from "../../store/chatApi";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useTheme } from "../../context/ThemeContext";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import { Audio } from "expo-av";
import * as Location from "expo-location";
// import * as FileSystem from "expo-file-system";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useWebRTCContext } from "@/context/WebRTCContext";
import * as FileSystem from "expo-file-system/legacy";
import { safeJsonParse } from "@/lib/safeJson";

import { BlurView } from "expo-blur";

import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

type ReplyContext = {
  id: string;
  name: string;
  content: string;
};

const AudioPlayer = ({
  uri,
  isMe,
  isDark,
}: {
  uri: string;
  isMe: boolean;
  isDark: boolean;
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return sound
      ? () => {
        sound.unloadAsync();
      }
      : undefined;
  }, [sound]);

  // const toggleSound = async () => {
  //   if (sound) {
  //     if (isPlaying) {
  //       await sound.pauseAsync();
  //       setIsPlaying(false);
  //     } else {
  //       await sound.playAsync();
  //       setIsPlaying(true);
  //     }
  //   } else {
  //     const { sound: newSound } = await Audio.Sound.createAsync(
  //       { uri },
  //       { shouldPlay: true },
  //     );
  //     setSound(newSound);
  //     setIsPlaying(true);
  //     newSound.setOnPlaybackStatusUpdate((status: any) => {
  //       if (status.isLoaded && status.didJustFinish) {
  //         setIsPlaying(false);
  //       }
  //     });
  //   }
  // };

  const toggleSound = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      try {
        const source = uri.startsWith("data:") ? { uri } : { uri }; // local file uri works best

        const { sound: newSound } = await Audio.Sound.createAsync(source, {
          shouldPlay: true,
        });

        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } catch (err) {
        console.error("Failed to play audio", err);
        Alert.alert("Playback Error", "Could not play this voice message.");
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={toggleSound}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isMe
          ? "rgba(255,255,255,0.2)"
          : isDark
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.05)",
        padding: 8,
        borderRadius: 20,
        minWidth: 120,
      }}
    >
      <Ionicons
        name={isPlaying ? "pause" : "play"}
        size={20}
        color={isMe ? "white" : "#0EA5E9"}
      />
      <View
        style={{
          flex: 1,
          height: 4,
          backgroundColor: isMe ? "rgba(255,255,255,0.3)" : "#E2E8F0",
          marginHorizontal: 8,
          borderRadius: 2,
        }}
      />
    </TouchableOpacity>
  );
};

const MessageBubble = memo(function MessageBubble({
  item,
  prevMessage,
  user,
  isDark,
  onReply,
  onLongPress,
}: {
  item: any;
  prevMessage: any;
  user: any;
  isDark: boolean;
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
              backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
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
          backgroundColor: isMe ? "#0EA5E9" : isDark ? "#1E293B" : "white",
          borderWidth: isMe ? 0 : 1,
          borderColor: isDark ? "#334155" : "#F1F5F9",
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
              backgroundColor: isMe
                ? "rgba(0,0,0,0.05)"
                : isDark
                  ? "rgba(14,165,233,0.1)"
                  : "#F8FAFC",
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
                color: isMe
                  ? "rgba(255, 255, 255, 0.8)"
                  : isDark
                    ? "#94A3B8"
                    : "#64748B",
              }}
              numberOfLines={2}
            >
              {item.replyToContent}
            </Text>
          </View>
        )}

        {item.type === "audio" && item.mediaUrl && (
          <AudioPlayer uri={item.mediaUrl} isMe={isMe} isDark={isDark} />
        )}

        {item.type === "location" && item.metadata && (
          <TouchableOpacity
            onPress={() => {
              const meta =
                typeof item.metadata === "string"
                  ? safeJsonParse<any>(item.metadata, null)
                  : item.metadata;
              if (meta.location) {
                const url =
                  Platform.OS === "ios"
                    ? `maps:0,0?q=${meta.location.lat},${meta.location.lng}`
                    : `geo:0,0?q=${meta.location.lat},${meta.location.lng}`;
                Linking.openURL(url);
              }
            }}
            style={{ padding: 4, alignItems: "center" }}
          >
            <Ionicons
              name="location"
              size={40}
              color={isMe ? "white" : "#0EA5E9"}
            />
            <Text
              style={{
                color: isMe ? "white" : isDark ? "white" : "#1E293B",
                fontSize: 12,
                marginTop: 4,
                textAlign: "center",
              }}
            >
              Shared Location
            </Text>
          </TouchableOpacity>
        )}

        {item.type === "call" && (
          <View style={{ alignItems: "center", padding: 8 }}>
            <Ionicons
              name="videocam"
              size={24}
              color={isMe ? "white" : "#0EA5E9"}
            />
            <Text
              style={{
                color: isMe ? "white" : isDark ? "white" : "#1E293B",
                fontWeight: "600",
                marginTop: 4,
              }}
            >
              Video Call
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 8,
                backgroundColor: isMe ? "white" : "#0EA5E9",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
              }}
              onPress={() => {
                WebBrowser.openBrowserAsync(
                  `https://meet.jit.si/SocialApp_room_${item.chatId}`,
                );
              }}
            >
              <Text
                style={{
                  color: isMe ? "#0EA5E9" : "white",
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                Join
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {item.type === "image" && item.mediaUrl && (
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

        {item.type === "text" && item.content && (
          <Text
            style={{
              fontSize: 15,
              fontWeight: "400",
              lineHeight: 20,
              color: isMe ? "white" : isDark ? "white" : "#1E293B",
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
              backgroundColor: isDark ? "#334155" : "white",
              borderRadius: 10,
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderWidth: 1,
              borderColor: isDark ? "#475569" : "#F1F5F9",
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
  const { isDark } = useTheme();

  const user = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);
  const [markAsRead] = useMarkMessagesAsReadMutation();
  const lastMarkedChatIdRef = useRef<string | null>(null);

  const { messages, loading, fetchMessages, sendMessage } = useChatMessages(
    resolvedChatId,
    token,
    user,
  );

  useEffect(() => {
    if (!resolvedChatId) return;
    if (lastMarkedChatIdRef.current === resolvedChatId) return;
    lastMarkedChatIdRef.current = resolvedChatId;
    markAsRead(resolvedChatId);
  }, [resolvedChatId, markAsRead]);

  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { startGlobalCall } = useWebRTCContext();

  const { sendTyping, deleteMessage, sendReaction, sendSignal } =
    useChatWebSocket({
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

  const reversedMessages = useMemo(() => {
    if (!messages) return [];

    // Deduplicate: Hide "pending" messages if a matching "synced" message exists from server
    // (Matching by senderId + content + timestamp within 60 seconds)
    const filtered = messages.filter((msg, index) => {
      if (msg.status !== "pending") return true;

      const hasSyncedMatch = messages.some(
        (other) =>
          other.status === "synced" &&
          other.senderId === msg.senderId &&
          other.content === msg.content &&
          Math.abs(Number(other.createdAt) - Number(msg.createdAt)) < 60000,
      );

      return !hasSyncedMatch;
    });

    return [...filtered].reverse();
  }, [messages]);

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

  // const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Add this near your other state declarations
  const recordingRef = useRef<Audio.Recording | null>(null); // ← Use ref instead of state for the recording object

  // Updated startRecording
  const startRecording = async () => {
    try {
      // Clean up any previous recording first (important!)
      await cleanupRecording();

      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      recordingRef.current = recording;
      setIsRecording(true);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err: any) {
      console.error("Failed to start recording", err);
      Alert.alert(
        "Recording Error",
        "Could not start audio recording. Please try again.",
      );
      await cleanupRecording(); // ensure cleanup on failure
    }
  };

  // // Updated stopRecording
  // const stopRecording = async () => {
  //   if (!recordingRef.current) {
  //     setIsRecording(false);
  //     return;
  //   }

  //   setIsRecording(false);

  //   try {
  //     const currentRecording = recordingRef.current;
  //     recordingRef.current = null; // clear ref immediately

  //     await currentRecording.stopAndUnloadAsync();
  //     const uri = currentRecording.getURI();

  //     if (uri) {
  //       const base64 = await FileSystem.readAsStringAsync(uri, {
  //         encoding: "base64",
  //       });

  //       sendMessage(
  //         "",
  //         `data:audio/m4a;base64,${base64}`,
  //         replyContext || undefined,
  //         "audio",
  //       );

  //       setReplyContext(null);
  //     }
  //   } catch (error) {
  //     console.error("Failed to stop recording", error);
  //     Alert.alert("Recording Error", "Failed to process the recording.");
  //   } finally {
  //     // Always try to clean up the file
  //     await cleanupRecording();
  //   }
  // };

  // Add this helper near the top of the component
  const getTempAudioUri = () => {
    return `${FileSystem.cacheDirectory}temp_recording_${Date.now()}.m4a`;
  };

  // Updated stopRecording
  const stopRecording = async () => {
    if (!recordingRef.current) {
      setIsRecording(false);
      return;
    }

    setIsRecording(false);

    let tempUri: string | null = null;

    try {
      const currentRecording = recordingRef.current;
      recordingRef.current = null;

      await currentRecording.stopAndUnloadAsync();
      const originalUri = currentRecording.getURI();

      if (!originalUri) throw new Error("No recording URI");

      // Create a temp file path
      tempUri = getTempAudioUri();

      // Copy the recorded file to our temp location (more reliable than base64)
      await FileSystem.copyAsync({
        from: originalUri,
        to: tempUri,
      });

      // Now send the LOCAL FILE URI instead of base64
      sendMessage(
        "",
        tempUri, // ← Send file URI directly
        replyContext || undefined,
        "audio",
      );

      setReplyContext(null);
    } catch (error: any) {
      console.error("Failed to stop recording", error);
      Alert.alert("Recording Error", "Failed to save the voice message.");
    } finally {
      await cleanupRecording();

      // Optional: delete temp file after a delay (to allow upload if sendMessage is async)
      if (tempUri) {
        setTimeout(async () => {
          try {
            await FileSystem.deleteAsync(tempUri as string, { idempotent: true } as any);
          } catch { }
        }, 60000);
      }
    }
  };
  // Helper to safely clean up any existing recording + temp file
  const cleanupRecording = async () => {
    try {
      if (recordingRef.current) {
        const rec = recordingRef.current;
        recordingRef.current = null;

        if (!rec._isDoneRecording) {
          // private but commonly used check
          await rec.stopAndUnloadAsync().catch(() => { });
        }
      }

      // Optional: delete any leftover temp files if you want (expo-av usually handles this)
      // const tempDir = FileSystem.cacheDirectory + 'Audio/';
      // ...
    } catch (e) {
      console.warn("Cleanup recording error:", e);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  // const startRecording = async () => {
  //   try {
  //     await Audio.requestPermissionsAsync();
  //     await Audio.setAudioModeAsync({
  //       allowsRecordingIOS: true,
  //       playsInSilentModeIOS: true,
  //     });
  //     const { recording } = await Audio.Recording.createAsync(
  //       Audio.RecordingOptionsPresets.HIGH_QUALITY,
  //     );
  //     setRecording(recording);
  //     setIsRecording(true);
  //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  //   } catch (err) {
  //     console.error("Failed to start recording", err);
  //   }
  // };

  // const stopRecording = async () => {
  //   setRecording(null);
  //   setIsRecording(false);
  //   try {
  //     if (recording) {
  //       await recording.stopAndUnloadAsync();
  //       const uri = recording.getURI();
  //       if (uri) {
  //         const base64 = await FileSystem.readAsStringAsync(uri, {
  //           encoding: "base64",
  //         });
  //         sendMessage(
  //           "",
  //           `data:audio/m4a;base64,${base64}`,
  //           replyContext || undefined,
  //           "audio",
  //         );
  //         setReplyContext(null);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Failed to stop recording", error);
  //   }
  // };

  const shareLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access location was denied");
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    sendMessage(
      "📍 Shared a location",
      undefined,
      replyContext || undefined,
      "location",
      {
        location: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
        messageType: "location",
      },
    );
    setReplyContext(null);
  };

  const startVideoCall = () => {
    startGlobalCall(resolvedChatId, "video", user?.name || "User");
  };

  const startVoiceCall = () => {
    startGlobalCall(resolvedChatId, "voice", user?.name || "User");
  };

  const handleLongPress = useCallback(
    (item: any) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const isMe = item.senderId === user?.id;
      const itemContent =
        item.content || (item.mediaUrl ? "Post Content" : "Message");

      Alert.alert(
        "Options",
        "Choose an action for this message.",
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
          { text: "❤️ Like", onPress: () => sendReaction(item.id, "❤️") },
          { text: "✨ Star", onPress: () => sendReaction(item.id, "✨") },
          isMe
            ? {
              text: "Delete",
              style: "destructive",
              onPress: () => deleteMessage(item.id),
            }
            : null,
          { text: "Cancel", style: "cancel" },
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

  useEffect(() => {
    if (!chatId) return;

    // Helper to safely clean up any existing recording + temp file
    const cleanupRecording = async () => {
      try {
        if (recordingRef.current) {
          const rec = recordingRef.current;
          recordingRef.current = null;

          if (!rec._isDoneRecording) {
            // Private but commonly used check
            await rec.stopAndUnloadAsync().catch(() => { });
          }
        }
      } catch (e) {
        console.warn("Cleanup recording error:", e);
      }
    };

    // Cleanup on component unmount
    return () => {
      cleanupRecording();
    };
  }, [chatId]);

  // const headerContent = useMemo(
  //   () => (
  //     <View
  //       style={{
  //         backgroundColor: isDark ? "#0F172A" : "white",
  //         paddingHorizontal: 20,
  //         paddingBottom: 16,
  //         borderBottomWidth: 1,
  //         borderBottomColor: isDark ? "#1E293B" : "#F1F5F9",
  //         paddingTop: insets.top,
  //       }}
  //     >
  //       <View style={{ flexDirection: "row", alignItems: "center" }}>
  //         <TouchableOpacity
  //           onPress={() => {
  //             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  //             router.back();
  //           }}
  //           style={{
  //             width: 40,
  //             height: 40,
  //             borderRadius: 16,
  //             backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
  //             alignItems: "center",
  //             justifyContent: "center",
  //             borderWidth: 1,
  //             borderColor: isDark ? "#334155" : "#F1F5F9",
  //             marginRight: 16,
  //           }}
  //         >
  //           <Ionicons
  //             name="chevron-back"
  //             size={20}
  //             color={isDark ? "white" : "#334155"}
  //           />
  //         </TouchableOpacity>
  //         <View style={{ flex: 1 }}>
  //           <Text
  //             style={{
  //               fontSize: 18,
  //               fontWeight: "900",
  //               color: isDark ? "white" : "#0F172A",
  //               letterSpacing: -0.5,
  //             }}
  //             numberOfLines={1}
  //           >
  //             {title || "Conversation"}
  //           </Text>
  //           <View
  //             style={{
  //               flexDirection: "row",
  //               alignItems: "center",
  //               marginTop: 2,
  //             }}
  //           >
  //             <View
  //               style={{
  //                 width: 8,
  //                 height: 8,
  //                 borderRadius: 4,
  //                 marginRight: 6,
  //                 backgroundColor: isTyping ? "#38BDF8" : "#10B981",
  //               }}
  //             />
  //             <Text
  //               style={{
  //                 fontSize: 10,
  //                 fontWeight: "900",
  //                 color: isTyping ? "#0EA5E9" : "#10B981",
  //                 textTransform: "uppercase",
  //                 letterSpacing: 1,
  //               }}
  //             >
  //               {isTyping ? "Typing..." : "Online"}
  //             </Text>
  //           </View>
  //         </View>
  //         <TouchableOpacity
  //           onPress={startVoiceCall}
  //           style={{
  //             width: 40,
  //             height: 40,
  //             borderRadius: 20,
  //             backgroundColor: isDark ? "#064E3B" : "#F0FDF4",
  //             alignItems: "center",
  //             justifyContent: "center",
  //             marginRight: 8,
  //           }}
  //         >
  //           <Ionicons name="call" size={20} color="#10B981" />
  //         </TouchableOpacity>
  //         <TouchableOpacity
  //           onPress={startVideoCall}
  //           style={{
  //             width: 40,
  //             height: 40,
  //             borderRadius: 20,
  //             backgroundColor: isDark ? "#0C4A6E" : "#E0F2FE",
  //             alignItems: "center",
  //             justifyContent: "center",
  //           }}
  //         >
  //           <Ionicons name="videocam" size={20} color="#0EA5E9" />
  //         </TouchableOpacity>
  //       </View>
  //     </View>
  //   ),
  //   [
  //     insets.top,
  //     isTyping,
  //     title,
  //     router,
  //     isDark,
  //     startVideoCall,
  //     startVoiceCall,
  //   ],
  //   // [insets.top, isTyping, title, router],
  // );

  // return (
  //   <View style={{ flex: 1, backgroundColor: isDark ? "#0B1120" : "#F8FAFC" }}>
  //     {headerContent}

  //     <View style={{ flex: 1 }}>
  //       <FlatList
  //         inverted
  //         data={reversedMessages}
  //         renderItem={({ item, index }) => (
  //           <MessageBubble
  //             item={item}
  //             prevMessage={reversedMessages[index + 1] || null}
  //             user={user}
  //             isDark={isDark}
  //             onReply={(rep) => setReplyContext(rep)}
  //             onLongPress={handleLongPress}
  //           />
  //         )}
  //         keyExtractor={(item) => item.id.toString()}
  //         contentContainerStyle={{ paddingBottom: 20 }}
  //         showsVerticalScrollIndicator={false}
  //         initialNumToRender={15}
  //         maxToRenderPerBatch={10}
  //         windowSize={10}
  //         removeClippedSubviews={Platform.OS === "android"}
  //         ListEmptyComponent={
  //           <View style={{ paddingTop: 60, alignItems: "center" }}>
  //             {loading ? (
  //               <>
  //                 <ActivityIndicator size="small" color="#0EA5E9" />
  //                 <Text
  //                   style={{
  //                     marginTop: 10,
  //                     fontSize: 12,
  //                     fontWeight: "700",
  //                     color: "#94A3B8",
  //                     textTransform: "uppercase",
  //                     letterSpacing: 1,
  //                   }}
  //                 >
  //                   Loading…
  //                 </Text>
  //               </>
  //             ) : (
  //               <>
  //                 <Ionicons name="chatbubbles" size={44} color="#94A3B8" />
  //                 <Text
  //                   style={{
  //                     marginTop: 12,
  //                     fontSize: 14,
  //                     fontWeight: "900",
  //                     color: isDark ? "white" : "#0F172A",
  //                     textTransform: "uppercase",
  //                     letterSpacing: 1,
  //                   }}
  //                 >
  //                   No messages yet
  //                 </Text>
  //               </>
  //             )}
  //           </View>
  //         }
  //       />

  //       <View
  //         style={{
  //           backgroundColor: isDark ? "#0F172A" : "white",
  //           borderTopWidth: 1,
  //           borderTopColor: isDark ? "#1E293B" : "#F1F5F9",
  //           paddingBottom:
  //             keyboardHeight > 0
  //               ? keyboardHeight -
  //                 (Platform.OS === "ios" ? insets.bottom : 0) +
  //                 8
  //               : Math.max(insets.bottom, 12) + 5,
  //           paddingTop: 5,
  //         }}
  //       >
  //         {replyContext && (
  //           <View
  //             style={{
  //               backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
  //               paddingHorizontal: 16,
  //               paddingVertical: 10,
  //               flexDirection: "row",
  //               alignItems: "center",
  //               borderBottomWidth: 1,
  //               borderBottomColor: isDark ? "#334155" : "#F1F5F9",
  //               marginBottom: 8,
  //             }}
  //           >
  //             <View
  //               style={{
  //                 width: 3,
  //                 height: 26,
  //                 backgroundColor: "#0EA5E9",
  //                 borderRadius: 1.5,
  //                 marginRight: 12,
  //               }}
  //             />
  //             <View style={{ flex: 1 }}>
  //               <Text
  //                 style={{
  //                   fontSize: 9,
  //                   fontWeight: "900",
  //                   color: "#0EA5E9",
  //                   textTransform: "uppercase",
  //                   letterSpacing: 1,
  //                 }}
  //               >
  //                 Replying to {replyContext.name}
  //               </Text>
  //               <Text
  //                 style={{ color: "#64748B", fontSize: 13 }}
  //                 numberOfLines={1}
  //               >
  //                 {replyContext.content}
  //               </Text>
  //             </View>
  //             <TouchableOpacity
  //               onPress={() => setReplyContext(null)}
  //               style={{ padding: 4 }}
  //             >
  //               <Ionicons name="close-circle" size={18} color="#CBD5E1" />
  //             </TouchableOpacity>
  //           </View>
  //         )}

  //         {selectedImage && (
  //           <View
  //             style={{
  //               paddingHorizontal: 16,
  //               paddingVertical: 10,
  //               flexDirection: "row",
  //               alignItems: "center",
  //               backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
  //               borderBottomWidth: 1,
  //               borderBottomColor: isDark ? "#334155" : "#F1F5F9",
  //               marginBottom: 8,
  //             }}
  //           >
  //             <View style={{ position: "relative" }}>
  //               <Image
  //                 source={{ uri: selectedImage }}
  //                 style={{
  //                   width: 64,
  //                   height: 64,
  //                   borderRadius: 12,
  //                   borderWidth: 1,
  //                   borderColor: "#E2E8F0",
  //                 }}
  //               />
  //               <TouchableOpacity
  //                 onPress={() => setSelectedImage(null)}
  //                 style={{
  //                   position: "absolute",
  //                   top: -8,
  //                   right: -8,
  //                   width: 24,
  //                   height: 24,
  //                   backgroundColor: isDark ? "#334155" : "white",
  //                   borderRadius: 12,
  //                   alignItems: "center",
  //                   justifyContent: "center",
  //                   borderWidth: 1,
  //                   borderColor: isDark ? "#475569" : "#F1F5F9",
  //                 }}
  //               >
  //                 <Ionicons name="close" size={14} color="#64748B" />
  //               </TouchableOpacity>
  //             </View>
  //             <Text
  //               style={{
  //                 marginLeft: 16,
  //                 fontSize: 11,
  //                 fontWeight: "700",
  //                 color: "#94A3B8",
  //                 textTransform: "uppercase",
  //                 letterSpacing: 0.5,
  //               }}
  //             >
  //               Media Attached
  //             </Text>
  //           </View>
  //         )}

  //         <View
  //           style={{
  //             flexDirection: "row",
  //             alignItems: "center",
  //             paddingHorizontal: 16,
  //           }}
  //         >
  //           <TouchableOpacity
  //             onPress={shareLocation}
  //             style={{
  //               width: 44,
  //               height: 44,
  //               borderRadius: 18,
  //               backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
  //               alignItems: "center",
  //               justifyContent: "center",
  //               borderWidth: 1,
  //               borderColor: isDark ? "#334155" : "#F1F5F9",
  //               marginRight: 8,
  //             }}
  //           >
  //             <Ionicons name="location" size={24} color="#64748B" />
  //           </TouchableOpacity>

  //           {/* <TouchableOpacity
  //             onPressIn={startRecording}
  //             onPressOut={stopRecording}
  //             style={{
  //               width: 44,
  //               height: 44,
  //               borderRadius: 18,
  //               backgroundColor: isRecording
  //                 ? isDark
  //                   ? "#7F1D1D"
  //                   : "#FEE2E2"
  //                 : isDark
  //                   ? "#1E293B"
  //                   : "#F8FAFC",
  //               alignItems: "center",
  //               justifyContent: "center",
  //               borderWidth: 1,
  //               borderColor: isRecording
  //                 ? isDark
  //                   ? "#991B1B"
  //                   : "#FECACA"
  //                 : isDark
  //                   ? "#334155"
  //                   : "#F1F5F9",
  //               marginRight: 8,
  //             }}
  //           >
  //             <Ionicons
  //               name="mic"
  //               size={24}
  //               color={isRecording ? "#EF4444" : "#64748B"}
  //             />
  //           </TouchableOpacity> */}
  //           <TouchableOpacity
  //             onPress={isRecording ? stopRecording : startRecording}
  //             style={{
  //               width: 44,
  //               height: 44,
  //               borderRadius: 18,
  //               backgroundColor: isRecording
  //                 ? isDark
  //                   ? "#7F1D1D"
  //                   : "#FEE2E2"
  //                 : isDark
  //                   ? "#1E293B"
  //                   : "#F8FAFC",
  //               alignItems: "center",
  //               justifyContent: "center",
  //               borderWidth: 1,
  //               borderColor: isRecording
  //                 ? isDark
  //                   ? "#991B1B"
  //                   : "#FECACA"
  //                 : isDark
  //                   ? "#334155"
  //                   : "#F1F5F9",
  //               marginRight: 8,
  //             }}
  //           >
  //             <Ionicons
  //               name={isRecording ? "stop-circle" : "mic"}
  //               size={24}
  //               color={isRecording ? "#EF4444" : "#64748B"}
  //             />
  //           </TouchableOpacity>

  //           <TouchableOpacity
  //             onPress={pickImage}
  //             style={{
  //               width: 44,
  //               height: 44,
  //               borderRadius: 18,
  //               backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
  //               alignItems: "center",
  //               justifyContent: "center",
  //               borderWidth: 1,
  //               borderColor: isDark ? "#334155" : "#F1F5F9",
  //               marginRight: 10,
  //             }}
  //           >
  //             <Ionicons name="image" size={24} color="#64748B" />
  //           </TouchableOpacity>

  //           <View
  //             style={{
  //               flex: 1,
  //               flexDirection: "row",
  //               alignItems: "center",
  //               backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
  //               borderWidth: 1,
  //               borderColor: isDark ? "#475569" : "#E2E8F0",
  //               borderRadius: 28,
  //               paddingHorizontal: 16,
  //               paddingVertical: 4,
  //             }}
  //           >
  //             <TextInput
  //               placeholder="Message..."
  //               placeholderTextColor="#94A3B8"
  //               value={inputText}
  //               onChangeText={handleTextChange}
  //               multiline
  //               style={{
  //                 flex: 1,
  //                 fontSize: 16,
  //                 color: isDark ? "white" : "#0F172A",
  //                 paddingVertical: 8,
  //                 minHeight: 40,
  //               }}
  //               selectionColor="#0EA5E9"
  //             />
  //             <Pressable
  //               onPress={handleSend}
  //               disabled={!inputText.trim() && !selectedImage}
  //               style={({ pressed }) => ({
  //                 width: 32,
  //                 height: 32,
  //                 borderRadius: 16,
  //                 alignItems: "center",
  //                 justifyContent: "center",
  //                 backgroundColor:
  //                   inputText.trim() || selectedImage
  //                     ? "#0EA5E9"
  //                     : isDark
  //                       ? "#475569"
  //                       : "#E2E8F0",
  //                 opacity: pressed ? 0.7 : 1,
  //               })}
  //             >
  //               <Ionicons
  //                 name="arrow-up"
  //                 size={20}
  //                 color="black"
  //                 className="p-2 m-1 bg-red-100 rounded-full"
  //               />
  //             </Pressable>
  //           </View>
  //         </View>
  //       </View>
  //     </View>
  //   </View>
  // );

  const headerContent = useMemo(
    () => (
      <BlurView
        intensity={30}
        tint={isDark ? "dark" : "light"}
        className="px-4 pb-4 border-b border-slate-800/10 z-[100]"
        style={{ paddingTop: insets.top }} // Top inset usually requires style/paddingTop
      >
        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className={`w-10 h-10 rounded-2xl items-center justify-center border ${isDark
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-slate-100 shadow-sm shadow-slate-200"
                }`}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={isDark ? "white" : "#334155"}
              />
            </TouchableOpacity>

            <View className="ml-4 flex-1">
              <Text
                className={`text-[17px] font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                numberOfLines={1}
              >
                {title || "Conversation"}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <View
                  className={`w-2 h-2 rounded-full mr-1.5 ${isTyping ? "bg-sky-400" : "bg-emerald-500"}`}
                />
                <Text
                  className={`text-[9px] font-black uppercase tracking-widest ${isTyping ? "text-sky-500" : "text-emerald-500"}`}
                >
                  {isTyping ? "Typing..." : "Online"}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={startVoiceCall}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}
            >
              <Ionicons name="call" size={18} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={startVideoCall}
              className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? "bg-sky-500/10" : "bg-sky-50"}`}
            >
              <Ionicons name="videocam" size={18} color="#0EA5E9" />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    ),
    [
      insets.top,
      isTyping,
      title,
      isDark,
      startVideoCall,
      startVoiceCall,
      router,
    ],
  );

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0B1120]" : "bg-[#F8FAFC]"}`}>
      {headerContent}

      <View className="flex-1">
        <FlatList
          inverted
          data={reversedMessages}
          renderItem={({ item, index }) => (
            <MessageBubble
              item={item}
              prevMessage={reversedMessages[index + 1] || null}
              user={user}
              isDark={isDark}
              onReply={(rep) => setReplyContext(rep)}
              onLongPress={handleLongPress}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === "android"}
          ListEmptyComponent={
            <View className="pt-20 items-center opacity-30">
              {loading ? (
                <ActivityIndicator size="small" color="#0EA5E9" />
              ) : (
                <>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={48}
                    color={isDark ? "white" : "#94A3B8"}
                  />
                  <Text
                    className={`mt-4 text-[10px] font-black uppercase tracking-[4px] ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Silent Sanctuary
                  </Text>
                </>
              )}
            </View>
          }
        />

        {/* Input Section */}
        <BlurView
          intensity={20}
          tint={isDark ? "dark" : "light"}
          className="pt-2 border-t border-slate-800/10"
          style={{
            paddingBottom:
              keyboardHeight > 0
                ? keyboardHeight + 8
                : Math.max(insets.bottom, 12) + 5,
          }}
        >
          {/* Reply Context */}
          {replyContext && (
            <Animated.View
              entering={SlideInDown}
              className="mx-4 mb-3 p-3 rounded-[24px] flex-row items-center bg-sky-500/10 border border-sky-500/20"
            >
              <View className="w-1 h-8 bg-sky-500 rounded-full mr-3" />
              <View className="flex-1">
                <Text className="text-[9px] font-black text-sky-500 uppercase tracking-widest">
                  Replying to {replyContext.name}
                </Text>
                <Text className="text-slate-500 text-[12px]" numberOfLines={1}>
                  {replyContext.content}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyContext(null)}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Media Preview */}
          {selectedImage && (
            <View className="px-4 mb-3 flex-row items-center">
              <View className="relative">
                <Image
                  source={{ uri: selectedImage }}
                  className="w-16 h-16 rounded-2xl border border-slate-200"
                />
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 rounded-full items-center justify-center border border-slate-700"
                >
                  <Ionicons name="close" size={14} color="white" />
                </TouchableOpacity>
              </View>
              <Text className="ml-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Attached Image
              </Text>
            </View>
          )}

          {/* Toolbar & Input */}
          <View className="flex-row items-end px-4">
            <TouchableOpacity
              onPress={pickImage}
              className={`w-11 h-11 rounded-full items-center justify-center border mb-1 mr-2 ${isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-100 shadow-sm"
                }`}
            >
              <Ionicons name="image" size={20} color="#64748B" />
            </TouchableOpacity>

            <View
              className={`flex-1 flex-row items-end rounded-[28px] border px-4 py-1.5 ${isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-sm"
                }`}
            >
              <TextInput
                placeholder="Message..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={handleTextChange}
                multiline
                className={`flex-1 text-[16px] max-h-32 py-2 ${isDark ? "text-white" : "text-slate-900"}`}
                selectionColor="#0EA5E9"
              />

              <TouchableOpacity
                onPress={handleSend}
                disabled={!inputText.trim() && !selectedImage}
                className={`w-9 h-9 rounded-full items-center justify-center mb-1 ml-2 ${inputText.trim() || selectedImage
                    ? "bg-sky-500"
                    : isDark
                      ? "bg-slate-800"
                      : "bg-slate-100"
                  }`}
              >
                <Ionicons
                  name="arrow-up"
                  size={18}
                  color={
                    inputText.trim() || selectedImage ? "white" : "#94A3B8"
                  }
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              className={`w-11 h-11 rounded-full items-center justify-center ml-2 mb-1 border ${isRecording
                  ? "bg-rose-500 border-rose-400"
                  : isDark
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-100 shadow-sm shadow-slate-200"
                }`}
            >
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={20}
                color={isRecording ? "white" : "#64748B"}
              />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );
}
