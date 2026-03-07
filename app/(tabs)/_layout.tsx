import React, { useEffect, useRef, useCallback } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector , useDispatch } from "react-redux";
import { useGetUnreadCountQuery } from "../../store/notificationApi";
import { API_URL, api } from "../../store/api";

export default function TabLayout() {
  const token = useSelector((state: any) => state.auth.token);
  const dispatch = useDispatch();
  const { data: notificationData, refetch: refetchUnread } =
    useGetUnreadCountQuery(undefined, {
      pollingInterval: 30000, // Reduced polling — WS handles real-time
    });

  // Keep refetch in a ref to avoid re-creating the WS connection
  const refetchRef = useRef(refetchUnread);
  useEffect(() => {
    refetchRef.current = refetchUnread;
  }, [refetchUnread]);

  useEffect(() => {
    if (!token) return;

    let isCleanedUp = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let socketRef: WebSocket | null = null;

    const wsProtocol = API_URL.startsWith("https") ? "wss" : "ws";
    const cleanBase = API_URL.replace(/^https?:\/\//, "");

    const connect = () => {
      if (isCleanedUp) return;

      const socket = new WebSocket(
        `${wsProtocol}://${cleanBase}/notifications/ws?token=${token}`,
      );
      socketRef = socket;

      socket.onopen = () => {
        console.log("✅ Notification WS connected");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "refresh") {
            console.log("🔔 Notification refresh signal received");
            // Refetch unread count (badge)
            refetchRef.current();
            // Invalidate the full notification list so it refetches when the screen is visited
            dispatch(api.util.invalidateTags(["Notification"]));
            // Also invalidate Chat tag so the chat list refreshes with new message previews
            dispatch(api.util.invalidateTags(["Chat"]));
          }
        } catch (e) {
          console.error("Error parsing notification WS message", e);
        }
      };

      socket.onerror = (e) => {
        console.error("❌ Notification WS error", e);
      };

      socket.onclose = (e) => {
        console.log(
          `🔌 Notification WS closed. Code: ${e.code}, Reason: ${e.reason}`,
        );
        socketRef = null;
        // Auto-reconnect after 5 seconds unless we cleaned up
        if (!isCleanedUp) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      isCleanedUp = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef?.close();
      socketRef = null;
    };
  }, [token, dispatch]); // Only reconnect when token changes, not on refetch

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1d9bf0",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#f3f4f6",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          borderBottomWidth: 1,
          borderBottomColor: "#f3f4f6",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={color}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarBadge:
            notificationData?.count > 0 ? notificationData.count : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "mail" : "mail-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
