import { useEffect, useRef } from "react";
import { API_URL } from "../store/api";
import { db } from "../db/client";
import { messages as messagesTable } from "../db/schema";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { metrics } from "../lib/metrics";

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
    const wsUrl = `${wsProtocol}://${cleanBase}/chat/ws?chatId=${chatId}&token=${token}`;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isCleanedUp = false;

    const connect = () => {
      if (isCleanedUp) return;

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log(`✅ Chat WS Connected: ${chatId}`);
        metrics.increment("chat_ws_open_total", { chatId });
      };

      socket.onmessage = async (event) => {
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
            const parsedMetadata = data.metadata ? (typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata) : null;
            const messageType = parsedMetadata?.messageType || (data.image ? "image" : "text");

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

      socket.onerror = (e) => {
        console.error("❌ Chat WS Error:", e);
        metrics.increment("chat_ws_error_total", { chatId });
      };

      socket.onclose = (e) => {
        console.log(`🔌 Chat WS Closed. Code: ${e.code}, Reason: ${e.reason}`);
        metrics.increment("chat_ws_close_total", { chatId, code: e.code });
        socketRef.current = null;

        if (!isCleanedUp) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

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
