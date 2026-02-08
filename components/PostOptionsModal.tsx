import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

interface PostOptionsModalProps {
  isVisible: boolean;
  onClose: () => void;
  onReport?: () => void;
  onBlock?: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
}

export default function PostOptionsModal({
  isVisible,
  onClose,
  onReport,
  onBlock,
  onDelete,
  isOwner = false,
}: PostOptionsModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/50">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-3xl overflow-hidden">
              <View className="items-center pt-3 pb-2">
                <View className="w-12 h-1 bg-gray-300 rounded-full" />
              </View>

              <View className="pb-8 pt-2">
                {isOwner ? (
                  <TouchableOpacity
                    onPress={onDelete}
                    className="flex-row items-center px-6 py-4 active:bg-gray-100"
                  >
                    <Ionicons name="trash-outline" size={24} color="#EF4444" />
                    <Text className="ml-4 text-[17px] font-medium text-red-500">
                      Delete Post
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={onReport}
                      className="flex-row items-center px-6 py-4 active:bg-gray-100"
                    >
                      <Ionicons name="flag-outline" size={24} color="#374151" />
                      <Text className="ml-4 text-[17px] font-medium text-gray-700">
                        Report Post
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={onBlock}
                      className="flex-row items-center px-6 py-4 active:bg-gray-100"
                    >
                      <Ionicons
                        name="person-remove-outline"
                        size={24}
                        color="#374151"
                      />
                      <Text className="ml-4 text-[17px] font-medium text-gray-700">
                        Block User
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <View className="h-[1px] bg-gray-100 my-2 mx-4" />

                <TouchableOpacity
                  onPress={onClose}
                  className="flex-row items-center px-6 py-4 active:bg-gray-100"
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={24}
                    color="#374151"
                  />
                  <Text className="ml-4 text-[17px] font-medium text-gray-700">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
              <SafeAreaView edges={["bottom"]} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
