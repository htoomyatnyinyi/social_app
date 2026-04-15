import React, { useEffect, useRef, useCallback } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch } from "../../store/store";
import { notificationApi, useGetUnreadCountQuery } from "../../store/notificationApi";
import { useGetNotificationPreferencesQuery } from "../../store/settingsApi";
import { useUpdatePushTokenMutation } from "../../store/profileApi";
import { API_URL, api } from "../../store/api";
import { usePushNotifications, scheduleLocalNotificationAsync } from "../../hooks/usePushNotifications";
import { Platform, View } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";
import { useWebRTCContext } from "../../context/WebRTCContext";

export default function TabLayout() {
  const { accentColor, isDark } = useTheme();
  const token = useSelector((state: any) => state.auth.token);
  const dispatch = useDispatch<AppDispatch>();
  const { processGlobalSignaling, setGlobalSendSignal } = useWebRTCContext();

  // Notifications logic
  const { data: preferences } = useGetNotificationPreferencesQuery({}, { skip: !token });
  const { data: notificationData, refetch: refetchUnread } =
    useGetUnreadCountQuery(undefined, {
      pollingInterval: 60000,
      refetchOnFocus: false,
      refetchOnReconnect: true,
      skip: !token,
    });

  const { expoPushToken } = usePushNotifications();
  const [updatePushToken] = useUpdatePushTokenMutation();

  // Fix 1: Update push token with full dependency array
  useEffect(() => {
    if (expoPushToken && token) {
      updatePushToken({ token: expoPushToken }).catch(console.error);
    }
  }, [expoPushToken, token, updatePushToken]);

  // Fix 2: Handle WebSocket with stable ref to prevent constant reconnections
  const refetchRef = useRef(refetchUnread);
  useEffect(() => {
    refetchRef.current = refetchUnread;
  }, [refetchUnread]);

  // Use refs for signaling functions so they NEVER trigger WebSocket reconnection
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
    let reconnectTimer: any = null;
    let socketRef: WebSocket | null = null;
    let didOpen = false;
    let usedFallback = false;

    const wsProtocol = API_URL.startsWith("https") ? "wss" : "ws";
    const cleanBase = API_URL.replace(/^https?:\/\//, "");

    const connect = (mode: "header" | "query") => {
      if (isCleanedUp) return;
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
        console.log("✅ Notification WS: Opened (stable)");
        setGlobalSendSignalRef.current((payload: any) => {
          if (socket.readyState === WebSocket.OPEN) {
            console.log("➡️ Sending:", payload.type);
            socket.send(JSON.stringify(payload));
          } else {
            console.warn("⚠️ Socket not OPEN, readyState:", socket.readyState);
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
            console.log("⬅️ Received:", data.type);
            processSignalingRef.current(data);
            return;
          }

          if (data.type === "new_notification") {
            const notif = data.data;

            // Check if notification is allowed by preferences
            const currentPrefs = currentPreferencesRef.current;
            let isAllowed = true;
            if (currentPrefs) {
              if (!currentPrefs.pushEnabled) isAllowed = false;
              else if (notif.type === "LIKE" && !currentPrefs.likes) isAllowed = false;
              else if (notif.type === "REPLY" && !currentPrefs.replies) isAllowed = false;
              else if (notif.type === "MENTION" && !currentPrefs.mentions) isAllowed = false;
              else if (notif.type === "REPOST" && !currentPrefs.reposts) isAllowed = false;
              else if (notif.type === "FOLLOW" && !currentPrefs.follows) isAllowed = false;
              else if (notif.type === "MESSAGE" && !currentPrefs.messages) isAllowed = false;
            }

            if (!isAllowed) {
              return; // Ignore this notification completely
            }

            // 1. Update unread count manually
            dispatch(
              notificationApi.util.updateQueryData("getUnreadCount", undefined, (draft: any) => {
                if (draft) {
                  draft.count = (draft.count || 0) + 1;
                }
              })
            );

            // Show a local notification for better UX in foreground/when WS resolves
            if (notif.message || notif.type) {
              const title = notif.type === "MESSAGE" ? "New Message" : "New Notification";
              const body = notif.message || "You have a new notification";
              scheduleLocalNotificationAsync(title, body, { id: notif.id, type: notif.type });
            }

            // 2. Optimistically append to notifications list cache
            // The query arg in notifications.tsx is {}
            dispatch(
              notificationApi.util.updateQueryData("getNotifications", {}, (draft: any) => {
                if (!draft) return;
                if (!Array.isArray(draft.notifications)) {
                  draft.notifications = [];
                }
                if (!draft.notifications.find((n: any) => n.id === notif.id)) {
                  draft.notifications.unshift(notif);
                }
              })
            );

            // If the notifications list query isn't in cache (or was GC'd),
            // make sure mounted screens still update without manual refresh.
            dispatch(api.util.invalidateTags(["Notification"]));

            // 3. If it's a message notification, we need to update the Chat list
            if (notif.type === "MESSAGE") {
              dispatch(api.util.invalidateTags(["Chat"]));
            }
          } else if (data.type === "refresh") {
            refetchRef.current();
            dispatch(api.util.invalidateTags(["Notification", "Chat"]));
          }
        } catch (e) {
          console.error("WS Error:", e);
        }
      };

      socket.onclose = () => {
        console.log("🔌 Notification WS closed, reconnecting in 5s...");
        if (!isCleanedUp) {
          if (Platform.OS !== "web" && !didOpen && !usedFallback) {
            usedFallback = true;
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
  }, [token, dispatch]); // ONLY token and dispatch — WebSocket stays alive during calls

  // Modern Icon Component using className
  const TabIcon = useCallback(
    ({ focused, color, icon, iconFocused }: any) => (
      <View className="items-center justify-center pt-2">
        <View
          className={`w-12 h-10 items-center justify-center rounded-2xl ${focused ? "opacity-100" : "opacity-80"}`}
          style={focused ? { backgroundColor: `${accentColor}20` } : {}}
        >
          <Ionicons
            name={focused ? iconFocused : icon}
            size={24}
            color={focused ? accentColor : color}
          />
        </View>
        {focused && (
          <View
            className="w-1 h-1 rounded-full mt-1"
            style={{ backgroundColor: accentColor }}
          />
        )}
      </View>
    ),
    [accentColor],
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: isDark ? "#94A3B8" : "#64748B",
        tabBarShowLabel: false,
        headerShown: false,
        // Using object style for the main container as expo-router requires it for positioning
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 34 : 20,
          left: 20,
          right: 20,
          height: 64,
          borderRadius: 32,
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint={isDark ? "dark" : "light"}
            className="absolute inset-0 rounded-full"
            style={{ borderRadius: 32, overflow: "hidden" }}
          />
        ),
      }}
      screenListeners={{
        tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: (props) => (
            <TabIcon {...props} icon="home-outline" iconFocused="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: (props) => (
            <TabIcon {...props} icon="search-outline" iconFocused="search" />
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
          },
          tabBarIcon: (props) => (
            <TabIcon
              {...props}
              icon="notifications-outline"
              iconFocused="notifications"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: (props) => (
            <TabIcon
              {...props}
              icon="chatbubble-outline"
              iconFocused="chatbubble"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: (props) => (
            <TabIcon {...props} icon="person-outline" iconFocused="person" />
          ),
        }}
      />
    </Tabs>
  );
}

// // import React, { useEffect, useRef } from "react";
// // import { Tabs } from "expo-router";
// // import { Ionicons } from "@expo/vector-icons";
// // import { useSelector, useDispatch } from "react-redux";
// // import { useGetUnreadCountQuery } from "../../store/notificationApi";
// // import { useUpdatePushTokenMutation } from "../../store/profileApi";
// // import { API_URL, api } from "../../store/api";
// // import { usePushNotifications } from "../../hooks/usePushNotifications";
// // import { Platform, View, StyleSheet } from "react-native";
// // import { BlurView } from "expo-blur";
// // import * as Haptics from "expo-haptics";
// // import { useTheme } from "../../context/ThemeContext";
// // import { useWebRTCContext } from "../../context/WebRTCContext";

// // export default function TabLayout() {
// //   const { accentColor, isDark } = useTheme();
// //   const token = useSelector((state: any) => state.auth.token);
// //   const dispatch = useDispatch();
// //   const { processGlobalSignaling, setGlobalSendSignal } = useWebRTCContext();

// //   const { data: notificationData, refetch: refetchUnread } =
// //     useGetUnreadCountQuery(undefined, {
// //       pollingInterval: 30000,
// //       skip: !token,
// //     });

// //   const { expoPushToken } = usePushNotifications();
// //   const [updatePushToken] = useUpdatePushTokenMutation();

// //   useEffect(() => {
// //     if (expoPushToken && token) {
// //       updatePushToken({ token: expoPushToken }).catch(console.error);
// //     }
// //   }, [expoPushToken, token, updatePushToken]);

// //   const refetchRef = useRef(refetchUnread);
// //   useEffect(() => {
// //     refetchRef.current = refetchUnread;
// //   }, [refetchUnread]);

// //   useEffect(() => {
// //     if (!token) return;

// //     let isCleanedUp = false;
// //     let reconnectTimer: any = null;
// //     let socketRef: WebSocket | null = null;

// //     const wsProtocol = API_URL.startsWith("https") ? "wss" : "ws";
// //     const cleanBase = API_URL.replace(/^https?:\/\//, "");

// //     const connect = () => {
// //       if (isCleanedUp) return;
// //       const socket = new WebSocket(
// //         `${wsProtocol}://${cleanBase}/notifications/ws?token=${token}`,
// //       );
// //       socketRef = socket;

// //       socket.onopen = () => {
// //         console.log("✅ Global Signaling Connected");
// //         setGlobalSendSignal((payload: any) => {
// //           if (socket.readyState === WebSocket.OPEN) {
// //             socket.send(JSON.stringify(payload));
// //           }
// //         });
// //       };

// //       socket.onmessage = (event) => {
// //         try {
// //           const data = JSON.parse(event.data);
// //           const signalingTypes = [
// //             "call_invite",
// //             "call_accept",
// //             "call_reject",
// //             "offer",
// //             "answer",
// //             "ice_candidate",
// //             "end_call",
// //           ];
// //           if (signalingTypes.includes(data.type)) {
// //             processGlobalSignaling(data);
// //             return;
// //           }
// //           if (data.type === "refresh") {
// //             refetchRef.current();
// //             dispatch(api.util.invalidateTags(["Notification", "Chat"]));
// //           }
// //         } catch (e) {
// //           console.error("Error processing message:", e);
// //         }
// //       };

// //       socket.onclose = () => {
// //         if (!isCleanedUp) reconnectTimer = setTimeout(connect, 5000);
// //       };
// //     };

// //     connect();

// //     return () => {
// //       isCleanedUp = true;
// //       if (reconnectTimer) clearTimeout(reconnectTimer);
// //       socketRef?.close();
// //     };
// //   }, [token, dispatch, processGlobalSignaling, setGlobalSendSignal]);

// //   // Helper function to render icons consistently
// //   const renderTabIcon = (
// //     focused: boolean,
// //     color: string,
// //     iconName: any,
// //     iconFocusedName: any,
// //   ) => (
// //     <View
// //       style={[
// //         styles.iconContainer,
// //         focused && { backgroundColor: accentColor, borderRadius: 12 },
// //       ]}
// //     >
// //       <Ionicons
// //         name={focused ? iconFocusedName : iconName}
// //         size={24}
// //         color={focused ? "#FFFFFF" : color}
// //       />
// //     </View>
// //   );

// //   return (
// //     <Tabs
// //       screenOptions={{
// //         tabBarActiveTintColor: accentColor,
// //         tabBarInactiveTintColor: isDark ? "#64748B" : "#94A3B8",
// //         tabBarShowLabel: false,
// //         tabBarLabelStyle: {
// //           fontSize: 11,
// //           fontWeight: "500",
// //           marginBottom: Platform.OS === "ios" ? 0 : 10,
// //         },
// //         tabBarStyle: {
// //           position: "absolute",
// //           borderTopWidth: 0,
// //           elevation: 0,
// //           // height: Platform.OS === "ios" ? 90 : 70,
// //           backgroundColor: "transparent",
// //           // backgroundColor: "red",
// //         },
// //         tabBarBackground: () => (
// //           <BlurView
// //             // intensity={95}
// //             tint={isDark ? "dark" : "light"}
// //             // style={StyleSheet.absoluteFillObject}
// //           />
// //         ),
// //         headerShown: false,
// //       }}
// //       screenListeners={{
// //         tabPress: () => {
// //           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
// //         },
// //       }}
// //     >
// //       <Tabs.Screen
// //         name="index"
// //         options={{
// //           title: "Home",
// //           tabBarIcon: ({ color, focused }) =>
// //             renderTabIcon(focused, color, "home-outline", "home"),
// //         }}
// //       />
// //       <Tabs.Screen
// //         name="explore"
// //         options={{
// //           title: "Explore",
// //           tabBarIcon: ({ color, focused }) =>
// //             renderTabIcon(focused, color, "search-outline", "search"),
// //         }}
// //       />
// //       <Tabs.Screen
// //         name="notifications"
// //         options={{
// //           title: "Notifications",
// //           tabBarBadge:
// //             notificationData?.count > 0 ? notificationData.count : undefined,
// //           tabBarBadgeStyle: {
// //             backgroundColor: "#F43F5E",
// //             fontSize: 10,
// //             color: "white",
// //           },
// //           tabBarIcon: ({ color, focused }) =>
// //             renderTabIcon(
// //               focused,
// //               color,
// //               "notifications-outline",
// //               "notifications",
// //             ),
// //         }}
// //       />
// //       <Tabs.Screen
// //         name="chat"
// //         options={{
// //           title: "Chat",
// //           tabBarIcon: ({ color, focused }) =>
// //             renderTabIcon(focused, color, "mail-outline", "mail"),
// //         }}
// //       />
// //       <Tabs.Screen
// //         name="profile"
// //         options={{
// //           title: "Profile",
// //           tabBarIcon: ({ color, focused }) =>
// //             renderTabIcon(focused, color, "person-outline", "person"),
// //         }}
// //       />
// //     </Tabs>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   iconContainer: {
// //     width: 42,
// //     height: 42,
// //     alignItems: "center",
// //     justifyContent: "center",
// //     marginTop: 12, // Keeps icon from being too close to the top
// //   },
// // });

// // // import React, { useEffect, useRef } from "react";
// // // import { Tabs } from "expo-router";
// // // import { Ionicons } from "@expo/vector-icons";
// // // import { useSelector, useDispatch } from "react-redux";
// // // import { useGetUnreadCountQuery } from "../../store/notificationApi";
// // // import { useUpdatePushTokenMutation } from "../../store/profileApi";
// // // import { API_URL, api } from "../../store/api";
// // // import { usePushNotifications } from "../../hooks/usePushNotifications";
// // // import { Platform, View } from "react-native";
// // // import { BlurView } from "expo-blur";
// // // import * as Haptics from "expo-haptics";
// // // import { useWebRTCContext } from "../../context/WebRTCContext";

// // // export default function TabLayout() {
// // //   const token = useSelector((state: any) => state.auth.token);
// // //   const dispatch = useDispatch();
// // //   const { processGlobalSignaling, setGlobalSendSignal } = useWebRTCContext();

// // //   const { data: notificationData, refetch: refetchUnread } =
// // //     useGetUnreadCountQuery(undefined, {
// // //       pollingInterval: 30000,
// // //       skip: !token,
// // //     });

// // //   const { expoPushToken } = usePushNotifications();
// // //   const [updatePushToken] = useUpdatePushTokenMutation();

// // //   useEffect(() => {
// // //     if (expoPushToken && token) {
// // //       updatePushToken({ token: expoPushToken }).catch(console.error);
// // //     }
// // //   }, [expoPushToken, token, updatePushToken]);

// // //   const refetchRef = useRef(refetchUnread);
// // //   useEffect(() => {
// // //     refetchRef.current = refetchUnread;
// // //   }, [refetchUnread]);

// // //   useEffect(() => {
// // //     if (!token) return;

// // //     let isCleanedUp = false;
// // //     let reconnectTimer: any = null;
// // //     let socketRef: WebSocket | null = null;

// // //     const wsProtocol = API_URL.startsWith("https") ? "wss" : "ws";
// // //     const cleanBase = API_URL.replace(/^https?:\/\//, "");

// // //     const connect = () => {
// // //       if (isCleanedUp) return;
// // //       const socket = new WebSocket(
// // //         `${wsProtocol}://${cleanBase}/notifications/ws?token=${token}`,
// // //       );
// // //       socketRef = socket;

// // //       socket.onopen = () => {
// // //         console.log("✅ Global Signaling Connected");
// // //         setGlobalSendSignal((payload: any) => {
// // //           if (socket.readyState === WebSocket.OPEN) {
// // //             socket.send(JSON.stringify(payload));
// // //           }
// // //         });
// // //       };

// // //       socket.onmessage = (event) => {
// // //         try {
// // //           const data = JSON.parse(event.data);

// // //           // Handle Signaling
// // //           const signalingTypes = ["call_invite", "call_accept", "call_reject", "offer", "answer", "ice_candidate", "end_call"];
// // //           if (signalingTypes.includes(data.type)) {
// // //             processGlobalSignaling(data);
// // //             return;
// // //           }

// // //           if (data.type === "refresh") {
// // //             refetchRef.current();
// // //             dispatch(api.util.invalidateTags(["Notification", "Chat"]));
// // //           }
// // //         } catch (e) { }
// // //       };

// // //       socket.onclose = () => {
// // //         if (!isCleanedUp) reconnectTimer = setTimeout(connect, 5000);
// // //       };
// // //     };

// // //     connect();

// // //     return () => {
// // //       isCleanedUp = true;
// // //       if (reconnectTimer) clearTimeout(reconnectTimer);
// // //       socketRef?.close();
// // //     };
// // //   }, [token, dispatch, processGlobalSignaling, setGlobalSendSignal]);

// // //   return (
// // //     <Tabs
// // //       screenOptions={{
// // //         // tabBarActiveTintColor: "#0ea5e9", // Match your sky-500
// // //         // tabBarInactiveTintColor: "#94A3B8",
// // //         tabBarShowLabel: true,
// // //         tabBarLabelStyle: {
// // //           fontSize: 11,
// // //           marginBottom: 5,
// // //         },
// // //         tabBarStyle: {
// // //           position: "absolute",
// // //           height: Platform.OS === "ios" ? 85 : 65,
// // //           backgroundColor: "transparent",
// // //           elevation: 0,
// // //           borderTopWidth: 0,
// // //         },
// // //         tabBarBackground: () => (
// // //           <BlurView
// // //             intensity={95}
// // //             tint="light"
// // //             style={{
// // //               position: "absolute",
// // //               top: 0,
// // //               left: 0,
// // //               right: 0,
// // //               bottom: 0,
// // //               borderTopWidth: 1,
// // //               borderTopColor: "rgba(226, 232, 240, 0.5)",
// // //             }}
// // //           />
// // //         ),
// // //         headerShown: false,
// // //       }}
// // //       screenListeners={{
// // //         tabPress: () => {
// // //           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
// // //         },
// // //       }}

// // //     >
// // //       <Tabs.Screen
// // //         name="index"
// // //         options={{
// // //           tabBarIcon: ({ color, focused }) => (
// // //             <View style={{ paddingTop: 12 }}>
// // //               <View
// // //                 className={focused ? "bg-sky-500 p-2 rounded-[16px]" : "p-2"}
// // //               >
// // //                 <Ionicons
// // //                   name={focused ? "home" : "home-outline"}
// // //                   size={26}
// // //                   color={color}
// // //                 />
// // //               </View>
// // //             </View>
// // //           ),
// // //         }}
// // //       />
// // //       {/* <Tabs.Screen
// // //         name="explore"
// // //         options={{
// // //           tabBarIcon: ({ color, focused }) => (
// // //             <View style={{ paddingTop: 12 }}>
// // //               <View
// // //                 className={focused ? "bg-sky-500 p-2 m-10 rounded-[16px]" : "p-2"}
// // //               >
// // //                 <Ionicons
// // //                   name={focused ? "search" : "search-outline"}
// // //                   size={26}
// // //                   color={color}
// // //                 />
// // //               </View>
// // //             </View>
// // //           ),
// // //         }}
// // //       /> */}
// // //       <Tabs.Screen
// // //         name="explore"
// // //         options={{
// // //           tabBarIcon: ({ color, focused }) => (
// // //             <View
// // //               style={{
// // //                 backgroundColor: focused ? "#0ea5e9" : "transparent",
// // //                 // Use fixed dimensions to ensure a perfect circle/square
// // //                 width: 42,
// // //                 height: 42,
// // //                 borderRadius: 12,
// // //                 alignItems: "center",
// // //                 justifyContent: "center",
// // //                 // Push it up slightly so it doesn't hit the label
// // //                 marginTop: 10,
// // //               }}
// // //             >
// // //               <Ionicons
// // //                 name={focused ? "search" : "search-outline"}
// // //                 size={24}
// // //                 // If focused, make icon white to stand out against blue
// // //                 color={focused ? "#FFFFFF" : color}
// // //               />
// // //             </View>
// // //           ),
// // //         }}
// // //       />

// // //       <Tabs.Screen
// // //         name="notifications"
// // //         options={{
// // //           tabBarBadge:
// // //             notificationData?.count > 0 ? notificationData.count : undefined,
// // //           tabBarBadgeStyle: {
// // //             backgroundColor: "#F43F5E",
// // //             fontSize: 10,
// // //             color: "white",
// // //             marginTop: 4,
// // //           },
// // //           tabBarIcon: ({ color, focused }) => (
// // //             <View style={{ paddingTop: 12 }}>
// // //               <View
// // //                 className={focused ? "bg-sky-500 p-2 rounded-[16px]" : "p-2"}
// // //               >
// // //                 <Ionicons
// // //                   name={focused ? "notifications" : "notifications-outline"}
// // //                   size={26}
// // //                   color={color}
// // //                 />
// // //               </View>
// // //             </View>
// // //           ),
// // //         }}
// // //       />
// // //       <Tabs.Screen
// // //         name="chat"
// // //         options={{
// // //           tabBarIcon: ({ color, focused }) => (
// // //             <View style={{ paddingTop: 12 }}>
// // //               <View
// // //                 className={focused ? "bg-sky-500 p-2 rounded-[16px]" : "p-2"}
// // //               >
// // //                 <Ionicons
// // //                   name={focused ? "mail" : "mail-outline"}
// // //                   size={26}
// // //                   color={color}
// // //                 />
// // //               </View>
// // //             </View>
// // //           ),
// // //         }}
// // //       />
// // //       <Tabs.Screen
// // //         name="profile"
// // //         options={{
// // //           tabBarIcon: ({ color, focused }) => (
// // //             <View style={{ paddingTop: 12 }}>
// // //               <View
// // //                 className={focused ? "bg-sky-500 p-2 rounded-[16px]" : "p-2"}
// // //               >
// // //                 <Ionicons
// // //                   name={focused ? "person" : "person-outline"}
// // //                   size={26}
// // //                   color={color}
// // //                 />
// // //               </View>
// // //             </View>
// // //           ),
// // //         }}
// // //       />
// // //     </Tabs>
// // //   );
// // // }
