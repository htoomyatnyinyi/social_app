import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useVerifyCodeMutation } from "../../store/authApi";

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const [verify, { isLoading }] = useVerifyCodeMutation();
  const { isDark } = useTheme();
  const router = useRouter();

  const handleVerify = async () => {
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (code.length < 6) return setError("Enter the 6-digit code.");

    try {
      await verify({ email, code }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.data?.message || "Verification failed.");
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid
      >
        <Animated.View
          entering={FadeInDown}
          className="items-center pt-20 pb-10"
        >
          <View className="w-24 h-24 bg-black dark:bg-slate-800 rounded-[40px] items-center justify-center mb-8">
            <Ionicons name="mail-open-outline" size={44} color="#0EA5E9" />
          </View>
          <Text className="text-4xl font-black text-gray-900 dark:text-white uppercase">
            Verify
          </Text>
          <Text className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-[4px] mt-4">
            Check your email
          </Text>
        </Animated.View>

        <View className="px-8">
          <View className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[32px] px-6 py-6 shadow-sm mb-8">
            <TextInput
              placeholder="000000"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              className="text-4xl text-gray-900 dark:text-white font-black text-center tracking-[12px]"
              value={code}
              onChangeText={setCode}
            />
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={isLoading}
            className="bg-[#0EA5E9] py-5 rounded-[28px] shadow-xl shadow-sky-200 dark:shadow-none"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-black text-center uppercase tracking-[2px]">
                Confirm Code
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
// import { Ionicons } from "@expo/vector-icons";
// import * as Haptics from "expo-haptics";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import React, { useState } from "react";
// import {
//   Platform,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   ActivityIndicator
// } from "react-native";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import Animated, {
//   FadeInDown,
//   FadeInUp
// } from "react-native-reanimated";
// import { useDispatch } from "react-redux";

// import { useVerifyCodeMutation } from "../../store/authApi";
// import { setCredentials } from "../../store/authSlice";

// export default function VerifyScreen() {
//   const { email } = useLocalSearchParams<{ email: string }>();
//   const [verificationCode, setVerificationCode] = useState("");
//   const [error, setError] = useState("");

//   const [verifyCode, { isLoading }] = useVerifyCodeMutation();

//   const router = useRouter();
//   const dispatch = useDispatch();

//   const handleVerify = async () => {
//     setError("");
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//     if (!verificationCode) {
//       setError("Please enter the 6-digit verification code.");
//       return;
//     }

//     try {
//       const res = await verifyCode({ email, code: verificationCode }).unwrap();
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       dispatch(setCredentials({ user: res.user, token: res.token }));
//       router.replace("/(tabs)");
//     } catch (err: any) {
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//       setError(err.data?.message || "Verification failed. Please check the code.");
//     }
//   };

//   return (
//     <View className="flex-1 bg-[#F8FAFC]">
//       <KeyboardAwareScrollView
//         enableOnAndroid
//         extraScrollHeight={Platform.OS === "ios" ? 20 : 0}
//         keyboardShouldPersistTaps="handled"
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ flexGrow: 1 }}
//       >
//         <Animated.View
//           entering={FadeInDown.duration(1000)}
//           className="items-center px-10 pt-20 pb-10"
//         >
//           <View className="w-24 h-24 bg-white rounded-[40px] items-center justify-center shadow-2xl shadow-sky-200 border border-sky-50 mb-8">
//             <Ionicons name="mail-open-outline" size={48} color="#0EA5E9" />
//           </View>
//           <Text className="text-4xl font-black text-gray-900 tracking-[-2px] uppercase text-center">Verify</Text>
//           <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-[4px] mt-4 text-center">Identity Check</Text>
//         </Animated.View>

//         <View className="px-8 flex-1">
//           <View className="mb-8">
//             <Text className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase">
//               Check Your Email
//             </Text>
//             <Text className="text-gray-400 font-medium text-[13px] uppercase tracking-wider">
//               We sent a verification code to {email || "your inbox"}.
//             </Text>
//           </View>

//           {error ? (
//             <Animated.View
//               entering={FadeInUp}
//               className="bg-rose-50/50 border border-rose-100/50 p-4 rounded-[24px] mb-8 flex-row items-center"
//             >
//               <Ionicons name="alert-circle" size={18} color="#F43F5E" />
//               <Text className="text-[#F43F5E] ml-3 font-bold text-[12px] uppercase tracking-wide flex-1">
//                 {error}
//               </Text>
//             </Animated.View>
//           ) : null}

//           <View className="bg-white border border-gray-100 rounded-[32px] px-6 py-6 flex-row items-center shadow-sm shadow-gray-50 mb-8">
//             <Ionicons name="keypad-outline" size={24} color="#94A3B8" />
//             <TextInput
//               placeholder="000000"
//               placeholderTextColor="#CBD5E1"
//               keyboardType="number-pad"
//               maxLength={6}
//               className="flex-1 ml-4 text-3xl text-gray-900 tracking-[8px] font-black"
//               value={verificationCode}
//               onChangeText={setVerificationCode}
//               autoFocus
//             />
//           </View>

//           <TouchableOpacity
//             onPress={handleVerify}
//             disabled={isLoading}
//             activeOpacity={0.9}
//             className={`py-5 rounded-[28px] items-center mt-10 shadow-xl ${isLoading ? "bg-sky-400/50" : "bg-[#0EA5E9] shadow-sky-200"}`}
//           >
//             {isLoading ? (
//               <ActivityIndicator color="white" size="small" />
//             ) : (
//               <Text className="text-white font-black text-xs uppercase tracking-[3px]">
//                 Verify Code
//               </Text>
//             )}
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={() => router.back()}
//             className="mt-8 mb-10 items-center"
//           >
//             <Text className="text-gray-400 font-black text-[10px] uppercase tracking-widest">
//               Back to Sign Up
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </KeyboardAwareScrollView>
//     </View>
//   );
// }
