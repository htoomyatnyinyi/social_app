import React, { useCallback } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useGetUnreadCountQuery } from "../../store/notificationApi";
import { Platform, View } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../context/ThemeContext";

export default function TabLayout() {
  const { accentColor, isDark } = useTheme();
  const token = useSelector((state: any) => state.auth.token);
  const { data: notificationData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 60000,
    refetchOnFocus: false,
    refetchOnReconnect: true,
    skip: !token,
  });

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

// // // // // import React, { useEffect, useRef } from "react";
// // // // // import { Tabs } from "expo-router";
// // // // // import { Ionicons } from "@expo/vector-icons";
// // // // // import { useSelector, useDispatch } from "react-redux";
// // // // // import { useGetUnreadCountQuery } from "../../store/notificationApi";
// // // // // import { useUpdatePushTokenMutation } from "../../store/profileApi";
// // // // // import { API_URL, api } from "../../store/api";
// // // // // import { usePushNotifications } from "../../hooks/usePushNotifications";
// // // // // import { Platform, View, StyleSheet } from "react-native";
// // // // // import { BlurView } from "expo-blur";
// // // // // import * as Haptics from "expo-haptics";
// // // // // import { useTheme } from "../../context/ThemeContext";
// // // // // import { useWebRTCContext } from "../../context/WebRTCContext";

// // // // // export default function TabLayout() {
// // // // //   const { accentColor, isDark } = useTheme();
// // // // //   const token = useSelector((state: any) => state.auth.token);
// // // // //   const dispatch = useDispatch();
// // // // //   const { processGlobalSignaling, setGlobalSendSignal } = useWebRTCContext();

// // // // //   const { data: notificationData, refetch: refetchUnread } =
// // // // //     useGetUnreadCountQuery(undefined, {
// // // // //       pollingInterval: 30000,
// // // // //       skip: !token,
// // // // //     });

// // // // //   const { expoPushToken } = usePushNotifications();
// // // // //   const [updatePushToken] = useUpdatePushTokenMutation();

// // // // //   useEffect(() => {
// // // // //     if (expoPushToken && token) {
// // // // //       updatePushToken({ token: expoPushToken }).catch(console.error);
// // // // //     }
// // // // //   }, [expoPushToken, token, updatePushToken]);

// // // // //   const refetchRef = useRef(refetchUnread);
// // // // //   useEffect(() => {
// // // // //     refetchRef.current = refetchUnread;
// // // // //   }, [refetchUnread]);

// // // // //   useEffect(() => {
// // // // //     if (!token) return;

// // // // //     let isCleanedUp = false;
// // // // //     let reconnectTimer: any = null;
// // // // //     let socketRef: WebSocket | null = null;

// // // // //     const wsProtocol = API_URL.startsWith("https") ? "wss" : "ws";
// // // // //     const cleanBase = API_URL.replace(/^https?:\/\//, "");

// // // // //     const connect = () => {
// // // // //       if (isCleanedUp) return;
// // // // //       const socket = new WebSocket(
// // // // //         `${wsProtocol}://${cleanBase}/notifications/ws?token=${token}`,
// // // // //       );
// // // // //       socketRef = socket;

// // // // //       socket.onopen = () => {
// // // // //         console.log("✅ Global Signaling Connected");
// // // // //         setGlobalSendSignal((payload: any) => {
// // // // //           if (socket.readyState === WebSocket.OPEN) {
// // // // //             socket.send(JSON.stringify(payload));
// // // // //           }
// // // // //         });
// // // // //       };

// // // // //       socket.onmessage = (event) => {
// // // // //         try {
// // // // //           const data = JSON.parse(event.data);
// // // // //           const signalingTypes = [
// // // // //             "call_invite",
// // // // //             "call_accept",
// // // // //             "call_reject",
// // // // //             "offer",
// // // // //             "answer",
// // // // //             "ice_candidate",
// // // // //             "end_call",
// // // // //           ];
// // // // //           if (signalingTypes.includes(data.type)) {
// // // // //             processGlobalSignaling(data);
// // // // //             return;
// // // // //           }
// // // // //           if (data.type === "refresh") {
// // // // //             refetchRef.current();
// // // // //             dispatch(api.util.invalidateTags(["Notification", "Chat"]));
// // // // //           }
// // // // //         } catch (e) {
// // // // //           console.error("Error processing message:", e);
// // // // //         }
// // // // //       };

