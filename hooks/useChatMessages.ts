import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "../db/client";
import { messages as messagesTable, chats as chatsTable } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { syncMessages } from "../services/sync";

export const useChatMessages = (
  chatId: string | null,
  token: string | null,
  user: any,
) => {
  const [messages, setMessages] = useState<
    (typeof messagesTable.$inferSelect)[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Use a ref for chatId to keep fetchMessages stable
  const chatIdRef = useRef(chatId);
  chatIdRef.current = chatId;

  const fetchMessages = useCallback(async () => {
    const currentChatId = chatIdRef.current;
    if (!currentChatId) return;
    try {
      const msgs = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.chatId, currentChatId))
        .orderBy(asc(messagesTable.createdAt));
      setMessages(msgs);
    } catch (e) {
      console.error("Failed to fetch messages", e);
    } finally {
      setLoading(false);
    }
  }, []); // Stable — uses ref internally

  const sendMessage = useCallback(
    async (
      content: string,
      image?: string,
      replyTo?: { id: string; name: string; content: string },
      messageType?: string,
      metadata?: any,
    ) => {
      if ((!content.trim() && !image && !messageType) || !chatId) return;

      const tempId = Crypto.randomUUID();
      const finalType = messageType || (image ? "image" : "text");
      const timestamp = Date.now();

      // 1. Optimistic UI Update — Update state immediately for zero-latency feel
      const optimisticMsg: any = {
        id: tempId,
        chatId: chatId,
        senderId: user?.id,
        content: content || "",
        type: finalType,
        mediaUrl: image || null,
        createdAt: timestamp,
        status: "pending",
        replyToId: replyTo?.id || null,
        replyToName: replyTo?.name || null,
        replyToContent: replyTo?.content || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        // 2. Persist to local SQLite in background
        await db.insert(messagesTable).values({
          ...optimisticMsg,
          read: 0,
        });

        // 3. Trigger sync to push pending + pull new
        if (token) {
          try {
            await syncMessages(chatId, token);
            // Refresh ONLY after full sync completes to get final server IDs/states
            await fetchMessages();
          } catch (e) {
            console.error("Sync failed after send", e);
          }
        }
      } catch (e) {
        console.error("Send failed", e);
      }
    },
    [chatId, user?.id, token, fetchMessages],
  );

  // Single combined mount effect: sync + load in one go
  useEffect(() => {
    if (!chatId) return;

    let cancelled = false;

    const init = async () => {
      // If we have a token, sync first then load; otherwise just load local
      if (token) {
        try {
          await syncMessages(chatId, token);
        } catch (e) {
          console.error("Initial sync failed", e);
        }
      }
      if (!cancelled) {
        await fetchMessages();
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [chatId, token, fetchMessages]);

  return {
    messages,
    loading,
    fetchMessages, // Exposed for WebSocket triggers
    sendMessage,
    setMessages,
  };
};
