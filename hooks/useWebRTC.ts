import { useState, useRef, useCallback, useEffect } from "react";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from "react-native-webrtc";
import { Audio } from "expo-av";

const isNativeAvailable = !!RTCPeerConnection;

// Mock for Expo Go to prevent crashes during development
class MockRTCPeerConnection {
  constructor() {}
  addEventListener() {}
  removeEventListener() {}
  addTrack() {}
  createOffer() {
    return Promise.resolve({ type: "offer", sdp: "" });
  }
  createAnswer() {
    return Promise.resolve({ type: "answer", sdp: "" });
  }
  setLocalDescription() {
    return Promise.resolve();
  }
  setRemoteDescription() {
    return Promise.resolve();
  }
  addIceCandidate() {
    return Promise.resolve();
  }
  close() {}
}

const ActualRTCPeerConnection = isNativeAvailable
  ? RTCPeerConnection
  : (MockRTCPeerConnection as any);
const ActualRTCIceCandidate = isNativeAvailable
  ? RTCIceCandidate
  : (class {
      constructor(c: any) {}
    } as any);
const ActualRTCSessionDescription = isNativeAvailable
  ? RTCSessionDescription
  : (class {
      constructor(d: any) {}
    } as any);

export type CallState = "IDLE" | "RINGING" | "CALLING" | "CONNECTED";
export type CallType = "voice" | "video";

interface UseWebRTCProps {
  initialChatId?: string;
  currentUserId?: string;
  sendSignal: (payload: any) => void;
}

