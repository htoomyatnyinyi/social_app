import { cssInterop } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export function configureCSSInterop() {
  cssInterop(SafeAreaView, {
    className: "style",
  });

  cssInterop(Image, {
    className: "style",
  });

  cssInterop(KeyboardAwareScrollView, {
    className: "style",
    contentContainerClassName: "contentContainerStyle",
  });
}
