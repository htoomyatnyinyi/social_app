import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import { RTCView as NativeRTCView, MediaStream } from "react-native-webrtc";
import { Ionicons } from "@expo/vector-icons";
import { CallState, CallType } from "../hooks/useWebRTC";
import { Image } from "expo-image";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

// RTCView Wrapper: Uses inline style to ensure Native WebRTC renders correctly
const RTCView = !!NativeRTCView
  ? NativeRTCView
  : (props: any) => (
      <View
        className="bg-slate-950 items-center justify-center"
        style={props.style}
      >
        <Ionicons name="videocam-off" size={40} color="#334155" />
        <Text className="text-slate-500 text-[10px] mt-3 font-black uppercase tracking-widest">
          Video Not Available
        </Text>
      </View>
    );

interface CallOverlayProps {
  callState: CallState;
  callType: CallType;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callerName?: string;
  callerImage?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerPhone: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleSpeaker: () => void;
}

export default function CallOverlay({
  callState,
  callType,
  localStream,
  remoteStream,
  callerName = "User",
  callerImage,
  isMuted,
  isVideoOff,
  isSpeakerPhone,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
}: CallOverlayProps) {
  const insets = useSafeAreaInsets();

  if (callState === "IDLE") return null;

  // Haptic Feedback Handlers
  const handleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleMute();
  };
  const handleVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleVideo();
  };
  const handleSpeaker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSpeaker();
  };
  const handleAccept = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAccept();
  };
  const handleReject = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    onReject();
  };
  const handleEnd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEnd();
  };

  return (
    <Modal
      visible={true}
      animationType="fade"
      transparent={false}
      presentationStyle="fullScreen"
    >
      <View className="flex-1 bg-slate-950">
        {/* REMOTE VIDEO LAYER: Uses StyleSheet.absoluteFill for reliable rendering */}
        {callState === "CONNECTED" && callType === "video" && remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={StyleSheet.absoluteFill}
            objectFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center pb-32">
            <View className="shadow-2xl shadow-sky-500/40">
              <Image
                source={{
                  uri:
                    callerImage ||
                    `https://api.dicebear.com/7.x/avataaars/png?seed=${callerName}`,
                }}
                className="w-40 h-40 rounded-full border-[6px] border-sky-500/20 bg-slate-900"
                contentFit="cover"
                transition={500}
              />
            </View>
            <Text className="text-white text-4xl font-black tracking-tighter mt-8">
              {callerName}
            </Text>
            <View className="mt-4 px-4 py-1.5 rounded-full bg-white/10 border border-white/10">
              <Text className="text-sky-400 text-[11px] font-black uppercase tracking-[2px]">
                {callState === "RINGING"
                  ? `Incoming ${callType}`
                  : callState === "CALLING"
                    ? "Connecting..."
                    : callState === "CONNECTED"
                      ? "Voice Active"
                      : "Ending..."}
              </Text>
            </View>
          </View>
        )}

        {/* PIP (Local Video): Uses style for width/height/zIndex to keep it on top */}
        {(callState === "CONNECTED" || callState === "CALLING") &&
          callType === "video" &&
          localStream &&
          !isVideoOff && (
            <View
              className="absolute top-14 right-5 rounded-[24px] overflow-hidden border-2 border-white/20 bg-black shadow-2xl"
              style={{ width: 112, height: 160, zIndex: 10 }}
            >
              <RTCView
                streamURL={localStream.toURL()}
                style={{ flex: 1 }}
                objectFit="cover"
                zOrder={1}
              />
            </View>
          )}

        {/* CONTROLS (Arkta Zen Blur) */}
        <View className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-[48px]">
          <BlurView intensity={40} tint="dark" className="px-8 pt-10 pb-12">
            <SafeAreaView edges={["bottom"]}>
              {callState === "RINGING" ? (
                <View className="flex-row justify-around items-center">
                  <TouchableOpacity
                    onPress={handleReject}
                    className="w-20 h-20 rounded-full bg-rose-500 items-center justify-center shadow-lg shadow-rose-900/40"
                  >
                    <Ionicons name="close" size={32} color="white" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleAccept}
                    className="w-20 h-20 rounded-full bg-emerald-500 items-center justify-center shadow-lg shadow-emerald-900/40"
                  >
                    <Ionicons
                      name={callType === "video" ? "videocam" : "call"}
                      size={32}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row justify-between items-center">
                  <View className="items-center">
                    <TouchableOpacity
                      onPress={handleMute}
                      className={`w-14 h-14 rounded-full items-center justify-center ${isMuted ? "bg-sky-500" : "bg-white/10"}`}
                    >
                      <Ionicons
                        name={isMuted ? "mic-off" : "mic"}
                        size={24}
                        color="white"
                      />
                    </TouchableOpacity>
                    <Text className="text-white/40 text-[9px] font-black uppercase mt-3">
                      {isMuted ? "Muted" : "Mute"}
                    </Text>
                  </View>

                  {callType === "video" && (
                    <View className="items-center">
                      <TouchableOpacity
                        onPress={handleVideo}
                        className={`w-14 h-14 rounded-full items-center justify-center ${isVideoOff ? "bg-sky-500" : "bg-white/10"}`}
                      >
                        <Ionicons
                          name={isVideoOff ? "videocam-off" : "videocam"}
                          size={24}
                          color="white"
                        />
                      </TouchableOpacity>
                      <Text className="text-white/40 text-[9px] font-black uppercase mt-3">
                        Camera
                      </Text>
                    </View>
                  )}

                  <View className="items-center">
                    <TouchableOpacity
                      onPress={handleSpeaker}
                      className={`w-14 h-14 rounded-full items-center justify-center ${isSpeakerPhone ? "bg-sky-500" : "bg-white/10"}`}
                    >
                      <Ionicons
                        name={isSpeakerPhone ? "volume-high" : "volume-medium"}
                        size={24}
                        color="white"
                      />
                    </TouchableOpacity>
                    <Text className="text-white/40 text-[9px] font-black uppercase mt-3">
                      Speaker
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleEnd}
                    className="w-20 h-20 rounded-full bg-rose-500 items-center justify-center shadow-lg shadow-rose-900/40"
                  >
                    <Ionicons
                      name="call"
                      size={32}
                      color="white"
                      style={{ transform: [{ rotate: "135deg" }] }}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </SafeAreaView>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}
