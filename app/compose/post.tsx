import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useSelector } from "react-redux";
import {
  useCreatePostMutation,
  useRepostPostMutation,
  useCommentPostMutation,
} from "../../store/postApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements"; // Using this helps calculate exact header offsets

export default function ComposePostScreen() {
  const router = useRouter();

  // For precise keyboard offset calculation if you are using a navigation header
  const headerHeight = useHeaderHeight();

  const {
    replyToId,
    parentId,
    replyToName,
    quoteId,
    quoteContent,
    quoteAuthor,
  } = useLocalSearchParams();
  const user = useSelector((state: any) => state.auth.user);

  const [content, setContent] = useState("");
  const [images, setImages] = useState<{uri: string, base64: string}[]>([]);
  const [locationTag, setLocationTag] = useState<string | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [repostPost, { isLoading: isReposting }] = useRepostPostMutation();
  const [commentPost, { isLoading: isCommenting }] = useCommentPostMutation();

  const isLoading =
    isCreating || isReposting || isCommenting || isFetchingLocation;

  const pickImage = async () => {
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

  const takePhoto = async () => {
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
      setImages((prev) => [
        ...prev,
        {
          uri: result.assets[0].uri,
          base64: `data:image/jpeg;base64,${result.assets[0].base64}`,
        },
      ].slice(0, 4));
    }
  };

  const fetchLocation = async () => {
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
    } catch (error) {
      Alert.alert("Error", "Could not fetch your location.");
      console.error("Location Error", error);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) return;

    const finalContent = locationTag
      ? `${content}\n\n📍 ${locationTag}`.trim()
      : content.trim();

    try {
      if (quoteId) {
        await repostPost({
          id: quoteId as string,
          content: finalContent,
          images: images.length > 0 ? images.map((img) => img.base64) : undefined,
        }).unwrap();
      } else if (replyToId) {
        await commentPost({
          id: replyToId as string,
          parentId: parentId as string,
          content: finalContent,
        }).unwrap();
      } else {
        await createPost({
          content: finalContent,
          images: images.length > 0 ? images.map((img) => img.base64) : undefined,
          isPublic: true,
        }).unwrap();
      }
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to post. Please try again.");
      console.error("Post Error", e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-50">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[16px] text-gray-700">Cancel</Text>
        </TouchableOpacity>

        <View className="flex-row items-center">
          {content.length > 0 && (
            <Text
              className={`mr-4 text-xs ${content.length > 250 ? "text-red-500" : "text-gray-400"}`}
            >
              {280 - content.length}
            </Text>
          )}
          <TouchableOpacity
            onPress={handlePost}
            disabled={(!content.trim() && images.length === 0) || isLoading}
            className={`px-6 py-1.5 rounded-full ${
              (!content.trim() && images.length === 0) || isLoading
                ? "bg-sky-200"
                : "bg-[#1d9bf0]"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-bold text-[15px]">Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        // Adding the headerHeight ensures exact calculation if a navigation bar exists above
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight || 40 : 0}
        className="flex-1 flex-col"
      >
        <ScrollView
          className="flex-1 px-4 pt-4"
          keyboardShouldPersistTaps="handled"
          // flexGrow ensures the scrollview expands, and paddingBottom gives a bit of breathing room
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        >
          <View className="flex-row flex-1">
            {/* Left Column: Avatar + Thread Line */}
            <View className="items-center mr-3">
              <Image
                source={{
                  uri: user?.image || "https://via.placeholder.com/40",
                }}
                className="w-10 h-10 rounded-full bg-gray-100"
              />
              {replyToId && (
                <View className="w-[2px] bg-gray-100 flex-1 my-2" />
              )}
            </View>

            {/* Right Column: Content Input */}
            <View className="flex-1">
              {replyToName && (
                <Text className="text-gray-500 text-[14px] mb-2">
                  Replying to{" "}
                  <Text className="text-[#1d9bf0]">@{replyToName}</Text>
                </Text>
              )}

              <TextInput
                autoFocus
                multiline
                placeholder={
                  replyToName
                    ? "Post your reply"
                    : quoteId
                      ? "Add a comment!"
                      : "What's happening?"
                }
                placeholderTextColor="#9CA3AF"
                className="text-[19px] leading-6 text-gray-900 mb-4 min-h-[120px]"
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
                // Ensure text input doesn't restrict its own height awkwardly
                style={{ flexShrink: 1 }}
              />

              {/* Location Tag Preview */}
              {locationTag && (
                <View className="flex-row items-center mb-4 self-start bg-sky-50 rounded-full px-3 py-1">
                  <Ionicons name="location" size={14} color="#1d9bf0" />
                  <Text className="text-[#1d9bf0] text-sm ml-1 font-medium">
                    {locationTag}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setLocationTag(null)}
                    className="ml-2"
                  >
                    <Ionicons name="close-circle" size={16} color="#1d9bf0" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Quote Context Preview */}
              {quoteId && (
                <View className="border border-gray-200 rounded-2xl p-3 mb-4">
                  <View className="flex-row items-center mb-1">
                    <Text className="font-bold text-sm text-gray-900">
                      {quoteAuthor}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm" numberOfLines={3}>
                    {quoteContent}
                  </Text>
                </View>
              )}

              {/* Image Previews */}
              {images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 flex-row">
                  {images.map((img, idx) => (
                    <View key={idx} className="relative mr-2">
                      <Image
                        source={{ uri: img.uri }}
                        className="w-48 h-56 rounded-2xl bg-gray-100"
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-full"
                      >
                        <Ionicons name="close" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Toolbar - Pinned strictly to the bottom of KeyboardAvoidingView */}
        <View className="border-t border-gray-100 px-4 py-2 flex-row items-center bg-white w-full">
          <TouchableOpacity onPress={pickImage} className="p-2 mr-2">
            <Ionicons name="image-outline" size={24} color="#1d9bf0" />
          </TouchableOpacity>
          <TouchableOpacity onPress={takePhoto} className="p-2 mr-2">
            <Ionicons name="camera-outline" size={24} color="#1d9bf0" />
          </TouchableOpacity>
          <TouchableOpacity onPress={fetchLocation} className="p-2 mr-2">
            <Ionicons
              name={locationTag ? "location" : "location-outline"}
              size={24}
              color="#1d9bf0"
            />
          </TouchableOpacity>
          <View className="flex-1" />
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="earth" size={16} color="#1d9bf0" />
            <Text className="text-[#1d9bf0] font-bold text-xs ml-1">
              Everyone can reply
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
// 1
// import React, { useState } from "react";
// import {
//   View,
//   TextInput,
//   Text,
//   TouchableOpacity,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   ActivityIndicator,
//   Alert,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import * as ImagePicker from "expo-image-picker";
// import * as Location from "expo-location";
// import { useSelector } from "react-redux";
// import {
//   useCreatePostMutation,
//   useRepostPostMutation,
//   useCommentPostMutation,
// } from "../../store/postApi";
// import { SafeAreaView } from "react-native-safe-area-context";

// export default function ComposePostScreen() {
//   const router = useRouter();
//   // parentId is crucial for the nested comment logic we built in RTK
//   const {
//     replyToId,
//     parentId,
//     replyToName,
//     quoteId,
//     quoteContent,
//     quoteAuthor,
//   } = useLocalSearchParams();
//   const user = useSelector((state: any) => state.auth.user);

//   const [content, setContent] = useState("");
//   const [image, setImage] = useState<string | null>(null);
//   const [base64Image, setBase64Image] = useState<string | null>(null);
//   const [locationTag, setLocationTag] = useState<string | null>(null);
//   const [isFetchingLocation, setIsFetchingLocation] = useState(false);

//   const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
//   const [repostPost, { isLoading: isReposting }] = useRepostPostMutation();
//   const [commentPost, { isLoading: isCommenting }] = useCommentPostMutation();

//   const isLoading =
//     isCreating || isReposting || isCommenting || isFetchingLocation;

//   const pickImage = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission denied", "Media library access is required.");
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       quality: 0.6, // Compressed for faster upload
//       base64: true,
//     });

//     if (!result.canceled && result.assets[0].base64) {
//       setImage(result.assets[0].uri);
//       setBase64Image(`data:image/jpeg;base64,${result.assets[0].base64}`);
//     }
//   };

//   const takePhoto = async () => {
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
//       setImage(result.assets[0].uri);
//       setBase64Image(`data:image/jpeg;base64,${result.assets[0].base64}`);
//     }
//   };

//   const fetchLocation = async () => {
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
//       Alert.alert("Error", "Could not fetch your location.");
//       console.error("Location Error", error);
//     } finally {
//       setIsFetchingLocation(false);
//     }
//   };

//   const handlePost = async () => {
//     if (!content.trim() && !image) return;

//     const finalContent = locationTag
//       ? `${content}\n\n📍 ${locationTag}`.trim()
//       : content.trim();

//     try {
//       if (quoteId) {
//         // --- QUOTE POST ---
//         await repostPost({
//           id: quoteId as string,
//           content: finalContent,
//           image: base64Image || undefined,
//         }).unwrap();
//       } else if (replyToId) {
//         // --- REPLY POST ---
//         // We pass 'id' as the post we are looking at,
//         // and 'parentId' as the specific comment we are replying to
//         await commentPost({
//           id: replyToId as string,
//           parentId: parentId as string,
//           content: finalContent,
//         }).unwrap();
//       } else {
//         // --- REGULAR POST ---
//         await createPost({
//           content: finalContent,
//           image: base64Image || undefined,
//           isPublic: true,
//         }).unwrap();
//       }
//       router.back();
//     } catch (e) {
//       Alert.alert("Error", "Failed to post. Please try again.,");
//       console.error("Post Error", e);
//     }
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       {/* Header */}
//       <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-50">
//         <TouchableOpacity onPress={() => router.back()}>
//           <Text className="text-[16px] text-gray-700">Cancel</Text>
//         </TouchableOpacity>

//         <View className="flex-row items-center">
//           {content.length > 0 && (
//             <Text
//               className={`mr-4 text-xs ${content.length > 250 ? "text-red-500" : "text-gray-400"}`}
//             >
//               {280 - content.length}
//             </Text>
//           )}
//           <TouchableOpacity
//             onPress={handlePost}
//             disabled={(!content.trim() && !image) || isLoading}
//             className={`px-6 py-1.5 rounded-full ${
//               (!content.trim() && !image) || isLoading
//                 ? "bg-sky-200"
//                 : "bg-[#1d9bf0]"
//             }`}
//           >
//             {isLoading ? (
//               <ActivityIndicator size="small" color="white" />
//             ) : (
//               <Text className="text-white font-bold text-[15px]">Post</Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
//         className="flex-1"
//       >
//         <ScrollView
//           className="flex-1 px-4 pt-4"
//           keyboardShouldPersistTaps="handled"
//         >
//           <View className="flex-row">
//             {/* Left Column: Avatar + Thread Line */}
//             <View className="items-center mr-3">
//               <Image
//                 source={{
//                   uri: user?.image || "https://via.placeholder.com/40",
//                 }}
//                 className="w-10 h-10 rounded-full bg-gray-100"
//               />
//               {/* This is the X-Style Thread Line while composing a reply */}
//               {replyToId && (
//                 <View className="w-[2px] bg-gray-100 flex-1 my-2" />
//               )}
//             </View>

//             {/* Right Column: Content Input */}
//             <View className="flex-1">
//               {replyToName && (
//                 <Text className="text-gray-500 text-[14px] mb-2">
//                   Replying to{" "}
//                   <Text className="text-[#1d9bf0]">@{replyToName}</Text>
//                 </Text>
//               )}

//               <TextInput
//                 autoFocus
//                 multiline
//                 placeholder={
//                   replyToName
//                     ? "Post your reply"
//                     : quoteId
//                       ? "Add a comment!"
//                       : "What's happening?"
//                 }
//                 placeholderTextColor="#9CA3AF"
//                 className="text-[19px] leading-6 text-gray-900 mb-4 min-h-[120px]"
//                 value={content}
//                 onChangeText={setContent}
//                 textAlignVertical="top"
//               />

//               {/* Location Tag Preview */}
//               {locationTag && (
//                 <View className="flex-row items-center mb-4 self-start bg-sky-50 rounded-full px-3 py-1">
//                   <Ionicons name="location" size={14} color="#1d9bf0" />
//                   <Text className="text-[#1d9bf0] text-sm ml-1 font-medium">
//                     {locationTag}
//                   </Text>
//                   <TouchableOpacity
//                     onPress={() => setLocationTag(null)}
//                     className="ml-2"
//                   >
//                     <Ionicons name="close-circle" size={16} color="#1d9bf0" />
//                   </TouchableOpacity>
//                 </View>
//               )}

//               {/* Quote Context Preview */}
//               {quoteId && (
//                 <View className="border border-gray-200 rounded-2xl p-3 mb-4">
//                   <View className="flex-row items-center mb-1">
//                     <Text className="font-bold text-sm text-gray-900">
//                       {quoteAuthor}
//                     </Text>
//                   </View>
//                   <Text className="text-gray-600 text-sm" numberOfLines={3}>
//                     {quoteContent}
//                   </Text>
//                 </View>
//               )}

//               {/* Image Preview */}
//               {image && (
//                 <View className="relative mb-6">
//                   <Image
//                     source={{ uri: image }}
//                     className="w-full h-72 rounded-2xl bg-gray-100"
//                     resizeMode="cover"
//                   />
//                   <TouchableOpacity
//                     onPress={() => {
//                       setImage(null);
//                       setBase64Image(null);
//                     }}
//                     className="absolute top-3 right-3 bg-black/70 p-1.5 rounded-full"
//                   >
//                     <Ionicons name="close" size={20} color="white" />
//                   </TouchableOpacity>
//                 </View>
//               )}
//             </View>
//           </View>
//         </ScrollView>

//         {/* Toolbar */}
//         <View className="border-t border-gray-100 px-4 py-2 flex-row items-center bg-white">
//           <TouchableOpacity onPress={pickImage} className="p-2 mr-2">
//             <Ionicons name="image-outline" size={24} color="#1d9bf0" />
//           </TouchableOpacity>
//           <TouchableOpacity onPress={takePhoto} className="p-2 mr-2">
//             <Ionicons name="camera-outline" size={24} color="#1d9bf0" />
//           </TouchableOpacity>
//           <TouchableOpacity onPress={fetchLocation} className="p-2 mr-2">
//             <Ionicons
//               name={locationTag ? "location" : "location-outline"}
//               size={24}
//               color="#1d9bf0"
//             />
//           </TouchableOpacity>
//           <View className="flex-1" />
//           {/* Privacy Indicator (X style) */}
//           <TouchableOpacity className="flex-row items-center">
//             <Ionicons name="earth" size={16} color="#1d9bf0" />
//             <Text className="text-[#1d9bf0] font-bold text-xs ml-1">
//               Everyone can reply
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// // import React, { useState } from "react";
// // import {
// //   View,
// //   TextInput,
// //   Text,
// //   TouchableOpacity,
// //   Image,
// //   KeyboardAvoidingView,
// //   Platform,
// //   ScrollView,
// //   ActivityIndicator,
// //   Alert,
// // } from "react-native";
// // import { Ionicons } from "@expo/vector-icons";
// // import { useRouter, useLocalSearchParams } from "expo-router";
// // import * as ImagePicker from "expo-image-picker";
// // import * as Location from "expo-location";
// // import { useSelector } from "react-redux";
// // import {
// //   useCreatePostMutation,
// //   useRepostPostMutation,
// //   useCommentPostMutation,
// // } from "../../store/postApi";
// // import { SafeAreaView } from "react-native-safe-area-context";

// // export default function ComposePostScreen() {
// //   const router = useRouter();
// //   const { replyToId, replyToName, quoteId, quoteContent, quoteAuthor } =
// //     useLocalSearchParams();
// //   const user = useSelector((state: any) => state.auth.user);

// //   const [content, setContent] = useState("");
// //   const [image, setImage] = useState<string | null>(null);
// //   const [base64Image, setBase64Image] = useState<string | null>(null);
// //   const [locationTag, setLocationTag] = useState<string | null>(null);
// //   const [isFetchingLocation, setIsFetchingLocation] = useState(false);

// //   const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
// //   const [repostPost, { isLoading: isReposting }] = useRepostPostMutation();
// //   const [commentPost, { isLoading: isCommenting }] = useCommentPostMutation();

// //   const isLoading =
// //     isCreating || isReposting || isCommenting || isFetchingLocation;

// //   // 1. Image Gallery Picker
// //   const pickImage = async () => {
// //     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
// //     if (status !== "granted") {
// //       Alert.alert(
// //         "Permission denied",
// //         "Sorry, we need camera roll permissions to make this work!",
// //       );
// //       return;
// //     }

// //     const result = await ImagePicker.launchImageLibraryAsync({
// //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
// //       allowsEditing: true,
// //       quality: 0.7,
// //       base64: true,
// //     });

// //     if (!result.canceled && result.assets[0].base64) {
// //       setImage(result.assets[0].uri);
// //       setBase64Image(`data:image/jpeg;base64,${result.assets[0].base64}`);
// //     }
// //   };

// //   // 2. Camera Capture
// //   const takePhoto = async () => {
// //     const { status } = await ImagePicker.requestCameraPermissionsAsync();
// //     if (status !== "granted") {
// //       Alert.alert(
// //         "Permission denied",
// //         "Sorry, we need camera permissions to take a photo!",
// //       );
// //       return;
// //     }

// //     const result = await ImagePicker.launchCameraAsync({
// //       allowsEditing: true,
// //       quality: 0.7,
// //       base64: true,
// //     });

// //     if (!result.canceled && result.assets[0].base64) {
// //       setImage(result.assets[0].uri);
// //       setBase64Image(`data:image/jpeg;base64,${result.assets[0].base64}`);
// //     }
// //   };

// //   // 3. Location Fetcher
// //   const fetchLocation = async () => {
// //     setIsFetchingLocation(true);
// //     try {
// //       const { status } = await Location.requestForegroundPermissionsAsync();
// //       if (status !== "granted") {
// //         Alert.alert("Permission denied", "Location permission is required.");
// //         setIsFetchingLocation(false);
// //         return;
// //       }

// //       const location = await Location.getCurrentPositionAsync({});
// //       const [geocode] = await Location.reverseGeocodeAsync({
// //         latitude: location.coords.latitude,
// //         longitude: location.coords.longitude,
// //       });

// //       if (geocode) {
// //         // e.g., "Bangkok, Thailand"
// //         const city = geocode.city || geocode.region || geocode.subregion;
// //         const country = geocode.country;
// //         setLocationTag(`${city}, ${country}`);
// //       }
// //     } catch (error) {
// //       Alert.alert("Error", "Could not fetch your location.");
// //       console.log(error);
// //     } finally {
// //       setIsFetchingLocation(false);
// //     }
// //   };

// //   const handlePost = async () => {
// //     if (!content.trim() && !image) return;

// //     // Optional: Append location to the text if your backend doesn't have a specific location field
// //     const finalContent = locationTag
// //       ? `${content}\n\n📍 ${locationTag}`.trim()
// //       : content.trim();

// //     try {
// //       if (quoteId) {
// //         // Quote Tweet
// //         await repostPost({
// //           id: quoteId as string,
// //           content: finalContent,
// //           image: base64Image || undefined,
// //         }).unwrap();
// //       } else if (replyToId) {
// //         // Reply
// //         await commentPost({
// //           id: replyToId as string,
// //           content: finalContent,
// //         }).unwrap();
// //       } else {
// //         // Regular Post
// //         await createPost({
// //           content: finalContent,
// //           image: base64Image || undefined,
// //           isPublic: true,
// //         }).unwrap();
// //       }
// //       router.back();
// //     } catch (e) {
// //       console.error(e);
// //       Alert.alert("Error", "Failed to post. Please try again.");
// //     }
// //   };

// //   return (
// //     <SafeAreaView className="flex-1 bg-white">
// //       {/* Header */}
// //       <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
// //         <TouchableOpacity onPress={() => router.back()}>
// //           <Text className="text-[17px] text-gray-900">Cancel</Text>
// //         </TouchableOpacity>
// //         <TouchableOpacity
// //           onPress={handlePost}
// //           disabled={(!content.trim() && !image) || isLoading}
// //           className={`px-5 py-1.5 rounded-full ${
// //             (!content.trim() && !image) || isLoading
// //               ? "bg-sky-200"
// //               : "bg-[#1d9bf0]"
// //           }`}
// //         >
// //           {isLoading ? (
// //             <ActivityIndicator size="small" color="white" />
// //           ) : (
// //             <Text className="text-white font-bold text-[15px]">Post</Text>
// //           )}
// //         </TouchableOpacity>
// //       </View>

// //       <KeyboardAvoidingView
// //         behavior={Platform.OS === "ios" ? "padding" : undefined}
// //         keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
// //         className="flex-1"

// //         // behavior={Platform.OS === "ios" ? "padding" : "height"}
// //         // // If it still stays too low, increase the offset for Android (e.g., 20 or 47)
// //         // keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 47}
// //         // className="flex-1"
// //       >
// //         <ScrollView
// //           className="flex-1 px-4 pt-4"
// //           keyboardShouldPersistTaps="handled"
// //         >
// //           <View className="flex-row">
// //             <Image
// //               source={{ uri: user?.image || "https://via.placeholder.com/40" }}
// //               className="w-10 h-10 rounded-full mr-3 bg-gray-100"
// //             />
// //             <View className="flex-1 pb-10">
// //               {replyToName && (
// //                 <Text className="text-gray-500 text-sm mb-2">
// //                   Replying to{" "}
// //                   <Text className="text-[#1d9bf0]">@{replyToName}</Text>
// //                 </Text>
// //               )}

// //               <TextInput
// //                 autoFocus
// //                 multiline
// //                 placeholder={
// //                   replyToName
// //                     ? "Post your reply"
// //                     : quoteId
// //                       ? "Add a comment!"
// //                       : "What's happening?"
// //                 }
// //                 placeholderTextColor="#9CA3AF"
// //                 className="text-[18px] leading-6 text-gray-900 mb-4 min-h-[100px]"
// //                 value={content}
// //                 onChangeText={setContent}
// //                 textAlignVertical="top"
// //               />

// //               {/* Location Tag Preview */}
// //               {locationTag && (
// //                 <View className="flex-row items-center mb-4 self-start bg-gray-100 rounded-full px-3 py-1.5">
// //                   <Ionicons name="location" size={14} color="#1d9bf0" />
// //                   <Text className="text-[#1d9bf0] text-sm ml-1 font-medium">
// //                     {locationTag}
// //                   </Text>
// //                   <TouchableOpacity
// //                     onPress={() => setLocationTag(null)}
// //                     className="ml-2"
// //                   >
// //                     <Ionicons name="close-circle" size={16} color="#9CA3AF" />
// //                   </TouchableOpacity>
// //                 </View>
// //               )}

// //               {/* Quote Context Preview */}
// //               {quoteId && (
// //                 <View className="border border-gray-200 rounded-xl p-3 mb-4 bg-gray-50">
// //                   <View className="flex-row items-center mb-1">
// //                     <Image
// //                       source={{ uri: "https://via.placeholder.com/20" }}
// //                       className="w-5 h-5 rounded-full mr-2"
// //                     />
// //                     <Text className="font-bold text-sm text-gray-900">
// //                       {quoteAuthor}
// //                     </Text>
// //                   </View>
// //                   <Text className="text-gray-600 text-sm" numberOfLines={3}>
// //                     {quoteContent}
// //                   </Text>
// //                 </View>
// //               )}

// //               {/* Image Preview */}
// //               {image && (
// //                 <View className="relative mb-4">
// //                   <Image
// //                     source={{ uri: image }}
// //                     className="w-full h-60 rounded-2xl bg-gray-100"
// //                     resizeMode="cover"
// //                   />
// //                   <TouchableOpacity
// //                     onPress={() => {
// //                       setImage(null);
// //                       setBase64Image(null);
// //                     }}
// //                     className="absolute top-2 right-2 bg-black/60 p-1 rounded-full"
// //                   >
// //                     <Ionicons name="close" size={20} color="white" />
// //                   </TouchableOpacity>
// //                 </View>
// //               )}
// //             </View>
// //           </View>
// //         </ScrollView>

// //         {/* Toolbar */}
// //         <View className="border-t border-gray-100 p-3 flex-row items-center bg-white">
// //           <TouchableOpacity onPress={pickImage} className="p-2 mr-4">
// //             <Ionicons name="image-outline" size={24} color="#1d9bf0" />
// //           </TouchableOpacity>
// //           <TouchableOpacity onPress={takePhoto} className="p-2 mr-4">
// //             <Ionicons name="camera-outline" size={24} color="#1d9bf0" />
// //           </TouchableOpacity>
// //           <TouchableOpacity onPress={fetchLocation} className="p-2 mr-4">
// //             <Ionicons
// //               name={locationTag ? "location" : "location-outline"}
// //               size={24}
// //               color="#1d9bf0"
// //             />
// //           </TouchableOpacity>
// //         </View>
// //       </KeyboardAvoidingView>
// //     </SafeAreaView>
// //   );
// // }
