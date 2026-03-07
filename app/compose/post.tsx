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

export default function ComposePostScreen() {
  const router = useRouter();
  const { replyToId, replyToName, quoteId, quoteContent, quoteAuthor } =
    useLocalSearchParams();
  const user = useSelector((state: any) => state.auth.user);

  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [locationTag, setLocationTag] = useState<string | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [repostPost, { isLoading: isReposting }] = useRepostPostMutation();
  const [commentPost, { isLoading: isCommenting }] = useCommentPostMutation();

  const isLoading =
    isCreating || isReposting || isCommenting || isFetchingLocation;

  // 1. Image Gallery Picker
  const pickImage = async () => {
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
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(result.assets[0].uri);
      setBase64Image(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  // 2. Camera Capture
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Sorry, we need camera permissions to take a photo!",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(result.assets[0].uri);
      setBase64Image(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  // 3. Location Fetcher
  const fetchLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        setIsFetchingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode) {
        // e.g., "Bangkok, Thailand"
        const city = geocode.city || geocode.region || geocode.subregion;
        const country = geocode.country;
        setLocationTag(`${city}, ${country}`);
      }
    } catch (error) {
      Alert.alert("Error", "Could not fetch your location.");
      console.log(error);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !image) return;

    // Optional: Append location to the text if your backend doesn't have a specific location field
    const finalContent = locationTag
      ? `${content}\n\n📍 ${locationTag}`.trim()
      : content.trim();

    try {
      if (quoteId) {
        // Quote Tweet
        await repostPost({
          id: quoteId as string,
          content: finalContent,
          image: base64Image || undefined,
        }).unwrap();
      } else if (replyToId) {
        // Reply
        await commentPost({
          id: replyToId as string,
          content: finalContent,
        }).unwrap();
      } else {
        // Regular Post
        await createPost({
          content: finalContent,
          image: base64Image || undefined,
          isPublic: true,
        }).unwrap();
      }
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to post. Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[17px] text-gray-900">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handlePost}
          disabled={(!content.trim() && !image) || isLoading}
          className={`px-5 py-1.5 rounded-full ${
            (!content.trim() && !image) || isLoading
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row">
            <Image
              source={{ uri: user?.image || "https://via.placeholder.com/40" }}
              className="w-10 h-10 rounded-full mr-3 bg-gray-100"
            />
            <View className="flex-1 pb-10">
              {replyToName && (
                <Text className="text-gray-500 text-sm mb-2">
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
                className="text-[18px] leading-6 text-gray-900 mb-4 min-h-[100px]"
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />

              {/* Location Tag Preview */}
              {locationTag && (
                <View className="flex-row items-center mb-4 self-start bg-gray-100 rounded-full px-3 py-1.5">
                  <Ionicons name="location" size={14} color="#1d9bf0" />
                  <Text className="text-[#1d9bf0] text-sm ml-1 font-medium">
                    {locationTag}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setLocationTag(null)}
                    className="ml-2"
                  >
                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Quote Context Preview */}
              {quoteId && (
                <View className="border border-gray-200 rounded-xl p-3 mb-4 bg-gray-50">
                  <View className="flex-row items-center mb-1">
                    <Image
                      source={{ uri: "https://via.placeholder.com/20" }}
                      className="w-5 h-5 rounded-full mr-2"
                    />
                    <Text className="font-bold text-sm text-gray-900">
                      {quoteAuthor}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm" numberOfLines={3}>
                    {quoteContent}
                  </Text>
                </View>
              )}

              {/* Image Preview */}
              {image && (
                <View className="relative mb-4">
                  <Image
                    source={{ uri: image }}
                    className="w-full h-60 rounded-2xl bg-gray-100"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setImage(null);
                      setBase64Image(null);
                    }}
                    className="absolute top-2 right-2 bg-black/60 p-1 rounded-full"
                  >
                    <Ionicons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Toolbar */}
        <View className="border-t border-gray-100 p-3 flex-row items-center bg-white">
          <TouchableOpacity onPress={pickImage} className="p-2 mr-4">
            <Ionicons name="image-outline" size={24} color="#1d9bf0" />
          </TouchableOpacity>
          <TouchableOpacity onPress={takePhoto} className="p-2 mr-4">
            <Ionicons name="camera-outline" size={24} color="#1d9bf0" />
          </TouchableOpacity>
          <TouchableOpacity onPress={fetchLocation} className="p-2 mr-4">
            <Ionicons
              name={locationTag ? "location" : "location-outline"}
              size={24}
              color="#1d9bf0"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
