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
