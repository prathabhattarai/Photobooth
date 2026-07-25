"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Download,
  Heart,
  Save,
  RotateCcw,
  LogOut,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

import { useApp } from "@/lib/store";
import type { SharedState } from "@/lib/types";
import FloatingElements from "@/components/ui/FloatingElements";
import { useWebRTC } from "@/hooks/useWebRTC";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function composeFinalImage(localPhoto: string, partnerPhoto: string): Promise<string> {
  const localImg = await loadImage(localPhoto);
  const partnerImg = await loadImage(partnerPhoto);

  const W = 372;
  const H = 250;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return localPhoto;

  const halfW = W / 2;

  function drawHalf(img: HTMLImageElement, x: number, w: number) {
    if (!ctx) return;
    const imgRatio = img.width / img.height;
    const slotRatio = w / H;
    let drawW: number, drawH: number, drawX: number, drawY: number;
    if (imgRatio > slotRatio) {
      drawW = w;
      drawH = w / imgRatio;
      drawX = x;
      drawY = (H - drawH) / 2;
    } else {
      drawH = H;
      drawW = H * imgRatio;
      drawX = x + (w - drawW) / 2;
      drawY = 0;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, w, H);
    ctx.clip();
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(x, 0, w, H);
    ctx.filter = "grayscale(1)";
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.filter = "none";
    ctx.restore();
  }

  drawHalf(localImg, 0, halfW);
  drawHalf(partnerImg, halfW, halfW);

  return canvas.toDataURL("image/png");
}

async function composeStrip(frames: string[], yourName: string, partnerNm: string): Promise<string> {
  const images = await Promise.all(frames.map((f) => loadImage(f)));

  const STRIP_W = 420;
  const PAD = 24;
  const GAP = 16;
  const SLOT_W = STRIP_W - PAD * 2;
  const SLOT_H = 250;
  const SLOT_R = 8;
  const HEADER_H = 80;
  const FOOTER_H = 70;
  const STRIP_H = HEADER_H + PAD + SLOT_H * 4 + GAP * 3 + PAD + FOOTER_H;

  const canvas = document.createElement("canvas");
  canvas.width = STRIP_W;
  canvas.height = STRIP_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return frames[0];

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, STRIP_W, STRIP_H);

  const displayName = [yourName, partnerNm].filter(Boolean).join(" & ");

  if (displayName) {
    ctx.fillStyle = "#d4627a";
    ctx.font = "bold 18px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(displayName, STRIP_W / 2, 36);
  }

  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  ctx.fillStyle = "#bbbbbb";
  ctx.font = "12px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(dateStr, STRIP_W / 2, 56);

  ctx.strokeStyle = "#f0c4d0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD + 40, HEADER_H - 8);
  ctx.lineTo(STRIP_W - PAD - 40, HEADER_H - 8);
  ctx.stroke();

  const startY = HEADER_H;

  function drawFrame(img: HTMLImageElement, y: number) {
    if (!ctx) return;
    const imgRatio = img.width / img.height;
    const slotRatio = SLOT_W / SLOT_H;
    let drawW: number, drawH: number, drawX: number, drawY: number;
    if (imgRatio > slotRatio) {
      drawW = SLOT_W;
      drawH = SLOT_W / imgRatio;
      drawX = PAD;
      drawY = y + (SLOT_H - drawH) / 2;
    } else {
      drawH = SLOT_H;
      drawW = SLOT_H * imgRatio;
      drawX = PAD + (SLOT_W - drawW) / 2;
      drawY = y;
    }
    ctx.save();
    roundRect(ctx, PAD, y, SLOT_W, SLOT_H, SLOT_R);
    ctx.clip();
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(PAD, y, SLOT_W, SLOT_H);
    ctx.filter = "grayscale(1)";
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.filter = "none";
    ctx.restore();
  }

  for (let i = 0; i < images.length && i < 4; i++) {
    drawFrame(images[i], startY + i * (SLOT_H + GAP));
  }

  const footerY = STRIP_H - FOOTER_H + 8;

  ctx.fillStyle = "#d4627a";
  ctx.font = "13px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("\u2764 TogetherFrame \u2764", STRIP_W / 2, footerY);

  return canvas.toDataURL("image/png");
}

type BoothView = "camera" | "result";

const TOTAL_PHOTOS = 4;

