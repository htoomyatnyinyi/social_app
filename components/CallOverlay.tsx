import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import { RTCView as NativeRTCView, MediaStream } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import { CallState } from '../hooks/useWebRTC';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock RTCView for Expo Go
const RTCView = !!NativeRTCView ? NativeRTCView : (props: any) => <View style={[props.style, { backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: '#94a3b8', fontSize: 10 }}>Video Not Available</Text></View>;

interface CallOverlayProps {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callerName?: string;
  callerImage?: string;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

const { width, height } = Dimensions.get('window');

export default function CallOverlay({
  callState,
  localStream,
  remoteStream,
  callerName = 'Unknown',
  callerImage,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleVideo
}: CallOverlayProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  if (callState === 'IDLE') return null;

  const handleMute = () => {
    onToggleMute();
    setIsMuted(!isMuted);
  };

  const handleVideo = () => {
    onToggleVideo();
    setIsVideoOff(!isVideoOff);
  };

  return (
    <Modal visible={true} animationType="slide" transparent={false}>
      <View style={styles.container}>

        {/* BACKGROUND LAYER (Ringing/Calling Avatars or Native Remote Video) */}
        {callState === 'CONNECTED' && remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.fullScreenVideo}
            objectFit="cover"
          />
        ) : (
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: callerImage || `https://api.dicebear.com/7.x/avataaars/png?seed=${callerName}` }}
              style={styles.largeAvatar}
              contentFit="cover"
            />
            <Text style={styles.callerName}>{callerName}</Text>
            <Text style={styles.callStatus}>
              {callState === 'RINGING' ? 'Incoming Video Call...' : 'Calling...'}
            </Text>
          </View>
        )}

        {/* PICTURE IN PICTURE (Local Video) */}
        {(callState === 'CONNECTED' || callState === 'CALLING') && localStream && !isVideoOff && (
          <View style={styles.pipContainer}>
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.pipVideo}
              objectFit="cover"
              zOrder={1}
            />
          </View>
        )}

        {/* CONTROLS LAYER */}
        <SafeAreaView style={styles.controlsSafeArea}>
          <View style={styles.controlsContainer}>

            {callState === 'RINGING' ? (
              <View style={styles.ringingControls}>
                <TouchableOpacity style={[styles.controlButton, styles.rejectButton]} onPress={onReject}>
                  <Ionicons name="close" size={32} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.controlButton, styles.acceptButton]} onPress={onAccept}>
                  <Ionicons name="videocam" size={32} color="white" />
                </TouchableOpacity>
              </View>
            ) : null}

            {callState === 'CALLING' || callState === 'CONNECTED' ? (
              <View style={styles.activeControls}>
                <TouchableOpacity
                  style={[styles.smallControlButton, isMuted && styles.controlActive]}
                  onPress={handleMute}
                >
                  <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.controlButton, styles.rejectButton]} onPress={onEnd}>
                  <Ionicons name="call" size={32} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallControlButton, isVideoOff && styles.controlActive]}
                  onPress={handleVideo}
                >
                  <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={28} color="white" />
                </TouchableOpacity>
              </View>
            ) : null}

          </View>
        </SafeAreaView>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  fullScreenVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -100,
  },
  largeAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#1E293B',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  callerName: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 16,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  pipContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: '#000',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  pipVideo: {
    width: '100%',
    height: '100%',
  },
  controlsSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsContainer: {
    paddingBottom: 40,
    paddingHorizontal: 30,
  },
  ringingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  controlButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallControlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  }
});
