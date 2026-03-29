import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

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
  const handleAction = (action: (() => void) | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (action) action();
    onClose();
  };

  if (!isVisible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-gray-900/20">
          <BlurView intensity={20} tint="dark" className="absolute inset-0" />
          
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-[48px] overflow-hidden border-t border-gray-100 shadow-2xl">
              <View className="items-center pt-4 pb-2">
                <View className="w-12 h-1.5 bg-gray-200 rounded-full" />
              </View>

              <View className="pb-10 pt-4 px-6">
                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-6 text-center">
                    Artifact Options
                </Text>

                {isOwner ? (
                  <TouchableOpacity
                    onPress={() => handleAction(onDelete)}
                    className="flex-row items-center px-6 py-5 bg-rose-50 rounded-[28px] border border-rose-100/50 mb-3"
                  >
                    <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center mr-4">
                        <Ionicons name="trash" size={20} color="#F43F5E" />
                    </View>
                    <Text className="flex-1 text-[15px] font-black text-rose-500 uppercase tracking-widest">
                      Dissolve Artifact
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => handleAction(onReport)}
                      className="flex-row items-center px-6 py-5 bg-gray-50 rounded-[28px] border border-gray-100/50 mb-3"
                    >
                      <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center mr-4 shadow-sm shadow-gray-100">
                         <Ionicons name="flag" size={20} color="#64748B" />
                      </View>
                      <Text className="flex-1 text-[15px] font-black text-gray-700 uppercase tracking-widest">
                        Signal Boundary
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleAction(onBlock)}
                      className="flex-row items-center px-6 py-5 bg-gray-50 rounded-[28px] border border-gray-100/50 mb-3"
                    >
                      <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center mr-4 shadow-sm shadow-gray-100">
                        <Ionicons name="person-remove" size={20} color="#64748B" />
                      </View>
                      <Text className="flex-1 text-[15px] font-black text-gray-700 uppercase tracking-widest">
                        Server Presence
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  onPress={onClose}
                  className="mt-4 py-5 items-center justify-center bg-gray-900 rounded-[28px] shadow-lg shadow-gray-400"
                >
                  <Text className="text-white font-black text-[12px] uppercase tracking-[3px]">
                    Return to Silence
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
