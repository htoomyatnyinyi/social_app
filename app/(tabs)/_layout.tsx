import React, { useEffect, useRef } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { useGetUnreadCountQuery } from "../../store/notificationApi";
import { useUpdatePushTokenMutation } from "../../store/profileApi";
import { API_URL, api } from "../../store/api";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { Platform, View } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useWebRTCContext } from "../../context/WebRTCContext";

export default function TabLayout() {
  const token = useSelector((state: any) => state.auth.token);
  const dispatch = useDispatch();
  const { processGlobalSignaling, setGlobalSendSignal } = useWebRTCContext();

  const { data: notificationData, refetch: refetchUnread } =
    useGetUnreadCountQuery(undefined, {
      pollingInterval: 30000,
      skip: !token,
    });

  const { expoPushToken } = usePushNotifications();
  const [updatePushToken] = useUpdatePushTokenMutation();

  useEffect(() => {
    if (expoPushToken && token) {
      updatePushToken({ token: expoPushToken }).catch(console.error);
    }
  }, [expoPushToken, token, updatePushToken]);

  const refetchRef = useRef(refetchUnread);
  useEffect(() => {
    refetchRef.current = refetchUnread;
  }, [refetchUnread]);

  useEffect(() => {
    if (!token) return;

    let isCleanedUp = false;
    let reconnectTimer: any = null;
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
        console.log("✅ Global Signaling Connected");
        setGlobalSendSignal((payload: any) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
          }
        });
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle Signaling
          const signalingTypes = ["call_invite", "call_accept", "call_reject", "offer", "answer", "ice_candidate", "end_call"];
          if (signalingTypes.includes(data.type)) {
            processGlobalSignaling(data);
            return;
          }

          if (data.type === "refresh") {
            refetchRef.current();
            dispatch(api.util.invalidateTags(["Notification", "Chat"]));
          }
        } catch (e) { }
      };

      socket.onclose = () => {
        if (!isCleanedUp) reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      isCleanedUp = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef?.close();
    };
  }, [token, dispatch, processGlobalSignaling, setGlobalSendSignal]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#fffff",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarShowLabel: true,
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === "ios" ? 90 : 70,
          backgroundColor: "transparent",
        },
        tabBarBackground: () => (
          <BlurView
            intensity={95}
            tint="light"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderTopWidth: 1,
              borderTopColor: "rgba(226, 232, 240, 0.5)",
            }}
          />
        ),
        headerShown: false,
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ paddingTop: 12 }}>
              <View
                className={focused ? "bg-sky-500 p-2 rounded-[16px]" : "p-2"}
              >
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={26}
                  color={color}
                />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ paddingTop: 12 }}>
              <View
                className={focused ? "bg-sky-500 p-2 rounded-[16px]" : "p-2"}
              >
                <Ionicons
                  name={focused ? "search" : "search-outline"}
                  size={26}
                  color={color}
                />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarBadge:
            notificationData?.count > 0 ? notificationData.count : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#F43F5E",
            fontSize: 10,
            color: "white",
            marginTop: 4,
          },
          tabBarIcon: ({ color, focused }) => (
            <View style={{ paddingTop: 12 }}>
              <View
                className={focused ? "bg-sky-500 p-2 rounded-[16px]" : "p-2"}
              >
                <Ionicons
                  name={focused ? "notifications" : "notifications-outline"}
                  size={26}
                  color={color}
                />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ paddingTop: 12 }}>
              <View
                className={focused ? "bg-sky-500 p-2 rounded-[16px]" : "p-2"}
              >
                <Ionicons
                  name={focused ? "mail" : "mail-outline"}
                  size={26}
                  color={color}
                />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ paddingTop: 12 }}>
              <View
                className={focused ? "bg-sky-500 p-2 rounded-[16px]" : "p-2"}
              >
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={26}
                  color={color}
                />
              </View>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
