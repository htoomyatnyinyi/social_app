import { useState, useEffect, useCallback } from "react";
import { db } from "../db/client";
import { messages as messagesTable, chats as chatsTable } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { syncMessages } from "../services/sync";

export const useChatMessages = (chatId: string | null, token: string | null, user: any) => {
  const [messages, setMessages] = useState<typeof messagesTable.$inferSelect[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const msgs = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.chatId, chatId))
        .orderBy(asc(messagesTable.createdAt));
      setMessages(msgs);
    } catch (e) {
      console.error("Failed to fetch messages", e);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !chatId) return;

    const tempId = Crypto.randomUUID();

    try {
      // 1. Optimistic UI Update
      await db.insert(messagesTable).values({
        id: tempId,
        chatId: chatId,
        senderId: user?.id,
        content: content,
        createdAt: Date.now(),
        status: "pending",
      });

      console.log("Message inserted locally with tempId:", tempId);
      
      // Immediate fetch to update UI
      fetchMessages();

      // 2. Trigger Sync
      if (token) {
        syncMessages(chatId, token)
          .then(() => {
              console.log("Sync completed");
              fetchMessages(); // Update UI after sync
          })
          .catch((e) => console.error("Sync failed", e));
      }
    } catch (e) {
      console.error("Send failed", e);
    }
  }, [chatId, user?.id, token, fetchMessages]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Initial Sync
  useEffect(() => {
    if (chatId && token) {
      syncMessages(chatId, token).then(() => {
        fetchMessages();
      });
    }
  }, [chatId, token, fetchMessages]);

  return {
    messages,
    loading,
    fetchMessages, // Exposed for external triggers (like WebSocket)
    sendMessage,
    setMessages // Exposed for manual updates if needed
  };
};
