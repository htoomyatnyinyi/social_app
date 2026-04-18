import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useTheme } from "../../context/ThemeContext";
import { useResetPasswordMutation } from "../../store/authApi";

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const { isDark, accentColor } = useTheme();
  const router = useRouter();

  const handleReset = async () => {
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (code.length < 6 || !newPassword) {
      setError("Please enter the security key and a new password.");
      return;
    }

    try {
      await resetPassword({ email, token: code, newPassword }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccessModal(true);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.data?.message || "Invalid or expired security key.");
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <KeyboardAwareScrollView
        enableOnAndroid
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Animated.View
          entering={FadeInDown}
          className="items-center pt-20 pb-10"
        >
          <View className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[40px] items-center justify-center mb-8 border border-sky-50 dark:border-slate-700 shadow-xl shadow-sky-50 dark:shadow-none">
            <Ionicons name="key-outline" size={44} color="#0EA5E9" />
          </View>
          <Text className="text-4xl font-black text-gray-900 dark:text-white uppercase">
            Reset
          </Text>
          <Text className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-[4px] mt-4">
            Security Verification
          </Text>
        </Animated.View>

        <View className="px-8 flex-1">
          <Text className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase">
            New Password
          </Text>
          <Text className="text-gray-400 dark:text-slate-500 font-medium text-[13px] uppercase mb-8">
            Verifying identity for {email}
          </Text>

          {error && (
            <Animated.View
              entering={FadeInUp}
              className="bg-rose-50/50 dark:bg-rose-900/20 p-4 rounded-[24px] mb-8 flex-row items-center"
            >
              <Ionicons name="alert-circle" size={18} color="#F43F5E" />
              <Text className="text-[#F43F5E] font-bold text-[12px] uppercase flex-1 ml-3">
                {error}
              </Text>
            </Animated.View>
          )}

          <View className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[24px] px-6 py-2 flex-row items-center mb-4 shadow-sm dark:shadow-none">
            <TextInput
              placeholder="000000"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              maxLength={6}
              className="flex-1 text-3xl text-gray-900 dark:text-white font-black tracking-[12px] text-center"
              value={code}
              onChangeText={setCode}
            />
          </View>

          <View className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[24px] px-6 py-2 flex-row items-center mb-10 shadow-sm dark:shadow-none">
            <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
            <TextInput
              placeholder="Create New Password"
              placeholderTextColor="#64748B"
              secureTextEntry={!showPassword}
              className="flex-1 ml-4 text-[16px] text-gray-900 dark:text-white font-medium"
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleReset}
            disabled={isLoading}
            className="bg-[#0EA5E9] py-5 rounded-[28px] items-center shadow-lg shadow-sky-200 dark:shadow-none"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-black text-xs uppercase tracking-[3px]">
                Restore Access
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* --- SUCCESS MODAL --- */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View className="flex-1 items-center justify-center px-6">
          <BlurView
            intensity={Platform.OS === "ios" ? 30 : 100}
            tint={isDark ? "dark" : "light"}
            className="absolute inset-0"
          />

          <Animated.View
            entering={FadeInDown.springify()}
            className="w-full bg-white dark:bg-slate-900 rounded-[40px] p-8 items-center border border-gray-100 dark:border-slate-800 shadow-2xl"
          >
            <View className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full items-center justify-center mb-6">
              <Ionicons name="checkmark-circle" size={50} color="#10B981" />
            </View>

            <Text className="text-2xl font-black text-gray-900 dark:text-white uppercase text-center mb-2">
              Access Restored
            </Text>

            <Text className="text-gray-500 dark:text-slate-400 text-center font-medium text-[14px] leading-5 mb-8">
              Your security credentials have been updated. You can now sign in
              with your new password.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                router.replace("/auth");
              }}
              className="bg-[#0EA5E9] w-full py-5 rounded-[24px] items-center"
            >
              <Text className="text-white font-black text-xs uppercase tracking-[2px]">
                Sign In Now
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
// v1
// import { Ionicons } from "@expo/vector-icons";
// import * as Haptics from "expo-haptics";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import React, { useState } from "react";
// import {
//   Platform,
//   Alert,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   ActivityIndicator,
// } from "react-native";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import Animated, { FadeInDown } from "react-native-reanimated";
// import { useTheme } from "../../context/ThemeContext";
// import { useResetPasswordMutation } from "../../store/authApi";

