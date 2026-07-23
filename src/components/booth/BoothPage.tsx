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
  Sparkles,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FRAMES } from "@/lib/constants";
import { FrameType } from "@/lib/types";
import { useApp } from "@/lib/store";
import FloatingElements from "@/components/ui/FloatingElements";
import {
  LoveCapsule,
  DistanceCounter,
  SurpriseBox,
  VirtualHug,
  RandomWheel,
  CouplePet,
  SamePoseChallenge,
  QuestionOfDay,
  CoupleStreak,
  DailyThemeDisplay,
} from "@/components/features";

export default function BoothPage() {
  const router = useRouter();
  const { user } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<FrameType>("polaroid");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [partnerConnected] = useState(true);
  const [showFeatures, setShowFeatures] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const frameScrollRef = useRef<HTMLDivElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: true,
      });
      setStream(mediaStream);
      setIsActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setCameraError("Could not access camera. Please allow camera permissions.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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

  const startCountdown = () => {
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);
        const photo = capturePhoto();
        if (photo) {
          sessionStorage.setItem("capturedPhoto", photo);
          sessionStorage.setItem("selectedFrame", selectedFrame);
          router.push("/editor");
        }
      }
    }, 1000);
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

  const scrollFrames = (dir: "left" | "right") => {
    if (frameScrollRef.current) {
      const amount = dir === "left" ? -200 : 200;
      frameScrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

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
                partnerConnected
                  ? "bg-green-50 text-green-600 border border-green-200/50"
                  : "bg-champagne/50 text-warm-gray-500 border border-gold/20"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  partnerConnected ? "bg-green-500 animate-pulse" : "bg-gold"
                }`}
              />
              {partnerConnected ? "Together" : "Waiting..."}
            </div>
            <Link href="/gallery">
              <button className="px-3 py-1.5 rounded-full bg-white/60 hover:bg-white/80 text-xs font-medium text-warm-gray-500 pastel-shadow transition-colors">
                Gallery
              </button>
            </Link>
            <Link href="/collage">
              <button className="px-3 py-1.5 rounded-full bg-white/60 hover:bg-white/80 text-xs font-medium text-warm-gray-500 pastel-shadow transition-colors">
                Collage
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
                <div className="absolute inset-0 flex flex-col items-center justify-center text-pink-400">
                  <Camera className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm text-center px-4">{cameraError}</p>
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
              {partnerConnected ? (
                <div className="text-center">
                  <div className="text-7xl mb-3 animate-float">🐰</div>
                  <p className="text-lavender-400 font-bold text-sm">
                    Partner&apos;s Camera
                  </p>
                  <p className="text-lavender-300 text-xs mt-1">
                    Connected &amp; ready to capture
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-5xl mb-3 animate-pulse-soft">💌</div>
                  <p className="text-lavender-400 font-bold text-sm">
                    Waiting for partner...
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
            disabled={countdown !== null}
            className="relative group"
          >
            <div className="absolute inset-0 rounded-full bg-pink-300 animate-ping opacity-20" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200">
              <Camera className="w-8 h-8" />
            </div>
          </button>

          <button className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-gray-500 hover:bg-white pastel-shadow transition-all">
            <Download className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-gray-500 hover:bg-white pastel-shadow transition-all">
            <Sparkles className="w-5 h-5" />
          </button>
        </motion.div>

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
                  {countdown === 1 ? "Smile! 📸" : "Get ready..."}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Frame Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-3xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-600 text-sm">Choose a Frame</h3>
            <button
              onClick={() => scrollFrames("left")}
              className="w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-pink-400" />
            </button>
          </div>
          <div
            ref={frameScrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: "none" }}
          >
            {FRAMES.map((frame) => (
              <button
                key={frame.id}
                onClick={() => setSelectedFrame(frame.id)}
                className={`flex-shrink-0 w-24 p-3 rounded-2xl text-center transition-all duration-200 ${
                  selectedFrame === frame.id
                    ? "bg-pink-100 ring-3 ring-pink-400 scale-105"
                    : "bg-white/60 hover:bg-pink-50 hover:scale-102"
                }`}
              >
                <div className="text-2xl mb-1">{frame.emoji}</div>
                <div className="text-xs font-bold text-gray-600 truncate">
                  {frame.name}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => scrollFrames("right")}
            className="absolute right-4 top-1/2 w-8 h-8 rounded-full bg-pink-50 hover:bg-pink-100 items-center justify-center transition-colors hidden"
          >
            <ChevronRight className="w-4 h-4 text-pink-400" />
          </button>
        </motion.div>

        {/* Quick Actions Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="mt-4 flex gap-3 justify-center"
        >
          <Link href="/collage">
            <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-rose-200/30 transition-all">
              Create Collage
            </button>
          </Link>
          <Link href="/gallery">
            <button className="px-5 py-2.5 rounded-xl bg-white/60 hover:bg-white/80 text-warm-gray-500 text-xs font-medium flex items-center gap-2 pastel-shadow transition-all border border-warm-gray-100">
              Gallery
            </button>
          </Link>
        </motion.div>

        {/* Features Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-4"
        >
          <button
            onClick={() => setShowFeatures(!showFeatures)}
            className="w-full glass-card rounded-2xl px-6 py-4 flex items-center justify-between hover:bg-white/70 transition-all"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-rose-400" fill="currentColor" />
              <div className="text-left">
                <h3 className="font-serif font-bold text-warm-gray-700 text-sm">Intimate Features</h3>
                <p className="text-xs text-warm-gray-400">Love Letters, Virtual Embrace, Daily Questions & more</p>
              </div>
            </div>
            <motion.span
              animate={{ rotate: showFeatures ? 180 : 0 }}
              className="text-gray-400 text-lg"
            >
              ▼
            </motion.span>
          </button>

          <AnimatePresence>
            {showFeatures && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3"
              >
                {/* Feature quick actions */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[
                    { id: "capsule", emoji: "💌", label: "Love Letter" },
                    { id: "surprise", emoji: "🎁", label: "Surprise" },
                    { id: "hug", emoji: "🫂", label: "Virtual Hug" },
                    { id: "pet", emoji: "🐾", label: "Our Pet" },
                    { id: "wheel", emoji: "🎡", label: "Spin Wheel" },
                    { id: "distance", emoji: "🌍", label: "Distance" },
                    { id: "pose", emoji: "📸", label: "Pose" },
                    { id: "question", emoji: "💭", label: "Question" },
                    { id: "streak", emoji: "🔥", label: "Streak" },
                    { id: "theme", emoji: "🎨", label: "Theme" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFeature(activeFeature === f.id ? null : f.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                        activeFeature === f.id
                          ? "bg-pink-100 ring-2 ring-pink-400 scale-105"
                          : "bg-white/60 hover:bg-pink-50"
                      }`}
                    >
                      <span className="text-xl">{f.emoji}</span>
                      <span className="text-[10px] font-bold text-gray-500">{f.label}</span>
                    </button>
                  ))}
                </div>

                {/* Active feature panel */}
                <AnimatePresence mode="wait">
                  {activeFeature && (
                    <motion.div
                      key={activeFeature}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {activeFeature === "capsule" && <LoveCapsule />}
                      {activeFeature === "surprise" && <SurpriseBox />}
                      {activeFeature === "hug" && <VirtualHug />}
                      {activeFeature === "pet" && <CouplePet />}
                      {activeFeature === "wheel" && <RandomWheel />}
                      {activeFeature === "distance" && <DistanceCounter />}
                      {activeFeature === "pose" && <SamePoseChallenge />}
                      {activeFeature === "question" && <QuestionOfDay />}
                      {activeFeature === "streak" && <CoupleStreak />}
                      {activeFeature === "theme" && <DailyThemeDisplay />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
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