// // // // //       socket.onclose = () => {
// // // // //         if (!isCleanedUp) reconnectTimer = setTimeout(connect, 5000);
// // // // //       };
// // // // //     };

// // // // //     connect();

// // // // //     return () => {
// // // // //       isCleanedUp = true;
// // // // //       if (reconnectTimer) clearTimeout(reconnectTimer);
// // // // //       socketRef?.close();
// // // // //     };
// // // // //   }, [token, dispatch, processGlobalSignaling, setGlobalSendSignal]);

// // // // //   // Helper function to render icons consistently
// // // // //   const renderTabIcon = (
// // // // //     focused: boolean,
// // // // //     color: string,
// // // // //     iconName: any,
// // // // //     iconFocusedName: any,
// // // // //   ) => (
// // // // //     <View
// // // // //       style={[
// // // // //         styles.iconContainer,
// // // // //         focused && { backgroundColor: accentColor, borderRadius: 12 },
// // // // //       ]}
// // // // //     >
// // // // //       <Ionicons
// // // // //         name={focused ? iconFocusedName : iconName}
// // // // //         size={24}
// // // // //         color={focused ? "#FFFFFF" : color}
// // // // //       />
// // // // //     </View>
// // // // //   );

// // // // //   return (
// // // // //     <Tabs
// // // // //       screenOptions={{
// // // // //         tabBarActiveTintColor: accentColor,
// // // // //         tabBarInactiveTintColor: isDark ? "#64748B" : "#94A3B8",
// // // // //         tabBarShowLabel: false,
// // // // //         tabBarLabelStyle: {
// // // // //           fontSize: 11,
// // // // //           fontWeight: "500",
// // // // //           marginBottom: Platform.OS === "ios" ? 0 : 10,
// // // // //         },
// // // // //         tabBarStyle: {
// // // // //           position: "absolute",
// // // // //           borderTopWidth: 0,
// // // // //           elevation: 0,
// // // // //           // height: Platform.OS === "ios" ? 90 : 70,
// // // // //           backgroundColor: "transparent",
// // // // //           // backgroundColor: "red",
// // // // //         },
// // // // //         tabBarBackground: () => (
// // // // //           <BlurView
// // // // //             // intensity={95}
// // // // //             tint={isDark ? "dark" : "light"}
// // // // //             // style={StyleSheet.absoluteFillObject}
// // // // //           />
// // // // //         ),
// // // // //         headerShown: false,
// // // // //       }}
// // // // //       screenListeners={{
// // // // //         tabPress: () => {
// // // // //           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
// // // // //         },
// // // // //       }}
// // // // //     >
// // // // //       <Tabs.Screen
// // // // //         name="index"
// // // // //         options={{
// // // // //           title: "Home",
// // // // //           tabBarIcon: ({ color, focused }) =>
// // // // //             renderTabIcon(focused, color, "home-outline", "home"),
// // // // //         }}
// // // // //       />
// // // // //       <Tabs.Screen
// // // // //         name="explore"
// // // // //         options={{
// // // // //           title: "Explore",
// // // // //           tabBarIcon: ({ color, focused }) =>
// // // // //             renderTabIcon(focused, color, "search-outline", "search"),
// // // // //         }}
// // // // //       />
// // // // //       <Tabs.Screen
// // // // //         name="notifications"
// // // // //         options={{
// // // // //           title: "Notifications",
// // // // //           tabBarBadge:
// // // // //             notificationData?.count > 0 ? notificationData.count : undefined,
// // // // //           tabBarBadgeStyle: {
// // // // //             backgroundColor: "#F43F5E",
// // // // //             fontSize: 10,
// // // // //             color: "white",
// // // // //           },
// // // // //           tabBarIcon: ({ color, focused }) =>
// // // // //             renderTabIcon(
// // // // //               focused,
// // // // //               color,
// // // // //               "notifications-outline",
// // // // //               "notifications",
// // // // //             ),
// // // // //         }}
// // // // //       />
// // // // //       <Tabs.Screen
// // // // //         name="chat"
// // // // //         options={{
// // // // //           title: "Chat",
// // // // //           tabBarIcon: ({ color, focused }) =>
// // // // //             renderTabIcon(focused, color, "mail-outline", "mail"),
// // // // //         }}
// // // // //       />
// // // // //       <Tabs.Screen
// // // // //         name="profile"
// // // // //         options={{
// // // // //           title: "Profile",
// // // // //           tabBarIcon: ({ color, focused }) =>
// // // // //             renderTabIcon(focused, color, "person-outline", "person"),
// // // // //         }}
// // // // //       />
// // // // //     </Tabs>
// // // // //   );
// // // // // }

