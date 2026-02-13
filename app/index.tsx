import { Redirect } from "expo-router";
import { useSelector } from "react-redux";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { token, _persist } = useSelector((state: any) => state.auth);

  // 1. Wait for Redux Persist to finish loading the token from storage
  // If we don't check _persist.rehydrated, token might be null for a split second
  if (_persist && !_persist.rehydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1d9bf0" />
      </View>
    );
  }

  // 2. Logic: If no token, go to Login. If token exists, go to Home.
  if (!token) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/(tabs)" />;
}

// import { Redirect } from "expo-router";
// import { useSelector } from "react-redux";

// export default function Index() {
//   const token = useSelector((state: any) => state.auth.token);

//   if (!token) {
//     return <Redirect href="/auth" />;
//   }

//   return <Redirect href="/(tabs)" />;
// }
