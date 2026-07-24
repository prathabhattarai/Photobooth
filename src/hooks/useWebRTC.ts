"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const STUN_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface UseWebRTCProps {
  roomCode: string;
  userName: string;
  localStream: MediaStream | null;
}

export function useWebRTC({ roomCode, userName, localStream }: UseWebRTCProps) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const gotAnswerRef = useRef(false);

  localStreamRef.current = localStream;

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection(STUN_SERVERS);
    console.log("[WebRTC] PeerConnection created");

    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        console.log("[WebRTC] Sending ICE candidate");
        wsRef.current.send(JSON.stringify({
          type: "ice-candidate",
          candidate: e.candidate,
        }));
      }
    };

    pc.ontrack = (e) => {
      console.log("[WebRTC] ontrack! tracks:", e.streams[0]?.getTracks().length);
      if (e.streams[0]) {
        setRemoteStream(e.streams[0]);
        setConnected(true);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] state:", pc.connectionState, "ice:", pc.iceConnectionState, "signaling:", pc.signalingState);
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setConnected(false);
        setRemoteStream(null);
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
        console.log("[WebRTC] Added local track:", track.kind);
      });
    }

    pcRef.current = pc;
    return pc;
  }, []);

  useEffect(() => {
    if (!roomCode || !userName || roomCode === "local") return;
    console.log("[WebRTC] Connecting ws room:", roomCode, "user:", userName);

    const wsUrl = `wss://togetherframe-backend.onrender.com/ws/${roomCode}/${userName}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WebRTC] WS connected");
    };

    ws.onerror = (e) => console.error("[WebRTC] WS error:", e);

    ws.onclose = (e) => console.log("[WebRTC] WS closed:", e.code);

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      console.log("[WebRTC] <<", msg.type, msg);

      if (msg.type === "existing_members") {
        setPeerCount(msg.member_count);
        if (msg.members.length > 0) {
          console.log("[WebRTC] Existing peers:", msg.members, "- creating offer");
          const pc = createPeerConnection();
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "offer", offer: pc.localDescription }));
              console.log("[WebRTC] >> Sent offer");
            }
          } catch (err) {
            console.error("[WebRTC] Offer failed:", err);
          }
        }
      }

      if (msg.type === "user_joined" && msg.user_name !== userName) {
        console.log("[WebRTC] Peer joined:", msg.user_name, "(waiting for their offer via existing_members)");
        setPeerCount(msg.members);
      }

      if (msg.type === "user_joined" && msg.user_name === userName) {
        setPeerCount(msg.members);
      }

      if (msg.type === "user_left") {
        console.log("[WebRTC] Peer left:", msg.user_name);
        setPeerCount(msg.members);
        setConnected(false);
        setRemoteStream(null);
        gotAnswerRef.current = false;
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
      }

      if (msg.type === "offer" && msg.sender !== userName) {
        console.log("[WebRTC] << Got offer from", msg.sender);
        try {
          const pc = createPeerConnection();
          await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "answer", answer: pc.localDescription }));
            console.log("[WebRTC] >> Sent answer");
          }
        } catch (err) {
          console.error("[WebRTC] Handle offer failed:", err);
        }
      }

      if (msg.type === "answer" && msg.sender !== userName) {
        console.log("[WebRTC] << Got answer from", msg.sender);
        try {
          const pc = pcRef.current;
          if (pc && !gotAnswerRef.current) {
            gotAnswerRef.current = true;
            await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
            console.log("[WebRTC] Remote description set (answer)");
          }
        } catch (err) {
          console.error("[WebRTC] Handle answer failed:", err);
        }
      }

      if (msg.type === "ice-candidate" && msg.sender !== userName) {
        try {
          if (pcRef.current) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
          }
        } catch {}
      }
    };

    return () => {
      ws.close();
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      gotAnswerRef.current = false;
    };
  }, [roomCode, userName, createPeerConnection]);

  useEffect(() => {
    if (!localStream || !pcRef.current) return;
    const pc = pcRef.current;
    localStream.getTracks().forEach((track) => {
      const senders = pc.getSenders();
      const existing = senders.find((s) => s.track?.kind === track.kind);
      if (existing) {
        existing.replaceTrack(track);
      } else {
        pc.addTrack(track, localStream);
      }
    });
  }, [localStream]);

  return { remoteStream, connected, peerCount };
}
