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
} from "lucide-react";
import { FrameType } from "@/lib/types";
import { useApp } from "@/lib/store";
import FloatingElements from "@/components/ui/FloatingElements";
import FrameLayoutSelector from "@/components/ui/FrameLayoutSelector";
import { useWebRTC } from "@/hooks/useWebRTC";

function composeLayout(photos: string[], layout: "1x4" | "2x2"): Promise<string> {
  const W = 400;
  const GAP = 6;
  const PADDING = 10;
  const innerW = W - PADDING * 2;
  let H: number;
  let cols: number;
  let rows: number;
  let slotH: number;

  if (layout === "1x4") {
    cols = 1;
    rows = 4;
    slotH = innerW * 1.1;
    H = PADDING * 2 + rows * slotH + (rows - 1) * GAP;
  } else {
    cols = 2;
    rows = 2;
    slotH = innerW / cols;
    H = PADDING * 2 + rows * slotH + (rows - 1) * GAP;
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject("Canvas context unavailable");

  ctx.fillStyle = "#fdf2f8";
  ctx.fillRect(0, 0, W, H);

  const slotW = (innerW - (cols - 1) * GAP) / cols;

  const drawPromises = photos.map((src, i) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const col = layout === "1x4" ? 0 : i % cols;
        const row = layout === "1x4" ? i : Math.floor(i / cols);
        const x = PADDING + col * (slotW + GAP);
        const y = PADDING + row * (slotH + GAP);

        ctx.save();
        const radius = 10;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + slotW - radius, y);
        ctx.quadraticCurveTo(x + slotW, y, x + slotW, y + radius);
        ctx.lineTo(x + slotW, y + slotH - radius);
        ctx.quadraticCurveTo(x + slotW, y + slotH, x + slotW - radius, y + slotH);
        ctx.lineTo(x + radius, y + slotH);
        ctx.quadraticCurveTo(x, y + slotH, x, y + slotH - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.clip();

        const imgRatio = img.width / img.height;
        const slotRatio = slotW / slotH;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (imgRatio > slotRatio) {
          sw = img.height * slotRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / slotRatio;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, x, y, slotW, slotH);
        ctx.restore();
        resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });
  });

  return Promise.all(drawPromises).then(() => canvas.toDataURL("image/png"));
}

