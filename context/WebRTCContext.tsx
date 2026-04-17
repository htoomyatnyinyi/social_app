import React, { createContext, useContext, useRef, useCallback, useMemo } from 'react';
import { useWebRTC, CallState, CallType } from '../hooks/useWebRTC';
import { useSelector } from 'react-redux';
import { MediaStream } from 'react-native-webrtc';

interface WebRTCContextType {
  callState: CallState;
  callType: CallType;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  chatId: string;
  remoteName: string;
  isSpeakerPhone: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  startGlobalCall: (chatId: string, type: CallType, senderName?: string) => void;
  acceptGlobalCall: () => void;
  rejectGlobalCall: () => void;
  endGlobalCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  processGlobalSignaling: (data: any) => void;
  setGlobalSendSignal: (fn: (payload: any) => void) => void;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useSelector((state: any) => state.auth.user);
  const { speakerDefault, autoMute } = useSelector((state: any) => state.settings);
  
  const sendSignalRef = useRef<(payload: any) => void>(() => {
    console.warn("WebRTC: Attempted to send signal before WebSocket was ready.");
  });

  const setGlobalSendSignal = useCallback((fn: (payload: any) => void) => {
    sendSignalRef.current = fn;
  }, []);

  const sendSignal = useCallback((payload: any) => {
    sendSignalRef.current(payload);
  }, []);

  const webrtc = useWebRTC({
    currentUserId: user?.id,
    sendSignal,
    initialSpeaker: speakerDefault,
    initialMute: autoMute,
  });

  const value = useMemo(() => ({
    callState: webrtc.callState,
    callType: webrtc.callType,
    localStream: webrtc.localStream,
    remoteStream: webrtc.remoteStream,
    chatId: webrtc.chatId,
    remoteName: webrtc.remoteName,
    isSpeakerPhone: webrtc.isSpeakerPhone,
    isMuted: webrtc.isMuted,
    isVideoOff: webrtc.isVideoOff,
    startGlobalCall: webrtc.startCall,
    acceptGlobalCall: webrtc.acceptCall,
    rejectGlobalCall: webrtc.rejectCall,
    endGlobalCall: webrtc.endCall,
    processGlobalSignaling: webrtc.processSignalingMessage,
    toggleMute: webrtc.toggleMute,
    toggleVideo: webrtc.toggleVideo,
    toggleSpeaker: webrtc.toggleSpeaker,
    setGlobalSendSignal,
  }), [
    webrtc.callState,
    webrtc.callType,
    webrtc.localStream,
    webrtc.remoteStream,
    webrtc.chatId,
    webrtc.remoteName,
    webrtc.isSpeakerPhone,
    webrtc.isMuted,
    webrtc.isVideoOff,
    webrtc.startCall,
    webrtc.acceptCall,
    webrtc.rejectCall,
    webrtc.endCall,
    webrtc.processSignalingMessage,
    webrtc.toggleMute,
    webrtc.toggleVideo,
    webrtc.toggleSpeaker,
    setGlobalSendSignal,
  ]);

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTCContext = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTCContext must be used within a WebRTCProvider');
  }
  return context;
};
