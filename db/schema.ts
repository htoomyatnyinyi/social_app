import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Chats - Local metadata for chats
export const chats = sqliteTable("chats", {
  id: text("id").primaryKey(), // Server ID
  name: text("name"),
  type: text("type"), // 'DIRECT', 'GROUP'
  lastSyncedAt: integer("last_synced_at"),
  createdAt: integer("created_at"),
  updatedAt: integer("updated_at"),
});

// Messages - Local copy of messages
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(), // Server ID or temporary local ID
  chatId: text("chat_id").notNull(),
  senderId: text("sender_id").notNull(),
  content: text("content"),
  type: text("type"), // text, image, etc.
  mediaUrl: text("media_url"),

  // Sync status
  status: text("status").default("synced"), // 'synced', 'pending', 'failed'

  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at"),
});
