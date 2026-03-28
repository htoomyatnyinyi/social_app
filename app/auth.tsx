import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  // KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import {
  useSigninMutation,
  useSignupMutation,
  useVerifyCodeMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
} from "../store/authApi";
import { setCredentials } from "../store/authSlice";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState(0); // 0: Sign In, 1: Sign Up, 2: Verify Email
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");

  const [signup, { isLoading: isSignupLoading }] = useSignupMutation();
  const [signin, { isLoading: isSigninLoading }] = useSigninMutation();
  const [verifyCode, { isLoading: isVerifyLoading }] = useVerifyCodeMutation();
  const [reqReset, { isLoading: isReqLoading }] =
    useRequestPasswordResetMutation();
  const [doReset, { isLoading: isResetLoading }] = useResetPasswordMutation();

  const dispatch = useDispatch();
  const router = useRouter();

  const handleAuth = async () => {
    setError("");

    if (activeTab === 0 && (!email || !password)) {
      setError("Please fill in all fields");
      return;
    }
    if (activeTab === 1 && (!email || !password || !name || !username)) {
      setError("Please fill in all fields");
      return;
    }

    try {
      if (activeTab === 0) {
        const res = await signin({ email, password }).unwrap();
        dispatch(setCredentials({ user: res.user, token: res.token }));
        router.replace("/(tabs)");
      } else if (activeTab === 1) {
        await signup({ email, password, name, username }).unwrap();
        setActiveTab(2);
        setError("");
      }
    } catch (err: any) {
      if (err.data?.requiresVerification) {
        setActiveTab(2);
        setError("Please verify your email to continue. We've sent a new OTP.");
      } else {
        setError(
          err.data?.message || "Authentication failed. Please try again.",
        );
      }
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    if (!email) {
      setError("Please enter your email");
      return;
    }
    try {
      await reqReset({ email }).unwrap();
      setActiveTab(4); // Move to Reset form
      setVerificationCode("");
      setPassword("");
    } catch (err: any) {
      setError(err.data?.message || "Failed to request reset.");
    }
  };

  const handleResetPassword = async () => {
    setError("");
    if (!verificationCode || !password) {
      setError("Please enter the code and a new password");
      return;
    }
    try {
      await doReset({
        email,
        token: verificationCode,
        newPassword: password,
      }).unwrap();
      setActiveTab(0); // Go back to login
      setPassword("");
      alert("Password reset successful! Please log in.");
    } catch (err: any) {
      setError(err.data?.message || "Reset failed. Invalid token.");
    }
  };

  const handleVerify = async () => {
    setError("");
    if (!verificationCode) {
      setError("Please enter the verification code");
      return;
    }

    try {
      const res = await verifyCode({ email, code: verificationCode }).unwrap();
      dispatch(setCredentials({ user: res.user, token: res.token }));
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.data?.message || "Verification failed. Invalid code.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
        }}
        // behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="px-8"
        >
          <View className="items-center mt-10 mb-12">
            <View className="w-16 h-16 bg-[#1d9bf0] rounded-2xl items-center justify-center shadow-xl shadow-sky-500/50">
              <Image source={require("../assets/images/icon.png")} style={{ width: 40, height: 40 }} contentFit="contain" />
            </View>
          </View>

          <Text className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            {activeTab === 0 && "Welcome back"}
            {activeTab === 1 && "Create account"}
            {activeTab === 2 && "Verify email"}
            {activeTab === 3 && "Reset password"}
            {activeTab === 4 && "Check your inbox"}
          </Text>
          <Text className="text-gray-500 text-lg mb-10">
            {activeTab === 0 && "See what's happening in the world right now."}
            {activeTab === 1 && "Join the conversation and stay connected."}
            {activeTab === 2 && `We sent a code to ${email || "your email"}.`}
            {activeTab === 3 && "Enter your email to receive a reset code."}
            {activeTab === 4 &&
              `Enter the 6-digit code sent to ${email || "your email"}.`}
          </Text>

          {error ? (
            <View className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-6 flex-row items-center">
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text className="text-red-600 ml-2 font-medium flex-1">
                {error}
              </Text>
            </View>
          ) : null}

          <View className="space-y-4">
            {activeTab === 1 && (
              <>
                <View className="mb-4">
                  <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center">
                    <Ionicons name="person-outline" size={20} color="#6B7280" />
                    <TextInput
                      placeholder="Full Name"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 ml-3 text-lg text-gray-900"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                </View>
                <View className="mb-4">
                  <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center">
                    <Ionicons name="at-outline" size={20} color="#6B7280" />
                    <TextInput
                      placeholder="Username"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                      className="flex-1 ml-3 text-lg text-gray-900"
                      value={username}
                      onChangeText={setUsername}
                    />
                  </View>
                </View>
              </>
            )}

            {(activeTab === 0 || activeTab === 1) && (
              <>
                <View className="mb-4">
                  <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center">
                    <Ionicons name="mail-outline" size={20} color="#6B7280" />
                    <TextInput
                      placeholder="Email address"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      className="flex-1 ml-3 text-lg text-gray-900"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                <View className="mb-8">
                  <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center">
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#6B7280"
                    />
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      className="flex-1 ml-3 text-lg text-gray-900"
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                </View>
              </>
            )}

            {activeTab === 2 && (
              <View className="mb-8">
                <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center">
                  <Ionicons name="keypad-outline" size={20} color="#6B7280" />
                  <TextInput
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    className="flex-1 ml-3 text-lg text-gray-900 tracking-widest font-bold"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                  />
                </View>
              </View>
            )}

            {activeTab === 3 && (
              <View className="mb-4">
                <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center">
                  <Ionicons name="mail-outline" size={20} color="#6B7280" />
                  <TextInput
                    placeholder="Email address"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="flex-1 ml-3 text-lg text-gray-900"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>
            )}

            {activeTab === 4 && (
              <>
                <View className="mb-4">
                  <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center">
                    <Ionicons name="keypad-outline" size={20} color="#6B7280" />
                    <TextInput
                      placeholder="Enter 6-digit reset code"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      maxLength={6}
                      className="flex-1 ml-3 text-lg text-gray-900 tracking-widest font-bold"
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                    />
                  </View>
                </View>
                <View className="mb-8">
                  <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center">
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#6B7280"
                    />
                    <TextInput
                      placeholder="New Password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      className="flex-1 ml-3 text-lg text-gray-900"
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity
            onPress={
              activeTab === 2
                ? handleVerify
                : activeTab === 3
                  ? handleForgotPassword
                  : activeTab === 4
                    ? handleResetPassword
                    : handleAuth
            }
            disabled={
              isSignupLoading ||
              isSigninLoading ||
              isVerifyLoading ||
              isReqLoading ||
              isResetLoading
            }
            activeOpacity={0.8}
            className={`py-4 rounded-2xl items-center shadow-lg shadow-sky-500/30 mt-4 ${
              isSignupLoading ||
              isSigninLoading ||
              isVerifyLoading ||
              isReqLoading ||
              isResetLoading
                ? "bg-sky-400"
                : "bg-[#1d9bf0]"
            }`}
          >
            <Text className="text-white font-bold text-xl">
              {activeTab === 0 && "Sign In"}
              {activeTab === 1 && "Get Started"}
              {activeTab === 2 && "Verify & Continue"}
              {activeTab === 3 && "Send Reset Link"}
              {activeTab === 4 && "Reset Password"}
            </Text>
          </TouchableOpacity>

          {activeTab === 0 && (
            <TouchableOpacity
              onPress={() => {
                setActiveTab(3);
                setError("");
              }}
              className="mt-5 mb-2 items-center"
            >
              <Text className="text-[#1d9bf0] font-semibold text-base">
                Forgot password?
              </Text>
            </TouchableOpacity>
          )}

          {(activeTab === 0 || activeTab === 1) && (
            <View className="flex-row justify-center mt-8">
              <Text className="text-gray-500 text-base">
                {activeTab === 0
                  ? "New to the platform? "
                  : "Already have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setActiveTab(activeTab === 0 ? 1 : 0);
                  setError("");
                }}
              >
                <Text className="text-[#1d9bf0] font-bold text-base">
                  {activeTab === 0 ? "Sign up" : "Log in"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab >= 2 && (
            <TouchableOpacity
              className="mt-6 items-center"
              onPress={() => setActiveTab(activeTab === 2 ? 1 : 0)}
            >
              <Text className="text-gray-500 font-medium">
                Change email or resend code
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
// import { Ionicons } from "@expo/vector-icons";
// import { Image } from "expo-image";
// import { useRouter } from "expo-router";
// import { useState } from "react";
// import {
//   Dimensions,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useDispatch } from "react-redux";
// import {
//   useSigninMutation,
//   useSignupMutation,
//   useGoogleAuthMutation,
//   useVerifyCodeMutation,
// } from "../store/authApi";
// import { setCredentials } from "../store/authSlice";
// import {
//   GoogleSignin,
//   statusCodes,
// } from "@react-native-google-signin/google-signin";

// // const { width } = Dimensions.get("window");

// GoogleSignin.configure({
//   webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
//   iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
// });

// export default function AuthScreen() {
//   const [activeTab, setActiveTab] = useState(0); // 0: Sign In, 1: Sign Up, 2: Verify Email
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [name, setName] = useState("");
//   const [username, setUsername] = useState("");
//   const [verificationCode, setVerificationCode] = useState("");
//   const [error, setError] = useState("");

//   const [signup, { isLoading: isSignupLoading }] = useSignupMutation();
//   const [signin, { isLoading: isSigninLoading }] = useSigninMutation();
//   const [googleAuth, { isLoading: isGoogleLoading }] = useGoogleAuthMutation();
//   const [verifyCode, { isLoading: isVerifyLoading }] = useVerifyCodeMutation();

//   const dispatch = useDispatch();
//   const router = useRouter();

//   const handleGoogleSignIn = async () => {
//     try {
//       await GoogleSignin.hasPlayServices();
//       const userInfo = await GoogleSignin.signIn();
//       if (userInfo.data?.idToken) {
//         const res = await googleAuth({
//           idToken: userInfo.data.idToken,
//         }).unwrap();
//         dispatch(setCredentials({ user: res.user, token: res.token }));
//         router.replace("/(tabs)");
//       }
//     } catch (error: any) {
//       if (error.code === statusCodes.SIGN_IN_CANCELLED) {
//         // user cancelled the login flow
//       } else if (error.code === statusCodes.IN_PROGRESS) {
//         // operation (e.g. sign in) is in progress already
//       } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
//         setError("Play services not available");
//       } else {
//         setError(error.message || "Google Sign-In failed.");
//       }
//     }
//   };

//   const handleAuth = async () => {
//     setError("");

//     // Validate Sign In and Sign Up fields
//     if (activeTab === 0 && (!email || !password)) {
//       setError("Please fill in all fields");
//       return;
//     }
//     if (activeTab === 1 && (!email || !password || !name || !username)) {
//       setError("Please fill in all fields");
//       return;
//     }

//     try {
//       if (activeTab === 0) {
//         // Sign In Flow
//         const res = await signin({ email, password }).unwrap();
//         dispatch(setCredentials({ user: res.user, token: res.token }));
//         router.replace("/(tabs)");
//       } else if (activeTab === 1) {
//         // Sign Up Flow - After signup, go to verification step instead of logging in
//         await signup({ email, password, name, username }).unwrap();
//         // Move to the verification tab
//         setActiveTab(2);
//         setError(""); // Clear any previous errors
//       }
//     } catch (err: any) {
//       setError(err.data?.message || "Authentication failed. Please try again.");
//     }
//   };

//   const handleVerify = async () => {
//     setError("");
//     if (!verificationCode) {
//       setError("Please enter the verification code");
//       return;
//     }

//     try {
//       // TODO: Replace with your actual verification API call
//       const res = await verifyCode({ email, code: verificationCode }).unwrap();
//       dispatch(setCredentials({ user: res.user, token: res.token }));

//       console.log("Verified code:", verificationCode);
//       router.replace("/(tabs)");
//     } catch (err: any) {
//       setError(err.data?.message || "Verification failed. Invalid code.");
//     }
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         className="flex-1"
//       >
//         <ScrollView
//           contentContainerStyle={{
//             flexGrow: 1,
//             justifyContent: "center",
//             paddingBottom: 40,
//           }}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//           className="px-8"
//         >
//           <View className="items-center mt-10 mb-12">
//             <View className="w-16 h-16 bg-[#1d9bf0] rounded-2xl items-center justify-center shadow-xl shadow-sky-500/50">
//               {/* If you want to use the vector icon instead, uncomment below: */}
//               {/* <Ionicons name="logo-twitter" size={40} color="white" /> */}

//               {/* Added explicit sizing and contentFit to make the image visible */}
//               <Image
//                 // source={require("../assets/images/icon.png")}
//                 style={{ width: 40, height: 40 }}
//                 contentFit="contain"
//               />
//             </View>
//           </View>

//           <Text className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
//             {activeTab === 0 && "Welcome back"}
//             {activeTab === 1 && "Create account"}
//             {activeTab === 2 && "Verify email"}
//           </Text>
//           <Text className="text-gray-500 text-lg mb-10">
//             {activeTab === 0 && "See what's happening in the world right now."}
//             {activeTab === 1 && "Join the conversation and stay connected."}
//             {activeTab === 2 && `We sent a code to ${email || "your email"}.`}
//           </Text>

//           {error ? (
//             <View className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-6 flex-row items-center">
//               <Ionicons name="alert-circle" size={20} color="#EF4444" />
//               <Text className="text-red-600 ml-2 font-medium flex-1">
//                 {error}
//               </Text>
//             </View>
//           ) : null}

//           <View className="space-y-4">
//             {/* SIGN UP FIELDS */}
//             {activeTab === 1 && (
//               <>
//                 <View className="mb-4">
//                   <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 focus:border-[#1d9bf0] flex-row items-center">
//                     <Ionicons name="person-outline" size={20} color="#6B7280" />
//                     <TextInput
//                       placeholder="Full Name"
//                       placeholderTextColor="#9CA3AF"
//                       className="flex-1 ml-3 text-lg text-gray-900"
//                       value={name}
//                       onChangeText={setName}
//                     />
//                   </View>
//                 </View>
//                 <View className="mb-4">
//                   <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 focus:border-[#1d9bf0] flex-row items-center">
//                     <Ionicons name="at-outline" size={20} color="#6B7280" />
//                     <TextInput
//                       placeholder="Username"
//                       placeholderTextColor="#9CA3AF"
//                       autoCapitalize="none"
//                       className="flex-1 ml-3 text-lg text-gray-900"
//                       value={username}
//                       onChangeText={setUsername}
//                     />
//                   </View>
//                 </View>
//               </>
//             )}

//             {/* EMAIL & PASSWORD FIELDS (Used in both Sign In and Sign Up) */}
//             {(activeTab === 0 || activeTab === 1) && (
//               <>
//                 <View className="mb-4">
//                   <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center">
//                     <Ionicons name="mail-outline" size={20} color="#6B7280" />
//                     <TextInput
//                       placeholder="Email address"
//                       placeholderTextColor="#9CA3AF"
//                       autoCapitalize="none"
//                       keyboardType="email-address"
//                       className="flex-1 ml-3 text-lg text-gray-900"
//                       value={email}
//                       onChangeText={setEmail}
//                     />
//                   </View>
//                 </View>

//                 <View className="mb-8">
//                   <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center">
//                     <Ionicons
//                       name="lock-closed-outline"
//                       size={20}
//                       color="#6B7280"
//                     />
//                     <TextInput
//                       placeholder="Password"
//                       placeholderTextColor="#9CA3AF"
//                       secureTextEntry
//                       className="flex-1 ml-3 text-lg text-gray-900"
//                       value={password}
//                       onChangeText={setPassword}
//                     />
//                   </View>
//                 </View>
//               </>
//             )}

//             {/* VERIFICATION CODE FIELD */}
//             {activeTab === 2 && (
//               <View className="mb-8">
//                 <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 flex-row items-center">
//                   <Ionicons name="keypad-outline" size={20} color="#6B7280" />
//                   <TextInput
//                     placeholder="Enter 6-digit code"
//                     placeholderTextColor="#9CA3AF"
//                     keyboardType="number-pad"
//                     maxLength={6}
//                     className="flex-1 ml-3 text-lg text-gray-900 tracking-widest font-bold"
//                     value={verificationCode}
//                     onChangeText={setVerificationCode}
//                   />
//                 </View>
//               </View>
//             )}
//           </View>

//           {/* GOOGLE LOG IN */}
//           {activeTab !== 2 && (
//             <>
//               <TouchableOpacity
//                 onPress={handleGoogleSignIn}
//                 disabled={isGoogleLoading}
//                 activeOpacity={0.8}
//                 className="py-4 rounded-2xl items-center border border-gray-200 bg-white flex-row justify-center mb-4 shadow-sm relative"
//               >
//                 <Ionicons
//                   name="logo-google"
//                   size={24}
//                   color="#DB4437"
//                   style={{ position: "absolute", left: 24 }}
//                 />
//                 <Text className="text-gray-700 font-bold text-lg">
//                   Continue with Google
//                 </Text>
//               </TouchableOpacity>

//               <View className="flex-row items-center my-4">
//                 <View className="flex-1 h-px bg-gray-200" />
//                 <Text className="text-gray-400 font-semibold px-4">OR</Text>
//                 <View className="flex-1 h-px bg-gray-200" />
//               </View>
//             </>
//           )}

//           {/* ACTION BUTTON */}
//           <TouchableOpacity
//             onPress={activeTab === 2 ? handleVerify : handleAuth}
//             disabled={isSignupLoading || isSigninLoading || isVerifyLoading}
//             activeOpacity={0.8}
//             className={`py-4 rounded-2xl items-center shadow-lg shadow-sky-500/30 mt-4 ${
//               isSignupLoading || isSigninLoading || isVerifyLoading
//                 ? "bg-sky-400"
//                 : "bg-[#1d9bf0]"
//             }`}
//           >
//             <Text className="text-white font-bold text-xl">
//               {activeTab === 0 && "Sign In"}
//               {activeTab === 1 && "Get Started"}
//               {activeTab === 2 && "Verify & Continue"}
//             </Text>
//           </TouchableOpacity>

//           {/* FOOTER NAVIGATION */}
//           {activeTab !== 2 && (
//             <View className="flex-row justify-center mt-8">
//               <Text className="text-gray-500 text-base">
//                 {activeTab === 0
//                   ? "New to the platform? "
//                   : "Already have an account? "}
//               </Text>
//               <TouchableOpacity
//                 onPress={() => {
//                   setActiveTab(activeTab === 0 ? 1 : 0);
//                   setError("");
//                 }}
//               >
//                 <Text className="text-[#1d9bf0] font-bold text-base">
//                   {activeTab === 0 ? "Sign up" : "Log in"}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           {/* BACK TO SIGN UP (From Verify Tab) */}
//           {activeTab === 2 && (
//             <TouchableOpacity
//               className="mt-6 items-center"
//               onPress={() => setActiveTab(1)}
//             >
//               <Text className="text-gray-500 font-medium">
//                 Change email or resend code
//               </Text>
//             </TouchableOpacity>
//           )}
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }
