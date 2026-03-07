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
    async (content: string) => {
      if (!content.trim() || !chatId) return;

      const tempId = Crypto.randomUUID();

      try {
        // 1. Optimistic UI Update — insert into local SQLite
        await db.insert(messagesTable).values({
          id: tempId,
          chatId: chatId,
          senderId: user?.id,
          content: content,
          createdAt: Date.now(),
          status: "pending",
        });

        // Immediately refresh UI with optimistic message
        await fetchMessages();

        // 2. Trigger sync to push pending + pull new
        if (token) {
          try {
            await syncMessages(chatId, token);
            await fetchMessages(); // Refresh after sync to show server-confirmed messages
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
