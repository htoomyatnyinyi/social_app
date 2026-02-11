import { useEffect } from "react";
import { Stack } from "expo-router";
import { Provider as ReduxProvider } from "react-redux";
import { store, persistor } from "../store/store";
import { PersistGate } from "redux-persist/integration/react";
import { ActivityIndicator, View, Text } from "react-native";

// Drizzle & SQLite Imports
import { db } from "../db/client";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";

import "../global.css";

export default function RootLayout() {
  // 1. Run migrations on app start
  const { success, error } = useMigrations(db, migrations);

  // 2. Handle Migration Errors
  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-5">
        <Text className="text-red-500 font-bold">Database Sync Error:</Text>
        <Text>{error.message}</Text>
      </View>
    );
  }

  // 3. Prevent rendering the app until the DB is ready
  if (!success) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text className="mt-2 text-gray-500">Preparing database...</Text>
      </View>
    );
  }

  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </PersistGate>
    </ReduxProvider>
  );
}

// import { Stack } from "expo-router";
// import { Provider as ReduxProvider } from "react-redux";
// import { store, persistor } from "../store/store";
// import { PersistGate } from "redux-persist/integration/react";

// // import "./global.css";
// import "../global.css";

// export default function RootLayout() {
//   return (
//     <ReduxProvider store={store}>
//       <PersistGate loading={null} persistor={persistor}>
//         <Stack
//           screenOptions={{
//             headerShown: false,
//           }}
//         />
//       </PersistGate>
//     </ReduxProvider>
//   );
// }
