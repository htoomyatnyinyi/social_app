export type ChatMessageType = "text" | "image" | "audio" | "location" | "call";

const KNOWN_TYPES: Set<string> = new Set([
  "text",
  "image",
  "audio",
  "location",
  "call",
]);

export function normalizeChatMessageType(type: unknown): ChatMessageType {
  if (typeof type === "string" && KNOWN_TYPES.has(type)) {
    return type as ChatMessageType;
  }
  return "text";
}

export function resolveMessageTypeFromMetadata(
  metadata: unknown,
  hasImage: boolean,
): ChatMessageType {
  const metaType =
    typeof metadata === "object" && metadata
      ? (metadata as any).messageType
      : undefined;
  if (typeof metaType === "string") {
    return normalizeChatMessageType(metaType);
  }
  return hasImage ? "image" : "text";
}

