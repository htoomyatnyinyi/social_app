import React from "react";
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
import { useTheme } from "../context/ThemeContext";

interface RepostModalProps {
  isVisible: boolean;
  onClose: () => void;
  onRepost: () => void;
  onQuote: () => void;
  hasReposted?: boolean;
}

export default function RepostModal({
  isVisible,
  onClose,
  onRepost,
  onQuote,
  hasReposted = false,
}: RepostModalProps) {
  const { isDark } = useTheme();

  const handleAction = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    action();
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
        <View className="flex-1 justify-end bg-gray-900/40">
          <BlurView intensity={30} tint="dark" className="absolute inset-0" />

          <TouchableWithoutFeedback>
            <View className="bg-white dark:bg-[#0F172A] rounded-t-[48px] overflow-hidden border-t border-gray-100 dark:border-slate-800 shadow-2xl">
              <View className="items-center pt-4 pb-2">
                <View className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full" />
              </View>

              <View className="pb-10 pt-4 px-6">
                <Text className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[3px] mb-8 text-center pt-2">
                  Share perspective
                </Text>

                <View className="flex-row justify-between space-x-4">
                  {/* Repost Button */}
                  <TouchableOpacity
                    onPress={() => handleAction(onRepost)}
                    className={`flex-1 items-center p-6 rounded-[32px] border ${hasReposted ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20" : "bg-gray-50 border-gray-100 dark:bg-slate-800/50 dark:border-slate-700"}`}
                  >
                    <View
                      className={`w-14 h-14 rounded-full items-center justify-center mb-4 ${hasReposted ? "bg-emerald-500" : "bg-white dark:bg-slate-800 shadow-sm"}`}
                    >
                      <Ionicons
                        name="repeat"
                        size={28}
                        color={hasReposted ? "white" : "#10B981"}
                      />
                    </View>
                    <Text
                      className={`font-black uppercase tracking-widest text-[12px] ${hasReposted ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}
                    >
                      {hasReposted ? "Shared" : "Repost"}
                    </Text>
                    <Text className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mt-1 uppercase">
                      Instant share
                    </Text>
                  </TouchableOpacity>

                  {/* Quote Button */}
                  <TouchableOpacity
                    onPress={() => handleAction(onQuote)}
                    className="flex-1 items-center p-6 bg-gray-50 dark:bg-slate-800/50 rounded-[32px] border border-gray-100 dark:border-slate-700"
                  >
                    <View className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 items-center justify-center mb-4 shadow-sm">
                      <Ionicons
                        name="create-outline"
                        size={28}
                        color="#0EA5E9"
                      />
                    </View>
                    <Text className="font-black uppercase tracking-widest text-[12px] text-gray-900 dark:text-white">
                      Quote
                    </Text>
                    <Text className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mt-1 uppercase">
                      Add thoughts
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  className="mt-8 py-5 items-center justify-center bg-gray-900 dark:bg-slate-800 rounded-[28px] shadow-lg"
                >
                  <Text className="text-white font-black text-[12px] uppercase tracking-[3px]">
                    Dismiss
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
