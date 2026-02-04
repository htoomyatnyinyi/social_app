import React, { useState, useEffect } from "react";
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

  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [repostPost, { isLoading: isReposting }] = useRepostPostMutation();
  const [commentPost, { isLoading: isCommenting }] = useCommentPostMutation();

  const isLoading = isCreating || isReposting || isCommenting;

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

  const handlePost = async () => {
    if (!content.trim() && !image) return;

    try {
      if (quoteId) {
        // Quote Tweet
        await repostPost({
          id: quoteId as string,
          content,
          image: base64Image || undefined,
        }).unwrap();
      } else if (replyToId) {
        // Reply
        await commentPost({
          id: replyToId as string,
          content,
          // Image in replies not fully supported by backend yet for comments, but logic is similar
          // For now, assuming comments are text-only in this implementation plan unless verified otherwise
        }).unwrap();
      } else {
        // Regular Post
        await createPost({
          content,
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
          className={`px-5 py-1.5 rounded-full ${(!content.trim() && !image) || isLoading ? "bg-sky-200" : "bg-[#1d9bf0]"}`}
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
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 pt-4">
          <View className="flex-row">
            <Image
              source={{ uri: user?.image || "https://via.placeholder.com/40" }}
              className="w-10 h-10 rounded-full mr-3 bg-gray-100"
            />
            <View className="flex-1 pb-10">
              {/* Context Indicators */}
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
                className="text-[18px] leading-6 text-gray-900 mb-4 h-20"
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />

              {/* Quote Context Preview */}
              {quoteId && (
                <View className="border border-gray-200 rounded-xl p-3 mb-4 bg-gray-50">
                  <View className="flex-row items-center mb-1">
                    <Image
                      source={{ uri: "https://via.placeholder.com/20" }} // Ideally pass author image param too
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
          <TouchableOpacity className="p-2 mr-4">
            <Ionicons name="camera-outline" size={24} color="#1d9bf0" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 mr-4">
            <Ionicons name="location-outline" size={24} color="#1d9bf0" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
