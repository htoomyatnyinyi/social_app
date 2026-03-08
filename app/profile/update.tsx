import React, { useState, useEffect } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";

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
  const user = useSelector((state: any) => state.auth.user) as User | null;
  const token = useSelector((state: any) => state.auth.token);

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [website, setWebsite] = useState(user?.website || "");
  
  // Date of Birth state
  const [dob, setDob] = useState<Date>(user?.dob ? new Date(user.dob) : new Date(2000, 0, 1));
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

    try {
      const updatedUser = await updateProfile({
        name,
        username,
        bio,
        location,
        website,
        dob: dob.toISOString().split('T')[0],
        image: profileBase64 || undefined,
        coverImage: coverBase64 || undefined,
      }).unwrap();

      dispatch(
        setCredentials({
          user: updatedUser,
          token: token,
        }),
      );

      router.back();
    } catch (error: any) {
      console.error("Update failed", error);
      Alert.alert(
        "Update Failed",
        error?.data?.message || "Something went wrong",
      );
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={26} color="black" />
        </TouchableOpacity>
        <Text className="text-[19px] font-extrabold text-gray-900">
          Edit Profile
        </Text>
        <TouchableOpacity
          onPress={handleUpdate}
          disabled={isLoading}
          className={`px-5 py-2 rounded-full ${isLoading ? "bg-gray-300" : "bg-black"}`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-bold">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="relative h-44 bg-gray-200">
            {coverImage ? (
              <Image
                source={{ uri: coverImage }}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={["#1d9bf0", "#0ea5e9"]}
                className="w-full h-full"
              />
            )}
            <View className="absolute inset-0 items-center justify-center bg-black/20">
              <TouchableOpacity
                onPress={() => pickImage(true)}
                className="bg-black/40 p-3 rounded-full border border-white/20"
              >
                <Ionicons name="camera-outline" size={30} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="px-4 -mt-12 mb-6">
            <View className="relative w-24 h-24">
              <Image
                source={{ uri: profileImage || "https://via.placeholder.com/150" }}
                className="w-24 h-24 rounded-full border-4 border-white bg-gray-200"
              />
              <View className="absolute inset-0 items-center justify-center bg-black/10 rounded-full">
                <TouchableOpacity
                  onPress={() => pickImage(false)}
                  className="bg-black/30 p-2 rounded-full"
                >
                  <Ionicons name="camera-outline" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="px-4 space-y-5">
            <View>
              <Text className="text-sm font-bold text-gray-500 mb-1 ml-1">Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Name"
                className="w-full border-b border-gray-200 py-2 text-[16px] text-gray-900"
              />
            </View>

            <View>
              <Text className="text-sm font-bold text-gray-500 mb-1 ml-1">Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder="@username"
                className="w-full border-b border-gray-200 py-2 text-[16px] text-gray-900"
              />
            </View>

            <View>
              <Text className="text-sm font-bold text-gray-500 mb-1 ml-1">Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                placeholder="Add a bio"
                className="w-full border-b border-gray-200 py-2 text-[16px] text-gray-900 min-h-[60px]"
              />
            </View>

            <View>
              <Text className="text-sm font-bold text-gray-500 mb-1 ml-1">Location</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Location"
                className="w-full border-b border-gray-200 py-2 text-[16px] text-gray-900"
              />
            </View>

            <View>
              <Text className="text-sm font-bold text-gray-500 mb-1 ml-1">Website</Text>
              <TextInput
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                keyboardType="url"
                placeholder="Add your website"
                className="w-full border-b border-gray-200 py-2 text-[16px] text-gray-900"
              />
            </View>

            <View>
              <Text className="text-sm font-bold text-gray-500 mb-1 ml-1">Birth date</Text>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                className="w-full border-b border-gray-200 py-2"
              >
                <Text className="text-[16px] text-gray-900">
                  {dob.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dob}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>
          </View>

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
