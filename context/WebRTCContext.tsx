import React, { createContext, useContext, useRef } from 'react';
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
  startGlobalCall: (chatId: string, type: CallType, senderName?: string) => void;
  acceptGlobalCall: () => void;
  rejectGlobalCall: () => void;
  endGlobalCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  processGlobalSignaling: (data: any) => void;
  setGlobalSendSignal: (fn: (payload: any) => void) => void;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useSelector((state: any) => state.auth.user);
  const sendSignalRef = useRef<(payload: any) => void>(() => {
    console.warn("WebRTC: Attempted to send signal before WebSocket was ready.");
  });

  const setGlobalSendSignal = (fn: (payload: any) => void) => {
    sendSignalRef.current = fn;
  };

  const webrtc = useWebRTC({
    currentUserId: user?.id,
    sendSignal: (payload) => sendSignalRef.current(payload),
  });

  return (
    <WebRTCContext.Provider
      value={{
        callState: webrtc.callState,
        callType: webrtc.callType,
        localStream: webrtc.localStream,
        remoteStream: webrtc.remoteStream,
        chatId: webrtc.chatId,
        remoteName: webrtc.remoteName,
        startGlobalCall: webrtc.startCall,
        acceptGlobalCall: webrtc.acceptCall,
        rejectGlobalCall: webrtc.rejectCall,
        endGlobalCall: webrtc.endCall,
        processGlobalSignaling: webrtc.processSignalingMessage,
        toggleMute: webrtc.toggleMute,
        toggleVideo: webrtc.toggleVideo,
        setGlobalSendSignal,
      }}
    >
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
