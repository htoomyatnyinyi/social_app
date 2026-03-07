import { useEffect, useRef, useCallback } from "react";
import { API_URL } from "../store/api";
import { db } from "../db/client";
import { messages as messagesTable } from "../db/schema";

interface UseChatWebSocketProps {
  chatId: string | null;
  token: string | null;
  onMessageReceived?: () => void;
}

export const useChatWebSocket = ({
  chatId,
  token,
  onMessageReceived,
}: UseChatWebSocketProps) => {
  const socketRef = useRef<WebSocket | null>(null);
  // Store callback in a ref to prevent reconnection loops when the callback identity changes
  const onMessageReceivedRef = useRef(onMessageReceived);

  // Keep the ref up to date without causing re-renders or reconnections
  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    if (!token || !chatId) return;

    // Safely build the WS URL
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
                createdAt: new Date(data.createdAt).getTime(),
                status: "synced",
              })
              .onConflictDoNothing();

            // Use the ref — no dependency on callback identity
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

        // Auto-reconnect after 3s unless cleaned up
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
  }, [chatId, token]); // Stable deps only — no callback

  return socketRef.current;
};
