import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Provider as ReduxProvider } from "react-redux";
import { store, persistor } from "../store/store";
import { PersistGate } from "redux-persist/integration/react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { db } from "../db/client";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";

import "../global.css";
import { Text, View, ActivityIndicator } from "react-native";
import { configureCSSInterop } from "../components/CssInterop";

// Configure CSS interop before the app starts
configureCSSInterop();

// Prevent the splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

import { WebRTCProvider } from "../context/WebRTCContext";
import { GlobalCallHandler } from "../components/GlobalCallHandler";
import { GlobalNotificationSocket } from "../components/GlobalNotificationSocket";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

function ThemeLayout() {
  const { isDark, accentColor } = useTheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: isDark ? "#0F172A" : "white" },
          headerTintColor: accentColor,
        }}
      />
      <GlobalNotificationSocket />
      <GlobalCallHandler />
    </>
  );
}

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (success || error) {
      SplashScreen.hideAsync();
    }
  }, [success, error]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-5">
        <Text className="text-red-500 font-bold text-lg">
          Database Sync Error:
        </Text>
        <Text className="text-gray-500 text-center mt-2">{error.message}</Text>
      </View>
    );
  }

  if (!success && !error) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text className="mt-4 text-gray-500 font-medium">
          Initializing App...
        </Text>
      </View>
    );
  }

  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <WebRTCProvider>
          <ThemeProvider>
            <SafeAreaProvider>
              <ThemeLayout />
            </SafeAreaProvider>
          </ThemeProvider>
        </WebRTCProvider>
      </PersistGate>
    </ReduxProvider>
  );
}

/* 

new code but not working

import { useEffect, useState } from "react";
import { Stack, Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Provider as ReduxProvider } from "react-redux";
import { store, persistor } from "../store/store";
import { PersistGate } from "redux-persist/integration/react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { db } from "../db/client";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";

import "../global.css";
import { Text, View, ActivityIndicator } from "react-native";

import { WebRTCProvider } from "../context/WebRTCContext";
import { GlobalCallHandler } from "../components/GlobalCallHandler";
import { GlobalNotificationSocket } from "../components/GlobalNotificationSocket";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { useOnboarding } from "../hooks/useOnboarding"; // ← New hook

// Prevent splash screen from auto hiding
SplashScreen.preventAutoHideAsync();

function ThemeLayout() {
  const { isDark } = useTheme();
  const { isOnboarded, isLoading } = useOnboarding();

  // Show loading while checking onboarding status
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-[#0F172A]">
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="mt-4 text-gray-500 dark:text-gray-400">
          Loading...
        </Text>
      </View>
    );
  }

  // If user has NOT completed onboarding → show onboarding screen
  if (!isOnboarded) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
      </Stack>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: isDark ? "#0F172A" : "white" },
        }}
      />
      <GlobalNotificationSocket />
      <GlobalCallHandler />
    </>
  );
}

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // You can add more initialization here (fonts, etc.)
        await new Promise((resolve) => setTimeout(resolve, 300)); // optional small delay
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
      }
    };

    if (success || error) {
      prepare();
    }
  }, [success, error]);

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-5 dark:bg-[#0F172A]">
        <Text className="text-red-500 font-bold text-lg">Database Error</Text>
        <Text className="text-gray-500 text-center mt-2">{error.message}</Text>
      </View>
    );
  }

  if (!success || !appReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-[#0F172A]">
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="mt-4 text-gray-500 dark:text-gray-400 font-medium">
          Initializing App...
        </Text>
      </View>
    );
  }

  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <WebRTCProvider>
          <ThemeProvider>
            <SafeAreaProvider>
              <ThemeLayout />
            </SafeAreaProvider>
          </ThemeProvider>
        </WebRTCProvider>
      </PersistGate>
    </ReduxProvider>
  );
}
*/
