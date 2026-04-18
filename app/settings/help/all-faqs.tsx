import { Text, TextInput, View } from "react-native";

export default function AllFaqsScreen() {
  return (
    <View className="p-4 flex flex-col gap-4">
      <Text className="font-bold text-2xl">Frequently Asked Questions</Text>
      <TextInput
        placeholder="What can we help you with?"
        className="border border-gray-400 px-4 py-2 rounded-lg mt-4 mb-2"
      />

      <Text className="font-bold">Explore topics</Text>

      <View className="border border-gray-400 px-4 py-2 rounded-lg">
        <Text className="text-base font-medium">Account and Login</Text>
        <Text className="text-sm text-gray-500">
          Manage your account settings, security, and more
        </Text>
      </View>

      <View className="border border-gray-400 px-4 py-2 rounded-lg">
        <Text className="text-base font-medium">Account and Login</Text>
        <Text className="text-sm text-gray-500">
          Manage your account settings, security, and more
        </Text>
      </View>

      <View className="border border-gray-400 px-4 py-2 rounded-lg">
        <Text className="text-base font-medium">Account and Login</Text>
        <Text className="text-sm text-gray-500">
          Manage your account settings, security, and more
        </Text>
      </View>

      <View className="border border-gray-400 px-4 py-2 rounded-lg">
        <Text className="text-base font-medium">Account and Login</Text>
        <Text className="text-sm text-gray-500">
          Manage your account settings, security, and more
        </Text>
      </View>

      <View className="border border-gray-400 px-4 py-2 rounded-lg">
        <Text className="text-base font-medium">Account and Login</Text>
        <Text className="text-sm text-gray-500">
          Manage your account settings, security, and more
        </Text>
      </View>

      <View className="border border-gray-400 px-4 py-2 rounded-lg">
        <Text className="text-base font-medium">Account and Login</Text>
        <Text className="text-sm text-gray-500">
          Manage your account settings, security, and more
        </Text>
      </View>
    </View>
  );
}
