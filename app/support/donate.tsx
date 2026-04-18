import { Button, Text, TextInput, View } from "react-native";

export default function DonateScreen() {
  return (
    <View className="p-4 flex flex-col gap-4">
      <Text className="text-2xl font-bold">Donate</Text>

      <Text className="text-gray-600">
        Your support helps us keep the platform running and improve your
        experience. Every contribution makes a difference.
      </Text>

      <TextInput
        placeholder="Amount"
        className="border border-gray-400 px-4 py-2 rounded-lg mt-4 mb-2"
      />

      <Button title="Donate" onPress={() => {}} />
    </View>
  );
}
