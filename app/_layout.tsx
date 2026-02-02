import { Stack } from "expo-router";
import { Provider as ReduxProvider } from "react-redux";
import { store, persistor } from "../store/store";
import { PersistGate } from "redux-persist/integration/react";

// import "./global.css";
import "../global.css";

export default function RootLayout() {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Stack />
      </PersistGate>
    </ReduxProvider>
  );
}