// import React from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Modal,
//   StyleSheet,
//   Dimensions,
//   Platform,
// } from "react-native";
// import { RTCView as NativeRTCView, MediaStream } from "react-native-webrtc";
// import { Ionicons } from "@expo/vector-icons";
// import { CallState, CallType } from "../hooks/useWebRTC";
// import { Image } from "expo-image";
// import {
//   SafeAreaView,
//   useSafeAreaInsets,
// } from "react-native-safe-area-context";
// import { BlurView } from "expo-blur";
// import * as Haptics from "expo-haptics";

// // Mock RTCView for Expo Go
// const RTCView = !!NativeRTCView
//   ? NativeRTCView
//   : (props: any) => (
//       <View
//         style={[
//           props.style,
//           {
//             backgroundColor: "#0F172A",
//             alignItems: "center",
//             justifyContent: "center",
//           },
//         ]}
//       >
//         <Ionicons name="videocam-off" size={40} color="#334155" />
//         <Text
//           style={{
//             color: "#475569",
//             fontSize: 12,
//             marginTop: 10,
//             fontWeight: "700",
//             textTransform: "uppercase",
//           }}
//         >
//           Video Not Available
//         </Text>
//       </View>
//     );

// interface CallOverlayProps {
//   callState: CallState;
//   callType: CallType;
//   localStream: MediaStream | null;
//   remoteStream: MediaStream | null;
//   callerName?: string;
//   callerImage?: string;
//   isMuted: boolean;
//   isVideoOff: boolean;
//   isSpeakerPhone: boolean;
//   onAccept: () => void;
//   onReject: () => void;
//   onEnd: () => void;
//   onToggleMute: () => void;
//   onToggleVideo: () => void;
//   onToggleSpeaker: () => void;
// }

// const { width, height } = Dimensions.get("window");

