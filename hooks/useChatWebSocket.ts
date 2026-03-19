import { useEffect, useRef } from "react";
import { API_URL } from "../store/api";
import { db } from "../db/client";
import { messages as messagesTable } from "../db/schema";
import * as Haptics from "expo-haptics";

interface UseChatWebSocketProps {
  chatId: string | null;
  token: string | null;
  currentUserId?: string;
  onMessageReceived?: () => void;
}

export const useChatWebSocket = ({
  chatId,
  token,
  currentUserId,
  onMessageReceived,
}: UseChatWebSocketProps) => {
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageReceivedRef = useRef(onMessageReceived);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

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
      };

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_message") {
            await db
              .insert(messagesTable)
              .values({
                id: data.id,
                chatId: chatId,
                senderId: data.senderId,
                content: data.content,
                type: data.image ? "image" : "text",
                mediaUrl: data.image || null,
                read: data.read ? 1 : 0,
                createdAt: new Date(data.createdAt).getTime(),
                status: "synced",
              })
              .onConflictDoNothing();

            // Haptic feedback for incoming messages (not from self)
            if (currentUserId && data.senderId !== currentUserId) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            }

            onMessageReceivedRef.current?.();
          }
        } catch (e) {
          console.error("❌ Chat WS Message Error:", e);
        }
      };

      socket.onerror = (e) => {
        console.error("❌ Chat WS Error:", e);
      };

      socket.onclose = (e) => {
        console.log(`🔌 Chat WS Closed. Code: ${e.code}, Reason: ${e.reason}`);
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
  }, [chatId, token]);

  return socketRef.current;
};
