"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  { urls: "stun:stun.ekiga.net" },
  { urls: "stun:stun.ideasip.com" },
  { urls: "stun:stun.schlund.de" },
  { urls: "stun:stun.voiparound.com" },
  { urls: "stun:stun.voipbuster.com" },
];

interface UseWebRTCProps {
  roomCode: string;
  userName: string;
  localStream: MediaStream | null;
  onPhotoReceived?: (photoDataUrl: string) => void;
  onPhotosReceived?: (photos: string[]) => void;
}

export function useWebRTC({ roomCode, userName, localStream, onPhotoReceived, onPhotosReceived }: UseWebRTCProps) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerIdRef = useRef(crypto.randomUUID().slice(0, 8));
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingCandidateRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingMembersRef = useRef<boolean>(false);
  const negotiatingRef = useRef(false);
  const answeringRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  localStreamRef.current = localStream;

  const onPhotoReceivedRef = useRef(onPhotoReceived);
  onPhotoReceivedRef.current = onPhotoReceived;

  const onPhotosReceivedRef = useRef(onPhotosReceived);
  onPhotosReceivedRef.current = onPhotosReceived;

  const destroyPC = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.onnegotiationneeded = null;
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    negotiatingRef.current = false;
    answeringRef.current = false;
    pendingCandidateRef.current = [];
  }, []);

  const sendWs = useCallback((data: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, []);

  const sendPhoto = useCallback((photoDataUrl: string) => {
    sendWs({ type: "photo_captured", photoData: photoDataUrl, peerId: peerIdRef.current });
  }, [sendWs]);

  const sendPhotos = useCallback((photos: string[]) => {
    sendWs({ type: "photos_captured", photos, peerId: peerIdRef.current });
  }, [sendWs]);

  const createAndSendOffer = useCallback(async (pc: RTCPeerConnection) => {
    if (pc.signalingState !== "stable") return;
    negotiatingRef.current = true;
    try {
      const offer = await pc.createOffer();
      if (pc.signalingState !== "stable") return;
      await pc.setLocalDescription(offer);
      sendWs({ type: "offer", offer: pc.localDescription, peerId: peerIdRef.current });
    } catch {
    } finally {
      negotiatingRef.current = false;
    }
  }, [sendWs]);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendWs({ type: "ice-candidate", candidate: e.candidate.toJSON(), peerId: peerIdRef.current });
      }
    };

    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        setRemoteStream(e.streams[0]);
        setConnected(true);
        retryCountRef.current = 0;
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === "connected" || state === "completed") {
        setConnected(true);
        retryCountRef.current = 0;
      }
      if (state === "failed") {
        setConnected(false);
        setRemoteStream(null);
        destroyPC();
        if (retryCountRef.current < 3) {
          retryCountRef.current++;
          retryTimerRef.current = setTimeout(() => {
            if (localStreamRef.current) {
              const newPc = createPeerConnection();
              localStreamRef.current.getTracks().forEach((t) => newPc.addTrack(t, localStreamRef.current!));
              createAndSendOffer(newPc);
            }
          }, 2000 * retryCountRef.current);
        }
      }
      if (state === "disconnected") {
        setConnected(false);
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "failed" || state === "closed") {
        setConnected(false);
        setRemoteStream(null);
        destroyPC();
      }
    };

    pc.onnegotiationneeded = () => {
      if (negotiatingRef.current || answeringRef.current) return;
      if (pc.signalingState === "stable") {
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
  }, [sendWs, createAndSendOffer, destroyPC]);

  const handleRemoteOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    answeringRef.current = true;
    negotiatingRef.current = true;
    try {
      let pc = pcRef.current;
      if (!pc || pc.signalingState === "closed" || pc.connectionState === "failed") {
        destroyPC();
        pc = createPeerConnection();
      }

      if (pc.signalingState !== "stable") {
        try { await pc.setLocalDescription({ type: "rollback" } as RTCSessionDescriptionInit); } catch {}
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendWs({ type: "answer", answer: pc.localDescription, peerId: peerIdRef.current });

      const candidates = [...pendingCandidateRef.current];
      pendingCandidateRef.current = [];
      for (const c of candidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        } catch {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
        }
      }
    } catch {
    } finally {
      negotiatingRef.current = false;
      setTimeout(() => { answeringRef.current = false; }, 0);
    }
  }, [createPeerConnection, sendWs, destroyPC]);

  useEffect(() => {
    if (!roomCode || !userName || roomCode === "local") return;

    const wsUrl = `wss://togetherframe-backend.onrender.com/ws/${roomCode}/${encodeURIComponent(userName)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCountRef.current = 0;
    };

    ws.onmessage = async (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data);
      } catch { return; }

      if (msg.type === "existing_members") {
        const hasExisting = msg.has_existing as boolean;
        setPeerCount(msg.member_count as number);
        if (hasExisting) {
          if (localStreamRef.current && !pcRef.current) {
            const pc = createPeerConnection();
            createAndSendOffer(pc);
          } else if (!localStreamRef.current) {
            pendingMembersRef.current = true;
          }
        }
      }

      if (msg.type === "user_joined" && msg.user_name !== userName) {
        setPeerCount(msg.members as number);
      }

      if (msg.type === "user_joined" && msg.user_name === userName) {
        setPeerCount(msg.members as number);
      }

      if (msg.type === "user_left") {
        setPeerCount(msg.members as number);
        setConnected(false);
        setRemoteStream(null);
        destroyPC();
        pendingOfferRef.current = null;
        pendingCandidateRef.current = [];
        pendingMembersRef.current = false;
        retryCountRef.current = 0;
        if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
        }
      }

      if (msg.type === "offer" && msg.peerId !== peerIdRef.current) {
        if (localStreamRef.current) {
          await handleRemoteOffer(msg.offer as RTCSessionDescriptionInit);
        } else {
          pendingOfferRef.current = msg.offer as RTCSessionDescriptionInit;
        }
      }

      if (msg.type === "answer" && msg.peerId !== peerIdRef.current) {
        try {
          const pc = pcRef.current;
          if (pc && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.answer as RTCSessionDescriptionInit));
          }
        } catch {}
      }

      if (msg.type === "ice-candidate" && msg.peerId !== peerIdRef.current) {
        const candidate = msg.candidate as RTCIceCandidateInit;
        try {
          if (pcRef.current && pcRef.current.remoteDescription) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            pendingCandidateRef.current.push(candidate);
          }
        } catch {
          try {
            if (pcRef.current && pcRef.current.remoteDescription) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
          } catch {}
        }
      }

      if (msg.type === "photo_captured" && msg.peerId !== peerIdRef.current) {
        onPhotoReceivedRef.current?.(msg.photoData as string);
      }

      if (msg.type === "photos_captured" && msg.peerId !== peerIdRef.current) {
        onPhotosReceivedRef.current?.(msg.photos as string[]);
      }
    };

    return () => {
      ws.close();
      destroyPC();
      pendingOfferRef.current = null;
      pendingCandidateRef.current = [];
      pendingMembersRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [roomCode, userName, createPeerConnection, createAndSendOffer, handleRemoteOffer, destroyPC]);

  useEffect(() => {
    if (!localStream) return;
    const pc = pcRef.current;
    if (pc && pc.signalingState !== "closed") {
      localStream.getTracks().forEach((track) => {
        const senders = pc.getSenders();
        const existing = senders.find((s) => s.track?.kind === track.kind);
        if (existing) {
          existing.replaceTrack(track);
        } else {
          pc.addTrack(track, localStream);
        }
      });
    } else if (pendingMembersRef.current) {
      pendingMembersRef.current = false;
      const newPc = createPeerConnection();
      createAndSendOffer(newPc);
    } else if (pendingOfferRef.current) {
      const offer = pendingOfferRef.current;
      pendingOfferRef.current = null;
      handleRemoteOffer(offer);
    }
  }, [localStream, createPeerConnection, createAndSendOffer, handleRemoteOffer]);

  return { remoteStream, connected, peerCount, sendPhoto, sendPhotos };
}
