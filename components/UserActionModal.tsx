import React from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

interface UserActionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onMute: () => void;
  onBlock: () => void;
  isDark: boolean;
  username: string;
}

export default function UserActionModal({
  isVisible,
  onClose,
  onMute,
  onBlock,
  isDark,
  username,
}: UserActionModalProps) {
  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <Pressable onPress={onClose} className="flex-1 justify-end">
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          className="flex-1"
        />

        <View
          className={`absolute bottom-0 w-full rounded-t-[40px] p-8 pb-12 border-t ${isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-gray-100"}`}
        >
          {/* Handlebar */}
          <View className="w-12 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full self-center mb-6" />

          <Text
            className={`text-xl font-black tracking-tight mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Privacy Actions
          </Text>
          <Text className="text-slate-500 font-medium mb-8">
            Manage your interaction with @{username}
          </Text>

          {/* Mute Button */}
          <TouchableOpacity
            onPress={() => {
              onMute();
              onClose();
            }}
            className={`flex-row items-center p-5 rounded-2xl mb-3 ${isDark ? "bg-slate-800" : "bg-gray-50"}`}
          >
            <View className="w-10 h-10 rounded-xl bg-amber-500/10 items-center justify-center mr-4">
              <Ionicons name="volume-mute-outline" size={22} color="#F59E0B" />
            </View>
            <View>
              <Text
                className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Mute Member
              </Text>
              <Text className="text-slate-500 text-xs">
                Hide their posts from your feed
              </Text>
            </View>
          </TouchableOpacity>

          {/* Block Button */}
          <TouchableOpacity
            onPress={() => {
              onBlock();
              onClose();
            }}
            className={`flex-row items-center p-5 rounded-2xl mb-8 ${isDark ? "bg-slate-800" : "bg-gray-50"}`}
          >
            <View className="w-10 h-10 rounded-xl bg-rose-500/10 items-center justify-center mr-4">
              <Ionicons name="ban-outline" size={22} color="#F43F5E" />
            </View>
            <View>
              <Text className="font-bold text-rose-500">Block Member</Text>
              <Text className="text-slate-500 text-xs">
                Restrict all interactions
              </Text>
            </View>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity onPress={onClose} className="py-4 items-center">
            <Text className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
              Close Menu
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}
// first code.
// import React from "react";
// import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
// import { BlurView } from "expo-blur";
// import { Ionicons } from "@expo/vector-icons";

// interface UserActionModalProps {
//   isVisible: boolean;
//   onClose: () => void;
//   onMute: () => void;
//   onBlock: () => void;
//   isDark: boolean;
//   username: string;
// }

// export default function UserActionModal({
//   isVisible,
//   onClose,
//   onMute,
//   onBlock,
//   isDark,
//   username,
// }: UserActionModalProps) {
//   return (
//     <Modal visible={isVisible} transparent animationType="slide">
//       <Pressable onPress={onClose} className="flex-1 justify-end">
//         <BlurView
//           intensity={isDark ? 40 : 60}
//           tint={isDark ? "dark" : "light"}
//           className="flex-1"
//         />

//         <View
//           className={`absolute bottom-0 w-full rounded-t-[40px] p-8 pb-12 border-t ${isDark ? "bg-[#0F172A] border-slate-800" : "bg-white border-gray-100"}`}
//         >
//           {/* Handlebar */}
//           <View className="w-12 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full self-center mb-6" />

//           <Text
//             className={`text-xl font-black tracking-tight mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
//           >
//             Privacy Actions
//           </Text>
//           <Text className="text-slate-500 font-medium mb-8">
//             Manage your interaction with @{username}
//           </Text>

//           {/* Mute Button */}
//           <TouchableOpacity
//             onPress={() => {
//               onMute();
//               onClose();
//             }}
//             className={`flex-row items-center p-5 rounded-2xl mb-3 ${isDark ? "bg-slate-800" : "bg-gray-50"}`}
//           >
//             <View className="w-10 h-10 rounded-xl bg-amber-500/10 items-center justify-center mr-4">
//               <Ionicons name="volume-mute-outline" size={22} color="#F59E0B" />
//             </View>
//             <View>
//               <Text
//                 className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}
//               >
//                 Mute Member
//               </Text>
//               <Text className="text-slate-500 text-xs">
//                 Hide their posts from your feed
//               </Text>
//             </View>
//           </TouchableOpacity>

//           {/* Block Button */}
//           <TouchableOpacity
//             onPress={() => {
//               onBlock();
//               onClose();
//             }}
//             className={`flex-row items-center p-5 rounded-2xl mb-8 ${isDark ? "bg-slate-800" : "bg-gray-50"}`}
//           >
//             <View className="w-10 h-10 rounded-xl bg-rose-500/10 items-center justify-center mr-4">
//               <Ionicons name="ban-outline" size={22} color="#F43F5E" />
//             </View>
//             <View>
//               <Text className="font-bold text-rose-500">Block Member</Text>
//               <Text className="text-slate-500 text-xs">
//                 Restrict all interactions
//               </Text>
//             </View>
//           </TouchableOpacity>

//           {/* Cancel */}
//           <TouchableOpacity onPress={onClose} className="py-4 items-center">
//             <Text className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
//               Close Menu
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </Pressable>
//     </Modal>
//   );
// }
