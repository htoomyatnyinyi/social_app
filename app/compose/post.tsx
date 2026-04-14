import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
  Dimensions,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useSelector } from "react-redux";
import {
  useCreatePostMutation,
  useRepostPostMutation,
  useReplyPostMutation,
} from "../../store/postApi";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useTheme } from "../../context/ThemeContext";
import * as Haptics from "expo-haptics";

export default function ComposePostScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { replyToId, replyToName, quoteId, quoteContent, quoteAuthor } =
    useLocalSearchParams();
  const user = useSelector((state: any) => state.auth.user);

  const [content, setContent] = useState("");
  const [images, setImages] = useState<{ uri: string; base64: string }[]>([]);
  const [locationTag, setLocationTag] = useState<string | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  // update
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(
    null,
  );

  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [repostPost, { isLoading: isReposting }] = useRepostPostMutation();
  const [replyPost, { isLoading: isReplying }] = useReplyPostMutation();

  const isLoading =
    isCreating || isReposting || isReplying || isFetchingLocation;

  // Track keyboard to manually handle safe area
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardOpen(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handlePost = async () => {
    if ((!content.trim() && images.length === 0) || isLoading) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const finalContent = locationTag
      ? `${content}\n\n📍 ${locationTag}`
      : content;
    try {
      if (quoteId) {
        await repostPost({
          id: quoteId as string,
          content: finalContent,
          images: images.map((img) => img.base64),
        }).unwrap();
      } else if (replyToId) {
        await replyPost({
          postId: replyToId as string,
          content: finalContent,
        }).unwrap();
      } else {
        await createPost({
          content: finalContent,
          images: images.map((img) => img.base64),
          isPublic: true,
        }).unwrap();
      }
      router.back();
    } catch (e: any) {
      Alert.alert("Error", "Failed to post.", e);
    }
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Media library access is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled) {
      const newImages = result.assets
        .filter((a) => a.base64)
        .map((a) => ({
          uri: a.uri,
          base64: `data:image/jpeg;base64,${a.base64}`,
        }));
      setImages((prev) => [...prev, ...newImages].slice(0, 4));
    }
  };

  const handleTakePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Camera access is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImages((prev) =>
        [
          ...prev,
          {
            uri: result.assets[0].uri,
            base64: `data:image/jpeg;base64,${result.assets[0].base64}`,
          },
        ].slice(0, 4),
      );
    }
  };

  const handleFetchLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode) {
        const city = geocode.city || geocode.region;
        setLocationTag(`${city}, ${geocode.country}`);
      }
    } catch (error: any) {
      Alert.alert("Error", "Could not fetch location.", error);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  return (
    // Outer container MUST be flex-1
    <View style={{ flex: 1, backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }}>
      {/* 1. HEADER (Static) */}
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100/10"
        style={{ paddingTop: insets.top }}
      >
        <TouchableOpacity onPress={() => router.back()} className="px-2">
          <Text className="text-gray-500 font-bold uppercase text-xs">
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handlePost}
          disabled={(!content.trim() && images.length === 0) || isLoading}
          className={`px-8 py-2 rounded-2xl ${(!content.trim() && images.length === 0) || isLoading ? "bg-gray-100" : "bg-sky-500"}`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-black text-xs">POST</Text>
          )}
        </TouchableOpacity>
      </BlurView>

      {/* 2. KEYBOARD AVOIDING VIEW (The logical container) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        // If it's still not pushing, try setting this to a higher number like 100
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View className="p-5 flex-row">
              <View className="mr-4">
                <Image
                  source={{
                    uri:
                      user?.image ||
                      `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.id}`,
                  }}
                  className="w-12 h-12 rounded-2xl bg-gray-200"
                />
              </View>
              <View className="flex-1">
                {replyToName && (
                  <View className="bg-sky-50 dark:bg-sky-900/30 self-start px-3 py-1 rounded-xl mb-3 border border-sky-100/50 dark:border-sky-800/30">
                    <Text className="text-sky-600 dark:text-sky-400 font-bold text-[11px] uppercase tracking-wider">
                      Replying to @{replyToName}
                    </Text>
                  </View>
                )}

                <TextInput
                  autoFocus
                  multiline
                  placeholder={
                    replyToName
                      ? "What are your thoughts?"
                      : quoteId
                        ? "Add your perspective..."
                        : "What's happening?"
                  }
                  placeholderTextColor="#94A3B8"
                  style={{
                    fontSize: 18,
                    minHeight: 150,
                    color: isDark ? "white" : "black",
                  }}
                  value={content}
                  onChangeText={setContent}
                  textAlignVertical="top"
                />

                {/* Quote Post Preview */}
                {quoteId && (
                  <View className="border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 rounded-3xl p-5 mt-2 mb-4 shadow-sm">
                    <View className="flex-row items-center mb-2">
                      <Text className="font-black text-[14px] text-gray-900 dark:text-white tracking-tight">
                        {quoteAuthor}
                      </Text>
                      <Text className="text-sky-500 font-bold text-[10px] ml-2 uppercase tracking-widest">
                        Quote
                      </Text>
                    </View>
                    <Text
                      className="text-gray-500 dark:text-gray-400 font-medium text-[14px] leading-5"
                      numberOfLines={4}
                    >
                      {quoteContent}
                    </Text>
                  </View>
                )}

                {locationTag && (
                  <View className="flex-row items-center mt-2 mb-4 self-start bg-emerald-50 dark:bg-emerald-900/30 rounded-xl px-3 py-1.5 border border-emerald-100/50 dark:border-emerald-800/30">
                    <Ionicons name="location" size={14} color="#10B981" />
                    <Text className="text-emerald-600 dark:text-emerald-400 text-[12px] ml-1.5 font-black uppercase tracking-wider">
                      {locationTag}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setLocationTag(null)}
                      className="ml-3 w-5 h-5 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm"
                    >
                      <Ionicons name="close" size={12} color="#10B981" />
                    </TouchableOpacity>
                  </View>
                )}

                {images.length > 0 && (
                  <View className="flex-row flex-wrap mt-4">
                    {images.map((img, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => setSelectedFullImage(img.uri)}
                        className="relative"
                      >
                        <Image
                          source={{ uri: img.uri }}
                          className="w-20 h-20 rounded-lg m-1"
                        />
                        <TouchableOpacity
                          onPress={() =>
                            setImages((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"
                        >
                          <Ionicons name="close" size={12} color="white" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              {/* Full Screen Image Preview Modal */}
              <Modal
                visible={!!selectedFullImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedFullImage(null)}
              >
                <View style={{ flex: 1, backgroundColor: "black" }}>
                  {/* Close Button */}
                  <TouchableOpacity
                    onPress={() => setSelectedFullImage(null)}
                    style={{
                      position: "absolute",
                      top: insets.top + 10,
                      right: 20,
                      zIndex: 10,
                      padding: 10,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      borderRadius: 20,
                    }}
                  >
                    <Ionicons name="close" size={28} color="white" />
                  </TouchableOpacity>

                  {/* Full Size Image */}
                  <Image
                    source={{ uri: selectedFullImage as any }}
                    style={{ flex: 1 }}
                    contentFit="contain"
                  />
                </View>
              </Modal>
            </View>
          </ScrollView>

          {/* 3. THE DOCK (Sitting as a sibling to ScrollView) */}
          <BlurView
            intensity={95}
            tint={isDark ? "dark" : "light"}
            className="border-t border-gray-100/20"
          >
            <View className="px-5 py-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={handlePickImage}
                  className="w-10 h-10 items-center justify-center rounded-xl bg-gray-50/10 mr-2"
                >
                  <Ionicons name="image-outline" size={20} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleTakePhoto}
                  className="w-10 h-10 items-center justify-center rounded-xl bg-gray-50/10 mr-2"
                >
                  <Ionicons name="camera-outline" size={20} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleFetchLocation}
                  className="w-10 h-10 items-center justify-center rounded-xl bg-gray-50/10"
                >
                  <Ionicons
                    name={locationTag ? "location" : "location-outline"}
                    size={20}
                    color={locationTag ? "#10B981" : "#64748B"}
                  />
                </TouchableOpacity>
              </View>

              <View className="bg-gray-100/10 px-3 py-2 rounded-lg">
                <Text className="text-gray-400 font-bold text-[10px]">
                  PUBLIC
                </Text>
              </View>
            </View>

            {/* Logic: Only add padding when keyboard is CLOSED */}
            {!isKeyboardOpen && (
              <View style={{ height: insets.bottom || 15 }} />
            )}
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// old working one.. do not delete it.
// import React, { useState, useCallback } from "react";
// import {
//   View,
//   TextInput,
//   Text,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter, useLocalSearchParams, router } from "expo-router";
// import * as ImagePicker from "expo-image-picker";
// import * as Location from "expo-location";
// import { useSelector } from "react-redux";
// import {
//   useCreatePostMutation,
//   useRepostPostMutation,
//   useReplyPostMutation,
// } from "../../store/postApi";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { BlurView } from "expo-blur";
// import { Image } from "expo-image";
// import { useTheme } from "../../context/ThemeContext";
// import * as Haptics from "expo-haptics";

// export default function ComposePostScreen() {
//   const insets = useSafeAreaInsets();
//   const { isDark } = useTheme();
//   const { replyToId, replyToName, quoteId, quoteContent, quoteAuthor } =
//     useLocalSearchParams();
//   const user = useSelector((state: any) => state.auth.user);

//   const [content, setContent] = useState("");
//   const [images, setImages] = useState<{ uri: string; base64: string }[]>([]);
//   const [locationTag, setLocationTag] = useState<string | null>(null);
//   const [isFetchingLocation, setIsFetchingLocation] = useState(false);

//   const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
//   const [repostPost, { isLoading: isReposting }] = useRepostPostMutation();
//   const [replyPost, { isLoading: isReplying }] = useReplyPostMutation();

//   const isLoading =
//     isCreating || isReposting || isReplying || isFetchingLocation;

//   const handlePickImage = async () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission denied", "Media library access is required.");
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsMultipleSelection: true,
//       selectionLimit: 4,
//       quality: 0.6,
//       base64: true,
//     });

//     if (!result.canceled) {
//       const newImages = result.assets
//         .filter((a) => a.base64)
//         .map((a) => ({
//           uri: a.uri,
//           base64: `data:image/jpeg;base64,${a.base64}`,
//         }));
//       setImages((prev) => [...prev, ...newImages].slice(0, 4));
//     }
//   };

//   const handleTakePhoto = async () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     const { status } = await ImagePicker.requestCameraPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission denied", "Camera access is required.");
//       return;
//     }

//     const result = await ImagePicker.launchCameraAsync({
//       allowsEditing: true,
//       quality: 0.6,
//       base64: true,
//     });

//     if (!result.canceled && result.assets[0].base64) {
//       setImages((prev) =>
//         [
//           ...prev,
//           {
//             uri: result.assets[0].uri,
//             base64: `data:image/jpeg;base64,${result.assets[0].base64}`,
//           },
//         ].slice(0, 4),
//       );
//     }
//   };

//   const handleFetchLocation = async () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     setIsFetchingLocation(true);
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         Alert.alert("Permission denied", "Location permission is required.");
//         return;
//       }

//       const location = await Location.getCurrentPositionAsync({});
//       const [geocode] = await Location.reverseGeocodeAsync({
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude,
//       });

//       if (geocode) {
//         const city = geocode.city || geocode.region;
//         setLocationTag(`${city}, ${geocode.country}`);
//       }
//     } catch (error) {
//       console.log(error);
//       Alert.alert("Error", "Could not fetch your location.");
//     } finally {
//       setIsFetchingLocation(false);
//     }
//   };

//   const handlePost = async () => {
//     if ((!content.trim() && images.length === 0) || isLoading) return;
//     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

//     const finalContent = locationTag
//       ? `${content}\n\n📍 ${locationTag}`.trim()
//       : content.trim();

//     try {
//       if (quoteId) {
//         await repostPost({
//           id: quoteId as string,
//           content: finalContent,
//           images:
//             images.length > 0 ? images.map((img) => img.base64) : undefined,
//         }).unwrap();
//       } else if (replyToId) {
//         await replyPost({
//           postId: replyToId as string,
//           content: finalContent,
//         }).unwrap();
//       } else {
//         await createPost({
//           content: finalContent,
//           images:
//             images.length > 0 ? images.map((img) => img.base64) : undefined,
//           isPublic: true,
//         }).unwrap();
//       }
//       router.back();
//     } catch (e) {
//       console.log(e);
//       Alert.alert("Error", "Failed to post. Please try again.");
//     }
//   };

//   return (
//     <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
//       {/* Premium Header */}
//       <BlurView
//         intensity={80}
//         tint={isDark ? "dark" : "light"}
//         className={`flex-row items-center justify-between px-5 py-4 border-b ${isDark ? "border-slate-800/50" : "border-gray-100/50"} z-50`}
//         style={{ paddingTop: insets.top }}
//       >
//         <TouchableOpacity
//           onPress={() => {
//             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//             router.back();
//           }}
//           className="px-4 py-2"
//         >
//           <Text className="text-gray-500 font-bold uppercase tracking-widest text-xs">
//             Cancel
//           </Text>
//         </TouchableOpacity>

//         <View className="flex-row items-center">
//           {content.length > 0 && (
//             <View className="mr-5 items-center justify-center">
//               <Text
//                 className={`font-black text-[10px] ${content.length > 250 ? "text-rose-500" : "text-gray-300"}`}
//               >
//                 {400 - content.length}
//               </Text>
//             </View>
//           )}
//           <TouchableOpacity
//             onPress={handlePost}
//             disabled={(!content.trim() && images.length === 0) || isLoading}
//             className={`px-8 py-2.5 rounded-2xl shadow-lg ${
//               (!content.trim() && images.length === 0) || isLoading
//                 ? "bg-gray-100 shadow-none"
//                 : "bg-sky-500 shadow-sky-200"
//             }`}
//           >
//             {isLoading ? (
//               <ActivityIndicator size="small" color="white" />
//             ) : (
//               <Text className="text-white font-black uppercase tracking-widest text-xs">
//                 Post
//               </Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </BlurView>

//       <KeyboardAvoidingView
//         // behavior={Platform.OS === "ios" ? "padding" : "height"}
//         // className="flex-1"

//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         className="flex-1"
//         // keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Adjust if you have a header offset
//       >
//         <ScrollView
//           className="flex-1"
//           keyboardShouldPersistTaps="handled"
//           contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
//         >
//           <View className="p-5 flex-row">
//             {/* Avatar Column */}
//             <View className="items-center mr-4">
//               <View className="shadow-md shadow-sky-100">
//                 <Image
//                   source={{
//                     uri:
//                       user?.image ||
//                       `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.id}`,
//                   }}
//                   className="w-12 h-12 rounded-[20px] bg-white border border-gray-100"
//                   contentFit="cover"
//                 />
//               </View>
//               {replyToId && (
//                 <View className="w-[1.5px] bg-sky-100 flex-1 my-3 rounded-full" />
//               )}
//             </View>

//             {/* Input Column */}
//             <View className="flex-1 pt-1">
//               {replyToName && (
//                 <View className="bg-sky-50 self-start px-3 py-1 rounded-xl mb-3 border border-sky-100/50">
//                   <Text className="text-sky-600 font-bold text-[11px] uppercase tracking-wider">
//                     Replying to @{replyToName}
//                   </Text>
//                 </View>
//               )}

//               <TextInput
//                 autoFocus
//                 multiline
//                 placeholder={
//                   replyToName
//                     ? "What are your thoughts?"
//                     : quoteId
//                       ? "Add your perspective..."
//                       : "What's on your mind?"
//                 }
//                 placeholderTextColor="#94A3B8"
//                 className="text-[18px] leading-7 text-gray-900 dark:text-white font-medium mb-6 min-h-[160px]"
//                 value={content}
//                 onChangeText={setContent}
//                 textAlignVertical="top"
//                 style={{ flexShrink: 1 }}
//               />

//               {/* Extras Row (Location) */}
//               {locationTag && (
//                 <View className="flex-row items-center mb-6 self-start bg-emerald-50 rounded-[14px] px-3 py-1.5 border border-emerald-100/50">
//                   <Ionicons name="location" size={14} color="#10B981" />
//                   <Text className="text-emerald-600 text-[12px] ml-1.5 font-black uppercase tracking-wider">
//                     {locationTag}
//                   </Text>
//                   <TouchableOpacity
//                     onPress={() => {
//                       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//                       setLocationTag(null);
//                     }}
//                     className="ml-3 w-5 h-5 items-center justify-center rounded-full bg-white shadow-sm"
//                   >
//                     <Ionicons name="close" size={12} color="#10B981" />
//                   </TouchableOpacity>
//                 </View>
//               )}

//               {/* Quote Post Preview */}
//               {quoteId && (
//                 <View className="border border-gray-100 bg-white rounded-[32px] p-5 mb-6 shadow-sm shadow-gray-100">
//                   <View className="flex-row items-center mb-2">
//                     <Text className="font-black text-[14px] text-gray-900 tracking-tight">
//                       {quoteAuthor}
//                     </Text>
//                     <Text className="text-sky-500 font-bold text-[10px] ml-2 uppercase tracking-widest">
//                       Quote
//                     </Text>
//                   </View>
//                   <Text
//                     className="text-gray-500 font-medium text-[14px] leading-5"
//                     numberOfLines={4}
//                   >
//                     {quoteContent}
//                   </Text>
//                 </View>
//               )}

//               {/* Image Previews */}
//               {images.length > 0 && (
//                 <ScrollView
//                   horizontal
//                   showsHorizontalScrollIndicator={false}
//                   className="mb-8"
//                 >
//                   {images.map((img, idx) => (
//                     <View
//                       key={idx}
//                       className="relative mr-4 shadow-lg shadow-gray-200"
//                     >
//                       <Image
//                         source={{ uri: img.uri }}
//                         className="w-56 h-64 rounded-[32px] bg-white border border-gray-100"
//                         contentFit="cover"
//                         transition={400}
//                       />
//                       <TouchableOpacity
//                         onPress={() => {
//                           Haptics.impactAsync(
//                             Haptics.ImpactFeedbackStyle.Light,
//                           );
//                           setImages((prev) => prev.filter((_, i) => i !== idx));
//                         }}
//                         className="absolute top-3 right-3 bg-white/90 w-8 h-8 items-center justify-center rounded-full shadow-md"
//                       >
//                         <Ionicons name="close" size={16} color="#64748B" />
//                       </TouchableOpacity>
//                     </View>
//                   ))}
//                 </ScrollView>
//               )}
//             </View>
//           </View>
//         </ScrollView>

//         {/* Premium Tool Dock */}
//         {/* <BlurView
//           intensity={90}
//           tint={isDark ? "dark" : "light"}
//           className="absolute bottom-0 left-0 right-0 border-t border-gray-300"
//           // className="absolute bottom-0 left-0 right-0 border-t border-gray-100/50 bg-white/50"
//         >
//           <View className="px-5 py-4 flex-row items-center justify-between">
//             <View className="flex-row items-center">
//               <TouchableOpacity
//                 onPress={handlePickImage}
//                 className="w-12 h-12 items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-sm mr-3"
//               >
//                 <Ionicons name="image-outline" size={22} color="#64748B" />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 onPress={handleTakePhoto}
//                 className="w-12 h-12 items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-sm mr-3"
//               >
//                 <Ionicons name="camera-outline" size={22} color="#64748B" />
//               </TouchableOpacity>
//               <TouchableOpacity
//                 onPress={handleFetchLocation}
//                 className={`w-12 h-12 items-center justify-center rounded-2xl border shadow-sm ${locationTag ? "bg-emerald-50 border-emerald-100" : "bg-white border-gray-100"}`}
//               >
//                 <Ionicons
//                   name={locationTag ? "location" : "location-outline"}
//                   size={22}
//                   color={locationTag ? "#10B981" : "#64748B"}
//                 />
//               </TouchableOpacity>
//             </View>

//             <TouchableOpacity className="flex-row items-center bg-gray-50 px-4 py-2 rounded-xl">
//               <Ionicons name="earth" size={16} color="#94A3B8" />
//               <Text className="text-gray-400 font-black uppercase tracking-widest text-[10px] ml-2 p-2">
//                 Public Post
//               </Text>
//             </TouchableOpacity>
//           </View>
//           <View style={{ height: Math.max(insets.bottom, 10) }} />
//         </BlurView> */}

//         {/* --- PREMIUM TOOL DOCK --- */}
//         {/* 1. Removed 'absolute bottom-0' so it pushes up with KeyboardAvoidingView */}
//         <BlurView
//           intensity={90}
//           tint={isDark ? "dark" : "light"}
//           className={`border-t ${isDark ? "border-slate-800" : "border-gray-200"}`}
//         >
//           <View className="px-5 py-4 flex-row items-center justify-between">
//             <View className="flex-row items-center">
//               <TouchableOpacity
//                 onPress={handlePickImage}
//                 className={`w-12 h-12 items-center justify-center rounded-2xl border shadow-sm mr-3 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
//               >
//                 <Ionicons
//                   name="image-outline"
//                   size={22}
//                   color={isDark ? "#94A3B8" : "#64748B"}
//                 />
//               </TouchableOpacity>

//               <TouchableOpacity
//                 onPress={handleTakePhoto}
//                 className={`w-12 h-12 items-center justify-center rounded-2xl border shadow-sm mr-3 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
//               >
//                 <Ionicons
//                   name="camera-outline"
//                   size={22}
//                   color={isDark ? "#94A3B8" : "#64748B"}
//                 />
//               </TouchableOpacity>

//               <TouchableOpacity
//                 onPress={handleFetchLocation}
//                 className={`w-12 h-12 items-center justify-center rounded-2xl border shadow-sm ${locationTag ? "bg-emerald-50 border-emerald-100" : isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
//               >
//                 <Ionicons
//                   name={locationTag ? "location" : "location-outline"}
//                   size={22}
//                   color={
//                     locationTag ? "#10B981" : isDark ? "#94A3B8" : "#64748B"
//                   }
//                 />
//               </TouchableOpacity>
//             </View>

//             <TouchableOpacity
//               className={`flex-row items-center px-4 py-2 rounded-xl ${isDark ? "bg-slate-800" : "bg-gray-50"}`}
//             >
//               <Ionicons name="earth" size={16} color="#94A3B8" />
//               <Text className="text-gray-400 font-black uppercase tracking-widest text-[10px] ml-2 p-2">
//                 Public Post
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {/* Only add inset padding when keyboard is NOT visible (handled automatically by KeyboardAvoidingView mostly) */}
//           <View style={{ height: Math.max(insets.bottom, 10) }} />
//         </BlurView>
//       </KeyboardAvoidingView>
//     </View>
//   );
// }
