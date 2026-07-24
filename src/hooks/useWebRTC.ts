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
  onPhotoReceived?: (photoDataUrl: string) => void;
}

export function useWebRTC({ roomCode, userName, localStream, onPhotoReceived }: UseWebRTCProps) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerIdRef = useRef(crypto.randomUUID().slice(0, 8));
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingCandidateRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingMembersRef = useRef<string[]>([]);
  const negotiatingRef = useRef(false);

  localStreamRef.current = localStream;

  const onPhotoReceivedRef = useRef(onPhotoReceived);
  onPhotoReceivedRef.current = onPhotoReceived;

  const sendWs = useCallback((data: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, []);

  const sendPhoto = useCallback((photoDataUrl: string) => {
    sendWs({ type: "photo_captured", photoData: photoDataUrl, peerId: peerIdRef.current });
  }, [sendWs]);

  const createAndSendOffer = useCallback(async (pc: RTCPeerConnection) => {
    if (negotiatingRef.current || pc.signalingState !== "stable") return;
    negotiatingRef.current = true;
    try {
      const offer = await pc.createOffer();
      if (pc.signalingState !== "stable") return;
      await pc.setLocalDescription(offer);
      sendWs({ type: "offer", offer: pc.localDescription, peerId: peerIdRef.current });
    } finally {
      negotiatingRef.current = false;
    }
  }, [sendWs]);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection(STUN_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendWs({ type: "ice-candidate", candidate: e.candidate, peerId: peerIdRef.current });
      }
    };

    pc.ontrack = (e) => {
      if (e.streams[0]) {
        setRemoteStream(e.streams[0]);
        setConnected(true);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setConnected(false);
        setRemoteStream(null);
      }
    };

    pc.onnegotiationneeded = () => {
      if (!negotiatingRef.current && pc.signalingState === "stable") {
        createAndSendOffer(pc);
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pcRef.current = pc;
    return pc;
  }, [sendWs, createAndSendOffer]);

  const handleRemoteOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    negotiatingRef.current = true;
    try {
      let pc = pcRef.current;
      if (!pc) {
        pc = createPeerConnection();
      }

      if (pc.signalingState !== "stable") {
        try { await pc.setLocalDescription({ type: "rollback" } as RTCSessionDescriptionInit); } catch {}
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendWs({ type: "answer", answer: pc.localDescription, peerId: peerIdRef.current });

      pendingCandidateRef.current.forEach((c) => {
        pc!.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      });
      pendingCandidateRef.current = [];
    } finally {
      negotiatingRef.current = false;
    }
  }, [createPeerConnection, sendWs]);

  useEffect(() => {
    if (!roomCode || !userName || roomCode === "local") return;

    const wsUrl = `wss://togetherframe-backend.onrender.com/ws/${roomCode}/${userName}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "existing_members") {
        setPeerCount(msg.member_count);
        if (msg.has_existing) {
          if (localStreamRef.current && !pcRef.current) {
            const pc = createPeerConnection();
            createAndSendOffer(pc);
          } else {
            pendingMembersRef.current = ["peer"];
          }
        }
      }

      if (msg.type === "user_joined" && msg.user_name !== userName) {
        setPeerCount(msg.members);
      }

      if (msg.type === "user_joined" && msg.user_name === userName) {
        setPeerCount(msg.members);
      }

      if (msg.type === "user_left") {
        setPeerCount(msg.members);
        setConnected(false);
        setRemoteStream(null);
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
        pendingOfferRef.current = null;
        pendingCandidateRef.current = [];
        pendingMembersRef.current = [];
        negotiatingRef.current = false;
      }

      if (msg.type === "offer" && msg.peerId !== peerIdRef.current) {
        if (localStreamRef.current) {
          await handleRemoteOffer(msg.offer);
        } else {
          pendingOfferRef.current = msg.offer;
        }
      }

      if (msg.type === "answer" && msg.peerId !== peerIdRef.current) {
        try {
          const pc = pcRef.current;
          if (pc && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
          }
        } catch {}
      }

      if (msg.type === "ice-candidate" && msg.peerId !== peerIdRef.current) {
        try {
          if (pcRef.current && pcRef.current.remoteDescription) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } else {
            pendingCandidateRef.current.push(msg.candidate);
          }
        } catch {}
      }

      if (msg.type === "photo_captured" && msg.peerId !== peerIdRef.current) {
        onPhotoReceivedRef.current?.(msg.photoData);
      }
    };

    return () => {
      ws.close();
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      negotiatingRef.current = false;
      pendingOfferRef.current = null;
      pendingCandidateRef.current = [];
      pendingMembersRef.current = [];
    };
  }, [roomCode, userName, createPeerConnection, createAndSendOffer, handleRemoteOffer]);

  useEffect(() => {
    if (!localStream) return;
    const pc = pcRef.current;
    if (pc) {
      localStream.getTracks().forEach((track) => {
        const senders = pc.getSenders();
        const existing = senders.find((s) => s.track?.kind === track.kind);
        if (existing) {
          existing.replaceTrack(track);
        } else {
          pc.addTrack(track, localStream);
        }
      });
    } else if (pendingMembersRef.current.length > 0) {
      const newPc = createPeerConnection();
      createAndSendOffer(newPc);
      pendingMembersRef.current = [];
    } else if (pendingOfferRef.current) {
      const offer = pendingOfferRef.current;
      pendingOfferRef.current = null;
      handleRemoteOffer(offer);
    }
  }, [localStream, createPeerConnection, createAndSendOffer, handleRemoteOffer]);

  return { remoteStream, connected, peerCount, sendPhoto };
}