export const useWebRTC = ({
  initialChatId,
  currentUserId,
  sendSignal,
}: UseWebRTCProps) => {
  const [callState, setCallState] = useState<CallState>("IDLE");
  const [callType, setCallType] = useState<CallType>("video");
  const [chatId, setChatId] = useState<string>(initialChatId || "");
  const [localStream, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStreamState] = useState<MediaStream | null>(
    null,
  );
  const [remoteName, setRemoteName] = useState<string>("");

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnection = useRef<any>(null);
  const pendingIceCandidates = useRef<any[]>([]);

  // === REFS for values that change during a call ===
  // These refs ensure processSignalingMessage always reads the latest
  // values WITHOUT needing them in its useCallback dependency array.
  // This is critical because putting chatId/callType in the deps would
  // cause the function reference to change, which would tear down the
  // WebSocket in _layout.tsx mid-call.
  const chatIdRef = useRef(chatId);
  const callTypeRef = useRef(callType);
  const sendSignalRef = useRef(sendSignal);
  const currentUserIdRef = useRef(currentUserId);

  useEffect(() => { chatIdRef.current = chatId; }, [chatId]);
  useEffect(() => { callTypeRef.current = callType; }, [callType]);
  useEffect(() => { sendSignalRef.current = sendSignal; }, [sendSignal]);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

  const setLocalStream = (stream: MediaStream | null) => {
    localStreamRef.current = stream;
    setLocalStreamState(stream);
  };

  const setRemoteStream = (stream: MediaStream | null) => {
    remoteStreamRef.current = stream;
    setRemoteStreamState(stream);
  };

  const cleanup = useCallback(() => {
    console.log("WebRTC: Cleaning up...");
    setCallState("IDLE");
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

  const setupLocalStream = async (type: CallType = "video") => {
    try {
      await Audio.requestPermissionsAsync();
      const constraints = {
        audio: true,
        video:
          type === "video"
            ? {
                facingMode: "user",
                frameRate: 30,
              }
            : false,
      };

      const stream = await (mediaDevices as any).getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (e) {
      console.error("WebRTC: Error getting user media:", e);
      return null;
    }
  };

  // initPeerConnection uses refs so it has a STABLE reference
  const initPeerConnection = useCallback(
    async (targetChatId: string) => {
      const config = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      };

      if (peerConnection.current) {
        try {
          peerConnection.current.close();
        } catch (e) {}
      }

      const pc = new ActualRTCPeerConnection(config);

      pc.addEventListener("icecandidate", (event: any) => {
        if (event.candidate) {
          console.log("🧊 ICE candidate generated, sending...");
          sendSignalRef.current({
            type: "ice_candidate",
            chatId: targetChatId,
            senderId: currentUserIdRef.current,
            candidate: event.candidate,
          });
        }
      });

      pc.addEventListener("track", (event: any) => {
        if (event.streams && event.streams[0]) {
          console.log("WebRTC: Remote stream received via track event");
          setRemoteStream(event.streams[0]);
        }
      });

      pc.addEventListener("addstream", (event: any) => {
        if (event.stream) {
          console.log("WebRTC: Remote stream received via addstream event");
          setRemoteStream(event.stream);
        }
      });

      pc.addEventListener("connectionstatechange", () => {
        console.log("WebRTC: Connection state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          setCallState("CONNECTED");
        }
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          cleanup();
        }
      });

      pc.addEventListener("iceconnectionstatechange", () => {
        console.log("WebRTC: ICE connection state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          setCallState("CONNECTED");
        }
      });

      peerConnection.current = pc;
      return pc;
    },
    [cleanup], // stable deps only — uses refs for userId/sendSignal
  );

  const startCall = async (
    targetChatId: string,
    type: CallType = "video",
    senderName?: string,
  ) => {
    if (!isNativeAvailable) {
      alert("Please use a Development Build for calls.");
      return;
    }
    setChatId(targetChatId);
    setCallType(type);
    setCallState("CALLING");
    await setupLocalStream(type);
    console.log("📞 Sending call_invite to", targetChatId);
    sendSignalRef.current({
      type: "call_invite",
      chatId: targetChatId,
      senderId: currentUserIdRef.current,
      senderName: senderName || "User",
      callType: type,
    });
  };

  const acceptCall = async () => {
    setCallState("CALLING");
    await setupLocalStream(callTypeRef.current);
    console.log("✅ Accepting call, sending call_accept");
    sendSignalRef.current({
      type: "call_accept",
      chatId: chatIdRef.current,
      senderId: currentUserIdRef.current,
    });
  };

  // processSignalingMessage has STABLE reference — only depends on
  // initPeerConnection and cleanup, both of which are stable useCallbacks.
  // All changing values (chatId, callType, sendSignal, currentUserId) are
  // read from refs.
  const processSignalingMessage = useCallback(
    async (data: any) => {
      console.log("📡 processSignaling:", data.type, "from:", data.senderId);
      if (data.senderId === currentUserIdRef.current) {
        return; // ignore own signals
      }

      try {
        switch (data.type) {
          case "call_invite":
            console.log("☎️ Incoming call from", data.senderName);
            setChatId(data.chatId);
            setRemoteName(data.senderName || "Anonymous");
            setCallType(data.callType || "video");
            setCallState("RINGING");
            break;

          case "call_accept": {
            console.log("✅ Remote accepted, creating offer...");
            const activeChatId = data.chatId || chatIdRef.current;
            const pc = await initPeerConnection(activeChatId);
            if (localStreamRef.current) {
              localStreamRef.current
                .getTracks()
                .forEach((track) => pc.addTrack(track, localStreamRef.current));
            }
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log("📤 Sending offer");
            sendSignalRef.current({
              type: "offer",
              chatId: activeChatId,
              senderId: currentUserIdRef.current,
              offer,
            });
            break;
          }

          case "offer": {
            console.log("📩 Received offer, creating answer...");
            const activeChatId = data.chatId || chatIdRef.current;
            const calleePc = await initPeerConnection(activeChatId);
            await calleePc.setRemoteDescription(
              new ActualRTCSessionDescription(data.offer),
            );

            if (localStreamRef.current) {
              localStreamRef.current
                .getTracks()
                .forEach((track) =>
                  calleePc.addTrack(track, localStreamRef.current),
                );
            }

            const answer = await calleePc.createAnswer();
            await calleePc.setLocalDescription(answer);
            console.log("📤 Sending answer");
            sendSignalRef.current({
              type: "answer",
              chatId: activeChatId,
              senderId: currentUserIdRef.current,
              answer,
            });

            while (pendingIceCandidates.current.length > 0) {
              const cand = pendingIceCandidates.current.shift();
              await calleePc.addIceCandidate(new ActualRTCIceCandidate(cand));
            }
            break;
          }

          case "answer":
            console.log("📩 Received answer, setting remote description");
            if (peerConnection.current) {
              await peerConnection.current.setRemoteDescription(
                new ActualRTCSessionDescription(data.answer),
              );
              while (pendingIceCandidates.current.length > 0) {
                const cand = pendingIceCandidates.current.shift();
                await peerConnection.current.addIceCandidate(
                  new ActualRTCIceCandidate(cand),
                );
              }
            }
            break;

          case "ice_candidate":
            if (peerConnection.current?.remoteDescription) {
              await peerConnection.current.addIceCandidate(
                new ActualRTCIceCandidate(data.candidate),
              );
            } else {
              pendingIceCandidates.current.push(data.candidate);
            }
            break;

          case "call_reject":
          case "end_call":
            cleanup();
            break;
        }
      } catch (e) {
        console.error("WebRTC Signaling Error:", e);
      }
    },
    [initPeerConnection, cleanup], // STABLE deps only — no chatId, callType, sendSignal
  );

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current
        .getAudioTracks()
        .forEach((t) => (t.enabled = !t.enabled));
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current
        .getVideoTracks()
        .forEach((t) => (t.enabled = !t.enabled));
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    callState,
    callType,
    chatId,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall: () => {
      sendSignalRef.current({ type: "call_reject", chatId: chatIdRef.current, senderId: currentUserIdRef.current });
      cleanup();
    },
    endCall: () => {
      sendSignalRef.current({ type: "end_call", chatId: chatIdRef.current, senderId: currentUserIdRef.current });
      cleanup();
    },
    processSignalingMessage,
    toggleMute,
    toggleVideo,
    remoteName,
  };
};
