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
} from "lucide-react";

import { useApp } from "@/lib/store";
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

  const W = 600;
  const H = 800;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return localPhoto;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  const PAD = 30;
  const GAP = 20;
  const TEXT_AREA = 60;
  const photoW = W - PAD * 2;
  const photoH = (H - PAD * 2 - GAP - TEXT_AREA) / 2;

  function drawPhoto(img: HTMLImageElement, x: number, y: number, w: number, h: number) {
    if (!ctx) return;
    const imgRatio = img.width / img.height;
    const slotRatio = w / h;
    let drawW: number, drawH: number, drawX: number, drawY: number;
    if (imgRatio > slotRatio) {
      drawW = w;
      drawH = w / imgRatio;
      drawX = x;
      drawY = y + (h - drawH) / 2;
    } else {
      drawH = h;
      drawW = h * imgRatio;
      drawX = x + (w - drawW) / 2;
      drawY = y;
    }
    ctx.save();
    roundRect(ctx, x, y, w, h, 12);
    ctx.clip();
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(x, y, w, h);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  drawPhoto(localImg, PAD, PAD, photoW, photoH);
  drawPhoto(partnerImg, PAD, PAD + photoH + GAP, photoW, photoH);

  ctx.fillStyle = "#bbbbbb";
  ctx.font = "13px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("TogetherFrame", W / 2, H - 25);

  return canvas.toDataURL("image/png");
}

type BoothView = "camera" | "result";