export default function BoothPage() {
  const router = useRouter();
  const { user, partnerAvatar, currentRoomCode, saveMemoryToAPI } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const selectedFrame = "polaroid";
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [flashVisible, setFlashVisible] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const [view, setView] = useState<BoothView>("camera");
  const [resultImage, setResultImage] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);

  const roomCode = currentRoomCode || "local";
  const userName = user?.name || "Guest";

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedFramesRef = useRef<string[]>([]);
  const localFrameRef = useRef<string | null>(null);
  const partnerFrameRef = useRef<string | null>(null);
  const frameComposedRef = useRef(false);
  const sequenceActiveRef = useRef(false);
  const isInitiatorRef = useRef(false);
  const nextFrameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processFrameRef = useRef<(local: string, partner: string) => void>(() => {});
  const startNextFrameRef = useRef<() => number | undefined>(() => undefined);
  const sendPhotoRef = useRef<(photoDataUrl: string) => void>(() => {});

  const triggerFlash = useCallback(() => {
    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 300);
  }, []);

  const capturePhoto = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video) return null;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;

    const dw = video.clientWidth;
    const dh = video.clientHeight;
    if (!dw || !dh) return null;

    const scale = Math.max(dw / vw, dh / vh);
    const scaledW = vw * scale;
    const scaledH = vh * scale;
    const offsetX = (scaledW - dw) / 2;
    const offsetY = (scaledH - dh) / 2;

    const sx = offsetX / scale;
    const sy = offsetY / scale;
    const sw = dw / scale;
    const sh = dh / scale;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.filter = "grayscale(1)";
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    return canvas.toDataURL("image/png");
  }, []);

  const resetPhotoState = useCallback(() => {
    sequenceActiveRef.current = false;
    accumulatedFramesRef.current = [];
    localFrameRef.current = null;
    partnerFrameRef.current = null;
    frameComposedRef.current = false;
    setCountdown(null);
    setCaptureCount(0);
    setResultImage("");
    setSaved(false);
    setView("camera");
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (nextFrameTimerRef.current) {
      clearTimeout(nextFrameTimerRef.current);
      nextFrameTimerRef.current = null;
    }
  }, []);

  const handleRetakeReceived = useCallback(() => {
    resetPhotoState();
  }, [resetPhotoState]);

  const handlePhotoReceivedStable = useCallback((photoData: string) => {
    partnerFrameRef.current = photoData;
    if (localFrameRef.current && !frameComposedRef.current && sequenceActiveRef.current) {
      frameComposedRef.current = true;
      processFrameRef.current(localFrameRef.current, photoData);
    }
  }, []);

  const handleCaptureStartStable = useCallback((captureStartTime: number) => {
    localFrameRef.current = null;
    partnerFrameRef.current = null;
    frameComposedRef.current = false;

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      const remaining = Math.ceil((captureStartTime - Date.now()) / 1000);
      if (remaining > 0) {
        setCountdown(remaining);
      } else {
        setCountdown(null);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;

        const photo = capturePhoto();
        if (photo) {
          localFrameRef.current = photo;
          triggerFlash();
          sendPhotoRef.current(photo);

          if (partnerFrameRef.current && !frameComposedRef.current) {
            frameComposedRef.current = true;
            processFrameRef.current(photo, partnerFrameRef.current);
          }
        }
      }
    }, 50);
  }, [capturePhoto, triggerFlash]);

  const handleFlashReceived = useCallback(() => {
    triggerFlash();
  }, [triggerFlash]);

  const handleNewSessionReceived = useCallback(() => {
    resetPhotoState();
  }, [resetPhotoState]);

  const handleRetakeReceivedStable = useCallback(() => {
    handleRetakeReceived();
  }, [handleRetakeReceived]);

  const handleSharedStateUpdate = useCallback((updates: Partial<SharedState>) => {
    if (updates.view === "result" && updates.resultImage) {
      setResultImage(updates.resultImage);
      setView("result");
      setIsComposing(false);
    }
    if (updates.view === "camera") {
      setView("camera");
      setResultImage("");
    }
  }, []);

  const { remoteStream, connected, peerCount, partnerName, sendPhoto, sendRetake, sendCaptureStart, sendFlash, sendNewSession, updateSharedState, addGalleryItem, addTimelineActivity } = useWebRTC({
    roomCode,
    userName,
    localStream: stream,
    onPhotoReceived: handlePhotoReceivedStable,
    onRetakeReceived: handleRetakeReceivedStable,
    onCaptureStartReceived: handleCaptureStartStable,
    onFlashReceived: handleFlashReceived,
    onNewSessionReceived: handleNewSessionReceived,
    onSharedStateUpdate: handleSharedStateUpdate,
  });

  useEffect(() => {
    sendPhotoRef.current = sendPhoto;
  }, [sendPhoto]);

  const finishSequence = useCallback(() => {
    sequenceActiveRef.current = false;
    setIsComposing(true);
    composeStrip(accumulatedFramesRef.current, user?.name || "", partnerName).then((strip) => {
      setResultImage(strip);
      setView("result");
      setIsComposing(false);
      updateSharedState({ resultImage: strip, view: "result" });
    }).catch(() => {
      setIsComposing(false);
    });
  }, [updateSharedState, user?.name, partnerName]);

  const processFrame = useCallback(async (localPhoto: string, partnerPhoto: string) => {
    const coupleFrame = await composeFinalImage(localPhoto, partnerPhoto);
    accumulatedFramesRef.current.push(coupleFrame);
    const count = accumulatedFramesRef.current.length;
    setCaptureCount(count);

    if (count >= TOTAL_PHOTOS) {
      finishSequence();
    } else {
      nextFrameTimerRef.current = setTimeout(() => {
        if (sequenceActiveRef.current && isInitiatorRef.current) {
          const captureStartTime = startNextFrameRef.current();
          if (captureStartTime) sendCaptureStart(captureStartTime);
        }
      }, 1200);
    }
  }, [finishSequence, sendCaptureStart]);

  const startNextFrame = useCallback(() => {
    if (!sequenceActiveRef.current) return undefined;

    localFrameRef.current = null;
    partnerFrameRef.current = null;
    frameComposedRef.current = false;

    const captureStartTime = Date.now() + 3000;

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      const remaining = Math.ceil((captureStartTime - Date.now()) / 1000);
      if (remaining > 0) {
        setCountdown(remaining);
      } else {
        setCountdown(null);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;

        const photo = capturePhoto();
        if (photo) {
          localFrameRef.current = photo;
          triggerFlash();
          sendPhoto(photo);

          if (partnerFrameRef.current && !frameComposedRef.current) {
            frameComposedRef.current = true;
            processFrameRef.current(photo, partnerFrameRef.current);
          }
        }
      }
    }, 50);

    return captureStartTime;
  }, [capturePhoto, triggerFlash, sendPhoto]);

  useEffect(() => {
    processFrameRef.current = processFrame;
    startNextFrameRef.current = startNextFrame;
  });

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: true,
      });
      setStream(mediaStream);
      setIsActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      const message = err instanceof DOMException && err.name === "NotAllowedError"
        ? "Camera permission denied. Please allow camera access."
        : err instanceof DOMException && err.name === "NotFoundError"
        ? "No camera found on this device."
        : "Could not access camera.";
      setCameraError(message);
    }
  }, []);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
    }
  }, [stream]);

  const remoteVideoCallback = useCallback((node: HTMLVideoElement | null) => {
    if (node && remoteStream) {
      node.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const startCapture = () => {
    resetPhotoState();
    sequenceActiveRef.current = true;
    isInitiatorRef.current = true;
    addTimelineActivity({
      id: `cap-${Date.now()}`,
      type: "photo_captured",
      message: "Started a 4-photo strip session",
      timestamp: new Date().toISOString(),
      user: userName,
    });
    const captureStartTime = startNextFrame();
    if (captureStartTime) sendCaptureStart(captureStartTime);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.download = `togetherframe-strip-${Date.now()}.png`;
    link.href = resultImage;
    link.click();
  };

  const handleSave = async () => {
    if (!resultImage || saved) return;
    setIsSaving(true);
    try {
      await saveMemoryToAPI(roomCode, resultImage, "Our photo strip", selectedFrame);
      setSaved(true);
      addGalleryItem({
        id: `gal-${Date.now()}`,
        imageUrl: resultImage,
        caption: "Our photo strip",
        frame: selectedFrame,
        createdAt: new Date().toISOString(),
        savedBy: userName,
      });
    } catch {
      setSaved(true);
      addGalleryItem({
        id: `gal-${Date.now()}`,
        imageUrl: resultImage,
        caption: "Our photo strip",
        frame: selectedFrame,
        createdAt: new Date().toISOString(),
        savedBy: userName,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    resetPhotoState();
    updateSharedState({ resultImage: "", view: "camera" });
    addTimelineActivity({
      id: `ret-${Date.now()}`,
      type: "retake",
      message: "Retaking photos",
      timestamp: new Date().toISOString(),
      user: userName,
    });
    if (connected) sendRetake();
  };

  const handleNewSession = () => {
    resetPhotoState();
    updateSharedState({ resultImage: "", view: "camera" });
    addTimelineActivity({
      id: `sess-${Date.now()}`,
      type: "session_ended",
      message: "Session ended",
      timestamp: new Date().toISOString(),
      user: userName,
    });
    stream?.getTracks().forEach((t) => t.stop());
    if (connected) sendNewSession();
    router.push("/room");
  };

  const toggleCamera = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOff(!videoTrack.enabled);
    }
  };

  const toggleMic = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const isCapturing = countdown !== null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingElements />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="w-10 h-10 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center transition-colors pastel-shadow">
                <ArrowLeft className="w-5 h-5 text-warm-gray-400" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" fill="currentColor" />
              <span className="font-serif font-bold text-warm-gray-700 text-sm">TogetherFrame</span>
            </div>
            {user?.avatar && (
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gold/30 ml-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.avatar} alt="You" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                connected
                  ? "bg-green-50 text-green-600 border border-green-200/50"
                  : "bg-champagne/50 text-warm-gray-500 border border-gold/20"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  connected ? "bg-green-500 animate-pulse" : "bg-gold"
                }`}
              />
              {connected ? "Together" : peerCount > 0 ? "Connecting..." : "Waiting..."}
            </div>
            {partnerAvatar && (
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-lavender-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={partnerAvatar} alt="Partner" className="w-full h-full object-cover" />
              </div>
            )}
            <Link href="/gallery">
              <button className="px-3 py-1.5 rounded-full bg-white/60 hover:bg-white/80 text-xs font-medium text-warm-gray-500 pastel-shadow transition-colors">
                Gallery
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Partner Disconnected Banner */}
        <AnimatePresence>
          {peerCount > 0 && !connected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200/50 text-amber-600 text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                <span>Partner disconnected. Attempting to reconnect...</span>
                <span className="w-4 h-4 border-2 border-amber-300 border-t-amber-500 rounded-full animate-spin" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========== CAMERA VIEW ========== */}
        <div className={view === "camera" ? "" : "hidden"}>
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-5 w-full max-w-[680px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2 w-full">
                {/* Local Video Slot */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  {isCamOff && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-pink-50/90 backdrop-blur-sm">
                      <VideoOff className="w-8 h-8 text-pink-300 mb-1" />
                      <p className="text-[10px] text-pink-400 font-bold">Camera off</p>
                    </div>
                  )}
                  {cameraError && !isCamOff && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-pink-400 bg-gradient-to-br from-pink-50 to-rose-50 p-3">
                      <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mb-1.5">
                        <Camera className="w-5 h-5 text-pink-400" />
                      </div>
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 text-white text-xs font-bold shadow-lg active:scale-95 transition-all"
                      >
                        Enable Camera
                      </button>
                      <p className="text-[9px] text-pink-400 mt-1.5 text-center leading-relaxed max-w-[160px]">
                        {cameraError}
                      </p>
                    </div>
                  )}
                  {!isActive && !cameraError && !isCamOff && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-pink-50/80 to-rose-50/80">
                      <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center mb-1.5 shadow-lg animate-pulse-soft">
                        <Camera className="w-5 h-5 text-pink-400" />
                      </div>
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 text-white text-xs font-bold shadow-lg active:scale-95 transition-all"
                      >
                        Start Camera
                      </button>
                    </div>
                  )}
                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-white/80 backdrop-blur text-[10px] font-bold text-pink-500">
                    You
                  </div>
                </div>

                {/* Partner Video Slot */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-lavender-50 to-lavender-100 rounded-2xl overflow-hidden">
                  {remoteStream ? (
                    <video
                      ref={remoteVideoCallback}
                      autoPlay
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : connected ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {partnerAvatar ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/60 mb-1 animate-float">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={partnerAvatar}
                            alt="Partner"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="text-3xl mb-1 animate-float">💌</div>
                      )}
                      <p className="text-lavender-400 font-bold text-[10px]">Connected</p>
                      <p className="text-lavender-300 text-[9px] mt-0.5">Waiting for camera...</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-2xl mb-1 animate-pulse-soft">💌</div>
                      <p className="text-lavender-400 font-bold text-[10px]">Waiting...</p>
                      <p className="text-lavender-300 text-[9px] mt-0.5">
                        Room: <span className="font-bold text-lavender-500">{roomCode}</span>
                      </p>
                    </div>
                  )}
                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-white/80 backdrop-blur text-[10px] font-bold text-lavender-500">
                    Partner
                  </div>
                </div>
              </div>

              <div className="text-center pt-1">
                <p className="text-[11px] text-gray-300 font-serif tracking-wide">TogetherFrame</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={toggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isCamOff ? "bg-red-100 text-red-400" : "bg-white/80 text-gray-500 hover:bg-white"
              } pastel-shadow`}
            >
              {isCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleMic}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isMuted ? "bg-red-100 text-red-400" : "bg-white/80 text-gray-500 hover:bg-white"
              } pastel-shadow`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={startCapture}
              disabled={isCapturing || isComposing}
              className="relative group"
            >
              {!isCapturing && !isComposing && (
                <div className="absolute inset-0 rounded-full bg-pink-300 animate-ping opacity-20" />
              )}
              <div className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 ${
                isComposing
                  ? "bg-gradient-to-br from-rose-400 to-rose-600"
                  : isCapturing
                  ? "bg-gradient-to-br from-pink-500 to-rose-500"
                  : "bg-gradient-to-br from-pink-400 to-pink-500"
              }`}>
                {isComposing ? (
                  <span className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isCapturing ? (
                  <Camera className="w-8 h-8 animate-pulse" />
                ) : (
                  <Camera className="w-8 h-8" />
                )}
              </div>
            </button>

            <div className="w-12 h-12" />
          </div>

          {captureCount > 0 && captureCount < TOTAL_PHOTOS && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-rose-400 font-medium mb-4">
              Photo {captureCount} of {TOTAL_PHOTOS} captured!
            </motion.p>
          )}

          {isComposing && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-rose-400 font-medium mb-4">
              Composing your strip...
            </motion.p>
          )}

          {/* Flash overlay */}
          <AnimatePresence>
            {flashVisible && (
              <motion.div
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-50 bg-white pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Countdown Overlay */}
          <AnimatePresence>
            {countdown !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
              >
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <div className="text-9xl font-black text-white drop-shadow-lg">{countdown}</div>
                  <p className="text-xl text-white/80 mt-4 handwriting">
                    {countdown === 1 ? "Say cheese!" : "Get ready..."}
                  </p>
                  <p className="text-sm text-white/60 mt-2">
                    Photo {Math.min(captureCount + 1, TOTAL_PHOTOS)} of {TOTAL_PHOTOS}
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========== RESULT VIEW — Vertical Strip ========== */}
        {view === "result" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 border border-pink-200/50 mb-4"
              >
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="text-sm font-bold text-pink-600">Strip captured!</span>
              </motion.div>
              <h2 className="text-2xl font-serif font-bold text-warm-gray-800">Your TogetherFrame Strip</h2>
            </div>

            {/* Strip Preview — scaled to fit screen */}
            <div className="glass-card rounded-3xl p-4 sm:p-6 mb-6 pastel-shadow max-w-[480px] w-full mx-auto px-4 sm:px-0">
              {isComposing ? (
                <div className="flex items-center justify-center py-20">
                  <span className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                </div>
              ) : resultImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resultImage}
                  alt="TogetherFrame Strip"
                  className="w-full rounded-2xl"
                  style={{ aspectRatio: "420/1246", objectFit: "contain" }}
                />
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto w-full px-2">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-500 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-sm sm:text-base"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                Download
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || saved}
                className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-sm sm:text-base ${
                  saved
                    ? "bg-green-100 text-green-600 border border-green-200/50"
                    : "bg-gradient-to-br from-lavender-400 to-lavender-500 text-white"
                }`}
              >
                {isSaving ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saved ? (
                  <>✓ Saved</>
                ) : (
                  <>
                    <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                    Save
                  </>
                )}
              </button>
              <button
                onClick={handleRetake}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-white/80 hover:bg-white text-warm-gray-600 font-bold pastel-shadow hover:scale-[1.02] active:scale-95 transition-all text-sm sm:text-base"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                Retake
              </button>
              <button
                onClick={handleNewSession}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-white/80 hover:bg-white text-warm-gray-600 font-bold pastel-shadow hover:scale-[1.02] active:scale-95 transition-all text-sm sm:text-base"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                New Session
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
