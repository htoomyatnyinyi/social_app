import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "../../store/authSlice";
import { useUpdateProfileMutation } from "../../store/profileApi";
import { useTheme } from "../../context/ThemeContext";

interface User {
  id: string;
  name: string;
  username: string;
  bio?: string;
  image?: string;
  coverImage?: string;
  location?: string;
  website?: string;
  dob?: string;
}

export default function UpdateProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // Theme Sync
  const isDark = theme?.isDark ?? true;
  const accentColor = theme?.accentColor ?? "#6366F1";

  const user = useSelector((state: any) => state.auth.user) as User | null;
  const token = useSelector((state: any) => state.auth.token);

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [website, setWebsite] = useState(user?.website || "");

  const [dob, setDob] = useState<Date>(
    user?.dob ? new Date(user.dob) : new Date(2000, 0, 1),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [profileImage, setProfileImage] = useState(user?.image || null);
  const [coverImage, setCoverImage] = useState(user?.coverImage || null);

  const [profileBase64, setProfileBase64] = useState<string | null>(null);
  const [coverBase64, setCoverBase64] = useState<string | null>(null);

  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setWebsite(user.website || "");
      if (user.dob) setDob(new Date(user.dob));
      setProfileImage(user.image || null);
      setCoverImage(user.coverImage || null);
    }
  }, [user]);

  const pickImage = async (isCover: boolean = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "We need camera roll permissions to update your visuals.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: isCover ? [16, 9] : [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const uri = result.assets[0].uri;
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;

      if (isCover) {
        setCoverImage(uri);
        setCoverBase64(base64);
      } else {
        setProfileImage(uri);
        setProfileBase64(base64);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim() || !username.trim()) {
      Alert.alert("Incomplete", "Identity and Handle are required.");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updatedUser = await updateProfile({
        name,
        username,
        bio,
        location,
        website,
        dob: dob.toISOString().split("T")[0],
        image: profileBase64 || undefined,
        coverImage: coverBase64 || undefined,
      }).unwrap();

      dispatch(setCredentials({ user: updatedUser, token: token }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      Alert.alert(
        "Failed",
        error?.data?.message || "The universe encountered a glitch.",
      );
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setDob(selectedDate);
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      {/* Zen Header */}
      <BlurView
        intensity={20}
        tint={isDark ? "dark" : "light"}
        className="absolute top-0 left-0 right-0 z-50 flex-row items-center justify-between px-5 h-24"
        style={{ paddingTop: insets.top }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className={`w-10 h-10 items-center justify-center rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100 shadow-sm"}`}
        >
          <Ionicons
            name="close"
            size={20}
            color={isDark ? "#94A3B8" : "#64748B"}
          />
        </TouchableOpacity>

        <Text
          className={`text-sm font-black tracking-widest uppercase ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Refine Profile
        </Text>

        <TouchableOpacity
          onPress={handleUpdate}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading
              ? isDark
                ? "#1E293B"
                : "#F1F5F9"
              : accentColor,
          }}
          className="px-6 py-2.5 rounded-xl shadow-sm"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : (
            <Text className="text-white font-black text-[11px] uppercase tracking-widest">
              Save
            </Text>
          )}
        </TouchableOpacity>
      </BlurView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Banner Edit */}
          <View className="h-56 bg-slate-200 dark:bg-slate-800">
            {coverImage ? (
              <Image
                source={{ uri: coverImage }}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={[accentColor, "#818CF8", "#A5B4FC"]}
                className="w-full h-full opacity-40"
              />
            )}
            <TouchableOpacity
              onPress={() => pickImage(true)}
              className="absolute inset-0 items-center justify-center bg-black/10"
            >
              <View className="bg-white/20 p-4 rounded-full border border-white/30">
                <Ionicons name="camera" size={24} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Profile Photo Edit */}
          <View className="px-5 -mt-16 mb-8">
            <View
              className={`w-32 h-32 rounded-[44px] border-4 ${isDark ? "border-slate-900" : "border-white"} overflow-hidden shadow-2xl`}
            >
              <Image
                source={{
                  uri:
                    profileImage ||
                    "https://api.dicebear.com/7.x/avataaars/png?seed=" +
                      user?.username,
                }}
                className="w-full h-full"
                contentFit="cover"
              />
              <TouchableOpacity
                onPress={() => pickImage(false)}
                className="absolute inset-0 bg-black/20 items-center justify-center"
              >
                <Ionicons name="camera" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View className="px-5 space-y-4 pb-20">
            {[
              {
                label: "Full Identity",
                value: name,
                setter: setName,
                placeholder: "Your Name",
              },
              {
                label: "Unique Handle",
                value: username,
                setter: setUsername,
                placeholder: "@handle",
                autoCap: "none" as const,
              },
              {
                label: "Presence (Location)",
                value: location,
                setter: setLocation,
                placeholder: "City, Country",
              },
              {
                label: "Digital Garden",
                value: website,
                setter: setWebsite,
                placeholder: "https://",
                kbType: "url" as const,
              },
            ].map((field, idx) => (
              <View
                key={idx}
                className={`p-4 rounded-[24px] border mb-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}
              >
                <Text
                  style={{ color: accentColor }}
                  className="text-[9px] font-black uppercase tracking-[2px] mb-2"
                >
                  {field.label}
                </Text>
                <TextInput
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  autoCapitalize={field.autoCap || "sentences"}
                  keyboardType={field.kbType || "default"}
                  placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                  className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                />
              </View>
            ))}

            <View
              className={`p-4 rounded-[24px] border mb-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}
            >
              <Text
                style={{ color: accentColor }}
                className="text-[9px] font-black uppercase tracking-[2px] mb-2"
              >
                Your Story
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                placeholder="A few words about your journey..."
                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                className={`text-sm font-medium min-h-[80px] ${isDark ? "text-white" : "text-slate-900"}`}
                textAlignVertical="top"
              />
            </View>

            <View
              className={`p-4 rounded-[24px] border mb-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}
            >
              <Text
                style={{ color: accentColor }}
                className="text-[9px] font-black uppercase tracking-[2px] mb-2"
              >
                Inception (Birth Date)
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowDatePicker(true);
                }}
                className="flex-row items-center justify-between"
              >
                <Text
                  className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {dob.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={accentColor}
                />
              </TouchableOpacity>

              {showDatePicker && (
                <View className="mt-4 border-t border-slate-800/10 pt-4">
                  <DateTimePicker
                    value={dob}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                  />
                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      className="items-center py-2"
                    >
                      <Text
                        style={{ color: accentColor }}
                        className="font-black uppercase text-[10px] tracking-widest"
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// original code
// import { Ionicons } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import * as Haptics from "expo-haptics";
// import { Image } from "expo-image";
// import * as ImagePicker from "expo-image-picker";
// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useDispatch, useSelector } from "react-redux";
// import { setCredentials } from "../../store/authSlice";
// import { useUpdateProfileMutation } from "../../store/profileApi";

// interface User {
//   id: string;
//   name: string;
//   username: string;
//   bio?: string;
//   image?: string;
//   coverImage?: string;
//   location?: string;
//   website?: string;
//   dob?: string;
// }

// export default function UpdateProfileScreen() {
//   const router = useRouter();
//   const dispatch = useDispatch();
//   const insets = useSafeAreaInsets();
//   const user = useSelector((state: any) => state.auth.user) as User | null;
//   const token = useSelector((state: any) => state.auth.token);

//   const [name, setName] = useState(user?.name || "");
//   const [username, setUsername] = useState(user?.username || "");
//   const [bio, setBio] = useState(user?.bio || "");
//   const [location, setLocation] = useState(user?.location || "");
//   const [website, setWebsite] = useState(user?.website || "");

//   const [dob, setDob] = useState<Date>(
//     user?.dob ? new Date(user.dob) : new Date(2000, 0, 1),
//   );
//   const [showDatePicker, setShowDatePicker] = useState(false);

//   const [profileImage, setProfileImage] = useState(user?.image || null);
//   const [coverImage, setCoverImage] = useState(user?.coverImage || null);

//   const [profileBase64, setProfileBase64] = useState<string | null>(null);
//   const [coverBase64, setCoverBase64] = useState<string | null>(null);

//   const [updateProfile, { isLoading }] = useUpdateProfileMutation();

//   useEffect(() => {
//     if (user) {
//       setName(user.name || "");
//       setUsername(user.username || "");
//       setBio(user.bio || "");
//       setLocation(user.location || "");
//       setWebsite(user.website || "");
//       if (user.dob) setDob(new Date(user.dob));
//       setProfileImage(user.image || null);
//       setCoverImage(user.coverImage || null);
//     }
//   }, [user]);

//   const pickImage = async (isCover: boolean = false) => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

//     if (status !== "granted") {
//       Alert.alert(
//         "Permission denied",
//         "Sorry, we need camera roll permissions to make this work!",
//       );
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ["images"],
//       allowsEditing: true,
//       aspect: isCover ? [16, 9] : [1, 1],
//       quality: 0.5,
//       base64: true,
//     });

//     if (!result.canceled && result.assets[0].base64) {
//       const uri = result.assets[0].uri;
//       const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;

//       if (isCover) {
//         setCoverImage(uri);
//         setCoverBase64(base64);
//       } else {
//         setProfileImage(uri);
//         setProfileBase64(base64);
//       }
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//     }
//   };

//   const handleUpdate = async () => {
//     if (!name.trim()) {
//       Alert.alert(
//         "Error",
//         "Your name is part of your identity. Please provide it.",
//       );
//       return;
//     }
//     if (!username.trim()) {
//       Alert.alert("Error", "Choose a unique username to be found.");
//       return;
//     }

//     try {
//       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//       const updatedUser = await updateProfile({
//         name,
//         username,
//         bio,
//         location,
//         website,
//         dob: dob.toISOString().split("T")[0],
//         image: profileBase64 || undefined,
//         coverImage: coverBase64 || undefined,
//       }).unwrap();

//       dispatch(
//         setCredentials({
//           user: updatedUser,
//           token: token,
//         }),
//       );

//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//       router.back();
//     } catch (error: any) {
//       console.error("Update failed", error);
//       Alert.alert(
//         "Update Failed",
//         error?.data?.message ||
//           "The universe encountered a temporary glitch. Please try again.",
//       );
//     }
//   };

//   const onDateChange = (event: any, selectedDate?: Date) => {
//     if (Platform.OS === "android") setShowDatePicker(false);
//     if (selectedDate) {
//       setDob(selectedDate);
//     }
//   };

//   return (
//     <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
//       {/* Premium Header */}
//       <View
//         style={{ paddingTop: insets.top }}
//         className="bg-white/80 dark:bg-[#0F172A]/80 border-b border-gray-100 dark:border-slate-800 flex-row items-center justify-between px-5 py-4"
//       >
//         <TouchableOpacity
//           onPress={() => router.back()}
//           className="w-10 h-10 items-center justify-center rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
//         >
//           <Ionicons name="close-outline" size={24} color="#64748B" />
//         </TouchableOpacity>
//         <Text className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
//           Refine Profile
//         </Text>
//         <TouchableOpacity
//           onPress={handleUpdate}
//           disabled={isLoading}
//           className={`px-6 py-2.5 rounded-2xl shadow-sm ${isLoading ? "bg-gray-100 dark:bg-slate-700" : "bg-sky-500 shadow-sky-200 dark:shadow-none"}`}
//         >
//           {isLoading ? (
//             <ActivityIndicator size="small" color="#0EA5E9" />
//           ) : (
//             <Text className="text-white font-black text-[13px] uppercase tracking-wider">
//               Save
//             </Text>
//           )}
//         </TouchableOpacity>
//       </View>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         className="flex-1"
//       >
//         <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
//           {/* Banner Edit */}
//           <View className="relative h-48 bg-sky-100 dark:bg-sky-900/30">
//             {coverImage ? (
//               <Image
//                 source={{ uri: coverImage }}
//                 className="w-full h-full"
//                 contentFit="cover"
//                 transition={500}
//               />
//             ) : (
//               <LinearGradient
//                 colors={["#38BDF8", "#0EA5E9"]}
//                 className="w-full h-full opacity-100 dark:opacity-80"
//               />
//             )}
//             <View className="absolute inset-0 items-center justify-center bg-black/10">
//               <TouchableOpacity
//                 onPress={() => pickImage(true)}
//                 className="bg-white/90 dark:bg-slate-800/90 p-4 rounded-3xl shadow-lg border border-white dark:border-slate-700"
//               >
//                 <Ionicons name="camera" size={28} color="#0EA5E9" />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Profile Photo Edit */}
//           <View className="px-5 -mt-14 mb-8">
//             <View className="relative w-28 h-28 shadow-2xl shadow-sky-300 dark:shadow-none">
//               <Image
//                 source={{
//                   uri:
//                     profileImage ||
//                     "https://api.dicebear.com/7.x/avataaars/png?seed=user1",
//                 }}
//                 className="w-28 h-28 rounded-[40px] border-4 border-white dark:border-[#0F172A] bg-white dark:bg-[#0F172A]"
//                 contentFit="cover"
//                 transition={300}
//               />
//               <TouchableOpacity
//                 onPress={() => pickImage(false)}
//                 className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 p-2.5 rounded-2xl shadow-md border border-gray-100 dark:border-slate-700"
//               >
//                 <Ionicons name="camera" size={20} color="#0EA5E9" />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Form Fields */}
//           <View className="px-5 space-y-6">
//             <View className="bg-white mb-1 dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm dark:shadow-none">
//               <Text className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1.5 px-1">
//                 Full Identity
//               </Text>
//               <TextInput
//                 value={name}
//                 onChangeText={setName}
//                 placeholder="What should we call you?"
//                 placeholderTextColor="#94A3B8"
//                 className="w-full px-1 text-[16px] text-gray-900 dark:text-white font-bold"
//               />
//             </View>

//             <View className="bg-white mb-1 dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm dark:shadow-none">
//               <Text className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1.5 px-1">
//                 Unique Handle
//               </Text>
//               <TextInput
//                 value={username}
//                 onChangeText={setUsername}
//                 autoCapitalize="none"
//                 placeholder="@handle"
//                 placeholderTextColor="#94A3B8"
//                 className="w-full px-1 text-[16px] text-gray-900 dark:text-white font-bold"
//               />
//             </View>

//             <View className="bg-white mb-1 dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm dark:shadow-none">
//               <Text className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1.5 px-1">
//                 Your Story (Bio)
//               </Text>
//               <TextInput
//                 value={bio}
//                 onChangeText={setBio}
//                 multiline
//                 placeholder="A few words about your journey..."
//                 placeholderTextColor="#94A3B8"
//                 className="w-full px-1 text-[16px] text-gray-900 dark:text-white font-medium min-h-[80px]"
//                 textAlignVertical="top"
//               />
//             </View>

//             <View className="flex-row space-x-4">
//               <View className="flex-1 bg-white mb-1 dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm dark:shadow-none">
//                 <Text className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1.5 px-1">
//                   Presence (Location)
//                 </Text>
//                 <TextInput
//                   value={location}
//                   onChangeText={setLocation}
//                   placeholder="Where are you?"
//                   placeholderTextColor="#94A3B8"
//                   className="w-full px-1 text-[16px] text-gray-900 dark:text-white font-bold"
//                 />
//               </View>
//             </View>

//             <View className="bg-white mb-1 dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm dark:shadow-none">
//               <Text className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1.5 px-1">
//                 Digital Garden (Website)
//               </Text>
//               <TextInput
//                 value={website}
//                 onChangeText={setWebsite}
//                 autoCapitalize="none"
//                 keyboardType="url"
//                 placeholder="https://yourpage.com"
//                 placeholderTextColor="#94A3B8"
//                 className="w-full px-1 text-[16px] text-gray-900 dark:text-white font-bold"
//               />
//             </View>

//             <View className="bg-white mb-1 dark:bg-slate-800 p-4 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm dark:shadow-none">
//               <Text className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1.5 px-1">
//                 Inception (Birth Date)
//               </Text>
//               <TouchableOpacity
//                 onPress={() => {
//                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//                   setShowDatePicker(true);
//                 }}
//                 className="w-full px-1 py-1 flex-row items-center justify-between"
//               >
//                 <Text className="text-[16px] text-gray-900 dark:text-white font-bold">
//                   {dob.toLocaleDateString("en-US", {
//                     year: "numeric",
//                     month: "long",
//                     day: "numeric",
//                   })}
//                 </Text>
//                 <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
//               </TouchableOpacity>

//               {showDatePicker && (
//                 <View className="mt-2 border-t border-gray-50 dark:border-slate-700 pt-2">
//                   <DateTimePicker
//                     value={dob}
//                     mode="date"
//                     display={Platform.OS === "ios" ? "spinner" : "default"}
//                     onChange={onDateChange}
//                     maximumDate={new Date()}
//                   />
//                   {Platform.OS === "ios" && (
//                     <TouchableOpacity
//                       onPress={() => setShowDatePicker(false)}
//                       className="items-center py-2"
//                     >
//                       <Text className="text-sky-500 font-black uppercase text-xs tracking-widest">
//                         Done
//                       </Text>
//                     </TouchableOpacity>
//                   )}
//                 </View>
//               )}
//             </View>
//           </View>

//           <View className="h-64" />
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </View>
//   );
// }