// // // // // const styles = StyleSheet.create({
// // // // //   iconContainer: {
// // // // //     width: 42,
// // // // //     height: 42,
// // // // //     alignItems: "center",
// // // // //     justifyContent: "center",
// // // // //     marginTop: 12, // Keeps icon from being too close to the top
// // // // //   },
// // // // // });

// // import React, { useEffect, useRef } from "react";
// // import { Tabs } from "expo-router";
// // import { Ionicons } from "@expo/vector-icons";
// // import { useSelector, useDispatch } from "react-redux";
// // import { useGetUnreadCountQuery } from "../../store/notificationApi";
// // import { useUpdatePushTokenMutation } from "../../store/profileApi";
// // import { API_URL, api } from "../../store/api";
// // import { usePushNotifications } from "../../hooks/usePushNotifications";
// // import { Platform, View } from "react-native";
// // import { BlurView } from "expo-blur";
// // import * as Haptics from "expo-haptics";
// // import { useWebRTCContext } from "../../context/WebRTCContext";

// // export default function TabLayout() {
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

// //           // Handle Signaling
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
// //         } catch (e) {}
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

// //   return (
// //     <Tabs
// //       screenOptions={{
// //         // tabBarActiveTintColor: "#0ea5e9", // Match your sky-500
// //         // tabBarInactiveTintColor: "#94A3B8",
// //         tabBarShowLabel: true,
// //         tabBarLabelStyle: {
// //           fontSize: 11,
// //           marginBottom: 5,
// //         },
// //         tabBarStyle: {
// //           position: "absolute",
// //           height: Platform.OS === "ios" ? 85 : 65,
// //           backgroundColor: "transparent",
// //           elevation: 0,
// //           borderTopWidth: 0,
// //         },
// //         tabBarBackground: () => (
// //           <BlurView
// //             intensity={95}
// //             tint="light"
// //             style={{
// //               position: "absolute",
// //               top: 0,
// //               left: 0,
// //               right: 0,
// //               bottom: 0,
// //               borderTopWidth: 1,
// //               borderTopColor: "rgba(226, 232, 240, 0.5)",
// //             }}
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
// //           tabBarIcon: ({ color, focused }) => (
// //             <View style={{ paddingTop: 12 }}>
// //               <View
// //                 className={focused ? "bg-sky-500 p-2 rounded-[16px]" : "p-2"}
// //               >
// //                 <Ionicons
// //                   name={focused ? "home" : "home-outline"}
// //                   size={26}
// //                   color={color}
// //                 />
// //               </View>
// //             </View>
// //           ),
// //         }}
// //       />
// //       {/* <Tabs.Screen
// //         name="explore"
// //         options={{
// //           tabBarIcon: ({ color, focused }) => (
// //             <View style={{ paddingTop: 12 }}>
// //               <View
// //                 className={focused ? "bg-sky-500 p-2 m-10 rounded-[16px]" : "p-2"}
// //               >
// //                 <Ionicons
// //                   name={focused ? "search" : "search-outline"}
// //                   size={26}
// //                   color={color}
// //                 />
// //               </View>
// //             </View>
// //           ),
// //         }}
// //       /> */}
// //       <Tabs.Screen
// //         name="explore"
// //         options={{
// //           tabBarIcon: ({ color, focused }) => (
// //             <View
// //               style={{
// //                 backgroundColor: focused ? "#0ea5e9" : "transparent",
// //                 // Use fixed dimensions to ensure a perfect circle/square
// //                 width: 42,
// //                 height: 42,
// //                 borderRadius: 12,
// //                 alignItems: "center",
// //                 justifyContent: "center",
// //                 // Push it up slightly so it doesn't hit the label
// //                 marginTop: 10,
// //               }}
// //             >
// //               <Ionicons
// //                 name={focused ? "search" : "search-outline"}
// //                 size={24}
// //                 // If focused, make icon white to stand out against blue
// //                 color={focused ? "#FFFFFF" : color}
// //               />
// //             </View>
// //           ),
// //         }}
// //       />

