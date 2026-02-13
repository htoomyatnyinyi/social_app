import { db } from "../db/client";
import { messages, chats } from "../db/schema";
import { eq, gt, or, and, desc } from "drizzle-orm";
// We need API access. Since we can't easily use RTK hooks outside React components,
// we might need a direct API client or pass the `baseQuery` function.
// Or we can rely on `fetch` with the token.
// For simplicity in this service, we'll assume we pass the `token` to the sync function.
import { API_URL } from "../store/api";

type SyncResult = {
  pushed: number;
  pulled: number;
};

export const syncMessages = async (
  chatId: string,
  token: string,
): Promise<SyncResult> => {
  if (!token) return { pushed: 0, pulled: 0 };

  const result: SyncResult = { pushed: 0, pulled: 0 };

  try {
    // 1. PUSH: Send pending messages to server
    const pendingMessages = await db
      .select()
      .from(messages)
      .where(and(eq(messages.chatId, chatId), eq(messages.status, "pending")));

    for (const msg of pendingMessages) {
      try {
        console.log("Syncing pending message:", msg.id, msg.content);
        const response = await fetch(`${API_URL}/chat/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            chatId,
            content: msg.content,
            // If we have temporary ID, we might need to handle it.
            // But server generates ID.
          }),
        });

        if (response.ok) {
          const serverMsg = await response.json();
          console.log("Server response:", serverMsg.id, "for temp", msg.id);
          // innovative: update local message ID with server ID?
          // Or just delete local and insert server?
          // Updating generic ID is hard because it's PK.
          // Better: Update status to 'synced' and maybe store serverId if we had a separate field.
          // BUT `id` is PK. If we generated a UUID locally, we can keep it if server accepts it.
          // If server generates ID, we must replace.
          // Insert/update server message first to ensure it's in DB
          await db
            .insert(messages)
            .values({
              id: serverMsg.id,
              chatId: serverMsg.chatId,
              senderId: serverMsg.senderId,
              content: serverMsg.content,
              createdAt: new Date(serverMsg.createdAt).getTime(),
              status: "synced",
            })
            .onConflictDoUpdate({
              target: messages.id,
              set: {
                status: "synced",
                content: serverMsg.content,
                createdAt: new Date(serverMsg.createdAt).getTime(),
              },
            });

          console.log("Server message inserted/updated:", serverMsg.id);

          // Only delete temp message if it has a different ID
          if (msg.id !== serverMsg.id) {
            await db.delete(messages).where(eq(messages.id, msg.id));
            console.log("Temp message deleted:", msg.id);
          }
          
          result.pushed++;
        }
      } catch (e) {
        console.error("Failed to push message", msg.id, e);
      }
    }

    // 2. PULL: Fetch new messages from server
    // Get last synced message time for this chat
    // We can store `lastSyncedAt` in `chats` table.
    const chatRecord = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .get();

    const lastSyncedAt = chatRecord?.lastSyncedAt || 0;

    const response = await fetch(
      `${API_URL}/chat/messages/${chatId}?after=${lastSyncedAt}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.ok) {
      const newMessages = await response.json();
      // newMessages should be an array
      if (Array.isArray(newMessages) && newMessages.length > 0) {
        let maxCreatedAt = lastSyncedAt;

        for (const msg of newMessages) {
          // Ensure we don't overwrite pending messages if they clash (unlikely if we use UUIDs)
          // UPSERT strategy
          await db
            .insert(messages)
            .values({
              id: msg.id,
              chatId: msg.chatId,
              senderId: msg.senderId,
              content: msg.content,
              createdAt: new Date(msg.createdAt).getTime(),
              status: "synced",
            })
            .onConflictDoUpdate({
              target: messages.id,
              set: { status: "synced", content: msg.content },
            });

          const msgTime = new Date(msg.createdAt).getTime();
          if (msgTime > maxCreatedAt) maxCreatedAt = msgTime;
          result.pulled++;
        }

        // Update chat sync status
        // Insert chat if not exists
        await db
          .insert(chats)
          .values({
            id: chatId,
            lastSyncedAt: maxCreatedAt,
            updatedAt: Date.now(),
          })
          .onConflictDoUpdate({
            target: chats.id,
            set: { lastSyncedAt: maxCreatedAt, updatedAt: Date.now() },
          });
      }
    }
  } catch (e) {
    console.error("Sync error:", e);
  }

  return result;
};
