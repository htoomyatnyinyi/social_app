import { Stack } from "expo-router";
import { Provider as ReduxProvider } from "react-redux";
import { Provider as AntProvider } from "@ant-design/react-native";
import { store } from "../store/store";
import * as Font from "expo-font";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync(
          "antoutline",
          require("@ant-design/icons-react-native/fonts/antoutline.ttf"),
        );
        await Font.loadAsync(
          "antfill",
          require("@ant-design/icons-react-native/fonts/antfill.ttf"),
        );
      } catch (e) {
        console.warn(e);
      } finally {
        setLoaded(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ReduxProvider store={store}>
      <AntProvider>
        <Stack />
      </AntProvider>
    </ReduxProvider>
  );
}
