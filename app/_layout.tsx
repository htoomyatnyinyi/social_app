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

// Prevent the splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    // Once migrations succeed (or fail), hide the splash screen
    if (success || error) {
      SplashScreen.hideAsync();
    }
  }, [success, error]);

  // If there's an error, we show a fallback
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-5">
        <Text className="text-red-500 font-bold text-lg">Database Sync Error:</Text>
        <Text className="text-gray-500 text-center mt-2">{error.message}</Text>
      </View>
    );
  }

  if (!success && !error) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text className="mt-4 text-gray-500 font-medium">Initializing Oasis...</Text>
      </View>
    );
  }

  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "white" },
            }}
          />
        </SafeAreaProvider>
      </PersistGate>
    </ReduxProvider>
  );
}

