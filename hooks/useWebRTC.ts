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

interface UseWebRTCProps {
  chatId: string;
  currentUserId?: string;
  sendSignal: (payload: any) => void;
}

export const useWebRTC = ({ chatId, currentUserId, sendSignal }: UseWebRTCProps) => {
  const [callState, setCallState] = useState<CallState>('IDLE');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerConnection = useRef<any>(null);
  const pendingIceCandidates = useRef<any[]>([]);

  const cleanup = useCallback(() => {
    setCallState('IDLE');
    if (localStream) {
      localStream.getTracks().forEach((t: any) => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    pendingIceCandidates.current = [];
  }, [localStream]);

  const setupLocalStream = async () => {
    try {
      await Audio.requestPermissionsAsync();
      const stream = await (mediaDevices as any).getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
          frameRate: 30,
        },
      });
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

  const startCall = async () => {
    if (!isNativeAvailable) {
      alert("Please use a Development Build for calls.");
      return;
    }
    setCallState('CALLING');
    await setupLocalStream();
    sendSignal({ type: 'call_invite', chatId, senderId: currentUserId });
  };

  const acceptCall = async () => {
    setCallState('CONNECTED');
    await setupLocalStream();
    sendSignal({ type: 'call_accept', chatId, senderId: currentUserId });
  };

  const processSignalingMessage = async (data: any) => {
    if (data.senderId === currentUserId) return;

    try {
      switch (data.type) {
        case 'call_invite':
          setCallState('RINGING');
          break;

        case 'call_accept':
          // Caller creates the offer after Callee accepts
          const pc = await initPeerConnection();
          if (localStream) {
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
          }
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal({ type: 'offer', chatId, senderId: currentUserId, offer });
          break;

        case 'offer':
          const calleePc = await initPeerConnection();
          await calleePc.setRemoteDescription(new ActualRTCSessionDescription(data.offer));

          if (localStream) {
            localStream.getTracks().forEach(track => calleePc.addTrack(track, localStream));
          }

          const answer = await calleePc.createAnswer();
          await calleePc.setLocalDescription(answer);
          sendSignal({ type: 'answer', chatId, senderId: currentUserId, answer });

          // Process any ICE candidates that arrived early
          while (pendingIceCandidates.current.length > 0) {
            const cand = pendingIceCandidates.current.shift();
            await calleePc.addIceCandidate(new ActualRTCIceCandidate(cand));
          }
          break;

        case 'answer':
          if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(new ActualRTCSessionDescription(data.answer));
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
    if (localStream) {
      localStream.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    callState,
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

// import {
//   RTCPeerConnection,
//   RTCIceCandidate,
//   RTCSessionDescription,
//   mediaDevices,
//   MediaStream,
// } from 'react-native-webrtc';
// import { useState, useRef, useCallback, useEffect } from 'react';
// import { Audio } from 'expo-av';

// // Add a check at the top of your hook
// if (!RTCPeerConnection) {
//   console.warn("WebRTC Native Module not found. Video calls will not work.");
// }
// // Check if we are in an environment with native WebRTC (Development Build) or not (Expo Go)
// const isNativeAvailable = !!RTCPeerConnection;

// // Mock implementations for Expo Go
// class MockRTCPeerConnection {
//   constructor(config?: any) { }
//   addEventListener(type: string, listener: any) { }
//   removeEventListener(type: string, listener: any) { }
//   addTrack(track: any, stream: any) { }
//   createOffer(options?: any) { return Promise.resolve({ type: 'offer', sdp: '' }); }
//   createAnswer(options?: any) { return Promise.resolve({ type: 'answer', sdp: '' }); }
//   setLocalDescription(desc: any) { return Promise.resolve(); }
//   setRemoteDescription(desc: any) { return Promise.resolve(); }
//   addIceCandidate(candidate: any) { return Promise.resolve(); }
//   close() { }
// }

// const ActualRTCPeerConnection = isNativeAvailable ? RTCPeerConnection : (MockRTCPeerConnection as any);
// const ActualRTCIceCandidate = isNativeAvailable ? RTCIceCandidate : (class { constructor(c: any) { } } as any);
// const ActualRTCSessionDescription = isNativeAvailable ? RTCSessionDescription : (class { constructor(d: any) { } } as any);
// const ActualMediaDevices = isNativeAvailable ? mediaDevices : {
//   getUserMedia: () => Promise.reject(new Error("WebRTC is not supported in Expo Go. Please use a Development Build.")),
//   enumerateDevices: () => Promise.resolve([])
// };

// export type CallState = 'IDLE' | 'RINGING' | 'CALLING' | 'CONNECTED';

// interface UseWebRTCProps {
//   chatId: string;
//   currentUserId?: string;
//   sendSignal: (payload: any) => void;
// }

// export const useWebRTC = ({ chatId, currentUserId, sendSignal }: UseWebRTCProps) => {
//   const [callState, setCallState] = useState<CallState>('IDLE');
//   const [localStream, setLocalStream] = useState<MediaStream | null>(null);
//   const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

//   const peerConnection = useRef<any>(null);

//   const initCall = async () => {
//     if (!isNativeAvailable) {
//       console.warn("WebRTC is not available. Call features will be disabled.");
//       return new ActualRTCPeerConnection();
//     }

//     const configuration = {
//       iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
//     };
//     const pc = new ActualRTCPeerConnection(configuration);

//     // Catch ICE candidates
//     pc.addEventListener('icecandidate', (event: any) => {
//       if (event.candidate) {
//         sendSignal({
//           type: 'ice_candidate',
//           chatId,
//           senderId: currentUserId,
//           candidate: event.candidate,
//         });
//       }
//     });

//     // Catch remote stream
//     pc.addEventListener('track', (event: any) => {
//       const stream = event.streams[0];
//       if (stream) {
//         setRemoteStream(stream);
//       }
//     });

//     peerConnection.current = pc;
//     return pc;
//   };

//   const setupLocalStream = async () => {
//     try {
//       await Audio.requestPermissionsAsync();
//       const stream = await (ActualMediaDevices as any).getUserMedia({
//         audio: true,
//         video: true,
//       });
//       setLocalStream(stream);
//       return stream;
//     } catch (e) {
//       console.error('Error getting user media:', e);
//       return null;
//     }
//   };

//   const cleanup = () => {
//     setCallState('IDLE');
//     if (localStream) {
//       localStream.getTracks().forEach((t: any) => t.stop());
//       setLocalStream(null);
//     }
//     setRemoteStream(null);
//     if (peerConnection.current) {
//       peerConnection.current.close();
//       peerConnection.current = null;
//     }
//   };

//   const startCall = async () => {
//     if (!isNativeAvailable) {
//       alert("WebRTC is not supported in Expo Go. Please use a development build to use call features.");
//       return;
//     }
//     setCallState('CALLING');
//     await setupLocalStream();
//     sendSignal({ type: 'call_invite', chatId, senderId: currentUserId });
//   };

//   const acceptCall = async () => {
//     if (!isNativeAvailable) return;
//     const pc = await initCall();
//     const stream = await setupLocalStream();
//     if (stream) {
//       stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));
//     }
//     setCallState('CONNECTED');
//     sendSignal({ type: 'call_accept', chatId, senderId: currentUserId });
//   };

//   const rejectCall = () => {
//     sendSignal({ type: 'call_reject', chatId, senderId: currentUserId });
//     cleanup();
//   };

//   const endCall = () => {
//     sendSignal({ type: 'end_call', chatId, senderId: currentUserId });
//     cleanup();
//   };

//   const processSignalingMessage = async (data: any) => {
//     if (data.senderId === currentUserId && data.type !== 'call_reject') return;
//     if (!isNativeAvailable) return;

//     try {
//       if (data.type === 'call_invite') {
//         setCallState('RINGING');
//       }
//       else if (data.type === 'call_accept') {
//         setCallState('CONNECTED');
//         const pc = await initCall();
//         if (localStream) {
//           localStream.getTracks().forEach((track: any) => pc.addTrack(track, localStream));
//         }
//         const offer = await pc.createOffer({});
//         await pc.setLocalDescription(offer);
//         sendSignal({ type: 'offer', chatId, senderId: currentUserId, offer });
//       }
//       else if (data.type === 'offer') {
//         const pc = peerConnection.current || await initCall();
//         await pc.setRemoteDescription(new ActualRTCSessionDescription(data.offer));
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);
//         sendSignal({ type: 'answer', chatId, senderId: currentUserId, answer });
//       }
//       else if (data.type === 'answer') {
//         if (peerConnection.current) {
//           await peerConnection.current.setRemoteDescription(new ActualRTCSessionDescription(data.answer));
//         }
//       }
//       else if (data.type === 'ice_candidate') {
//         if (peerConnection.current && data.candidate) {
//           await peerConnection.current.addIceCandidate(new ActualRTCIceCandidate(data.candidate));
//         }
//       }
//       else if (data.type === 'call_reject' || data.type === 'end_call') {
//         cleanup();
//       }
//     } catch (e) {
//       console.error("WebRTC Error handling signal:", e);
//     }
//   };

//   useEffect(() => {
//     return () => cleanup();
//   }, []);

//   const toggleMute = () => {
//     if (localStream) {
//       localStream.getAudioTracks().forEach((track: any) => {
//         track.enabled = !track.enabled;
//       });
//     }
//   };

//   const toggleVideo = () => {
//     if (localStream) {
//       localStream.getVideoTracks().forEach((track: any) => {
//         track.enabled = !track.enabled;
//       });
//     }
//   };

//   return {
//     callState,
//     localStream,
//     remoteStream,
//     startCall,
//     acceptCall,
//     rejectCall,
//     endCall,
//     processSignalingMessage,
//     toggleMute,
//     toggleVideo,
//   };
// };