// //       <Tabs.Screen
// //         name="notifications"
// //         options={{
// //           tabBarBadge:
// //             notificationData?.count > 0 ? notificationData.count : undefined,
// //           tabBarBadgeStyle: {
// //             backgroundColor: "#F43F5E",
// //             fontSize: 10,
// //             color: "white",
// //             marginTop: 4,
// //           },
// //           tabBarIcon: ({ color, focused }) => (
// //             <View style={{ paddingTop: 12 }}>
// //               <View
// //                 className={focused ? "bg-sky-500 p-2 rounded-[16px]" : "p-2"}
// //               >
// //                 <Ionicons
// //                   name={focused ? "notifications" : "notifications-outline"}
// //                   size={26}
// //                   color={color}
// //                 />
// //               </View>
// //             </View>
// //           ),
// //         }}
// //       />
// //       <Tabs.Screen
// //         name="chat"
// //         options={{
// //           tabBarIcon: ({ color, focused }) => (
// //             <View style={{ paddingTop: 12 }}>
// //               <View
// //                 className={focused ? "bg-sky-500 p-2 rounded-[16px]" : "p-2"}
// //               >
// //                 <Ionicons
// //                   name={focused ? "mail" : "mail-outline"}
// //                   size={26}
// //                   color={color}
// //                 />
// //               </View>
// //             </View>
// //           ),
// //         }}
// //       />
// //       <Tabs.Screen
// //         name="profile"
// //         options={{
// //           tabBarIcon: ({ color, focused }) => (
// //             <View style={{ paddingTop: 12 }}>
// //               <View
// //                 className={focused ? "bg-sky-500 p-2 rounded-[16px]" : "p-2"}
// //               >
// //                 <Ionicons
// //                   name={focused ? "person" : "person-outline"}
// //                   size={26}
// //                   color={color}
// //                 />
// //               </View>
// //             </View>
// //           ),
// //         }}
// //       />
// //     </Tabs>
// //   );
// // }

// import React, { useEffect, useRef, useCallback } from "react";
// import { Tabs } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { useSelector, useDispatch } from "react-redux";
// import { useGetUnreadCountQuery } from "../../store/notificationApi";
// import { useUpdatePushTokenMutation } from "../../store/profileApi";
// import { API_URL, api } from "../../store/api";
// import { usePushNotifications } from "../../hooks/usePushNotifications";
// import { Platform, View } from "react-native";
// import { BlurView } from "expo-blur";
// import * as Haptics from "expo-haptics";
// import { useWebRTCContext } from "../../context/WebRTCContext";

// export default function TabLayout() {
//   const token = useSelector((state: any) => state.auth.token);
//   const dispatch = useDispatch();
//   const { processGlobalSignaling, setGlobalSendSignal } = useWebRTCContext();

//   const { data: notificationData, refetch: refetchUnread } =
//     useGetUnreadCountQuery(undefined, {
//       pollingInterval: 30000,
//       skip: !token,
//     });

//   const { expoPushToken } = usePushNotifications();
//   const [updatePushToken] = useUpdatePushTokenMutation();

//   useEffect(() => {
//     if (expoPushToken && token) {
//       updatePushToken({ token: expoPushToken }).catch(console.error);
//     }
//   }, [expoPushToken, token, updatePushToken]);

//   const refetchRef = useRef(refetchUnread);
//   useEffect(() => {
//     refetchRef.current = refetchUnread;
//   }, [refetchUnread]);

//   useEffect(() => {
//     if (!token) return;

//     let isCleanedUp = false;
//     let reconnectTimer: any = null;
//     let socketRef: WebSocket | null = null;

//     const wsProtocol = API_URL.startsWith("https") ? "wss" : "ws";
//     const cleanBase = API_URL.replace(/^https?:\/\//, "");

//     const connect = () => {
//       if (isCleanedUp) return;
//       const socket = new WebSocket(
//         `${wsProtocol}://${cleanBase}/notifications/ws?token=${token}`,
//       );
//       socketRef = socket;

