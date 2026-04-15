import { useEffect, useRef } from "react";
import { API_URL } from "../store/api";
import { db } from "../db/client";
import { messages as messagesTable } from "../db/schema";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { metrics } from "../lib/metrics";
import { safeJsonParse } from "../lib/safeJson";
import { Platform } from "react-native";
import { resolveMessageTypeFromMetadata } from "../lib/chatMessage";

interface UseChatWebSocketProps {
  chatId: string | null;
  token: string | null;
  currentUserId?: string;
  onMessageReceived?: () => void;
  onTypingStatus?: (userId: string) => void;
  onSignalingMessage?: (data: any) => void;
}

export const useChatWebSocket = ({
  chatId,
  token,
  currentUserId,
  onMessageReceived,
  onTypingStatus,
  onSignalingMessage,
}: UseChatWebSocketProps) => {
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onTypingStatusRef = useRef(onTypingStatus);
  const onSignalingMessageRef = useRef(onSignalingMessage);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
    onTypingStatusRef.current = onTypingStatus;
    onSignalingMessageRef.current = onSignalingMessage;
  }, [onMessageReceived, onTypingStatus, onSignalingMessage]);

  useEffect(() => {
    if (!token || !chatId) return;

    const wsProtocol = API_URL.startsWith("https") ? "wss" : "ws";
    const cleanBase = API_URL.replace(/^https?:\/\//, "");
    const wsUrlNative = `${wsProtocol}://${cleanBase}/chat/ws?chatId=${chatId}`;
    const wsUrlWeb = `${wsProtocol}://${cleanBase}/chat/ws?chatId=${chatId}&token=${token}`;
    const wsUrlNativeWithToken = `${wsProtocol}://${cleanBase}/chat/ws?chatId=${chatId}&token=${token}`;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isCleanedUp = false;
    let didOpen = false;
    let usedFallback = false;

    const connect = (mode: "header" | "query") => {
      if (isCleanedUp) return;

      didOpen = false;
      const socket = (() => {
        if (Platform.OS === "web") return new WebSocket(wsUrlWeb);

        if (mode === "query") {
          return new WebSocket(wsUrlNativeWithToken);
        }

        return new (WebSocket as any)(wsUrlNative, undefined, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })();
      socketRef.current = socket;

      socket.onopen = () => {
        didOpen = true;
        console.log(`✅ Chat WS Connected: ${chatId}`);
        metrics.increment("chat_ws_open_total", { chatId });
      };

      socket.onmessage = async (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          
          const signalingTypes = ["call_invite", "call_accept", "call_reject", "offer", "answer", "ice_candidate", "end_call"];
          if (signalingTypes.includes(data.type)) {
             onSignalingMessageRef.current?.(data);
             return;
          }

          if (data.type === "new_message") {
            const stopTimer = metrics.startTimer("chat_ws_message_process_ms", {
              chatId,
            });
            const parsedMetadata =
              typeof data.metadata === "string"
                ? safeJsonParse<any>(data.metadata, null)
                : (data.metadata ?? null);
            const messageType = resolveMessageTypeFromMetadata(
              parsedMetadata,
              Boolean(data.image),
            );

            await db.insert(messagesTable).values({
              id: data.id,
              chatId: chatId,
              senderId: data.senderId,
              content: data.content,
              type: messageType,
              mediaUrl: data.image || null,
              read: data.read ? 1 : 0,
              createdAt: new Date(data.createdAt).getTime(),
              status: "synced",
              replyToId: data.replyToId || null,
              replyToName: data.replyTo?.sender?.name || null,
              replyToContent: data.replyTo?.content || null,
              metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            }).onConflictDoNothing();

            if (currentUserId && data.senderId !== currentUserId) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            onMessageReceivedRef.current?.();
            stopTimer();
          } 
          else if (data.type === "message_deleted") {
            await db.delete(messagesTable).where(eq(messagesTable.id, data.messageId));
            onMessageReceivedRef.current?.();
          }
          else if (data.type === "reaction_update") {
             const reactionsStr = JSON.stringify({ reactions: data.reactions });
             await db.update(messagesTable)
               .set({ metadata: reactionsStr })
               .where(eq(messagesTable.id, data.messageId));
             onMessageReceivedRef.current?.();
          }
          else if (data.type === "typing_start" && data.userId !== currentUserId) {
             onTypingStatusRef.current?.(data.userId);
          }
        } catch (e) {
          console.error("❌ Chat WS Message Error:", e);
        }
      };

      socket.onerror = (e: any) => {
        console.error("❌ Chat WS Error:", e);
        metrics.increment("chat_ws_error_total", { chatId });
      };

      socket.onclose = (e: any) => {
        console.log(`🔌 Chat WS Closed. Code: ${e.code}, Reason: ${e.reason}`);
        metrics.increment("chat_ws_close_total", { chatId, code: e.code });
        socketRef.current = null;

        if (!isCleanedUp) {
          // If the header-auth connection never opened, fallback to query-token.
          if (Platform.OS !== "web" && !didOpen && !usedFallback) {
            usedFallback = true;
            reconnectTimer = setTimeout(() => connect("query"), 250);
            return;
          }
          reconnectTimer = setTimeout(
            () => connect(usedFallback ? "query" : "header"),
            3000,
          );
        }
      };
    };

    connect(Platform.OS === "web" ? "query" : "header");

    return () => {
      isCleanedUp = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [chatId, token, currentUserId]);

  const sendTyping = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "typing_start", chatId }));
    }
  };

  const deleteMessage = (messageId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "delete", chatId, messageId }));
    }
  };

  const sendReaction = (messageId: string, emoji: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "reaction", chatId, messageId, content: emoji }));
    }
  };

  const sendSignal = (payload: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  return { socket: socketRef.current, sendTyping, deleteMessage, sendReaction, sendSignal };
};
