import { Stack } from "expo-router";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "../store/store";

// import "./global.css";
import "../global.css";

export default function RootLayout() {
  return (
    <ReduxProvider store={store}>
      <Stack />
    </ReduxProvider>
  );
}