// export default function CallOverlay({
//   callState,
//   callType,
//   localStream,
//   remoteStream,
//   callerName = "User",
//   callerImage,
//   isMuted,
//   isVideoOff,
//   isSpeakerPhone,
//   onAccept,
//   onReject,
//   onEnd,
//   onToggleMute,
//   onToggleVideo,
//   onToggleSpeaker,
// }: CallOverlayProps) {
//   const insets = useSafeAreaInsets();

//   if (callState === "IDLE") return null;

//   const handleMute = () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     onToggleMute();
//   };

//   const handleVideo = () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     onToggleVideo();
//   };

//   const handleSpeaker = () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     onToggleSpeaker();
//   };

//   const handleAccept = () => {
//     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
//     onAccept();
//   };

//   const handleReject = () => {
//     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
//     onReject();
//   };

//   const handleEnd = () => {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//     onEnd();
//   };

//   return (
//     <Modal
//       visible={true}
//       animationType="fade"
//       transparent={false}
//       presentationStyle="fullScreen"
//     >
//       <View style={styles.container}>
//         {/* BACKGROUND LAYER */}
//         {callState === "CONNECTED" &&
//         callType === "video" &&
//         remoteStream &&
//         !remoteStream.getVideoTracks().every((t) => !t.enabled) ? (
//           <RTCView
//             streamURL={remoteStream.toURL()}
//             style={styles.fullScreenVideo}
//             objectFit="cover"
//           />
//         ) : (
//           <View style={styles.centeredContent}>
//             <View className="shadow-2xl shadow-sky-500/20">
//               <Image
//                 source={{
//                   uri:
//                     callerImage ||
//                     `https://api.dicebear.com/7.x/avataaars/png?seed=${callerName}`,
//                 }}
//                 style={styles.largeAvatar}
//                 contentFit="cover"
//                 transition={500}
//               />
//             </View>
//             <Text style={styles.callerName}>{callerName}</Text>
//             <View style={styles.statusBadge}>
//               <Text style={styles.callStatus}>
//                 {callState === "RINGING"
//                   ? `Incoming ${callType} Call`
//                   : callState === "CALLING"
//                     ? "Connecting..."
//                     : callState === "CONNECTED"
//                       ? "Voice Call Connected"
//                       : "Call Ended"}
//               </Text>
//             </View>
//           </View>
//         )}

//         {/* PICTURE IN PICTURE (Local Video) */}
//         {(callState === "CONNECTED" || callState === "CALLING") &&
//           callType === "video" &&
//           localStream &&
//           !isVideoOff && (
//             <View style={styles.pipContainer}>
//               <RTCView
//                 streamURL={localStream.toURL()}
//                 style={styles.pipVideo}
//                 objectFit="cover"
//                 zOrder={1}
//               />
//             </View>
//           )}

//         {/* CONTROLS LAYER */}
//         <BlurView intensity={30} tint="dark" style={styles.bottomBlur}>
//           <SafeAreaView edges={["bottom"]}>
//             <View style={styles.controlsContainer}>
//               {callState === "RINGING" ? (
//                 <View style={styles.ringingRow}>
//                   <TouchableOpacity
//                     style={[styles.mainButton, styles.declineButton]}
//                     onPress={handleReject}
//                     activeOpacity={0.8}
//                   >
//                     <Ionicons name="close" size={32} color="white" />
//                     <Text style={styles.buttonLabel}>Decline</Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={[styles.mainButton, styles.acceptButton]}
//                     onPress={handleAccept}
//                     activeOpacity={0.8}
//                   >
//                     <Ionicons
//                       name={callType === "video" ? "videocam" : "call"}
//                       size={32}
//                       color="white"
//                     />
//                     <Text style={styles.buttonLabel}>Accept</Text>
//                   </TouchableOpacity>
//                 </View>
//               ) : (
//                 <View style={styles.activeRow}>
//                   <TouchableOpacity
//                     style={[
//                       styles.actionButton,
//                       isMuted && styles.actionButtonActive,
//                     ]}
//                     onPress={handleMute}
//                   >
//                     <Ionicons
//                       name={isMuted ? "mic-off" : "mic"}
//                       size={26}
//                       color="white"
//                     />
//                     <Text style={styles.minLabel}>
//                       {isMuted ? "Muted" : "Mute"}
//                     </Text>
//                   </TouchableOpacity>