// export default function ResetPasswordScreen() {
//   const { email } = useLocalSearchParams<{ email: string }>();
//   const { isDark } = useTheme();
//   const [code, setCode] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState("");

//   const [doReset, { isLoading }] = useResetPasswordMutation();
//   const router = useRouter();

//   const handleReset = async () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//     if (code.length < 6 || !password) return setError("Fill all fields.");
//     try {
//       await doReset({ email, token: code, newPassword: password }).unwrap();
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       Alert.alert("Success", "Password updated.", [
//         { text: "Login", onPress: () => router.replace("/auth") },
//       ]);
//     } catch (err: any) {
//       setError(err.data?.message || "Reset failed.");
//     }
//   };

//   return (
//     <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] px-8">
//       <KeyboardAwareScrollView>
//         <Animated.View
//           entering={FadeInDown}
//           className="items-center pt-20 mb-10"
//         >
//           <View className="w-24 h-24 bg-slate-800 rounded-[40px] items-center justify-center mb-6">
//             <Ionicons name="shield-checkmark" size={44} color="#0EA5E9" />
//           </View>
//           <Text className="text-4xl font-black dark:text-white uppercase">
//             Reset
//           </Text>
//         </Animated.View>

//         <View className="bg-slate-800 rounded-[24px] px-6 py-4 mb-4">
//           <TextInput
//             placeholder="000000"
//             placeholderTextColor="#64748B"
//             keyboardType="number-pad"
//             maxLength={6}
//             className="text-2xl text-white tracking-[10px] font-black text-center"
//             value={code}
//             onChangeText={setCode}
//           />
//         </View>

//         <View className="bg-slate-800 rounded-[24px] px-6 py-4 flex-row items-center mb-8">
//           <TextInput
//             placeholder="New Password"
//             placeholderTextColor="#64748B"
//             secureTextEntry={!showPassword}
//             className="flex-1 text-white font-medium"
//             value={password}
//             onChangeText={setPassword}
//           />
//           <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
//             <Ionicons
//               name={showPassword ? "eye-off" : "eye"}
//               size={20}
//               color="#94A3B8"
//             />
//           </TouchableOpacity>
//         </View>

//         <TouchableOpacity
//           onPress={handleReset}
//           disabled={isLoading}
//           className="bg-[#0EA5E9] py-5 rounded-[28px]"
//         >
//           {isLoading ? (
//             <ActivityIndicator color="white" />
//           ) : (
//             <Text className="text-white font-black text-center uppercase tracking-[3px]">
//               Update Password
//             </Text>
//           )}
//         </TouchableOpacity>
//       </KeyboardAwareScrollView>
//     </View>
//   );
// }
// // import { Ionicons } from "@expo/vector-icons";
// // import * as Haptics from "expo-haptics";
// // import { useRouter, useLocalSearchParams } from "expo-router";
// // import React, { useState } from "react";
// // import {
// //   Platform,
// //   Alert,
// //   Text,
// //   TextInput,
// //   TouchableOpacity,
// //   View,
// // } from "react-native";
// // import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// // import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

// // import { useResetPasswordMutation } from "../../store/authApi";

// // export default function ResetPasswordScreen() {
// //   const { email } = useLocalSearchParams<{ email: string }>();
// //   const [verificationCode, setVerificationCode] = useState("");
// //   const [password, setPassword] = useState("");
// //   const [error, setError] = useState("");

// //   const [doReset, { isLoading }] = useResetPasswordMutation();

// //   const router = useRouter();

// //   const handleResetPassword = async () => {
// //     setError("");
// //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
// //     if (!verificationCode || !password) {
// //       setError("Enter the code and your new password.");
// //       return;
// //     }
// //     try {
// //       await doReset({
// //         email,
// //         token: verificationCode,
// //         newPassword: password,
// //       }).unwrap();
// //       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
// //       Alert.alert(
// //         "Password Updated",
// //         "Your password has been reset. Please sign in now.",
// //       );
// //       router.replace("/auth");
// //     } catch (err: any) {
// //       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
// //       setError(
// //         err.data?.message || "Failed to reset password. Please try again.",
// //       );
// //     }
// //   };

// //   return (
// //     <View className="flex-1 bg-[#F8FAFC]">
// //       <KeyboardAwareScrollView
// //         enableOnAndroid
// //         extraScrollHeight={Platform.OS === "ios" ? 20 : 0}
// //         keyboardShouldPersistTaps="handled"
// //         showsVerticalScrollIndicator={false}
// //         contentContainerStyle={{ flexGrow: 1 }}
// //       >
// //         <Animated.View
// //           entering={FadeInDown.duration(1000)}
// //           className="items-center px-10 pt-20 pb-10"
// //         >
// //           <View className="w-24 h-24 bg-white rounded-[40px] items-center justify-center shadow-2xl shadow-sky-200 border border-sky-50 mb-8">
// //             <Ionicons name="lock-open-outline" size={48} color="#0EA5E9" />
// //           </View>
// //           <Text className="text-4xl font-black text-gray-900 tracking-[-2px] uppercase text-center">
// //             Update
// //           </Text>
// //           <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-[4px] mt-4 text-center">
// //             New Credentials
// //           </Text>
// //         </Animated.View>

// //         <View className="px-8 flex-1">
// //           <View className="mb-8">
// //             <Text className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase">
// //               Reset Password
// //             </Text>
// //             <Text className="text-gray-400 font-medium text-[13px] uppercase tracking-wider">
// //               Enter the verification code sent to your email.
// //             </Text>
// //           </View>

// //           {error ? (
// //             <Animated.View
// //               entering={FadeInUp}
// //               className="bg-rose-50/50 border border-rose-100/50 p-4 rounded-[24px] mb-8 flex-row items-center"
// //             >
// //               <Ionicons name="alert-circle" size={18} color="#F43F5E" />
// //               <Text className="text-[#F43F5E] ml-3 font-bold text-[12px] uppercase tracking-wide flex-1">
// //                 {error}
// //               </Text>
// //             </Animated.View>
// //           ) : null}

// //           <View className="space-y-4">
// //             <View className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50 mb-4">
// //               <Ionicons name="keypad-outline" size={20} color="#94A3B8" />
// //               <TextInput
// //                 placeholder="6-Digit Code"
// //                 placeholderTextColor="#CBD5E1"
// //                 keyboardType="number-pad"
// //                 maxLength={6}
// //                 className="flex-1 ml-4 text-2xl text-gray-900 tracking-[8px] font-black"
// //                 value={verificationCode}
// //                 onChangeText={setVerificationCode}
// //               />
// //             </View>

// //             <View className="bg-white border border-gray-100 rounded-[24px] px-6 py-4 flex-row items-center shadow-sm shadow-gray-50 mb-8">
// //               <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
// //               <TextInput
// //                 placeholder="New Password"
// //                 placeholderTextColor="#CBD5E1"
// //                 secureTextEntry
// //                 className="flex-1 ml-4 text-[16px] text-gray-900 font-medium"
// //                 value={password}
// //                 onChangeText={setPassword}
// //               />
// //             </View>
// //           </View>

// //           <TouchableOpacity
// //             onPress={handleResetPassword}
// //             disabled={isLoading}
// //             activeOpacity={0.9}
// //             className={`py-5 rounded-[28px] items-center mt-10 shadow-xl ${isLoading ? "bg-sky-400" : "bg-[#0EA5E9] shadow-sky-200"}`}
// //           >
// //             <Text className="text-white font-black text-xs uppercase tracking-[3px]">
// //               Set New Password
// //             </Text>
// //           </TouchableOpacity>

// //           <TouchableOpacity
// //             onPress={() => router.replace("/auth")}
// //             className="mt-8 mb-10 items-center"
// //           >
// //             <Text className="text-gray-400 font-black text-[10px] uppercase tracking-widest">
// //               Return to Sign In
// //             </Text>
// //           </TouchableOpacity>
// //         </View>
// //       </KeyboardAwareScrollView>
// //     </View>
// //   );
// // }