export default function BoothPage() {
  const router = useRouter();
  const { user, partnerAvatar, frameLayout, setFrameLayout, currentRoomCode } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<FrameType>("polaroid");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [captureIndex, setCaptureIndex] = useState<number | null>(null);
  const [flashVisible, setFlashVisible] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const captureTimerRef = useRef<NodeJS.Timeout | null>(null);

  const roomCode = currentRoomCode || "local";
  const userName = user?.name || "Guest";

  const { remoteStream, connected, peerCount } = useWebRTC({
    roomCode,
    userName,
    localStream: stream,
  });

  const TOTAL_PHOTOS = 4;

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
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const capturePhoto = (): string | null => {
    const video = videoRef.current;
    if (!video) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const flash = () => {
    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 300);
  };

  const runCaptureSequence = useCallback(async (layoutType: "1x4" | "2x2") => {
    const photos: string[] = [];
    for (let i = 0; i < TOTAL_PHOTOS; i++) {
      setCaptureIndex(i);
      await new Promise<void>((resolve) => {
        let count = 3;
        setCountdown(count);
        const interval = setInterval(() => {
          count--;
          if (count > 0) {
            setCountdown(count);
          } else {
            clearInterval(interval);
            setCountdown(null);
            resolve();
          }
        }, 1000);
      });
      flash();
      const photo = capturePhoto();
      if (photo) {
        photos.push(photo);
        setCapturedPhotos([...photos]);
      }
    }
    setCaptureIndex(null);
    return photos;
  }, []);

  const startCountdown = async () => {
    setCapturedPhotos([]);
    const photos = await runCaptureSequence(frameLayout);
    if (photos.length === 0) return;
    setIsComposing(true);
    try {
      let finalImage: string;
      if (photos.length === 1) {
        finalImage = photos[0];
      } else {
        finalImage = await composeLayout(photos, frameLayout);
      }
      sessionStorage.setItem("capturedPhoto", finalImage);
      sessionStorage.setItem("selectedFrame", selectedFrame);
      router.push("/editor");
    } catch {
      sessionStorage.setItem("capturedPhoto", photos[0]);
      sessionStorage.setItem("selectedFrame", selectedFrame);
      router.push("/editor");
    } finally {
      setIsComposing(false);
    }
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

  const isCapturing = captureIndex !== null;

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

        {/* Split Screen */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        >
          {/* Partner 1 (You) */}
          <div className="relative rounded-3xl overflow-hidden pastel-shadow">
            <div className="aspect-[4/3] bg-gradient-to-br from-pink-100 to-pink-200 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              {isCamOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-pink-50/90 backdrop-blur-sm">
                  <VideoOff className="w-12 h-12 text-pink-300 mb-2" />
                  <p className="text-sm text-pink-400 font-bold">Camera off</p>
                </div>
              )}
              {cameraError && !isCamOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-pink-400 bg-gradient-to-br from-pink-50 to-rose-50 p-6">
                  <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-3">
                    <Camera className="w-8 h-8 text-pink-400" />
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 text-white text-lg font-bold shadow-xl hover:shadow-2xl active:scale-95 transition-all"
                  >
                    Tap to Enable Camera
                  </button>
                  <p className="text-xs text-pink-400 mt-4 text-center leading-relaxed">{cameraError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-1.5 rounded-full bg-pink-100 text-pink-500 text-xs font-bold hover:bg-pink-200 transition-colors"
                  >
                    Reload Page
                  </button>
                </div>
              )}
              {!isActive && !cameraError && !isCamOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-pink-50/80 to-rose-50/80">
                  <div className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center mb-4 shadow-lg animate-pulse-soft">
                    <Camera className="w-10 h-10 text-pink-400" />
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-10 py-5 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 text-white text-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
                  >
                    📸 Tap to Start Camera
                  </button>
                  <p className="text-sm text-pink-300 mt-3">Tap the button above to allow camera access</p>
                </div>
              )}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/80 backdrop-blur text-xs font-bold text-pink-500">
                You 📷
              </div>
              {/* Frame overlay */}
              <FrameOverlay frame={selectedFrame} side="left" />
            </div>
          </div>

          {/* Connection Indicator */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 z-20 flex-col items-center gap-1">
            <Heart
              className="w-6 h-6 text-pink-400 animate-heartbeat"
              fill="currentColor"
            />
          </div>

          {/* Partner 2 */}
          <div className="relative rounded-3xl overflow-hidden pastel-shadow">
            <div className="aspect-[4/3] bg-gradient-to-br from-lavender-100 to-lavender-200 relative flex items-center justify-center">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : connected ? (
                <div className="text-center">
                  {partnerAvatar ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/60 mx-auto mb-3 animate-float">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={partnerAvatar} alt="Partner" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="text-7xl mb-3 animate-float">💌</div>
                  )}
                  <p className="text-lavender-400 font-bold text-sm">
                    Partner Connected
                  </p>
                  <p className="text-lavender-300 text-xs mt-1">
                    Waiting for camera...
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-5xl mb-3 animate-pulse-soft">💌</div>
                  <p className="text-lavender-400 font-bold text-sm">
                    Waiting for partner...
                  </p>
                  <p className="text-lavender-300 text-xs mt-1">
                    Share room code: <span className="font-bold text-lavender-500">{roomCode}</span>
                  </p>
                </div>
              )}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/80 backdrop-blur text-xs font-bold text-lavender-500">
                Partner 📷
              </div>
              <FrameOverlay frame={selectedFrame} side="right" />
            </div>
          </div>
        </motion.div>

        {/* Frame Layout Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <FrameLayoutSelector
            value={frameLayout}
            onChange={setFrameLayout}
          />
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-4 mb-6"
        >
          <button
            onClick={toggleCamera}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isCamOff
                ? "bg-red-100 text-red-400"
                : "bg-white/80 text-gray-500 hover:bg-white"
            } pastel-shadow`}
          >
            {isCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? "bg-red-100 text-red-400"
                : "bg-white/80 text-gray-500 hover:bg-white"
            } pastel-shadow`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Capture Button */}
          <button
            onClick={startCountdown}
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

          <button className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-gray-500 hover:bg-white pastel-shadow transition-all">
            <Download className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Capture progress thumbnails */}
        <AnimatePresence>
          {capturedPhotos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              {Array.from({ length: TOTAL_PHOTOS }).map((_, i) => (
                <div
                  key={i}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    i < capturedPhotos.length
                      ? "border-pink-400 shadow-md shadow-pink-100"
                      : i === captureIndex
                      ? "border-pink-300 border-dashed animate-pulse"
                      : "border-warm-gray-100"
                  }`}
                >
                  {i < capturedPhotos.length ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={capturedPhotos[i]}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/40">
                      <span className="text-[10px] font-bold text-warm-gray-300">
                        {i + 1}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Capture progress text */}
        {isCapturing && captureIndex !== null && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-warm-gray-400 font-medium mb-4"
          >
            Photo {captureIndex + 1} of {TOTAL_PHOTOS}
          </motion.p>
        )}

        {/* Composing indicator */}
        {isComposing && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-rose-400 font-medium mb-4"
          >
            Composing your layout...
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
                <div className="text-9xl font-black text-white drop-shadow-lg">
                  {countdown}
                </div>
                <p className="text-xl text-white/80 mt-4 handwriting">
                  {countdown === 1
                    ? isCapturing
                      ? `Say cheese! 📸 (${(captureIndex ?? 0) + 1}/${TOTAL_PHOTOS})`
                      : "Smile! 📸"
                    : "Get ready..."}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function FrameOverlay({ frame, side }: { frame: FrameType; side: "left" | "right" }) {
  const overlayStyle = "absolute inset-0 pointer-events-none";

  switch (frame) {
    case "pink-heart":
      return (
        <div className={overlayStyle}>
          <div className="absolute inset-0 border-4 border-pink-300 rounded-3xl" />
          <div className="absolute top-2 right-2 text-lg">💕</div>
          <div className="absolute bottom-2 left-2 text-lg">💗</div>
          <div className="absolute top-2 left-2 text-sm">✨</div>
          <div className="absolute bottom-2 right-2 text-sm">🎀</div>
        </div>
      );
    case "scrapbook":
      return (
        <div className={overlayStyle}>
          <div className="absolute inset-0 border-4 border-dashed border-amber-300 rounded-2xl" />
          <div className="absolute -top-1 left-1/4 w-12 h-5 bg-amber-100/70 rotate-[-3deg] rounded" />
          <div className="absolute top-3 right-2 text-sm">🌸</div>
          <div className="absolute bottom-2 left-2 text-sm">📒</div>
        </div>
      );
    case "miles-apart":
      return (
        <div className={overlayStyle}>
          <div className="absolute inset-0 border-4 border-blue-300 rounded-3xl" />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/80 px-2 py-0.5 rounded-full text-[10px] font-bold text-blue-400">
            Miles Apart, Together at Heart
          </div>
          <div className="absolute bottom-2 left-2 text-sm">🌍</div>
          <div className="absolute bottom-2 right-2 text-sm">💕</div>
        </div>
      );
    case "cloud-stars":
      return (
        <div className={overlayStyle}>
          <div className="absolute inset-0 border-4 border-blue-200 rounded-3xl" />
          <div className="absolute top-2 right-2 text-sm">☁️</div>
          <div className="absolute top-3 left-2 text-sm">⭐</div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm">🌙</div>
        </div>
      );
    case "bear-bunny":
      return (
        <div className={overlayStyle}>
          <div className="absolute inset-0 border-4 border-amber-200 rounded-3xl" />
          <div className="absolute top-2 left-2 text-lg">
            {side === "left" ? "🐻" : "🐰"}
          </div>
          <div className="absolute bottom-2 right-2 text-lg">
            {side === "left" ? "🐰" : "🐻"}
          </div>
        </div>
      );
    case "love-letter":
      return (
        <div className={overlayStyle}>
          <div className="absolute inset-0 border-4 border-red-200 rounded-2xl" />
          <div className="absolute top-2 right-2 text-sm">💌</div>
          <div className="absolute top-2 left-2 text-sm">💝</div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs handwriting text-red-300">
            With love
          </div>
        </div>
      );
    case "polaroid":
      return (
        <div className={overlayStyle}>
          <div className="absolute inset-x-3 inset-y-3 border-2 border-white/60 rounded" />
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-white/80 px-2 py-0.5 rounded text-[10px] text-gray-400">
            TogetherFrame
          </div>
        </div>
      );
    case "photobooth-strip":
      return (
        <div className={overlayStyle}>
          <div className="absolute inset-y-0 left-0 w-2 bg-pink-200" />
          <div className="absolute inset-y-0 right-0 w-2 bg-pink-200" />
          <div className="absolute top-2 right-2 text-sm">📸</div>
        </div>
      );
    case "same-moment":
      return (
        <div className={overlayStyle}>
          <div className="absolute inset-0 border-4 border-lavender-200 rounded-3xl" />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/80 px-2 py-0.5 rounded-full text-[10px] font-bold text-lavender-400">
            Same Moment 🕐
          </div>
        </div>
      );
    default:
      return null;
  }
}