//                   {callType === "video" ? (
//                     <TouchableOpacity
//                       style={[
//                         styles.actionButton,
//                         isVideoOff && styles.actionButtonActive,
//                       ]}
//                       onPress={handleVideo}
//                     >
//                       <Ionicons
//                         name={isVideoOff ? "videocam-off" : "videocam"}
//                         size={26}
//                         color="white"
//                       />
//                       <Text style={styles.minLabel}>
//                         {isVideoOff ? "Video Off" : "Video"}
//                       </Text>
//                     </TouchableOpacity>
//                   ) : null}

//                   <TouchableOpacity
//                     style={[
//                       styles.actionButton,
//                       isSpeakerPhone && styles.actionButtonActive,
//                     ]}
//                     onPress={handleSpeaker}
//                   >
//                     <Ionicons
//                       name={isSpeakerPhone ? "volume-high" : "volume-medium"}
//                       size={26}
//                       color="white"
//                     />
//                     <Text style={styles.minLabel}>
//                       {isSpeakerPhone ? "Speaker" : "Earpiece"}
//                     </Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={[
//                       styles.mainButton,
//                       styles.declineButton,
//                       { width: 72, height: 72 },
//                     ]}
//                     onPress={handleEnd}
//                   >
//                     <Ionicons
//                       name="call-outline"
//                       size={32}
//                       color="white"
//                       style={{ transform: [{ rotate: "135deg" }] }}
//                     />
//                   </TouchableOpacity>
//                 </View>
//               )}
//             </View>
//           </SafeAreaView>
//         </BlurView>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#0F172A",
//   },
//   fullScreenVideo: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   centeredContent: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingBottom: 150,
//   },
//   largeAvatar: {
//     width: 160,
//     height: 160,
//     borderRadius: 80,
//     backgroundColor: "#1E293B",
//     marginBottom: 32,
//     borderWidth: 6,
//     borderColor: "rgba(14, 165, 233, 0.2)",
//   },
//   callerName: {
//     fontSize: 32,
//     fontWeight: "900",
//     color: "white",
//     letterSpacing: -1,
//     marginBottom: 12,
//   },
//   statusBadge: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     paddingHorizontal: 16,
//     paddingVertical: 6,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.1)",
//   },
//   callStatus: {
//     fontSize: 13,
//     color: "#0EA5E9",
//     textTransform: "uppercase",
//     letterSpacing: 2,
//     fontWeight: "900",
//   },
//   pipContainer: {
//     position: "absolute",
//     top: 60,
//     right: 20,
//     width: 110,
//     height: 160,
//     borderRadius: 24,
//     overflow: "hidden",
//     borderWidth: 2,
//     borderColor: "rgba(255,255,255,0.2)",
//     backgroundColor: "#000",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.5,
//     shadowRadius: 15,
//     elevation: 10,
//   },
//   pipVideo: {
//     width: "100%",
//     height: "100%",
//   },
//   bottomBlur: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     paddingBottom: Platform.OS === "ios" ? 40 : 20,
//     borderTopLeftRadius: 40,
//     borderTopRightRadius: 40,
//     overflow: "hidden",
//   },
//   controlsContainer: {
//     paddingTop: 30,
//     paddingHorizontal: 30,
//   },
//   ringingRow: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//     alignItems: "center",
//   },
//   activeRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   mainButton: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.3,
//     shadowRadius: 10,
//     elevation: 10,
//   },
//   actionButton: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     backgroundColor: "rgba(255,255,255,0.1)",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   actionButtonActive: {
//     backgroundColor: "#0EA5E9",
//   },
//   acceptButton: {
//     backgroundColor: "#10B981",
//   },
//   declineButton: {
//     backgroundColor: "#F43F5E",
//   },
//   buttonLabel: {
//     color: "white",
//     fontSize: 12,
//     fontWeight: "bold",
//     marginTop: 8,
//     position: "absolute",
//     bottom: -25,
//   },
//   minLabel: {
//     color: "rgba(255,255,255,0.6)",
//     fontSize: 10,
//     fontWeight: "800",
//     marginTop: 4,
//     position: "absolute",
//     bottom: -20,
//     width: 80,
//     textAlign: "center",
//   },
// });