//       socket.onopen = () => {
//         console.log("✅ Global Signaling Connected");
//         setGlobalSendSignal((payload: any) => {
//           if (socket.readyState === WebSocket.OPEN) {
//             socket.send(JSON.stringify(payload));
//           }
//         });
//       };

//       socket.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);

//           // Handle Signaling
//           const signalingTypes = [
//             "call_invite",
//             "call_accept",
//             "call_reject",
//             "offer",
//             "answer",
//             "ice_candidate",
//             "end_call",
//           ];
//           if (signalingTypes.includes(data.type)) {
//             processGlobalSignaling(data);
//             return;
//           }

//           if (data.type === "refresh") {
//             refetchRef.current();
//             dispatch(api.util.invalidateTags(["Notification", "Chat"]));
//           }
//         } catch (e) {}
//       };

//       socket.onclose = () => {
//         if (!isCleanedUp) reconnectTimer = setTimeout(connect, 5000);
//       };
//     };

//     connect();

//     return () => {
//       isCleanedUp = true;
//       if (reconnectTimer) clearTimeout(reconnectTimer);
//       socketRef?.close();
//     };
//   }, [token, dispatch, processGlobalSignaling, setGlobalSendSignal]);

//   // Unified Modern Tab Icon Component
//   const TabIcon = useCallback(
//     ({ focused, color, iconSolid, iconOutline }: any) => (
//       <View className="pt-2 items-center justify-center mt-1">
//         <View
//           className={`w-14 h-8 items-center justify-center rounded-xl ${
//             focused ? "bg-sky-500" : "bg-transparent"
//           }`}
//         >
//           <Ionicons
//             name={focused ? iconSolid : iconOutline}
//             size={22}
//             // Active icons are white to contrast against the blue background
//             // Inactive icons use the default gray theme color
//             color={focused ? "#FFFFFF" : color}
//           />
//         </View>
//       </View>
//     ),
//     [],
//   );

//   return (
//     <Tabs
//       screenOptions={{
//         tabBarActiveTintColor: "#0ea5e9", // Tailwind sky-500 for the labels
//         tabBarInactiveTintColor: "#64748B", // Tailwind slate-500 for inactive labels
//         tabBarShowLabel: false,
//         tabBarLabelStyle: {
//           fontSize: 11,
//           fontWeight: "600",
//           marginBottom: 4,
//         },
//         tabBarStyle: {
//           position: "absolute",
//           height: Platform.OS === "ios" ? 85 : 65,
//           backgroundColor: "transparent",
//           elevation: 0,
//           borderTopWidth: 0,
//         },
//         tabBarBackground: () => (
//           <BlurView
//             intensity={95}
//             tint="light"
//             style={{
//               position: "absolute",
//               top: 0,
//               left: 0,
//               right: 0,
//               bottom: 0,
//               borderTopWidth: 1,
//               borderTopColor: "rgba(226, 232, 240, 0.5)",
//             }}
//           />
//         ),
//         headerShown: false,
//       }}
//       screenListeners={{
//         tabPress: () => {
//           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//         },
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           // tabBarLabel: "Home",
//           tabBarIcon: (props) => (
//             <TabIcon {...props} iconSolid="home" iconOutline="home-outline" />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="explore"
//         options={{
//           // tabBarLabel: "Explore",
//           tabBarIcon: (props) => (
//             <TabIcon
//               {...props}
//               iconSolid="search"
//               iconOutline="search-outline"
//             />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="notifications"
//         options={{
//           // tabBarLabel: "Alerts",
//           tabBarBadge:
//             notificationData?.count > 0 ? notificationData.count : undefined,
//           tabBarBadgeStyle: {
//             backgroundColor: "#F43F5E", // Tailwind rose-500
//             fontSize: 10,
//             color: "white",
//             marginTop: 4,
//           },
//           tabBarIcon: (props) => (
//             <TabIcon
//               {...props}
//               iconSolid="notifications"
//               iconOutline="notifications-outline"
//             />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="chat"
//         options={{
//           // tabBarLabel: "Messages",
//           tabBarIcon: (props) => (
//             <TabIcon {...props} iconSolid="mail" iconOutline="mail-outline" />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="profile"
//         options={{
//           // tabBarLabel: "Profile",
//           tabBarIcon: (props) => (
//             <TabIcon
//               {...props}
//               iconSolid="person"
//               iconOutline="person-outline"
//             />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }
