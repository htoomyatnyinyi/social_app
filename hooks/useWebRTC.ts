import { useState, useRef, useCallback, useEffect } from 'react';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { Audio } from 'expo-av';

const isNativeAvailable = !!RTCPeerConnection;

// Mock for Expo Go to prevent crashes during development
class MockRTCPeerConnection {
  constructor() { }
  addEventListener() { }
  removeEventListener() { }
  addTrack() { }
  createOffer() { return Promise.resolve({ type: 'offer', sdp: '' }); }
  createAnswer() { return Promise.resolve({ type: 'answer', sdp: '' }); }
  setLocalDescription() { return Promise.resolve(); }
  setRemoteDescription() { return Promise.resolve(); }
  addIceCandidate() { return Promise.resolve(); }
  close() { }
}

const ActualRTCPeerConnection = isNativeAvailable ? RTCPeerConnection : (MockRTCPeerConnection as any);
const ActualRTCIceCandidate = isNativeAvailable ? RTCIceCandidate : (class { constructor(c: any) { } } as any);
const ActualRTCSessionDescription = isNativeAvailable ? RTCSessionDescription : (class { constructor(d: any) { } } as any);
export type CallState = 'IDLE' | 'RINGING' | 'CALLING' | 'CONNECTED';
export type CallType = 'voice' | 'video';

interface UseWebRTCProps {
  chatId: string;
  currentUserId?: string;
  sendSignal: (payload: any) => void;
}

export const useWebRTC = ({ chatId, currentUserId, sendSignal }: UseWebRTCProps) => {
  const [callState, setCallState] = useState<CallState>('IDLE');
  const [callType, setCallType] = useState<CallType>('video');
  const [localStream, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStreamState] = useState<MediaStream | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnection = useRef<any>(null);
  const pendingIceCandidates = useRef<any[]>([]);

  const setLocalStream = (stream: MediaStream | null) => {
    localStreamRef.current = stream;
    setLocalStreamState(stream);
  };

  const setRemoteStream = (stream: MediaStream | null) => {
    remoteStreamRef.current = stream;
    setRemoteStreamState(stream);
  };

  const cleanup = useCallback(() => {
    setCallState('IDLE');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t: any) => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    if (peerConnection.current) {
      try {
        peerConnection.current.close();
      } catch (e) {}
      peerConnection.current = null;
    }
    pendingIceCandidates.current = [];
  }, []);

  const setupLocalStream = async (type: CallType = 'video') => {
    try {
      await Audio.requestPermissionsAsync();
      const constraints = {
        audio: true,
        video: type === 'video' ? {
          facingMode: 'user',
          frameRate: 30,
        } : false,
      };
      
      const stream = await (mediaDevices as any).getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (e) {
      console.error('Ananta: Error getting user media:', e);
      return null;
    }
  };

  const initPeerConnection = async () => {
    const config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    };
    const pc = new ActualRTCPeerConnection(config);

    pc.addEventListener('icecandidate', (event: any) => {
      if (event.candidate) {
        sendSignal({
          type: 'ice_candidate',
          chatId,
          senderId: currentUserId,
          candidate: event.candidate,
        });
      }
    });

    pc.addEventListener('track', (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    });

    pc.addEventListener('connectionstatechange', () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanup();
      }
    });

    peerConnection.current = pc;
    return pc;
  };

  const startCall = async (type: CallType = 'video') => {
    if (!isNativeAvailable) {
      alert("Please use a Development Build for calls.");
      return;
    }
    setCallType(type);
    setCallState('CALLING');
    await setupLocalStream(type);
    sendSignal({ type: 'call_invite', chatId, senderId: currentUserId, callType: type });
  };

  const acceptCall = async () => {
    setCallState('CONNECTED');
    await setupLocalStream(callType);
    sendSignal({ type: 'call_accept', chatId, senderId: currentUserId });
  };

  const processSignalingMessage = async (data: any) => {
    if (data.senderId === currentUserId) return;

    try {
      switch (data.type) {
        case 'call_invite':
          setCallType(data.callType || 'video');
          setCallState('RINGING');
          break;

        case 'call_accept':
          const pc = await initPeerConnection();
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
          }
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal({ type: 'offer', chatId, senderId: currentUserId, offer });
          break;

        case 'offer':
          const calleePc = await initPeerConnection();
          await calleePc.setRemoteDescription(new ActualRTCSessionDescription(data.offer));

          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => calleePc.addTrack(track, localStreamRef.current));
          }

          const answer = await calleePc.createAnswer();
          await calleePc.setLocalDescription(answer);
          sendSignal({ type: 'answer', chatId, senderId: currentUserId, answer });

          while (pendingIceCandidates.current.length > 0) {
            const cand = pendingIceCandidates.current.shift();
            await calleePc.addIceCandidate(new ActualRTCIceCandidate(cand));
          }
          break;

        case 'answer':
          if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(new ActualRTCSessionDescription(data.answer));
            while (pendingIceCandidates.current.length > 0) {
              const cand = pendingIceCandidates.current.shift();
              await peerConnection.current.addIceCandidate(new ActualRTCIceCandidate(cand));
            }
          }
          break;

        case 'ice_candidate':
          if (peerConnection.current?.remoteDescription) {
            await peerConnection.current.addIceCandidate(new ActualRTCIceCandidate(data.candidate));
          } else {
            pendingIceCandidates.current.push(data.candidate);
          }
          break;

        case 'call_reject':
        case 'end_call':
          cleanup();
          break;
      }
    } catch (e) {
      console.error("Ananta WebRTC Signaling Error:", e);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    callState,
    callType,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall: () => {
      sendSignal({ type: 'call_reject', chatId, senderId: currentUserId });
      cleanup();
    },
    endCall: () => {
      sendSignal({ type: 'end_call', chatId, senderId: currentUserId });
      cleanup();
    },
    processSignalingMessage,
    toggleMute,
    toggleVideo,
  };
};

// ... existing commented out code is removed ...

