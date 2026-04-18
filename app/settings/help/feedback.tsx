import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

export default function FeedbackScreen() {
  const [feedback, setFeedback] = useState("");

  return (
    <View className="p-4 flex flex-col gap-4">
      <Text className="text-2xl font-bold">Feedback</Text>

      <TextInput
        placeholder="Share your thoughts, ideas, and suggestions..."
        className="border border-gray-400 px-4 py-2 rounded-lg mt-4 mb-2"
      />

      <Button
        title="Send"
        onPress={() => console.log("Send")}
        color="#1E90FF"
      />
    </View>
  );
}
