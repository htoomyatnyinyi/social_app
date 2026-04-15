import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Audio } from "expo-av";
import { BlurView } from "expo-blur";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Theme and API Imports
import { useTheme } from "../../context/ThemeContext";
import {
  useGetMeditationStatsQuery,
  useRecordSessionMutation,
  useUpdateMeditationStatusMutation,
} from "../../store/meditationApi";

const BELL_SOUND = require("../../assets/sounds/bell.mp3");

export default function MeditationTimer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // Safety check for Navigation Context stability
  if (!theme) return null;
  const { isDark, accentColor } = theme;

  // API Hooks
  const { data: stats } = useGetMeditationStatsQuery();
  const [recordSession] = useRecordSessionMutation();
  const [updateStatus] = useUpdateMeditationStatusMutation();

  // State
  const [intervalTime, setIntervalTime] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [repeat, setRepeat] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulse = useSharedValue(1);

  // --- Keep Awake Logic ---
  useEffect(() => {
    if (isActive) {
      activateKeepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }
    return () => { deactivateKeepAwake(); };
  }, [isActive]);

  // --- Sound Setup ---
  const loadSound = useCallback(async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(BELL_SOUND);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });
      setSound(newSound);
    } catch (e) { console.log("Audio Load Error:", e); }
  }, []);

  useEffect(() => {
    loadSound();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (sound) sound.unloadAsync();
      updateStatus({ isMeditating: false }).catch(() => { });
    };
  }, [loadSound]);

  const playBell = useCallback(async () => {
    if (sound) {
      await sound.replayAsync();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [sound]);

  // --- Timer Engine ---
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      playBell();
      recordSession({ duration: intervalTime }).catch(() => { });

      if (repeat) {
        setTimeLeft(intervalTime * 60);
      } else {
        setIsActive(false);
        updateStatus({ isMeditating: false }).catch(() => { });
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, repeat, intervalTime]);

  // --- Stability Handlers (Fixes the Navigation Context Error) ---
  const handleTimeChange = useCallback((mins: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setIntervalTime(mins);
    setTimeLeft(mins * 60);
  }, []);

  const toggleTimer = useCallback(() => {
    const nextState = !isActive;
    Haptics.impactAsync(nextState ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    setIsActive(nextState);
    updateStatus({ isMeditating: nextState }).catch(() => { });
  }, [isActive, updateStatus]);

  // --- Animations ---
  useEffect(() => {
    if (isActive) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 3000, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 3000, easing: Easing.in(Easing.ease) })
        ), -1, true
      );
    } else { pulse.value = withTiming(1); }
  }, [isActive]);

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.2], [0.4, 0.1]),
    backgroundColor: accentColor,
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
      <Stack.Screen options={{ headerShown: false }} />

      <BlurView intensity={20} tint={isDark ? "dark" : "light"} className="flex-1" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 h-16">
          <TouchableOpacity
            onPress={() => router.back()}
            className={`w-10 h-10 rounded-xl items-center justify-center border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
          >
            <Ionicons name="chevron-back" size={24} color={isDark ? "#94A3B8" : "#64748B"} />
          </TouchableOpacity>
          <Text className={`font-black tracking-[2px] uppercase ${isDark ? "text-white" : "text-slate-900"}`}>Zen Timer</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center pb-10">
          {/* Status Badge */}
          <View className={`flex-row items-center px-4 py-2 rounded-full mb-10 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
            <View style={{ backgroundColor: isActive ? accentColor : '#94A3B8' }} className="w-2 h-2 rounded-full mr-2" />
            <Text className="text-slate-500 text-[10px] font-black tracking-widest uppercase">
              {isActive ? "Meditating" : "Ready"}
            </Text>
          </View>

          {/* Timer Circle */}
          <View className="w-[300px] h-[300px] items-center justify-center mb-10">
            <Animated.View style={animatedCircleStyle} className="absolute w-[280px] h-[280px] rounded-full" />
            <View className={`w-[250px] h-[250px] rounded-full items-center justify-center shadow-2xl border-2 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-50"}`}>
              <Text className={`text-6xl font-extralight tracking-tighter ${isDark ? "text-white" : "text-slate-900"}`}>
                {formatTime(timeLeft)}
              </Text>
              <Text style={{ color: accentColor }} className="text-[11px] font-black tracking-[4px] uppercase mt-2">
                {isActive ? "Breathe" : "Begin"}
              </Text>
            </View>
          </View>

          {/* Bottom Panel */}
          <View className="w-full px-10">
            {/* Stats Summary */}
            <View className={`flex-row p-5 rounded-[32px] mb-8 border justify-around ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-100 shadow-sm"}`}>
              <View className="items-center">
                <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{stats?.totalMinutes || 0}</Text>
                <Text className="text-slate-500 text-[9px] font-black uppercase">Total Mins</Text>
              </View>
              <View className="items-center">
                <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{stats?.sessionsCount || 0}</Text>
                <Text className="text-slate-500 text-[9px] font-black uppercase">Sessions</Text>
              </View>
            </View>

            {/* Time Selectors & Repeat */}
            <View className={`flex-row items-center justify-between p-2 rounded-3xl mb-10 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-100"}`}>
              <View className="flex-row space-x-2">
                {[30, 60].map((t) => (
                  <TouchableOpacity
                    key={`time-opt-${t}`}
                    onPress={() => handleTimeChange(t)}
                    className={`px-6 py-2 rounded-2xl ${intervalTime === t ? (isDark ? "bg-slate-700" : "bg-white shadow-sm") : ""}`}
                  >
                    <Text className={`font-bold ${intervalTime === t ? (isDark ? "text-white" : "text-slate-900") : "text-slate-400"}`}>{t}m</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRepeat(!repeat);
                }}
                className="pr-4 flex-row items-center"
              >
                <Text className={`text-[9px] font-black uppercase mr-2 ${repeat ? "" : "text-slate-500"}`} style={repeat ? { color: accentColor } : {}}>
                  {repeat ? "Infinite" : "Once"}
                </Text>
                <Ionicons name="infinite" size={20} color={repeat ? accentColor : "#475569"} />
              </TouchableOpacity>
            </View>

            {/* Main Controls */}
            <View className="flex-row items-center justify-center gap-10">
              <TouchableOpacity onPress={() => setTimeLeft(intervalTime * 60)}>
                <Ionicons name="refresh-outline" size={28} color={isDark ? "#475569" : "#CBD5E1"} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={toggleTimer}
                style={{ backgroundColor: accentColor }}
                className="w-20 h-20 rounded-full items-center justify-center shadow-xl"
              >
                <Ionicons name={isActive ? "pause" : "play"} size={36} color="white" />
              </TouchableOpacity>

              <TouchableOpacity onPress={playBell}>
                <Ionicons name="notifications-outline" size={28} color={isDark ? "#475569" : "#CBD5E1"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </View>
  );
}
// owrking but 60 min error 
// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { View, Text, TouchableOpacity, Linking } from "react-native";
// import { Audio } from "expo-av";
// import { BlurView } from "expo-blur";
// import { Stack, useRouter } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
//   withRepeat,
//   withSequence,
//   Easing,
//   interpolate,
// } from "react-native-reanimated";
// import * as Haptics from "expo-haptics";
// import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useTheme } from "../../context/ThemeContext"; // Added Theme Hook

// const BELL_SOUND = require("../../assets/sounds/bell.mp3");
// import {
//   useGetMeditationStatsQuery,
//   useRecordSessionMutation,
//   useUpdateMeditationStatusMutation
// } from "../../store/meditationApi";

// export default function MeditationTimer() {
//   const router = useRouter();
//   const insets = useSafeAreaInsets();
//   const { isDark, accentColor } = useTheme(); // Using both now

//   const { data: stats } = useGetMeditationStatsQuery();
//   const [recordSession] = useRecordSessionMutation();
//   const [updateStatus] = useUpdateMeditationStatusMutation();

//   const [intervalTime, setIntervalTime] = useState(30);
//   const [isActive, setIsActive] = useState(false);
//   const [timeLeft, setTimeLeft] = useState(30 * 60);
//   const [sound, setSound] = useState<Audio.Sound | null>(null);
//   const [repeat, setRepeat] = useState(true);

//   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const pulse = useSharedValue(1);

//   // --- Background/Lock Logic ---
//   useEffect(() => {
//     if (isActive) {
//       activateKeepAwakeAsync();
//     } else {
//       deactivateKeepAwake();
//     }
//     return () => { deactivateKeepAwake(); };
//   }, [isActive]);

//   const loadSound = useCallback(async () => {
//     try {
//       const { sound: newSound } = await Audio.Sound.createAsync(BELL_SOUND);
//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: false,
//         staysActiveInBackground: true, // Rings even when screen is locked
//         playsInSilentModeIOS: true,
//       });
//       setSound(newSound);
//     } catch (e) { console.log("Sound error", e); }
//   }, []);

//   useEffect(() => {
//     loadSound();
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//       if (sound) sound.unloadAsync();
//       updateStatus({ isMeditating: false }).catch(() => { });
//     };
//   }, [loadSound]);

//   const playBell = useCallback(async () => {
//     if (sound) {
//       await sound.replayAsync();
//       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//     }
//   }, [sound]);

//   // --- Timer Engine ---
//   useEffect(() => {
//     if (isActive && timeLeft > 0) {
//       timerRef.current = setInterval(() => setTimeLeft((p) => p - 1), 1000);
//     } else if (timeLeft === 0) {
//       playBell();
//       recordSession({ duration: intervalTime }).catch(() => { });
//       if (repeat) {
//         setTimeLeft(intervalTime * 60);
//       } else {
//         setIsActive(false);
//         updateStatus({ isMeditating: false }).catch(() => { });
//       }
//     }
//     return () => { if (timerRef.current) clearInterval(timerRef.current); };
//   }, [isActive, timeLeft, repeat]);

//   // --- Theme-Linked Animations ---
//   useEffect(() => {
//     if (isActive) {
//       pulse.value = withRepeat(
//         withSequence(
//           withTiming(1.2, { duration: 3000, easing: Easing.out(Easing.ease) }),
//           withTiming(1, { duration: 3000, easing: Easing.in(Easing.ease) })
//         ), -1, true
//       );
//     } else { pulse.value = withTiming(1); }
//   }, [isActive]);

//   const animatedCircleStyle = useAnimatedStyle(() => ({
//     transform: [{ scale: pulse.value }],
//     opacity: interpolate(pulse.value, [1, 1.2], [0.4, 0.1]),
//     backgroundColor: accentColor, // Linked to appearance color
//   }));

//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
//   };

//   return (
//     <View className={`flex-1 ${isDark ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
//       <Stack.Screen options={{ headerShown: false }} />

//       <BlurView intensity={20} tint={isDark ? "dark" : "light"} className="flex-1" style={{ paddingTop: insets.top }}>
//         {/* Nav */}
//         <View className="flex-row items-center justify-between px-5 h-16">
//           <TouchableOpacity
//             onPress={() => router.back()}
//             className={`w-10 h-10 rounded-xl items-center justify-center border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
//           >
//             <Ionicons name="chevron-back" size={24} color={isDark ? "#94A3B8" : "#64748B"} />
//           </TouchableOpacity>
//           <Text className={`font-black tracking-[2px] uppercase ${isDark ? "text-white" : "text-slate-900"}`}>Timer</Text>
//           <View className="w-10" />
//         </View>

//         <View className="flex-1 items-center justify-center pb-10">
//           {/* Status Badge */}
//           <View className={`flex-row items-center px-3 py-1.5 rounded-full mb-10 border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
//             <View style={{ backgroundColor: isActive ? accentColor : '#94A3B8' }} className="w-2 h-2 rounded-full mr-2" />
//             <Text className="text-slate-500 text-[10px] font-black tracking-widest uppercase">
//               {isActive ? "Meditating" : "Zen Mode"}
//             </Text>
//           </View>

//           {/* Timer Circle */}
//           <View className="w-[300px] h-[300px] items-center justify-center mb-10">
//             <Animated.View style={animatedCircleStyle} className="absolute w-[280px] h-[280px] rounded-full" />
//             <View className={`w-[250px] h-[250px] rounded-full items-center justify-center shadow-2xl border-2 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-50"}`}>
//               <Text className={`text-6xl font-extralight tracking-tighter ${isDark ? "text-white" : "text-slate-900"}`}>
//                 {formatTime(timeLeft)}
//               </Text>
//               <Text style={{ color: accentColor }} className="text-[11px] font-black tracking-[4px] uppercase mt-2">
//                 {isActive ? "Breathe Out" : "Breathe In"}
//               </Text>
//             </View>
//           </View>

//           {/* Controls */}
//           <View className="w-full px-10">
//             <View className="flex-row items-center justify-center gap-10">
//               {/* Reset */}
//               <TouchableOpacity onPress={() => setTimeLeft(intervalTime * 60)}>
//                 <Ionicons name="refresh-outline" size={28} color={isDark ? "#475569" : "#CBD5E1"} />
//               </TouchableOpacity>

//               {/* Main Play/Pause */}
//               <TouchableOpacity
//                 onPress={() => {
//                   const next = !isActive;
//                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//                   setIsActive(next);
//                   updateStatus({ isMeditating: next });
//                 }}
//                 activeOpacity={0.9}
//                 style={{ backgroundColor: accentColor }}
//                 className="w-24 h-24 rounded-full items-center justify-center shadow-xl shadow-indigo-500/50"
//               >
//                 <Ionicons name={isActive ? "pause" : "play"} size={40} color="white" />
//               </TouchableOpacity>

//               {/* Bell / Manual Ring */}
//               <TouchableOpacity onPress={playBell}>
//                 <Ionicons name="notifications-outline" size={28} color={isDark ? "#475569" : "#CBD5E1"} />
//               </TouchableOpacity>
//             </View>

//             {/* Interval & Repeat Toggles */}
//             <View className="flex-row items-center justify-between mt-12 bg-slate-800/10 p-2 rounded-3xl border border-slate-500/10">
//               <View className="flex-row space-x-2">
//                 {[30, 60].map((t) => (
//                   <TouchableOpacity
//                     key={t}
//                     onPress={() => {
//                       // 1. Add Haptics for feedback
//                       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

//                       // 2. SAFETY: Force stop the timer before changing values
//                       setIsActive(false);

//                       // 3. Clear the interval ref immediately to prevent race conditions
//                       if (timerRef.current) {
//                         clearInterval(timerRef.current);
//                         timerRef.current = null;
//                       }

//                       // 4. Update the times
//                       setIntervalTime(t);
//                       setTimeLeft(t * 60);
//                     }}
//                     className={`px-6 py-2 rounded-2xl ${intervalTime === t
//                       ? (isDark ? "bg-slate-700 shadow-none" : "bg-white shadow-sm")
//                       : ""
//                       }`}
//                   >
//                     <Text className={`font-bold ${intervalTime === t
//                       ? (isDark ? "text-white" : "text-slate-900")
//                       : "text-slate-400"
//                       }`}>
//                       {t}m
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//               {/* <TouchableOpacity
//                 onPress={() => setRepeat(!repeat)}
//                 className="pr-4"
//               >
//                 <Ionicons name="infinite" size={24} color={repeat ? accentColor : "#475569"} />
//               </TouchableOpacity> */}
//               <TouchableOpacity
//                 onPress={() => {
//                   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//                   setRepeat(prev => !prev); // Use functional update for stability
//                 }}
//                 activeOpacity={0.7}
//                 className="flex-row items-center px-4 py-2"
//               >
//                 <View className="flex-row items-center gap-2 mr-2">
//                   <Text className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
//                     {repeat ? "Infinite" : "One-Shot"}
//                   </Text>
//                   <Ionicons
//                     name={repeat ? "infinite" : "stop-circle-outline"}
//                     size={20}
//                     color={repeat ? accentColor : "#475569"}
//                   />
//                 </View>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </BlurView>
//     </View>
//   );
// }
// // import React, { useState, useEffect, useRef, useCallback } from "react";
// // import { View, Text, TouchableOpacity, Linking } from "react-native";
// // import { Audio } from "expo-av";
// // import { BlurView } from "expo-blur";
// // import { Stack, useRouter } from "expo-router";
// // import { Ionicons } from "@expo/vector-icons";
// // import Animated, {
// //   useSharedValue,
// //   useAnimatedStyle,
// //   withTiming,
// //   withRepeat,
// //   withSequence,
// //   Easing,
// //   interpolate,
// // } from "react-native-reanimated";
// // import * as Haptics from "expo-haptics";
// // import { activateKeepAwakeAsync } from "expo-keep-awake";
// // import { useSafeAreaInsets } from "react-native-safe-area-context";

// // import {
// //   useGetMeditationStatsQuery,
// //   useRecordSessionMutation,
// //   useUpdateMeditationStatusMutation,
// // } from "../../store/meditationApi";

// // const BELL_SOUND = require("../../assets/sounds/bell.mp3");

// // export default function MeditationTimer() {
// //   const router = useRouter();
// //   const insets = useSafeAreaInsets();
// //   const { data: stats } = useGetMeditationStatsQuery();
// //   const [recordSession] = useRecordSessionMutation();
// //   const [updateStatus] = useUpdateMeditationStatusMutation();

// //   // --- 1. State Hooks ---
// //   const [intervalTime, setIntervalTime] = useState(30);
// //   const [isActive, setIsActive] = useState(false);
// //   const [timeLeft, setTimeLeft] = useState(30 * 60);
// //   const [sound, setSound] = useState<Audio.Sound | null>(null);
// //   const [repeat, setRepeat] = useState(true);

// //   // --- 2. Ref and Animation Hooks (Always at Top Level) ---
// //   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
// //   const pulse = useSharedValue(1);

// //   // --- 3. Keep Awake Logic (Fixed: Imperative call inside Effect) ---
// //   // useEffect(() => {
// //   //   if (isActive) {
// //   //     activateKeepAwakeAsync();
// //   //   } else {
// //   //     deactivateKeepAwakeAsync();
// //   //   }
// //   //   return () => {
// //   //     deactivateKeepAwakeAsync();
// //   //   };
// //   // }, [isActive]);

// //   // --- 4. Sound Loading ---
// //   const loadSound = useCallback(async () => {
// //     try {
// //       const { sound: newSound } = await Audio.Sound.createAsync(BELL_SOUND);
// //       await Audio.setAudioModeAsync({
// //         allowsRecordingIOS: false,
// //         staysActiveInBackground: true,
// //         playsInSilentModeIOS: true,
// //       });
// //       setSound(newSound);
// //     } catch (e) {
// //       console.log("Audio Error:", e);
// //     }
// //   }, []);

// //   useEffect(() => {
// //     loadSound();
// //     return () => {
// //       if (timerRef.current) clearInterval(timerRef.current);
// //       if (sound) sound.unloadAsync();
// //       updateStatus({ isMeditating: false }).catch(() => { });
// //     };
// //   }, [loadSound]);

// //   const playBell = useCallback(async () => {
// //     if (sound) {
// //       await sound.replayAsync();
// //       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
// //     }
// //   }, [sound]);

// //   // --- 5. Timer Core Logic ---
// //   useEffect(() => {
// //     if (isActive && timeLeft > 0) {
// //       timerRef.current = setInterval(() => setTimeLeft((p) => p - 1), 1000);
// //     } else if (timeLeft === 0) {
// //       playBell();
// //       recordSession({ duration: intervalTime }).catch(() => { });
// //       if (repeat) {
// //         setTimeLeft(intervalTime * 60);
// //       } else {
// //         setIsActive(false);
// //         updateStatus({ isMeditating: false }).catch(() => { });
// //       }
// //     }

// //     return () => {
// //       if (timerRef.current) {
// //         clearInterval(timerRef.current);
// //       }
// //     };
// //   }, [isActive, timeLeft, repeat, intervalTime, playBell]);

// //   // --- 6. Animations ---
// //   useEffect(() => {
// //     if (isActive) {
// //       pulse.value = withRepeat(
// //         withSequence(
// //           withTiming(1.15, { duration: 3000, easing: Easing.out(Easing.ease) }),
// //           withTiming(1, { duration: 3000, easing: Easing.in(Easing.ease) })
// //         ),
// //         -1,
// //         true
// //       );
// //     } else {
// //       pulse.value = withTiming(1);
// //     }
// //   }, [isActive]);

// //   const animatedCircleStyle = useAnimatedStyle(() => ({
// //     transform: [{ scale: pulse.value }],
// //     opacity: interpolate(pulse.value, [1, 1.15], [0.3, 0.1]),
// //   }));

// //   // --- 7. Handlers ---
// //   const toggleTimer = () => {
// //     const next = !isActive;
// //     Haptics.impactAsync(next ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
// //     setIsActive(next);
// //     updateStatus({ isMeditating: next }).catch(() => { });
// //   };

// //   const resetTimer = () => {
// //     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
// //     setIsActive(false);
// //     setTimeLeft(intervalTime * 60);
// //     updateStatus({ isMeditating: false }).catch(() => { });
// //   };

// //   const formatTime = (seconds: number) => {
// //     const mins = Math.floor(seconds / 60);
// //     const secs = seconds % 60;
// //     return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
// //   };

// //   return (
// //     <View className="flex-1 bg-[#0F172A]">
// //       <Stack.Screen options={{ headerShown: false }} />

// //       <BlurView intensity={20} tint="dark" className="flex-1" style={{ paddingTop: insets.top }}>
// //         {/* Header */}
// //         <View className="flex-row items-center justify-between px-5 h-16">
// //           <TouchableOpacity
// //             onPress={() => router.back()}
// //             className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center border border-slate-700"
// //           >
// //             <Ionicons name="chevron-back" size={24} color="#94A3B8" />
// //           </TouchableOpacity>
// //           <Text className="text-white font-bold tracking-[2px] uppercase">Meditation</Text>
// //           <View className="w-10" />
// //         </View>

// //         <View className="flex-1 items-center justify-center pb-10">
// //           {/* Status Badge */}
// //           <View className="flex-row items-center bg-slate-800 px-3 py-1.5 rounded-full mb-10 border border-slate-700">
// //             <View className={`w-1.5 h-1.5 rounded-full mr-2 ${isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
// //             <Text className="text-slate-400 text-[10px] font-black tracking-widest uppercase">
// //               {isActive ? "Session Active" : "Ready"}
// //             </Text>
// //           </View>

// //           {/* Timer Circle */}
// //           <View className="w-[280px] h-[280px] items-center justify-center mb-10">
// //             <Animated.View
// //               style={animatedCircleStyle}
// //               className="absolute w-[280px] h-[280px] rounded-full bg-indigo-500"
// //             />
// //             <View className="w-[240px] h-[240px] rounded-full bg-slate-900 border-2 border-slate-800 items-center justify-center shadow-2xl">
// //               <Text className="text-white text-6xl font-extralight tracking-tighter">
// //                 {formatTime(timeLeft)}
// //               </Text>
// //               <Text className="text-slate-500 text-[11px] font-bold tracking-[4px] uppercase mt-2">
// //                 {isActive ? "Breathe" : "Focus"}
// //               </Text>
// //             </View>
// //           </View>

// //           {/* Bottom Panel */}
// //           <View className="w-full px-8 items-center">
// //             <View className="flex-row bg-slate-800/50 p-5 rounded-[32px] mb-8 border border-slate-700 w-full justify-around">
// //               <View className="items-center">
// //                 <Text className="text-white text-lg font-bold">{stats?.totalMinutes || 0}</Text>
// //                 <Text className="text-slate-500 text-[9px] font-black uppercase">Mins</Text>
// //               </View>
// //               <View className="w-[1px] h-8 bg-slate-700" />
// //               <View className="items-center">
// //                 <Text className="text-white text-lg font-bold">{stats?.sessionsCount || 0}</Text>
// //                 <Text className="text-slate-500 text-[9px] font-black uppercase">Sessions</Text>
// //               </View>
// //             </View>

// //             {/* Interval Picker */}
// //             <View className="flex-row bg-slate-800 p-1 rounded-2xl mb-10 border border-slate-700">
// //               {[30, 60].map((t) => (
// //                 <TouchableOpacity
// //                   key={t}
// //                   onPress={() => {
// //                     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
// //                     setIntervalTime(t);
// //                     setTimeLeft(t * 60);
// //                     setIsActive(false);
// //                   }}
// //                   className={`px-8 py-2 rounded-xl ${intervalTime === t ? 'bg-slate-700' : ''}`}
// //                 >
// //                   <Text className={`font-bold ${intervalTime === t ? 'text-white' : 'text-slate-500'}`}>
// //                     {t}m
// //                   </Text>
// //                 </TouchableOpacity>
// //               ))}
// //             </View>

// //             {/* Controls */}
// //             <View className="flex-row items-center justify-center gap-8">
// //               <TouchableOpacity onPress={resetTimer} className="w-12 h-12 rounded-full bg-slate-800 items-center justify-center border border-slate-700">
// //                 <Ionicons name="refresh" size={20} color="#94A3B8" />
// //               </TouchableOpacity>

// //               <TouchableOpacity
// //                 onPress={toggleTimer}
// //                 className={`w-20 h-20 rounded-full items-center justify-center shadow-xl ${isActive ? 'bg-indigo-500' : 'bg-indigo-600'}`}
// //               >
// //                 <Ionicons name={isActive ? "pause" : "play"} size={32} color="white" />
// //               </TouchableOpacity>

// //               <TouchableOpacity onPress={() => setRepeat(!repeat)} className="w-12 h-12 rounded-full bg-slate-800 items-center justify-center border border-slate-700">
// //                 <Ionicons name="infinite" size={20} color={repeat ? "#6366F1" : "#475569"} />
// //               </TouchableOpacity>
// //             </View>
// //           </View>
// //         </View>
// //       </BlurView>
// //     </View>
// //   );
// // }
// // // import React, { useState, useEffect, useRef, useCallback } from "react";
// // // import { View, Text, TouchableOpacity, Platform } from "react-native";
// // // import { Audio } from "expo-av";
// // // import { BlurView } from "expo-blur";
// // // import { Stack, useRouter } from "expo-router";
// // // import { Ionicons } from "@expo/vector-icons";
// // // import Animated, {
// // //   useSharedValue,
// // //   useAnimatedStyle,
// // //   withTiming,
// // //   withRepeat,
// // //   withSequence,
// // //   Easing,
// // //   interpolate,
// // // } from "react-native-reanimated";
// // // import * as Haptics from "expo-haptics";
// // // import { useKeepAwake } from "expo-keep-awake";
// // // import { useSafeAreaInsets } from "react-native-safe-area-context";

// // // import {
// // //   useGetMeditationStatsQuery,
// // //   useRecordSessionMutation,
// // //   useUpdateMeditationStatusMutation,
// // // } from "../../store/meditationApi";

// // // const BELL_SOUND = require("../../assets/sounds/bell.mp3");

// // // export default function MeditationTimer() {
// // //   const router = useRouter();
// // //   const insets = useSafeAreaInsets();
// // //   const { data: stats } = useGetMeditationStatsQuery();
// // //   const [recordSession] = useRecordSessionMutation();
// // //   const [updateStatus] = useUpdateMeditationStatusMutation();

// // //   const [intervalTime, setIntervalTime] = useState(30);
// // //   const [isActive, setIsActive] = useState(false);
// // //   const [timeLeft, setTimeLeft] = useState(30 * 60);
// // //   const [sound, setSound] = useState<Audio.Sound | null>(null);
// // //   const [repeat, setRepeat] = useState(true);

// // //   if (isActive) useKeepAwake();

// // //   const pulse = useSharedValue(1);
// // //   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

// // //   const loadSound = useCallback(async () => {
// // //     try {
// // //       const { sound: newSound } = await Audio.Sound.createAsync(BELL_SOUND);
// // //       await Audio.setAudioModeAsync({
// // //         allowsRecordingIOS: false,
// // //         staysActiveInBackground: true,
// // //         playsInSilentModeIOS: true,
// // //       });
// // //       setSound(newSound);
// // //     } catch (e) {
// // //       console.log("Audio Init Error", e);
// // //     }
// // //   }, []);

// // //   useEffect(() => {
// // //     loadSound();
// // //     return () => {
// // //       if (timerRef.current) clearInterval(timerRef.current);
// // //       if (sound) sound.unloadAsync();
// // //       updateStatus({ isMeditating: false }).catch(() => { });
// // //     };
// // //   }, [loadSound, sound, updateStatus]);

// // //   const playBell = useCallback(async () => {
// // //     if (sound) {
// // //       await sound.replayAsync();
// // //       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
// // //     }
// // //   }, [sound]);

// // //   useEffect(() => {
// // //     if (isActive && timeLeft > 0) {
// // //       timerRef.current = setInterval(() => setTimeLeft((p) => p - 1), 1000);
// // //     } else if (timeLeft === 0) {
// // //       playBell();
// // //       recordSession({ duration: intervalTime }).catch(() => { });

// // //       if (repeat) {
// // //         setTimeLeft(intervalTime * 60);
// // //       } else {
// // //         setIsActive(false);
// // //         updateStatus({ isMeditating: false }).catch(() => { });
// // //       }
// // //     }

// // //     // FIXED CLEANUP: Wrap in braces so it returns 'void'
// // //     return () => {
// // //       if (timerRef.current) {
// // //         clearInterval(timerRef.current);
// // //       }
// // //     };
// // //   }, [isActive, timeLeft, repeat, intervalTime, playBell, recordSession, updateStatus]);

// // //   useEffect(() => {
// // //     isActive
// // //       ? (pulse.value = withRepeat(withSequence(withTiming(1.15, { duration: 3000 }), withTiming(1, { duration: 3000 })), -1, true))
// // //       : (pulse.value = withTiming(1));
// // //   }, [isActive]);

// // //   const animatedCircleStyle = useAnimatedStyle(() => ({
// // //     transform: [{ scale: pulse.value }],
// // //     opacity: interpolate(pulse.value, [1, 1.15], [0.3, 0.1]),
// // //   }));

// // //   const formatTime = (seconds: number) => {
// // //     const mins = Math.floor(seconds / 60);
// // //     const secs = seconds % 60;
// // //     return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
// // //   };

// // //   return (
// // //     <View className="flex-1 bg-[#0F172A]">
// // //       <Stack.Screen options={{ headerShown: false }} />

// // //       <BlurView intensity={20} tint="dark" className="flex-1" style={{ paddingTop: insets.top }}>
// // //         {/* Navigation */}
// // //         <View className="flex-row items-center justify-between px-5 h-16">
// // //           <TouchableOpacity
// // //             onPress={() => router.back()}
// // //             className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center border border-slate-700"
// // //           >
// // //             <Ionicons name="chevron-back" size={24} color="#94A3B8" />
// // //           </TouchableOpacity>
// // //           <Text className="text-white font-bold tracking-[2px] uppercase">Meditation</Text>
// // //           <View className="w-10" />
// // //         </View>

// // //         <View className="flex-1 items-center justify-center pb-10">
// // //           {/* Status Badge */}
// // //           <View className="flex-row items-center bg-slate-800 px-3 py-1.5 rounded-full mb-10 border border-slate-700">
// // //             <View className={`w-1.5 h-1.5 rounded-full mr-2 ${isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
// // //             <Text className="text-slate-400 text-[10px] font-black tracking-widest uppercase">
// // //               {isActive ? "Session Active" : "Ready"}
// // //             </Text>
// // //           </View>

// // //           {/* Timer Display */}
// // //           <View className="w-[280px] h-[280px] items-center justify-center mb-10">
// // //             <Animated.View
// // //               style={animatedCircleStyle}
// // //               className="absolute w-[280px] h-[280px] rounded-full bg-indigo-500"
// // //             />
// // //             <View className="w-[240px] h-[240px] rounded-full bg-slate-800 border-2 border-slate-700 items-center justify-center shadow-2xl">
// // //               <Text className="text-white text-6xl font-extralight tracking-tighter">
// // //                 {formatTime(timeLeft)}
// // //               </Text>
// // //               <Text className="text-slate-500 text-[11px] font-bold tracking-[4px] uppercase mt-2">
// // //                 {isActive ? "Breathe" : "Focus"}
// // //               </Text>
// // //             </View>
// // //           </View>

// // //           <View className="w-full px-8 items-center">
// // //             {/* Stats Card */}
// // //             <View className="flex-row bg-slate-800 p-5 rounded-[32px] mb-8 border border-slate-700 w-full justify-around">
// // //               <View className="items-center">
// // //                 <Text className="text-white text-lg font-bold">{stats?.totalMinutes || 0}</Text>
// // //                 <Text className="text-slate-500 text-[9px] font-black uppercase">Mins</Text>
// // //               </View>
// // //               <View className="w-[1px] h-8 bg-slate-700" />
// // //               <View className="items-center">
// // //                 <Text className="text-white text-lg font-bold">{stats?.sessionsCount || 0}</Text>
// // //                 <Text className="text-slate-500 text-[9px] font-black uppercase">Sessions</Text>
// // //               </View>
// // //             </View>

// // //             {/* Time Selector */}
// // //             <View className="flex-row bg-slate-800 p-1 rounded-2xl mb-10 border border-slate-700">
// // //               {[30, 60].map((t) => (
// // //                 <TouchableOpacity
// // //                   key={t}
// // //                   onPress={() => {
// // //                     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
// // //                     setIntervalTime(t);
// // //                     setTimeLeft(t * 60);
// // //                     setIsActive(false);
// // //                   }}
// // //                   className={`px-8 py-2 rounded-xl ${intervalTime === t ? 'bg-slate-700' : ''}`}
// // //                 >
// // //                   <Text className={`font-bold ${intervalTime === t ? 'text-white' : 'text-slate-500'}`}>
// // //                     {t}m
// // //                   </Text>
// // //                 </TouchableOpacity>
// // //               ))}
// // //             </View>

// // //             {/* Controls */}
// // //             <View className="flex-row items-center justify-center space-x-10 gap-8">
// // //               <TouchableOpacity
// // //                 onPress={resetTimer}
// // //                 className="w-12 h-12 rounded-full bg-slate-800 items-center justify-center border border-slate-700"
// // //               >
// // //                 <Ionicons name="refresh" size={20} color="#94A3B8" />
// // //               </TouchableOpacity>

// // //               <TouchableOpacity
// // //                 onPress={toggleTimer}
// // //                 activeOpacity={0.8}
// // //                 className={`w-20 h-20 rounded-full items-center justify-center shadow-xl ${isActive ? 'bg-indigo-500 shadow-indigo-500/50' : 'bg-indigo-600 shadow-indigo-900/50'}`}
// // //               >
// // //                 <Ionicons name={isActive ? "pause" : "play"} size={32} color="white" />
// // //               </TouchableOpacity>

// // //               <TouchableOpacity
// // //                 onPress={() => setRepeat(!repeat)}
// // //                 className="w-12 h-12 rounded-full bg-slate-800 items-center justify-center border border-slate-700"
// // //               >
// // //                 <Ionicons name="infinite" size={20} color={repeat ? "#6366F1" : "#475569"} />
// // //               </TouchableOpacity>
// // //             </View>
// // //           </View>
// // //         </View>
// // //       </BlurView>
// // //     </View>
// // //   );

// // //   function resetTimer() {
// // //     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
// // //     setIsActive(false);
// // //     setTimeLeft(intervalTime * 60);
// // //     updateStatus({ isMeditating: false });
// // //   }

// // //   function toggleTimer() {
// // //     const next = !isActive;
// // //     Haptics.impactAsync(next ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
// // //     setIsActive(next);
// // //     updateStatus({ isMeditating: next });
// // //   }
// // // }
// // // // import React, { useState, useEffect } from "react";
// // // // import {
// // // //   View,
// // // //   Text,
// // // //   StyleSheet,
// // // //   TouchableOpacity,
// // // //   Platform,
// // // // } from "react-native";
// // // // import { Audio } from "expo-av";
// // // // import { LinearGradient } from "expo-linear-gradient";
// // // // import { Stack } from "expo-router";
// // // // import { Ionicons } from "@expo/vector-icons";
// // // // import Animated, {
// // // //   useSharedValue,
// // // //   useAnimatedStyle,
// // // //   withTiming,
// // // //   withRepeat,
// // // //   withSequence,
// // // //   Easing,
// // // //   interpolate,
// // // // } from "react-native-reanimated";
// // // // import * as Haptics from "expo-haptics";

// // // // import {
// // // //   useGetMeditationStatsQuery,
// // // //   useRecordSessionMutation,
// // // //   useUpdateMeditationStatusMutation,
// // // // } from "../../store/meditationApi";

// // // // const BELL_SOUND = require("../../assets/sounds/bell.mp3");

// // // // const MeditationTimer = () => {
// // // //   const { data: stats } = useGetMeditationStatsQuery();
// // // //   const [recordSession] = useRecordSessionMutation();
// // // //   const [updateStatus] = useUpdateMeditationStatusMutation();

// // // //   const [intervalTime, setIntervalTime] = useState(30); // 30 or 60 minutes
// // // //   const [isActive, setIsActive] = useState(false);
// // // //   const [timeLeft, setTimeLeft] = useState(30 * 60); // In seconds
// // // //   const [sound, setSound] = useState<Audio.Sound | null>(null);
// // // //   const [repeat, setRepeat] = useState(true);

// // // //   const pulse = useSharedValue(1);

// // // //   const loadSound = React.useCallback(async () => {
// // // //     try {
// // // //       if (sound) {
// // // //         await sound.unloadAsync();
// // // //       }
// // // //       const { sound: newSound } = await Audio.Sound.createAsync(BELL_SOUND);
// // // //       setSound(newSound);
// // // //     } catch {
// // // //       // Failed to load sound
// // // //     }
// // // //   }, [sound]);

// // // //   useEffect(() => {
// // // //     loadSound();
// // // //     return () => {
// // // //       if (sound) {
// // // //         sound.unloadAsync();
// // // //       }
// // // //     };
// // // //     // eslint-disable-next-line react-hooks/exhaustive-deps
// // // //   }, []);

// // // //   const playBell = React.useCallback(async () => {
// // // //     if (sound) {
// // // //       try {
// // // //         await sound.replayAsync();
// // // //         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
// // // //       } catch {
// // // //         // Reload sound if it failed
// // // //         const { sound: newSound } = await Audio.Sound.createAsync(BELL_SOUND);
// // // //         setSound(newSound);
// // // //         await newSound.playAsync();
// // // //       }
// // // //     } else {
// // // //       loadSound().then(() => playBell());
// // // //     }
// // // //   }, [sound, loadSound]);

// // // //   useEffect(() => {
// // // //     let timer: any;
// // // //     if (isActive && timeLeft > 0) {
// // // //       timer = setInterval(() => {
// // // //         setTimeLeft((prev) => prev - 1);
// // // //       }, 1000);
// // // //     } else if (isActive && timeLeft === 0) {
// // // //       playBell();

// // // //       // Record session to backend
// // // //       recordSession({ duration: intervalTime }).catch(console.error);

// // // //       if (repeat) {
// // // //         setTimeLeft(intervalTime * 60);
// // // //       } else {
// // // //         setIsActive(false);
// // // //         updateStatus({ isMeditating: false }).catch(console.error);
// // // //       }
// // // //     }
// // // //     return () => clearInterval(timer);
// // // //   }, [
// // // //     isActive,
// // // //     timeLeft,
// // // //     repeat,
// // // //     intervalTime,
// // // //     playBell,
// // // //     recordSession,
// // // //     updateStatus,
// // // //   ]);

// // // //   useEffect(() => {
// // // //     if (isActive) {
// // // //       pulse.value = withRepeat(
// // // //         withSequence(
// // // //           withTiming(1.1, {
// // // //             duration: 2000,
// // // //             easing: Easing.inOut(Easing.ease),
// // // //           }),
// // // //           withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
// // // //         ),
// // // //         -1,
// // // //         true,
// // // //       );
// // // //     } else {
// // // //       pulse.value = withTiming(1);
// // // //     }
// // // //   }, [isActive, pulse]);

// // // //   const animatedCircleStyle = useAnimatedStyle(() => {
// // // //     return {
// // // //       transform: [{ scale: pulse.value }],
// // // //       opacity: interpolate(pulse.value, [1, 1.1], [0.6, 0.4]),
// // // //     };
// // // //   });

// // // //   const toggleTimer = () => {
// // // //     const nextState = !isActive;
// // // //     if (nextState) {
// // // //       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
// // // //     } else {
// // // //       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
// // // //     }
// // // //     setIsActive(nextState);
// // // //     updateStatus({ isMeditating: nextState }).catch(console.error);
// // // //   };

// // // //   const resetTimer = () => {
// // // //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
// // // //     setIsActive(false);
// // // //     setTimeLeft(intervalTime * 60);
// // // //     updateStatus({ isMeditating: false }).catch(console.error);
// // // //   };

// // // //   const selectInterval = (time: number) => {
// // // //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
// // // //     setIntervalTime(time);
// // // //     setTimeLeft(time * 60);
// // // //     setIsActive(false);
// // // //     updateStatus({ isMeditating: false }).catch(console.error);
// // // //   };

// // // //   const formatTime = (seconds: number) => {
// // // //     const mins = Math.floor(seconds / 60);
// // // //     const secs = seconds % 60;
// // // //     return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
// // // //   };

// // // //   return (
// // // //     <View style={styles.container}>
// // // //       <Stack.Screen
// // // //         options={{
// // // //           title: "Meditation Timer",
// // // //           headerTransparent: true,
// // // //           headerTintColor: "#fff",
// // // //           headerTitleStyle: { fontWeight: "600" },
// // // //         }}
// // // //       />
// // // //       <LinearGradient
// // // //         colors={["#0f172a", "#1e293b", "#334155"]}
// // // //         style={StyleSheet.absoluteFill}
// // // //       />

// // // //       <View style={styles.content}>
// // // //         <View style={styles.header}>
// // // //           <Text style={styles.title}>Focus Timer</Text>
// // // //           <TouchableOpacity
// // // //             onPress={() => setRepeat(!repeat)}
// // // //             style={[styles.repeatToggle, repeat && styles.repeatToggleActive]}
// // // //           >
// // // //             <Ionicons
// // // //               name={repeat ? "repeat" : "repeat-outline"}
// // // //               size={20}
// // // //               color={repeat ? "#fff" : "#94a3b8"}
// // // //             />
// // // //             <Text
// // // //               style={[styles.repeatText, repeat && styles.repeatTextActive]}
// // // //             >
// // // //               {repeat ? "Continuous" : "Single Session"}
// // // //             </Text>
// // // //           </TouchableOpacity>
// // // //         </View>

// // // //         <View style={styles.timerWrapper}>
// // // //           <Animated.View style={[styles.pulseCircle, animatedCircleStyle]} />
// // // //           <View style={styles.timerCircle}>
// // // //             <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
// // // //             <Text style={styles.timerSubheader}>
// // // //               {isActive ? "Breathe Deeply" : "Peaceful Mind"}
// // // //             </Text>
// // // //           </View>
// // // //         </View>

// // // //         <View style={styles.controls}>
// // // //           {stats?.totalMinutes > 0 && (
// // // //             <View style={styles.statsRow}>
// // // //               <View className="items-center">
// // // //                 <Text style={styles.statsValue}>{stats.totalMinutes}</Text>
// // // //                 <Text style={styles.statsLabel}>Minutes</Text>
// // // //               </View>
// // // //               <View style={styles.statsDivider} />
// // // //               <View className="items-center">
// // // //                 <Text style={styles.statsValue}>{stats.sessionsCount}</Text>
// // // //                 <Text style={styles.statsLabel}>Sessions</Text>
// // // //               </View>
// // // //             </View>
// // // //           )}

// // // //           <View style={styles.intervalOptions}>
// // // //             <TouchableOpacity
// // // //               onPress={() => selectInterval(30)}
// // // //               style={[
// // // //                 styles.intervalBtn,
// // // //                 intervalTime === 30 && styles.intervalBtnActive,
// // // //               ]}
// // // //             >
// // // //               <Text
// // // //                 style={[
// // // //                   styles.intervalBtnText,
// // // //                   intervalTime === 30 && styles.intervalBtnTextActive,
// // // //                 ]}
// // // //               >
// // // //                 30 Min
// // // //               </Text>
// // // //             </TouchableOpacity>
// // // //             <TouchableOpacity
// // // //               onPress={() => selectInterval(60)}
// // // //               style={[
// // // //                 styles.intervalBtn,
// // // //                 intervalTime === 60 && styles.intervalBtnActive,
// // // //               ]}
// // // //             >
// // // //               <Text
// // // //                 style={[
// // // //                   styles.intervalBtnText,
// // // //                   intervalTime === 60 && styles.intervalBtnTextActive,
// // // //                 ]}
// // // //               >
// // // //                 1 Hour
// // // //               </Text>
// // // //             </TouchableOpacity>
// // // //           </View>

// // // //           <View style={styles.actionRow}>
// // // //             <TouchableOpacity onPress={resetTimer} style={styles.secondaryBtn}>
// // // //               <Ionicons name="refresh-outline" size={24} color="#94a3b8" />
// // // //             </TouchableOpacity>

// // // //             <TouchableOpacity onPress={toggleTimer} style={styles.mainBtn}>
// // // //               <View style={styles.playIconBox}>
// // // //                 <Ionicons
// // // //                   name={isActive ? "pause" : "play"}
// // // //                   size={32}
// // // //                   color="#fff"
// // // //                   style={{ marginLeft: isActive ? 0 : 4 }}
// // // //                 />
// // // //               </View>
// // // //             </TouchableOpacity>

// // // //             <TouchableOpacity onPress={playBell} style={styles.secondaryBtn}>
// // // //               <Ionicons
// // // //                 name="notifications-outline"
// // // //                 size={24}
// // // //                 color="#94a3b8"
// // // //               />
// // // //             </TouchableOpacity>
// // // //           </View>
// // // //         </View>
// // // //       </View>
// // // //     </View>
// // // //   );
// // // // };

// // // // const styles = StyleSheet.create({
// // // //   container: {
// // // //     flex: 1,
// // // //     backgroundColor: "#0f172a",
// // // //   },
// // // //   content: {
// // // //     flex: 1,
// // // //     alignItems: "center",
// // // //     justifyContent: "center",
// // // //     paddingHorizontal: 20,
// // // //   },
// // // //   header: {
// // // //     alignItems: "center",
// // // //     marginBottom: 40,
// // // //   },
// // // //   title: {
// // // //     fontSize: 24,
// // // //     fontWeight: "300",
// // // //     color: "#fff",
// // // //     letterSpacing: 8,
// // // //     textTransform: "uppercase",
// // // //     marginBottom: 16,
// // // //   },
// // // //   repeatToggle: {
// // // //     flexDirection: "row",
// // // //     alignItems: "center",
// // // //     backgroundColor: "rgba(255, 255, 255, 0.05)",
// // // //     paddingVertical: 8,
// // // //     paddingHorizontal: 16,
// // // //     borderRadius: 20,
// // // //     gap: 8,
// // // //     borderWidth: 1,
// // // //     borderColor: "rgba(255, 255, 255, 0.1)",
// // // //   },
// // // //   repeatToggleActive: {
// // // //     backgroundColor: "rgba(59, 130, 246, 0.2)",
// // // //     borderColor: "rgba(59, 130, 246, 0.3)",
// // // //   },
// // // //   repeatText: {
// // // //     color: "#94a3b8",
// // // //     fontSize: 12,
// // // //     fontWeight: "500",
// // // //     textTransform: "uppercase",
// // // //     letterSpacing: 1,
// // // //   },
// // // //   repeatTextActive: {
// // // //     color: "#fff",
// // // //   },
// // // //   timerWrapper: {
// // // //     width: 280,
// // // //     height: 280,
// // // //     alignItems: "center",
// // // //     justifyContent: "center",
// // // //     marginBottom: 60,
// // // //   },
// // // //   timerCircle: {
// // // //     width: 260,
// // // //     height: 260,
// // // //     borderRadius: 130,
// // // //     borderWidth: 1,
// // // //     borderColor: "rgba(255, 255, 255, 0.2)",
// // // //     backgroundColor: "rgba(255, 255, 255, 0.05)",
// // // //     alignItems: "center",
// // // //     justifyContent: "center",
// // // //     shadowColor: "#fff",
// // // //     shadowOffset: { width: 0, height: 0 },
// // // //     shadowOpacity: 0.1,
// // // //     shadowRadius: 20,
// // // //     elevation: 5,
// // // //   },
// // // //   pulseCircle: {
// // // //     position: "absolute",
// // // //     width: 260,
// // // //     height: 260,
// // // //     borderRadius: 130,
// // // //     backgroundColor: "rgba(255, 255, 255, 0.1)",
// // // //   },
// // // //   timerText: {
// // // //     fontSize: 54,
// // // //     fontWeight: "200",
// // // //     color: "#fff",
// // // //     fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
// // // //     letterSpacing: 2,
// // // //   },
// // // //   timerSubheader: {
// // // //     fontSize: 14,
// // // //     color: "#94a3b8",
// // // //     textTransform: "uppercase",
// // // //     letterSpacing: 4,
// // // //     marginTop: 8,
// // // //   },
// // // //   controls: {
// // // //     width: "100%",
// // // //     alignItems: "center",
// // // //   },
// // // //   statsRow: {
// // // //     flexDirection: "row",
// // // //     alignItems: "center",
// // // //     marginBottom: 32,
// // // //     gap: 32,
// // // //     backgroundColor: "rgba(255, 255, 255, 0.03)",
// // // //     paddingVertical: 12,
// // // //     paddingHorizontal: 24,
// // // //     borderRadius: 16,
// // // //     borderWidth: 1,
// // // //     borderColor: "rgba(255, 255, 255, 0.05)",
// // // //   },
// // // //   statsValue: {
// // // //     fontSize: 20,
// // // //     fontWeight: "600",
// // // //     color: "#fff",
// // // //   },
// // // //   statsLabel: {
// // // //     fontSize: 10,
// // // //     color: "#94a3b8",
// // // //     textTransform: "uppercase",
// // // //     letterSpacing: 1,
// // // //     marginTop: 2,
// // // //   },
// // // //   statsDivider: {
// // // //     width: 1,
// // // //     height: 24,
// // // //     backgroundColor: "rgba(255, 255, 255, 0.1)",
// // // //   },
// // // //   intervalOptions: {
// // // //     flexDirection: "row",
// // // //     backgroundColor: "rgba(255, 255, 255, 0.05)",
// // // //     borderRadius: 16,
// // // //     padding: 6,
// // // //     marginBottom: 32,
// // // //     borderWidth: 1,
// // // //     borderColor: "rgba(255, 255, 255, 0.1)",
// // // //   },
// // // //   intervalBtn: {
// // // //     paddingVertical: 10,
// // // //     paddingHorizontal: 24,
// // // //     borderRadius: 12,
// // // //   },
// // // //   intervalBtnActive: {
// // // //     backgroundColor: "rgba(255, 255, 255, 0.1)",
// // // //   },
// // // //   intervalBtnText: {
// // // //     color: "#94a3b8",
// // // //     fontSize: 15,
// // // //     fontWeight: "500",
// // // //   },
// // // //   intervalBtnTextActive: {
// // // //     color: "#fff",
// // // //   },
// // // //   actionRow: {
// // // //     flexDirection: "row",
// // // //     alignItems: "center",
// // // //     justifyContent: "center",
// // // //     gap: 40,
// // // //   },
// // // //   mainBtn: {
// // // //     width: 80,
// // // //     height: 80,
// // // //     borderRadius: 40,
// // // //     backgroundColor: "rgba(255, 255, 255, 0.15)",
// // // //     alignItems: "center",
// // // //     justifyContent: "center",
// // // //     borderWidth: 1,
// // // //     borderColor: "rgba(255, 255, 255, 0.2)",
// // // //   },
// // // //   playIconBox: {
// // // //     width: 64,
// // // //     height: 64,
// // // //     borderRadius: 32,
// // // //     backgroundColor: "#3b82f6",
// // // //     alignItems: "center",
// // // //     justifyContent: "center",
// // // //     shadowColor: "#3b82f6",
// // // //     shadowOffset: { width: 0, height: 4 },
// // // //     shadowOpacity: 0.3,
// // // //     shadowRadius: 10,
// // // //   },
// // // //   secondaryBtn: {
// // // //     width: 48,
// // // //     height: 48,
// // // //     borderRadius: 24,
// // // //     backgroundColor: "rgba(255, 255, 255, 0.05)",
// // // //     alignItems: "center",
// // // //     justifyContent: "center",
// // // //     borderWidth: 1,
// // // //     borderColor: "rgba(255, 255, 255, 0.1)",
// // // //   },
// // // // });

// // // // export default MeditationTimer;