export default function BoothPage() {
  const router = useRouter();
  const { user, partnerAvatar, currentRoomCode, saveMemoryToAPI } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
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

  const roomCode = currentRoomCode || "local";
  const userName = user?.name || "Guest";

  const countdownTargetRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localCaptureRef = useRef<string | null>(null);
  const partnerCaptureRef = useRef<string | null>(null);
  const composedRef = useRef(false);

  const resetPhotoState = useCallback(() => {
    setCountdown(null);
    setSaved(false);
    setResultImage("");
    setView("camera");
    localCaptureRef.current = null;
    partnerCaptureRef.current = null;
    composedRef.current = false;
    countdownTargetRef.current = null;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const handleRetakeReceived = useCallback(() => {
    resetPhotoState();
  }, [resetPhotoState]);

  const composeAndShowRef = useRef<(local: string, partner: string) => void>(() => {});
  const handlePhotoReceivedInnerRef = useRef<(photoData: string) => void>(() => {});
  const handleCaptureStartInnerRef = useRef<(captureStartTime: number) => void>(() => {});

  const handlePhotoReceivedStable = useCallback((photoData: string) => {
    handlePhotoReceivedInnerRef.current(photoData);
  }, []);

  const handleRetakeReceivedStable = useCallback(() => {
    handleRetakeReceived();
  }, [handleRetakeReceived]);

  const handleCaptureStartStable = useCallback((captureStartTime: number) => {
    handleCaptureStartInnerRef.current(captureStartTime);
  }, []);

  const { remoteStream, connected, peerCount, sendPhoto, sendRetake, sendCaptureStart, updateSharedState, addGalleryItem, addTimelineActivity } = useWebRTC({
    roomCode,
    userName,
    localStream: stream,
    onPhotoReceived: handlePhotoReceivedStable,
    onRetakeReceived: handleRetakeReceivedStable,
    onCaptureStartReceived: handleCaptureStartStable,
  });

  const composeAndShow = useCallback(async (local: string, partner: string) => {
    if (composedRef.current) return;
    composedRef.current = true;
    setIsComposing(true);
    try {
      const finalImg = await composeFinalImage(local, partner);
      setResultImage(finalImg);
      setView("result");
      updateSharedState({ resultImage: finalImg, view: "result" });
    } catch {
      setResultImage(local);
      setView("result");
      updateSharedState({ resultImage: local, view: "result" });
    } finally {
      setIsComposing(false);
    }
  }, [updateSharedState]);

  const capturePhoto = (): string | null => {
    const video = videoRef.current;
    if (!video) return null;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;
    const canvas = document.createElement("canvas");
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, vw, vh);
    return canvas.toDataURL("image/png");
  };

  const handlePhotoReceivedInner = useCallback((photoData: string) => {
    partnerCaptureRef.current = photoData;
    if (localCaptureRef.current && !composedRef.current) {
      composeAndShowRef.current(localCaptureRef.current, photoData);
    }
  }, []);

  const handleCaptureStartInner = useCallback((captureStartTime: number) => {
    countdownTargetRef.current = captureStartTime;
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
          localCaptureRef.current = photo;
          setFlashVisible(true);
          setTimeout(() => setFlashVisible(false), 300);
          sendPhoto(photo);
          if (partnerCaptureRef.current && !composedRef.current) {
            composeAndShowRef.current(photo, partnerCaptureRef.current);
          }
        }
      }
    }, 50);
  }, [sendPhoto]);

  useEffect(() => { composeAndShowRef.current = composeAndShow; }, [composeAndShow]);
  useEffect(() => { handlePhotoReceivedInnerRef.current = handlePhotoReceivedInner; }, [handlePhotoReceivedInner]);
  useEffect(() => { handleCaptureStartInnerRef.current = handleCaptureStartInner; }, [handleCaptureStartInner]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: true,
        });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
      }
      setStream(mediaStream);
      setIsActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setCameraError("Camera permission was denied. Tap the lock/info icon in your address bar, find Camera, and set it to Allow. Then reload the page.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setCameraError("No camera found. Make sure your device has a camera connected.");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setCameraError("Camera is being used by another app. Close other camera apps and try again.");
      } else {
        setCameraError("Could not access camera. Check your browser camera settings and reload.");
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const remoteVideoCallback = useCallback((node: HTMLVideoElement | null) => {
    remoteVideoRef.current = node;
    if (node && remoteStream) {
      node.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const startCapture = () => {
    localCaptureRef.current = null;
    partnerCaptureRef.current = null;
    composedRef.current = false;
    setSaved(false);
    setResultImage("");
    setView("camera");

    addTimelineActivity({
      id: `cap-${Date.now()}`,
      type: "photo_captured",
      message: "Started a new photo session",
      timestamp: new Date().toISOString(),
      user: userName,
    });

    const captureStartTime = Date.now() + 3000;
    countdownTargetRef.current = captureStartTime;
    sendCaptureStart(captureStartTime);

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
          localCaptureRef.current = photo;
          setFlashVisible(true);
          setTimeout(() => setFlashVisible(false), 300);
          sendPhoto(photo);
          if (partnerCaptureRef.current && !composedRef.current) {
            composeAndShow(photo, partnerCaptureRef.current);
          }
        }
      }
    }, 50);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.download = `togetherframe-${Date.now()}.png`;
    link.href = resultImage;
    link.click();
  };

  const handleSave = async () => {
    if (!resultImage || saved) return;
    setIsSaving(true);
    try {
      await saveMemoryToAPI(roomCode, resultImage, "Our cute moment", selectedFrame);
      setSaved(true);
      addGalleryItem({
        id: `gal-${Date.now()}`,
        imageUrl: resultImage,
        caption: "Our cute moment",
        frame: selectedFrame,
        createdAt: new Date().toISOString(),
        savedBy: userName,
      });
    } catch {
      setSaved(true);
      addGalleryItem({
        id: `gal-${Date.now()}`,
        imageUrl: resultImage,
        caption: "Our cute moment",
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

        {/* ========== CAMERA VIEW (always mounted, hidden when viewing result) ========== */}
        <div className={view === "camera" ? "" : "hidden"}>
          {/* Fixed Shared Photobooth Frame */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-5 w-full max-w-[380px] flex flex-col gap-2">
              {/* Local Video Slot */}
              <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl overflow-hidden">
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
                    <VideoOff className="w-10 h-10 text-pink-300 mb-1" />
                    <p className="text-xs text-pink-400 font-bold">Camera off</p>
                  </div>
                )}
                {cameraError && !isCamOff && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-pink-400 bg-gradient-to-br from-pink-50 to-rose-50 p-4">
                    <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mb-2">
                      <Camera className="w-6 h-6 text-pink-400" />
                    </div>
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 text-white text-sm font-bold shadow-lg active:scale-95 transition-all"
                    >
                      Tap to Enable Camera
                    </button>
                    <p className="text-[10px] text-pink-400 mt-2 text-center leading-relaxed">
                      {cameraError}
                    </p>
                  </div>
                )}
                {!isActive && !cameraError && !isCamOff && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-pink-50/80 to-rose-50/80">
                    <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center mb-2 shadow-lg animate-pulse-soft">
                      <Camera className="w-7 h-7 text-pink-400" />
                    </div>
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 text-white text-sm font-bold shadow-lg active:scale-95 transition-all"
                    >
                      Start Camera
                    </button>
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/80 backdrop-blur text-[10px] font-bold text-pink-500">
                  You
                </div>
              </div>

              {/* Partner Video Slot */}
              <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-lavender-50 to-lavender-100 rounded-2xl overflow-hidden">
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
                      <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-white/60 mb-1 animate-float">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={partnerAvatar}
                          alt="Partner"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="text-4xl mb-1 animate-float">💌</div>
                    )}
                    <p className="text-lavender-400 font-bold text-xs">
                      Partner Connected
                    </p>
                    <p className="text-lavender-300 text-[10px] mt-0.5">
                      Waiting for camera...
                    </p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl mb-1 animate-pulse-soft">💌</div>
                    <p className="text-lavender-400 font-bold text-xs">
                      Waiting for partner...
                    </p>
                    <p className="text-lavender-300 text-[10px] mt-0.5">
                      Room:{" "}
                      <span className="font-bold text-lavender-500">
                        {roomCode}
                      </span>
                    </p>
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/80 backdrop-blur text-[10px] font-bold text-lavender-500">
                  Partner
                </div>
              </div>

              {/* Bottom Text */}
              <div className="text-center pt-1">
                <p className="text-[11px] text-gray-300 font-serif tracking-wide">
                  TogetherFrame
                </p>
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

            {/* Capture Button */}
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

          {isComposing && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-rose-400 font-medium mb-4">
              Composing your photo...
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
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========== RESULT VIEW ========== */}
        {view === "result" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 border border-pink-200/50 mb-4"
              >
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="text-sm font-bold text-pink-600">Photo captured!</span>
              </motion.div>
              <h2 className="text-2xl font-serif font-bold text-warm-gray-800">Your TogetherFrame</h2>
            </div>

            {/* Preview */}
            <div className="glass-card rounded-3xl p-6 mb-6 pastel-shadow">
              {isComposing ? (
                <div className="flex items-center justify-center py-20">
                  <span className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
                </div>
              ) : resultImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resultImage}
                  alt="Your TogetherFrame"
                  className="w-full rounded-2xl"
                />
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-500 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || saved}
                className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all ${
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
                    <Save className="w-5 h-5" />
                    Save
                  </>
                )}
              </button>
              <button
                onClick={handleRetake}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/80 hover:bg-white text-warm-gray-600 font-bold pastel-shadow hover:scale-[1.02] active:scale-95 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                Retake
              </button>
              <button
                onClick={handleNewSession}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/80 hover:bg-white text-warm-gray-600 font-bold pastel-shadow hover:scale-[1.02] active:scale-95 transition-all"
              >
                <LogOut className="w-5 h-5" />
                New Session
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
