import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { useUpdateProfileMutation } from "../../store/profileApi";
import { setCredentials } from "../../store/authSlice";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UpdateProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [image, setImage] = useState(user?.image || null);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
      setImage(user.image || null);
    }
  }, [user]);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Sorry, we need camera roll permissions to make this work!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(result.assets[0].uri);
      // Format specifically for Cloudinary upload logic in backend if it expects data URI
      setBase64Image(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    if (!username.trim()) {
      Alert.alert("Error", "Username cannot be empty");
      return;
    }

    // console.log(base64Image, "base64Image");
    try {
      const updatedUser = await updateProfile({
        name,
        username,
        bio,
        image: base64Image || undefined, // Only send if changed
      }).unwrap();

      dispatch(
        setCredentials({
          user: updatedUser,
          token: token,
        }),
      );
      // Wait, setCredentials in common redux patterns usually requires both.
      // Let's check authSlice below. Ideally we should have an 'updateUser' action.
      // For now, I'll assume we need to re-pass the token or modify authSlice.
      // Given the previous file views, I didn't see an explicit 'updateUser' reducer.
      // Retaining the token is safer.

      router.back();
    } catch (error: any) {
      console.error("Update failed", error);
      Alert.alert(
        "Update Failed",
        error?.data?.message || "Something went wrong not sure",
      );
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      // edges={["bottom", "left", "right"]}
    >
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[17px] text-gray-900">Cancel</Text>
        </TouchableOpacity>
        <Text className="text-[17px] font-bold text-gray-900">
          Edit Profile
        </Text>
        <TouchableOpacity onPress={handleUpdate} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#1d9bf0" />
          ) : (
            <Text className="text-[17px] font-bold text-[#1d9bf0]">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView className="flex-1 px-4 pt-10">
          <View className="items-center mb-8">
            <TouchableOpacity onPress={pickImage} className="relative">
              <Image
                source={{ uri: image || "https://via.placeholder.com/100" }}
                className="w-24 h-24 rounded-full border-4 border-gray-50"
              />
              <View className="absolute bottom-0 right-0 bg-gray-900/60 p-1.5 rounded-full border-2 border-white">
                <Ionicons name="camera-outline" size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text
              className="text-[#1d9bf0] font-medium mt-3"
              onPress={pickImage}
            >
              Change profile photo
            </Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-sm font-medium text-gray-500 mb-1 ml-1">
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[16px] text-gray-900 focus:border-[#1d9bf0]"
                placeholder="Name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-500 mb-1 ml-1">
                Username
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[16px] text-gray-900 focus:border-[#1d9bf0]"
                placeholder="Username"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-500 mb-1 ml-1">
                Bio
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[16px] text-gray-900 focus:border-[#1d9bf0] min-h-[100px] align-top"
                placeholder="Add a bio to your profile"
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
              />
            </View>
          </View>

          <View className="h-20" />
          {/* Spacer for bottom scrolling */}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// // ####################3

// import React, { useState, useEffect, useRef } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
//   Animated,
//   Dimensions,
//   StyleSheet,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { Image } from "expo-image";
// import * as ImagePicker from "expo-image-picker";
// import { LinearGradient } from "expo-linear-gradient";
// import { BlurView } from "expo-blur"; // ← bun add expo-blur
// import { useRouter } from "expo-router";
// import { useSelector, useDispatch } from "react-redux";
// import { useUpdateProfileMutation } from "@/store/profileApi";
// import { setCredentials } from "@/store/authSlice";
// import { SafeAreaView } from "react-native-safe-area-context";

// const { width: SCREEN_WIDTH } = Dimensions.get("window");
// const COVER_HEIGHT = 180;

// interface User {
//   id: string;
//   name: string;
//   username: string;
//   bio?: string;
//   image?: string;
//   coverImage?: string;
// }

// export default function UpdateProfileScreen() {
//   const router = useRouter();
//   const dispatch = useDispatch();
//   const user = useSelector((state: any) => state.auth.user) as User | null;
//   const token = useSelector((state: any) => state.auth.token);

//   const [name, setName] = useState(user?.name || "");
//   const [username, setUsername] = useState(user?.username || "");
//   const [bio, setBio] = useState(user?.bio || "");
//   const [profileImage, setProfileImage] = useState(user?.image || null);
//   const [coverImage, setCoverImage] = useState(user?.coverImage || null);

//   const [profileBase64, setProfileBase64] = useState<string | null>(null);
//   const [coverBase64, setCoverBase64] = useState<string | null>(null);

//   const [updateProfile, { isLoading }] = useUpdateProfileMutation();

//   // Animations
//   const profileScale = useRef(new Animated.Value(1)).current;
//   const labelNameAnim = useRef(new Animated.Value(0)).current;
//   const labelUsernameAnim = useRef(new Animated.Value(0)).current;
//   const labelBioAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     if (user) {
//       setName(user.name || "");
//       setUsername(user.username || "");
//       setBio(user.bio || "");
//       setProfileImage(user.image || null);
//       setCoverImage(user.coverImage || null);
//     }
//   }, [user]);

//   const animateLabel = (anim: Animated.Value, toValue: number) => {
//     Animated.timing(anim, {
//       toValue,
//       duration: 220,
//       useNativeDriver: false,
//     }).start();
//   };

//   const pickImage = async (isCover: boolean = false) => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission Required", "Allow access to photos to continue.");
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: isCover ? [16, 9] : [4, 3],
//       quality: 0.75,
//       base64: true,
//     });

//     if (!result.canceled && result.assets?.[0]?.base64) {
//       const uri = result.assets[0].uri;
//       const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;

//       if (isCover) {
//         setCoverImage(uri);
//         setCoverBase64(base64);
//       } else {
//         setProfileImage(uri);
//         setProfileBase64(base64);
//       }
//     }
//   };

//   const handleSave = async () => {
//     if (!name.trim()) return Alert.alert("Required", "Please enter your name");
//     if (!username.trim())
//       return Alert.alert("Required", "Please choose a username");

//     try {
//       const payload: any = { name, username, bio };
//       if (profileBase64) payload.image = profileBase64;
//       if (coverBase64) payload.coverImage = coverBase64;

//       const updated = await updateProfile(payload).unwrap();
//       dispatch(setCredentials({ user: updated, token }));
//       router.back();
//     } catch (err: any) {
//       Alert.alert("Error", err?.data?.message || "Update failed — try again");
//     }
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
//       {/* Custom Header */}
//       <LinearGradient
//         colors={["#1d9bf0", "#60a5fa"]}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//         className="px-5 pt-4 pb-3"
//       >
//         <View className="flex-row items-center justify-between">
//           <TouchableOpacity onPress={() => router.back()}>
//             <Text className="text-lg text-white font-medium">Cancel</Text>
//           </TouchableOpacity>
//           <Text className="text-xl font-bold text-white tracking-wide">
//             Customize Profile
//           </Text>
//           <TouchableOpacity
//             onPress={handleSave}
//             disabled={isLoading}
//             className="px-6 py-2.5 bg-white/20 rounded-full border border-white/30"
//           >
//             {isLoading ? (
//               <ActivityIndicator size="small" color="white" />
//             ) : (
//               <Text className="text-lg font-semibold text-white">Save</Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </LinearGradient>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         className="flex-1"
//         keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
//       >
//         <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
//           {/* Cover with Glassy overlay */}
//           <View className="relative">
//             <Image
//               source={{
//                 uri:
//                   coverImage ||
//                   "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80", // nice gradient fallback
//               }}
//               style={{ width: "100%", height: COVER_HEIGHT }}
//               contentFit="cover"
//             />
//             <BlurView
//               intensity={60}
//               tint="dark"
//               className="absolute inset-0 justify-center items-center"
//             >
//               <TouchableOpacity onPress={() => pickImage(true)}>
//                 <View className="bg-black/40 p-5 rounded-3xl border border-white/20">
//                   <Ionicons name="image-outline" size={36} color="white" />
//                 </View>
//               </TouchableOpacity>
//             </BlurView>
//             <Text className="absolute bottom-4 right-5 text-white/90 text-sm font-medium bg-black/50 px-4 py-1.5 rounded-full">
//               Edit Cover
//             </Text>
//           </View>

//           {/* Floating asymmetric profile pic */}
//           <View className="items-start px-6 -mt-20 mb-10">
//             <Animated.View
//               style={{
//                 transform: [{ scale: profileScale }],
//               }}
//             >
//               <TouchableOpacity
//                 onPressIn={() =>
//                   Animated.spring(profileScale, {
//                     toValue: 0.92,
//                     useNativeDriver: true,
//                   }).start()
//                 }
//                 onPressOut={() =>
//                   Animated.spring(profileScale, {
//                     toValue: 1,
//                     friction: 4,
//                     useNativeDriver: true,
//                   }).start()
//                 }
//                 onPress={() => pickImage(false)}
//                 className="relative"
//               >
//                 <Image
//                   source={{
//                     uri: profileImage || "https://i.pravatar.cc/300",
//                   }}
//                   className="w-36 h-36 rounded-3xl border-4 border-white shadow-2xl"
//                   contentFit="cover"
//                 />
//                 <View className="absolute -bottom-1 -right-1 bg-gradient-to-br from-[#1d9bf0] to-[#3b82f6] p-3 rounded-2xl border-2 border-white shadow-lg">
//                   <Ionicons name="camera" size={22} color="white" />
//                 </View>
//               </TouchableOpacity>
//             </Animated.View>
//           </View>

//           {/* Glassmorphic form fields */}
//           <View className="px-6 pb-12 space-y-7">
//             {/* Name */}
//             <View className="relative">
//               <Animated.Text
//                 style={[
//                   styles.floatingLabel,
//                   {
//                     top: labelNameAnim.interpolate({
//                       inputRange: [0, 1],
//                       outputRange: [18, -8],
//                     }),
//                     fontSize: labelNameAnim.interpolate({
//                       inputRange: [0, 1],
//                       outputRange: [16, 12],
//                     }),
//                   },
//                 ]}
//               >
//                 Name
//               </Animated.Text>
//               <BlurView
//                 intensity={80}
//                 tint="light"
//                 className="rounded-3xl overflow-hidden border border-white/40 shadow-md"
//               >
//                 <TextInput
//                   value={name}
//                   onChangeText={setName}
//                   placeholder="Your display name"
//                   placeholderTextColor="#a0aec0"
//                   className="px-5 py-5 text-base text-gray-900 bg-white/60"
//                   onFocus={() => animateLabel(labelNameAnim, 1)}
//                   onBlur={() => !name && animateLabel(labelNameAnim, 0)}
//                 />
//               </BlurView>
//             </View>

//             {/* Username */}
//             <View className="relative">
//               <Animated.Text
//                 style={[
//                   styles.floatingLabel,
//                   {
//                     top: labelUsernameAnim.interpolate({
//                       inputRange: [0, 1],
//                       outputRange: [18, -8],
//                     }),
//                     fontSize: labelUsernameAnim.interpolate({
//                       inputRange: [0, 1],
//                       outputRange: [16, 12],
//                     }),
//                   },
//                 ]}
//               >
//                 Username
//               </Animated.Text>
//               <BlurView
//                 intensity={80}
//                 tint="light"
//                 className="rounded-3xl overflow-hidden border border-white/40 shadow-md"
//               >
//                 <TextInput
//                   value={username}
//                   onChangeText={setUsername}
//                   autoCapitalize="none"
//                   placeholder="@yourhandle"
//                   placeholderTextColor="#a0aec0"
//                   className="px-5 py-5 text-base text-gray-900 bg-white/60"
//                   onFocus={() => animateLabel(labelUsernameAnim, 1)}
//                   onBlur={() => !username && animateLabel(labelUsernameAnim, 0)}
//                 />
//               </BlurView>
//             </View>

//             {/* Bio */}
//             <View className="relative">
//               <Animated.Text
//                 style={[
//                   styles.floatingLabel,
//                   {
//                     top: labelBioAnim.interpolate({
//                       inputRange: [0, 1],
//                       outputRange: [18, -8],
//                     }),
//                     fontSize: labelBioAnim.interpolate({
//                       inputRange: [0, 1],
//                       outputRange: [16, 12],
//                     }),
//                   },
//                 ]}
//               >
//                 Bio
//               </Animated.Text>
//               <BlurView
//                 intensity={80}
//                 tint="light"
//                 className="rounded-3xl overflow-hidden border border-white/40 shadow-md"
//               >
//                 <TextInput
//                   value={bio}
//                   onChangeText={setBio}
//                   multiline
//                   numberOfLines={6}
//                   placeholder="Tell your story..."
//                   placeholderTextColor="#a0aec0"
//                   textAlignVertical="top"
//                   className="px-5 py-5 text-base text-gray-900 bg-white/60 min-h-[140px]"
//                   onFocus={() => animateLabel(labelBioAnim, 1)}
//                   onBlur={() => !bio && animateLabel(labelBioAnim, 0)}
//                 />
//               </BlurView>
//             </View>
//           </View>

//           <View className="h-32" />
//         </ScrollView>
//       </KeyboardAvoidingView>

//       {isLoading && (
//         <View className="absolute inset-0 bg-black/50 items-center justify-center">
//           <ActivityIndicator size="large" color="#60a5fa" />
//           <Text className="text-white mt-4 font-medium">
//             Saving your profile...
//           </Text>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   floatingLabel: {
//     position: "absolute",
//     left: 20,
//     color: "#4a5568",
//     fontWeight: "500",
//     zIndex: 1,
//     backgroundColor: "transparent",
//     paddingHorizontal: 4,
//   },
// });
