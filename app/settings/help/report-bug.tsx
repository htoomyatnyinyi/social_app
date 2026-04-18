import { Button, Text, TextInput, View } from "react-native";

export default function ReportBugScreen() {
  return (
    <View className="p-4 flex flex-col gap-4">
      <Text className="text-2xl font-bold">Report Bug</Text>

      <TextInput
        placeholder="What did you expect to happen?"
        className="border border-gray-400 px-4 py-2 rounded-lg mt-4 mb-2"
      />

      <TextInput
        placeholder="What actually happened?"
        className="border border-gray-400 px-4 py-2 rounded-lg mt-4 mb-2"
      />

      <Button title="Send" onPress={() => console.log("Send")} />
    </View>
  );
}
