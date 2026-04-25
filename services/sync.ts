import { db } from "../db/client";
import { messages, chats } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { API_URL } from "../store/api";
import { metrics } from "../lib/metrics";
import { safeJsonParse } from "../lib/safeJson";
import * as FileSystem from "expo-file-system";
import { resolveMessageTypeFromMetadata } from "../lib/chatMessage";

const MAX_MEDIA_BYTES = 5 * 1024 * 1024; // keep payloads reasonable for JSON transport

async function mediaUrlToDataUriIfNeeded(
  mediaUrl: string,
  messageType: string | null,
): Promise<string> {
  if (!mediaUrl) return mediaUrl;

  // already data URI (images are sent this way today)
  if (mediaUrl.startsWith("data:")) return mediaUrl;

  // For audio messages we currently store a local file URI; convert to base64.
  if (messageType === "audio") {
    const info = await FileSystem.getInfoAsync(mediaUrl);
    if (!info.exists) {
      throw new Error("Audio file does not exist");
    }
    if (typeof info.size === "number" && info.size > MAX_MEDIA_BYTES) {
      throw new Error("Audio file too large to upload");
    }
    const base64 = await FileSystem.readAsStringAsync(mediaUrl, {
      encoding: "base64",
    });
    return `data:audio/m4a;base64,${base64}`;
  }

  return mediaUrl;
}

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
    const pendingMessages = await db
      .select()
      .from(messages)
      .where(and(eq(messages.chatId, chatId), eq(messages.status, "pending")));
    const pushBatchSize = 10;
    for (let i = 0; i < pendingMessages.length; i += pushBatchSize) {
      const batch = pendingMessages.slice(i, i + pushBatchSize);

      await Promise.all(
        batch.map(async (msg) => {
          const maxAttempts = 3;
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              const uploadableMedia =
                msg.mediaUrl && msg.type
                  ? await mediaUrlToDataUriIfNeeded(msg.mediaUrl, msg.type)
                  : undefined;

              const response = await fetch(`${API_URL}/chat/message`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  chatId,
                  content: msg.content,
                  image: uploadableMedia || undefined,
                  replyToId: msg.replyToId || undefined,
                  messageType:
                    msg.type !== "text" && msg.type !== "image"
                      ? msg.type
                      : undefined,
                }),
              });

              if (!response.ok) throw new Error(`Push failed: ${response.status}`);

              const serverMsg = await response.json();
              const parsedMetadata =
                typeof serverMsg.metadata === "string"
                  ? safeJsonParse<any>(serverMsg.metadata, null)
                  : (serverMsg.metadata ?? null);
              const messageType = resolveMessageTypeFromMetadata(
                parsedMetadata,
                Boolean(serverMsg.image),
              );

              await db
                .insert(messages)
                .values({
                  id: serverMsg.id,
                  chatId: serverMsg.chatId,
                  senderId: serverMsg.senderId,
                  content: serverMsg.content,
                  type: messageType,
                  mediaUrl: serverMsg.image || null,
                  read: serverMsg.read ? 1 : 0,
                  createdAt: new Date(serverMsg.createdAt).getTime(),
                  status: "synced",
                  replyToId: serverMsg.replyToId || null,
                  replyToName: serverMsg.replyTo?.sender?.name || null,
                  replyToContent: serverMsg.replyTo?.content || null,
                  metadata: serverMsg.metadata
                    ? JSON.stringify(serverMsg.metadata)
                    : null,
                })
                .onConflictDoUpdate({
                  target: messages.id,
                  set: {
                    status: "synced",
                    content: serverMsg.content,
                    read: serverMsg.read ? 1 : 0,
                    createdAt: new Date(serverMsg.createdAt).getTime(),
                    metadata: serverMsg.metadata
                      ? JSON.stringify(serverMsg.metadata)
                      : null,
                  },
                });

              if (msg.id !== serverMsg.id) {
                await db.delete(messages).where(eq(messages.id, msg.id));
              }

              result.pushed++;
              metrics.increment("sync_push_success_total", { chatId });
              return;
            } catch (e) {
              if (attempt === maxAttempts) {
                metrics.increment("sync_push_fail_total", { chatId });
                console.error("Failed to push message", msg.id, e);
                await db
                  .update(messages)
                  .set({ status: "failed" })
                  .where(eq(messages.id, msg.id));
                return;
              }

              const backoffMs = 250 * Math.pow(2, attempt - 1);
              await new Promise((resolve) => setTimeout(resolve, backoffMs));
            }
          }
        }),
      );
    }

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
      const data = await response.json();
      const newMessages = Array.isArray(data) ? data : (data.messages || []);
      if (newMessages.length > 0) {
        let maxCreatedAt = lastSyncedAt;
        const pullBatchSize = 20;

        for (let i = 0; i < newMessages.length; i += pullBatchSize) {
          const batch = newMessages.slice(i, i + pullBatchSize);
          await Promise.all(
            batch.map(async (msg: any) => {
              const parsedMetadata =
                typeof msg.metadata === "string"
                  ? safeJsonParse<any>(msg.metadata, null)
                  : (msg.metadata ?? null);
              const messageType = resolveMessageTypeFromMetadata(
                parsedMetadata,
                Boolean(msg.image),
              );

              await db
                .insert(messages)
                .values({
                  id: msg.id,
                  chatId: msg.chatId,
                  senderId: msg.senderId,
                  content: msg.content,
                  type: messageType,
                  mediaUrl: msg.image || null,
                  read: msg.read ? 1 : 0,
                  createdAt: new Date(msg.createdAt).getTime(),
                  status: "synced",
                  replyToId: msg.replyToId || null,
                  replyToName: msg.replyTo?.sender?.name || null,
                  replyToContent: msg.replyTo?.content || null,
                  metadata: msg.metadata ? JSON.stringify(msg.metadata) : null,
                })
                .onConflictDoUpdate({
                  target: messages.id,
                  set: {
                    status: "synced",
                    content: msg.content,
                    read: msg.read ? 1 : 0,
                    mediaUrl: msg.image || null,
                    metadata: msg.metadata ? JSON.stringify(msg.metadata) : null,
                  },
                });

              const msgTime = new Date(msg.createdAt).getTime();
              if (msgTime > maxCreatedAt) maxCreatedAt = msgTime;
              result.pulled++;
            }),
          );
        }

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
    metrics.increment("sync_run_fail_total", { chatId });
    console.error("Sync error:", e);
  }

  metrics.observe("sync_pulled_messages", result.pulled, { chatId });
  metrics.observe("sync_pushed_messages", result.pushed, { chatId });

  return result;
};
