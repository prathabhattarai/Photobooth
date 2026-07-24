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
  const isInitiatorRef = useRef(false);
  const gotAnswerRef = useRef(false);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection(STUN_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "ice-candidate",
          candidate: e.candidate,
          sender: userName,
        }));
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

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pcRef.current = pc;
    return pc;
  }, [localStream, userName]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, sender: string) => {
    if (sender === userName) return;
    const pc = createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "answer",
        answer,
        sender: userName,
      }));
    }
  }, [userName, createPeerConnection]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit, sender: string) => {
    if (sender === userName) return;
    const pc = pcRef.current;
    if (pc && !gotAnswerRef.current) {
      gotAnswerRef.current = true;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, [userName]);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit, sender: string) => {
    if (sender === userName) return;
    const pc = pcRef.current;
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {}
    }
  }, [userName]);

  useEffect(() => {
    if (!roomCode || !userName || !localStream) return;

    const backendHost = "togetherframe-backend.onrender.com";
    const wsProtocol = "wss:";
    const wsUrl = `${wsProtocol}//${backendHost}/ws/${roomCode}/${userName}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", sender: userName }));
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "user_joined" && msg.sender !== userName) {
        setPeerCount(msg.members);
        isInitiatorRef.current = true;
        gotAnswerRef.current = false;

        const pc = createPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "offer",
            offer,
            sender: userName,
          }));
        }
      }

      if (msg.type === "user_left") {
        setPeerCount(msg.members);
        setConnected(false);
        setRemoteStream(null);
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
          gotAnswerRef.current = false;
        }
      }

      if (msg.type === "offer") {
        await handleOffer(msg.offer, msg.sender);
      }
      if (msg.type === "answer") {
        await handleAnswer(msg.answer, msg.sender);
      }
      if (msg.type === "ice-candidate") {
        await handleIceCandidate(msg.candidate, msg.sender);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setPeerCount(0);
    };

    return () => {
      ws.close();
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [roomCode, userName, localStream, createPeerConnection, handleOffer, handleAnswer, handleIceCandidate]);

  return { remoteStream, connected, peerCount };
}
