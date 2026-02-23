import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (!token || !chatId) return;

    const wsUrl = API_URL.replace("http", "ws");
    const socket = new WebSocket(
      `${wsUrl}/chat/ws?chatId=${chatId}&token=${token}`,
    );
    socketRef.current = socket;

    socket.onopen = () => console.log("WS Connected to", chatId);

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WS message received:", data);
        if (data.type === "new_message") {
          await db
            .insert(messagesTable)
            .values({
              id: data.id,
              chatId: chatId,
              senderId: data.senderId,
              content: data.content,
              createdAt: new Date(data.createdAt).getTime(),
              status: "synced", // Server messages are always synced
            })
            .onConflictDoNothing();

          console.log("WS message inserted:", data.id);

          // Trigger callback to update UI
          if (onMessageReceived) {
            onMessageReceived();
          }
        }
      } catch (e) {
        console.error("WS Message Error", e);
      }
    };

    socket.onerror = (e) => console.error("WS Error", e);

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [chatId, token, onMessageReceived]);

  return socketRef.current;
};

// // ####################################

// import { useEffect, useRef } from "react";
// import { API_URL } from "../store/api";
// import { db } from "../db/client";
// import { messages as messagesTable } from "../db/schema";

// interface UseChatWebSocketProps {
//   chatId: string | null;
//   token: string | null;
//   onMessageReceived?: () => void;
// }

// export const useChatWebSocket = ({
//   chatId,
//   token,
//   onMessageReceived,
// }: UseChatWebSocketProps) => {
//   const socketRef = useRef<WebSocket | null>(null);
//   // Keep callback in a ref to avoid reconnect loops
//   const onMessageRef = useRef(onMessageReceived);

//   useEffect(() => {
//     onMessageRef.current = onMessageReceived;
//   }, [onMessageReceived]);

//   useEffect(() => {
//     if (!token || !chatId) return;

//     // Use URL constructor for safer parsing
//     const wsBase = API_URL.startsWith("https") ? "wss" : "ws";
//     const cleanBaseUrl = API_URL.replace(/^https?:\/\//, "");
//     const socket = new WebSocket(
//       `${wsBase}://${cleanBaseUrl}/chat/ws?chatId=${chatId}&token=${token}`,
//     );

//     socketRef.current = socket;

//     socket.onopen = () => {
//       console.log(`✅ WS Connected: ${chatId}`);
//     };

//     socket.onmessage = async (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         if (data.type === "new_message") {
//           await db
//             .insert(messagesTable)
//             .values({
//               id: data.id,
//               chatId: chatId,
//               senderId: data.senderId,
//               content: data.content,
//               createdAt: new Date(data.createdAt).getTime(),
//               status: "synced",
//             })
//             .onConflictDoNothing();

//           // Use the ref here
//           onMessageRef.current?.();
//         }
//       } catch (e) {
//         console.error("❌ WS Message Error:", e);
//       }
//     };

//     socket.onerror = (e) => {
//       console.error("❌ WS Error Event:", e);
//     };

//     socket.onclose = (e) => {
//       // THIS is where the useful error info usually hides
//       console.log(`🔌 WS Closed. Code: ${e.code}, Reason: ${e.reason}`);
//     };

//     return () => {
//       console.log("🧹 Cleaning up WS connection...");
//       socket.close();
//       socketRef.current = null;
//     };
//   }, [chatId, token]); // Removed onMessageReceived from here

//   return socketRef.current;
// };
