import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useWebRTCContext } from "../context/WebRTCContext";
import { scheduleLocalNotificationAsync, usePushNotifications } from "../hooks/usePushNotifications";
import { API_URL, api } from "../store/api";
import { notificationApi, useGetUnreadCountQuery } from "../store/notificationApi";
import { useUpdatePushTokenMutation } from "../store/profileApi";
import { useGetNotificationPreferencesQuery } from "../store/settingsApi";

export function GlobalNotificationSocket() {
  const token = useSelector((state: any) => state.auth.token);
  const dispatch = useDispatch();
  const { processGlobalSignaling, setGlobalSendSignal } = useWebRTCContext();

  const { data: preferences } = useGetNotificationPreferencesQuery(
    {},
    { skip: !token },
  );
  useGetUnreadCountQuery(undefined, {
    pollingInterval: 300000,
    refetchOnFocus: false,
    refetchOnReconnect: true,
    skip: !token,
  });

  const { expoPushToken } = usePushNotifications();
  const [updatePushToken] = useUpdatePushTokenMutation();

  useEffect(() => {
    if (expoPushToken && token) {
      updatePushToken({ token: expoPushToken }).catch(console.error);
    }
  }, [expoPushToken, token, updatePushToken]);

  const processSignalingRef = useRef(processGlobalSignaling);
  useEffect(() => {
    processSignalingRef.current = processGlobalSignaling;
  }, [processGlobalSignaling]);

  const setGlobalSendSignalRef = useRef(setGlobalSendSignal);
  useEffect(() => {
    setGlobalSendSignalRef.current = setGlobalSendSignal;
  }, [setGlobalSendSignal]);

  const currentPreferencesRef = useRef(preferences);
  useEffect(() => {
    currentPreferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    if (!token) return;

    let isCleanedUp = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let socketRef: WebSocket | null = null;
    let didOpen = false;
    let usedFallback = false;
    let activeMode: "header" | "query" =
      Platform.OS === "web" ? "query" : "header";

    const wsProtocol = API_URL.startsWith("https") ? "wss" : "ws";
    const cleanBase = API_URL.replace(/^https?:\/\//, "");

    const connect = (mode: "header" | "query") => {
      if (isCleanedUp) return;
      activeMode = mode;
      didOpen = false;

      const wsUrlNative = `${wsProtocol}://${cleanBase}/notifications/ws`;
      const wsUrlWeb = `${wsProtocol}://${cleanBase}/notifications/ws?token=${token}`;
      const wsUrlNativeWithToken = `${wsProtocol}://${cleanBase}/notifications/ws?token=${token}`;

      const socket = (() => {
        if (Platform.OS === "web") return new WebSocket(wsUrlWeb);
        if (mode === "query") return new WebSocket(wsUrlNativeWithToken);
        return new (WebSocket as any)(wsUrlNative, undefined, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })();
      socketRef = socket;

      socket.onopen = () => {
        didOpen = true;
        console.log(`✅ Notification WS: Opened (${activeMode})`);
        setGlobalSendSignalRef.current((payload: any) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
          }
        });
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const signalingTypes = [
            "call_invite",
            "call_accept",
            "call_reject",
            "offer",
            "answer",
            "ice_candidate",
            "end_call",
          ];

          if (signalingTypes.includes(data.type)) {
            processSignalingRef.current(data);
            return;
          }

          if (data.type === "new_notification") {
            const notif = data.data;
            const currentPrefs = currentPreferencesRef.current;
            let isAllowed = true;

            if (currentPrefs) {
              if (!currentPrefs.pushEnabled) isAllowed = false;
              else if (notif.type === "LIKE" && !currentPrefs.likes)
                isAllowed = false;
              else if (notif.type === "REPLY" && !currentPrefs.replies)
                isAllowed = false;
              else if (notif.type === "MENTION" && !currentPrefs.mentions)
                isAllowed = false;
              else if (notif.type === "REPOST" && !currentPrefs.reposts)
                isAllowed = false;
              else if (notif.type === "FOLLOW" && !currentPrefs.follows)
                isAllowed = false;
              else if (notif.type === "MESSAGE" && !currentPrefs.messages)
                isAllowed = false;
            }

            if (!isAllowed) return;

            dispatch(
              notificationApi.util.updateQueryData(
                "getUnreadCount",
                undefined,
                (draft: any) => {
                  if (draft) {
                    draft.count = (draft.count || 0) + 1;
                  }
                },
              ),
            );

            if (notif.message || notif.type) {
              const title =
                notif.type === "MESSAGE" ? "New Message" : "New Notification";
              const body = notif.message || "You have a new notification";
              scheduleLocalNotificationAsync(title, body, {
                id: notif.id,
                type: notif.type,
              });
            }

            dispatch(
              notificationApi.util.updateQueryData(
                "getNotifications",
                {},
                (draft: any) => {
                  if (!draft) return;
                  if (!Array.isArray(draft.notifications)) {
                    draft.notifications = [];
                  }
                  if (!draft.notifications.find((n: any) => n.id === notif.id)) {
                    draft.notifications.unshift(notif);
                  }
                },
              ),
            );

            dispatch(api.util.invalidateTags(["Notification"]));
            if (notif.type === "MESSAGE") {
              dispatch(api.util.invalidateTags(["Chat"]));
            }
          } else if (data.type === "refresh") {
            dispatch(api.util.invalidateTags(["Notification", "Chat"]));
          }
        } catch (e) {
          console.error("WS Error:", e);
        }
      };

      socket.onclose = () => {
        if (!isCleanedUp) {
          if (Platform.OS !== "web" && !didOpen && !usedFallback) {
            usedFallback = true;
            console.log("↪️ Notification WS auth fallback: header -> query token");
            reconnectTimer = setTimeout(() => connect("query"), 250);
            return;
          }
          reconnectTimer = setTimeout(
            () => connect(usedFallback ? "query" : "header"),
            5000,
          );
        }
      };
    };

    connect(Platform.OS === "web" ? "query" : "header");

    return () => {
      isCleanedUp = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef?.close();
    };
  }, [token, dispatch]);

  return null;
}

