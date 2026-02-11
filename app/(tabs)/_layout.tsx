import React, { useEffect, useRef } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useGetUnreadCountQuery } from "../../store/notificationApi";
import { API_URL } from "../../store/api";

export default function TabLayout() {
  const token = useSelector((state: any) => state.auth.token);
  const { data: notificationData, refetch } = useGetUnreadCountQuery(
    undefined,
    {
      pollingInterval: 15000,
    },
  );

  useEffect(() => {
    if (!token) return;

    const wsUrl = API_URL.replace("http", "ws");
    const socket = new WebSocket(
      `${wsUrl}/notifications/ws?token=${token || ""}`,
    );

    socket.onopen = () => {
      console.log("Connected to notification WS");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "refresh") {
          console.log("Received notification refresh signal");
          refetch();
        }
      } catch (e) {
        console.error("Error parsing notification WS message", e);
      }
    };

    socket.onerror = (e) => {
      console.log("Notification WS error", e);
    };

    return () => {
      socket.close();
    };
  }, [token, refetch]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1d9bf0",
        tabBarInactiveTintColor: "#6B7280",
        // headerShown: false,
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
          headerShown: false, // Often Home has custom header
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
