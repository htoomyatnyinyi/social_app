import React from 'react';
import { useWebRTCContext } from '../context/WebRTCContext';
import CallOverlay from './CallOverlay';

export const GlobalCallHandler = () => {
  const { 
    callState, 
    callType, 
    localStream, 
    remoteStream, 
    remoteName,
    acceptGlobalCall, 
    rejectGlobalCall, 
    endGlobalCall,
    toggleMute,
    toggleVideo
  } = useWebRTCContext();

  if (callState === 'IDLE') return null;

  return (
    <CallOverlay
      callState={callState}
      callType={callType}
      localStream={localStream}
      remoteStream={remoteStream}
      callerName={remoteName || "User"}
      onAccept={acceptGlobalCall}
      onReject={rejectGlobalCall}
      onEnd={endGlobalCall}
      onToggleMute={toggleMute}
      onToggleVideo={toggleVideo}
    />
  );
};
