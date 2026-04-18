import { Button, Text, View } from "react-native";

export default function ChatScreen() {
  return (
    <View className="p-4 flex flex-col gap-4">
      <Text className="text-2xl font-bold">Chat</Text>

      <Text className="text-gray-600">
        Our team is here to help you with any issues you&apos;re facing. You can
        reach us through the chat feature, and we&apos;ll get back to you as
        soon as possible.
      </Text>

      <Button title="Start Chat" onPress={() => {}} />
    </View>
  );
}
