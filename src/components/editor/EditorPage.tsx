"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Save,
  Type,
  Smile,
  Palette,
  Heart,
  X,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { FRAMES, STICKERS, FILTERS } from "@/lib/constants";
import { FrameType, PlacedSticker } from "@/lib/types";
import { useApp } from "@/lib/store";
import FloatingElements from "@/components/ui/FloatingElements";

type EditorTab = "frames" | "stickers" | "text" | "filters";

export default function EditorPage() {
  const router = useRouter();
  const { saveMemoryToAPI, currentRoomCode, editorState, updateEditorState } = useApp();
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  const [partnerPhotoUrl, setPartnerPhotoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("frames");
  const [textInput, setTextInput] = useState("");
  const [caption, setCaption] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const hasPartner = !!partnerPhotoUrl;

  useEffect(() => {
    const local = sessionStorage.getItem("capturedPhoto");
    const partner = sessionStorage.getItem("partnerPhoto");
    const frame = sessionStorage.getItem("selectedFrame") as FrameType | null;
    if (local) setLocalPhotoUrl(local);
    if (partner) setPartnerPhotoUrl(partner);
    if (frame) updateEditorState({ selectedFrame: frame });
  }, [updateEditorState]);

  const handleAddSticker = (emoji: string) => {
    const sticker: PlacedSticker = {
      id: `sticker-${Date.now()}-${Math.random()}`,
      emoji,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      scale: 1,
      rotation: -10 + Math.random() * 20,
    };
    updateEditorState({
      stickers: [...editorState.stickers, sticker],
    });
  };

  const handleRemoveSticker = (id: string) => {
    updateEditorState({
      stickers: editorState.stickers.filter((s) => s.id !== id),
    });
  };

  const handleTextChange = (val: string) => {
    setTextInput(val);
    updateEditorState({ text: val });
  };

  const handleCaptionChange = (val: string) => {
    setCaption(val);
    updateEditorState({ caption: val });
  };

  const handleFilterSelect = (filterId: string) => {
    updateEditorState({ filter: filterId });
  };

  const getFilterCSS = (filterId: string): string => {
    const f = FILTERS.find((f) => f.id === filterId);
    return f?.css === "none" ? "" : f?.css || "";
  };

  const handleDownload = useCallback(async () => {
    if (!localPhotoUrl) return;
    const finalImage = await composeCoupleFrame(
      localPhotoUrl, partnerPhotoUrl, editorState.selectedFrame,
      editorState.stickers, textInput, getFilterCSS(editorState.filter)
    );
    const link = document.createElement("a");
    link.download = `togetherframe-${Date.now()}.png`;
    link.href = finalImage;
    link.click();
  }, [localPhotoUrl, partnerPhotoUrl, editorState, textInput]);

  const handleSave = async () => {
    if (!localPhotoUrl) return;
    const finalImage = await composeCoupleFrame(
      localPhotoUrl, partnerPhotoUrl, editorState.selectedFrame,
      editorState.stickers, textInput, getFilterCSS(editorState.filter)
    );
    const captionText = caption || editorState.caption || "Our cute moment 💕";
    const roomCode = currentRoomCode || "local";
    await saveMemoryToAPI(roomCode, finalImage, captionText, editorState.selectedFrame);
    sessionStorage.removeItem("capturedPhoto");
    sessionStorage.removeItem("partnerPhoto");
    sessionStorage.removeItem("selectedFrame");
    router.push("/gallery");
  };

  const tabs: { id: EditorTab; icon: React.ReactNode; label: string }[] = [
    { id: "frames", icon: <span className="text-lg">🖼️</span>, label: "Frames" },
    { id: "stickers", icon: <Smile className="w-5 h-5" />, label: "Stickers" },
    { id: "text", icon: <Type className="w-5 h-5" />, label: "Text" },
    { id: "filters", icon: <Palette className="w-5 h-5" />, label: "Filters" },
  ];

  const stickerCategories = [
    "hearts", "stars", "bows", "flowers", "cute", "love", "nature",
  ] as const;

  const frameColors: Record<FrameType, string> = {
    "pink-heart": "from-pink-100 to-pink-200",
    scrapbook: "from-amber-50 to-amber-100",
    "miles-apart": "from-blue-100 to-cyan-100",
    "cloud-stars": "from-blue-50 to-indigo-100",
    "bear-bunny": "from-amber-100 to-orange-100",
    "love-letter": "from-red-50 to-pink-100",
    polaroid: "from-gray-50 to-gray-100",
    "photobooth-strip": "from-pink-50 to-rose-100",
    "same-moment": "from-lavender-50 to-lavender-100",
  };

  if (!localPhotoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📸</div>
          <p className="text-gray-400 mb-4">No photo to edit yet!</p>
          <Link href="/booth">
            <button className="cute-button bg-pink-400 text-white">
              Take a Photo
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingElements />
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <Link href="/booth">
              <button className="w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors pastel-shadow">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
            </Link>
            <div>
              <h1 className="font-bold text-gray-700">Edit Your Photo</h1>
              <p className="text-xs text-gray-400">
                Add frames, stickers, and filters ✨
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-full bg-white/80 hover:bg-white text-sm font-bold text-gray-500 pastel-shadow transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 text-white text-sm font-bold hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Photo Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="glass-card rounded-3xl p-6 relative">
              <div className="relative overflow-hidden rounded-2xl">
                {/* Frame border */}
                <div
                  className={`absolute inset-0 rounded-2xl z-10 pointer-events-none ${
                    frameColors[editorState.selectedFrame]
                      ? `bg-gradient-to-br ${frameColors[editorState.selectedFrame]} opacity-30`
                      : ""
                  }`}
                />

                {/* Photo(s) */}
                <div className="relative max-h-[60vh] overflow-hidden rounded-2xl">
                  <CoupleFramePreview
                    localPhoto={localPhotoUrl}
                    partnerPhoto={partnerPhotoUrl}
                    frame={editorState.selectedFrame}
                    filter={getFilterCSS(editorState.filter)}
                  />

                  {/* Stickers overlay */}
                  {editorState.stickers.map((s) => (
                    <div
                      key={s.id}
                      className="absolute group cursor-pointer"
                      style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        transform: `rotate(${s.rotation}deg) scale(${s.scale})`,
                        fontSize: "2rem",
                      }}
                      onClick={() => handleRemoveSticker(s.id)}
                    >
                      {s.emoji}
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-400 text-white rounded-full text-xs items-center justify-center hidden group-hover:flex">
                        <X className="w-3 h-3" />
                      </div>
                    </div>
                  ))}

                  {/* Text overlay */}
                  {textInput && (
                    <div className="absolute bottom-4 left-0 right-0 text-center z-20">
                      <span className="handwriting text-3xl text-white drop-shadow-lg bg-black/20 px-4 py-1 rounded-full">
                        {textInput}
                      </span>
                    </div>
                  )}

                  {/* Frame decoration */}
                  <FrameDecoration frame={editorState.selectedFrame} hasPartner={hasPartner} />
                </div>
              </div>

              {/* Caption */}
              <div className="mt-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-pink-300" />
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => handleCaptionChange(e.target.value)}
                  placeholder="Add a cute caption..."
                  className="cute-input text-sm py-2"
                />
              </div>

              {/* Date */}
              <div className="mt-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-lavender-300" />
                <span className="text-sm text-gray-400 handwriting text-lg">
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Editing Tools */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl p-6"
          >
            {/* Tab bar */}
            <div className="flex gap-1 mb-6 bg-white/50 rounded-2xl p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                    activeTab === tab.id
                      ? "bg-pink-100 text-pink-500"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === "frames" && (
                <motion.div
                  key="frames"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <h3 className="font-bold text-gray-600 text-sm mb-3">
                    Choose a Frame
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {FRAMES.map((frame) => (
                      <button
                        key={frame.id}
                        onClick={() =>
                          updateEditorState({ selectedFrame: frame.id })
                        }
                        className={`p-3 rounded-2xl text-center transition-all ${
                          editorState.selectedFrame === frame.id
                            ? "bg-pink-100 ring-2 ring-pink-400 scale-105"
                            : "bg-white/60 hover:bg-pink-50"
                        }`}
                      >
                        <div className="text-xl mb-1">{frame.emoji}</div>
                        <div className="text-[10px] font-bold text-gray-500 truncate">
                          {frame.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "stickers" && (
                <motion.div
                  key="stickers"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h3 className="font-bold text-gray-600 text-sm mb-3">
                    Add Stickers
                  </h3>
                  {stickerCategories.map((cat) => (
                    <div key={cat} className="mb-4">
                      <p className="text-xs text-gray-400 font-bold mb-2 capitalize">
                        {cat}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {STICKERS.filter((s) => s.category === cat).map(
                          (sticker) => (
                            <button
                              key={sticker.id}
                              onClick={() => handleAddSticker(sticker.emoji)}
                              className="w-10 h-10 rounded-xl bg-white/60 hover:bg-pink-50 hover:scale-110 transition-all flex items-center justify-center text-lg"
                              title={sticker.label}
                            >
                              {sticker.emoji}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === "text" && (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="font-bold text-gray-600 text-sm mb-2">
                      Add Text on Photo
                    </h3>
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => handleTextChange(e.target.value)}
                      placeholder="Type something cute..."
                      className="cute-input text-sm"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-600 text-sm mb-2">
                      Caption
                    </h3>
                    <textarea
                      value={caption}
                      onChange={(e) => handleCaptionChange(e.target.value)}
                      placeholder="Write a caption for this memory..."
                      className="cute-input text-sm min-h-[80px] resize-none"
                      maxLength={200}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Heart className="w-4 h-4 text-pink-300" fill="currentColor" />
                    <span className="handwriting text-lg">
                      &quot;Every photo is a love story&quot;
                    </span>
                  </div>
                </motion.div>
              )}

              {activeTab === "filters" && (
                <motion.div
                  key="filters"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h3 className="font-bold text-gray-600 text-sm mb-3">
                    Choose a Filter
                  </h3>
                  <div className="max-h-64 overflow-y-auto pr-1 scrollbar-hide">
                  <div className="grid grid-cols-4 gap-2">
                    {FILTERS.map((filter) => {
                      const filterEmojis: Record<string, string> = {
                        none: "🌈",
                        warm: "☀️",
                        cool: "❄️",
                        soft: "🫧",
                        vintage: "📜",
                        dreamy: "💭",
                        pastel: "🎨",
                        rosy: "🌹",
                        noir: "🖤",
                        sepia: "🎞️",
                        film: "🎬",
                        "cross-process": "🧪",
                        lomo: "📷",
                        dramatic: "⚡",
                        fade: "🌅",
                        vivid: "🌈",
                        "golden-hour": "🌇",
                        moody: "🌧️",
                        polaroid: "📸",
                        matte: "🌫️",
                        glam: "✨",
                        "bw-warm": "🎞️",
                        "bw-cool": "❄️",
                      };
                      return (
                        <button
                          key={filter.id}
                          onClick={() => handleFilterSelect(filter.id)}
                          className={`p-2 rounded-2xl text-center transition-all ${
                            editorState.filter === filter.id
                              ? "bg-pink-100 ring-2 ring-pink-400 scale-105"
                              : "bg-white/60 hover:bg-pink-50"
                          }`}
                        >
                          <div className="text-lg mb-1">
                            {filterEmojis[filter.id] || "✨"}
                          </div>
                          <div className="text-[9px] font-bold text-gray-500 leading-tight">
                            {filter.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function composeCoupleFrame(
  localPhoto: string,
  partnerPhoto: string | null,
  frame: FrameType,
  stickers: PlacedSticker[],
  text: string,
  filter: string
): Promise<string> {
  const localImg = await loadImage(localPhoto);
  const partnerImg = partnerPhoto ? await loadImage(partnerPhoto) : null;

  const W = partnerImg ? 800 : localImg.width;
  const H = partnerImg ? Math.max(localImg.height, partnerImg.height) : localImg.height;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return localPhoto;

  if (filter) ctx.filter = filter;

  if (partnerImg) {
    const halfW = W / 2;
    const drawW = halfW - 10;
    const drawH = H - 20;

    const localRatio = localImg.width / localImg.height;
    const partnerRatio = partnerImg.width / partnerImg.height;
    const slotRatio = drawW / drawH;

    let lsx = 0, lsy = 0, lsw = localImg.width, lsh = localImg.height;
    if (localRatio > slotRatio) { lsw = localImg.height * slotRatio; lsx = (localImg.width - lsw) / 2; }
    else { lsh = localImg.width / slotRatio; lsy = (localImg.height - lsh) / 2; }

    let psx = 0, psy = 0, psw = partnerImg.width, psh = partnerImg.height;
    if (partnerRatio > slotRatio) { psw = partnerImg.height * slotRatio; psx = (partnerImg.width - psw) / 2; }
    else { psh = partnerImg.width / slotRatio; psy = (partnerImg.height - psh) / 2; }

    ctx.drawImage(localImg, lsx, lsy, lsw, lsh, 5, 10, drawW, drawH);
    ctx.drawImage(partnerImg, psx, psy, psw, psh, halfW + 5, 10, drawW, drawH);
  } else {
    ctx.drawImage(localImg, 0, 0);
  }

  ctx.filter = "none";

  if (text) {
    const fontSize = Math.floor(W * 0.04);
    ctx.font = `bold ${fontSize}px Caveat, cursive`;
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 8;
    ctx.textAlign = "center";
    ctx.fillText(text, W / 2, H * 0.92);
    ctx.shadowBlur = 0;
  }

  stickers.forEach((s) => {
    const fontSize = Math.floor(W * 0.05);
    ctx.font = `${fontSize}px serif`;
    ctx.textAlign = "center";
    ctx.fillText(s.emoji, (s.x / 100) * W, (s.y / 100) * H);
  });

  return canvas.toDataURL("image/png");
}

function CoupleFramePreview({
  localPhoto,
  partnerPhoto,
  frame,
  filter,
}: {
  localPhoto: string | null;
  partnerPhoto: string | null;
  frame: FrameType;
  filter?: string;
}) {
  if (!localPhoto) return null;

  if (!partnerPhoto) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={localPhoto}
        alt="Your photo"
        className="w-full rounded-2xl"
        style={{ filter, objectFit: "contain" }}
      />
    );
  }

  const bgClass: Record<FrameType, string> = {
    polaroid: "from-gray-50 to-gray-100",
    "photobooth-strip": "from-pink-50 to-rose-100",
    scrapbook: "from-amber-50 to-amber-100",
    "pink-heart": "from-pink-100 to-rose-100",
    "miles-apart": "from-blue-50 to-cyan-50",
    "cloud-stars": "from-blue-50 to-indigo-100",
    "bear-bunny": "from-amber-50 to-orange-50",
    "love-letter": "from-red-50 to-pink-100",
    "same-moment": "from-lavender-50 to-lavender-100",
  };

  const photoStyle = filter ? { filter } : {};

  switch (frame) {
    case "polaroid":
      return (
        <div className={`flex gap-4 p-6 bg-gradient-to-br ${bgClass[frame]} justify-center items-center min-h-[300px]`}>
          <div className="bg-white p-2 pb-10 shadow-lg rotate-[-2deg] rounded-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={localPhoto} alt="You" className="w-48 h-36 object-cover" style={photoStyle} />
            <p className="text-center text-[10px] text-gray-400 mt-1 font-serif">You</p>
          </div>
          <div className="bg-white p-2 pb-10 shadow-lg rotate-[2deg] rounded-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={partnerPhoto} alt="Partner" className="w-48 h-36 object-cover" style={photoStyle} />
            <p className="text-center text-[10px] text-gray-400 mt-1 font-serif">Partner</p>
          </div>
        </div>
      );
    case "photobooth-strip":
      return (
        <div className={`flex gap-3 p-4 bg-gradient-to-br ${bgClass[frame]} justify-center items-center min-h-[300px]`}>
          <div className="bg-white rounded-xl p-2 shadow-md border-2 border-pink-200/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={localPhoto} alt="You" className="w-40 h-52 object-cover rounded-lg" style={photoStyle} />
          </div>
          <div className="bg-white rounded-xl p-2 shadow-md border-2 border-pink-200/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={partnerPhoto} alt="Partner" className="w-40 h-52 object-cover rounded-lg" style={photoStyle} />
          </div>
        </div>
      );
    case "scrapbook":
      return (
        <div className={`flex gap-6 p-6 bg-gradient-to-br ${bgClass[frame]} justify-center items-center min-h-[300px]`}>
          <div className="relative rotate-[-3deg] shadow-md">
            <div className="absolute -top-2 left-4 w-12 h-5 bg-amber-200/70 rotate-[-2deg] rounded" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={localPhoto} alt="You" className="w-48 h-36 object-cover rounded border-2 border-amber-200/40" style={photoStyle} />
          </div>
          <div className="relative rotate-[2deg] shadow-md">
            <div className="absolute -top-2 right-4 w-12 h-5 bg-pink-200/70 rotate-[3deg] rounded" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={partnerPhoto} alt="Partner" className="w-48 h-36 object-cover rounded border-2 border-amber-200/40" style={photoStyle} />
          </div>
        </div>
      );
    case "pink-heart":
      return (
        <div className={`flex gap-4 p-6 bg-gradient-to-br ${bgClass[frame]} justify-center items-center min-h-[300px]`}>
          <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-pink-300/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={localPhoto} alt="You" className="w-48 h-36 object-cover" style={photoStyle} />
          </div>
          <div className="text-3xl">💕</div>
          <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-pink-300/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={partnerPhoto} alt="Partner" className="w-48 h-36 object-cover" style={photoStyle} />
          </div>
        </div>
      );
    case "miles-apart":
      return (
        <div className={`flex flex-col items-center gap-2 p-6 bg-gradient-to-br ${bgClass[frame]} min-h-[300px]`}>
          <div className="bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-blue-400 mb-2">
            Miles Apart, Together at Heart 💕
          </div>
          <div className="flex gap-3">
            <div className="relative rounded-xl overflow-hidden shadow-md border-2 border-dashed border-blue-300/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={localPhoto} alt="You" className="w-48 h-36 object-cover" style={photoStyle} />
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
              <span className="text-lg">🌍</span>
              <span className="text-lg">💕</span>
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-md border-2 border-dashed border-blue-300/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={partnerPhoto} alt="Partner" className="w-48 h-36 object-cover" style={photoStyle} />
            </div>
          </div>
        </div>
      );
    case "cloud-stars":
      return (
        <div className={`flex gap-4 p-6 bg-gradient-to-br ${bgClass[frame]} justify-center items-center min-h-[300px]`}>
          <div className="text-xl absolute top-3 left-4">⭐</div>
          <div className="text-xl absolute top-3 right-4">☁️</div>
          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={localPhoto} alt="You" className="w-48 h-36 object-cover rounded-2xl" style={photoStyle} />
          </div>
          <div className="text-xl">🌙</div>
          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={partnerPhoto} alt="Partner" className="w-48 h-36 object-cover rounded-2xl" style={photoStyle} />
          </div>
        </div>
      );
    case "bear-bunny":
      return (
        <div className={`flex gap-4 p-6 bg-gradient-to-br ${bgClass[frame]} justify-center items-center min-h-[300px]`}>
          <div className="text-2xl">🐻</div>
          <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-amber-200/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={localPhoto} alt="You" className="w-48 h-36 object-cover" style={photoStyle} />
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-amber-200/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={partnerPhoto} alt="Partner" className="w-48 h-36 object-cover" style={photoStyle} />
          </div>
          <div className="text-2xl">🐰</div>
        </div>
      );
    case "love-letter":
      return (
        <div className={`flex flex-col items-center gap-2 p-6 bg-gradient-to-br ${bgClass[frame]} min-h-[300px]`}>
          <div className="flex gap-1 text-xl">
            <span>💌</span><span>💝</span>
          </div>
          <div className="flex gap-3">
            <div className="relative rounded-xl overflow-hidden shadow-md border-2 border-red-200/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={localPhoto} alt="You" className="w-48 h-36 object-cover" style={photoStyle} />
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-md border-2 border-red-200/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={partnerPhoto} alt="Partner" className="w-48 h-36 object-cover" style={photoStyle} />
            </div>
          </div>
          <p className="text-xs handwriting text-red-300">With all my love</p>
        </div>
      );
    case "same-moment":
      return (
        <div className={`flex flex-col items-center gap-2 p-6 bg-gradient-to-br ${bgClass[frame]} min-h-[300px]`}>
          <div className="bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-lavender-400 mb-1">
            Same Moment 🕐
          </div>
          <div className="flex gap-3">
            <div className="relative rounded-xl overflow-hidden shadow-md border-2 border-lavender-300/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={localPhoto} alt="You" className="w-48 h-36 object-cover" style={photoStyle} />
              <div className="absolute bottom-1 left-1 text-[10px] text-white bg-black/30 px-1 rounded">You</div>
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-md border-2 border-lavender-300/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={partnerPhoto} alt="Partner" className="w-48 h-36 object-cover" style={photoStyle} />
              <div className="absolute bottom-1 left-1 text-[10px] text-white bg-black/30 px-1 rounded">Partner</div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      );
    default:
      return (
        <div className="flex gap-4 p-4 justify-center items-center min-h-[300px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={localPhoto} alt="You" className="w-1/2 rounded-xl object-cover" style={photoStyle} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={partnerPhoto} alt="Partner" className="w-1/2 rounded-xl object-cover" style={photoStyle} />
        </div>
      );
  }
}

function FrameDecoration({ frame, hasPartner }: { frame: FrameType; hasPartner?: boolean }) {
  if (hasPartner) {
    switch (frame) {
      case "pink-heart":
        return (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute inset-2 border-2 border-pink-300/30 rounded-xl" />
            <div className="absolute top-2 left-2 text-lg">✨</div>
            <div className="absolute bottom-2 right-2 text-lg">🎀</div>
          </div>
        );
      case "scrapbook":
        return (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-2 right-2 text-sm">🌸</div>
            <div className="absolute bottom-2 left-2 text-sm">🌼</div>
          </div>
        );
      case "miles-apart":
        return (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute inset-2 border-2 border-dashed border-blue-300/30 rounded-xl" />
          </div>
        );
      case "cloud-stars":
        return (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm">🌙</div>
          </div>
        );
      case "bear-bunny":
        return (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm">💕</div>
          </div>
        );
      case "love-letter":
        return (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute inset-2 border-2 border-red-200/30 rounded-xl" />
          </div>
        );
      case "polaroid":
        return (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute inset-2 border border-white/40 rounded" />
          </div>
        );
      case "photobooth-strip":
        return (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute inset-y-0 left-0 w-2 bg-pink-200/40" />
            <div className="absolute inset-y-0 right-0 w-2 bg-pink-200/40" />
          </div>
        );
      case "same-moment":
        return (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute inset-2 border-2 border-lavender-300/30 rounded-xl" />
          </div>
        );
      default:
        return null;
    }
  }

  switch (frame) {
    case "pink-heart":
      return (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-3 right-3 text-2xl">💕</div>
          <div className="absolute bottom-3 left-3 text-2xl">💗</div>
          <div className="absolute top-3 left-3 text-lg">✨</div>
          <div className="absolute bottom-3 right-3 text-lg">🎀</div>
          <div className="absolute inset-2 border-2 border-pink-300/40 rounded-xl" />
        </div>
      );
    case "scrapbook":
      return (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute -top-2 left-8 w-16 h-6 bg-amber-100/60 rotate-[-5deg] rounded" />
          <div className="absolute -top-1 right-12 w-14 h-5 bg-pink-100/60 rotate-[3deg] rounded" />
          <div className="absolute top-3 right-3 text-lg">🌸</div>
          <div className="absolute bottom-3 left-3 text-lg">🌼</div>
        </div>
      );
    case "miles-apart":
      return (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-blue-400">
            Miles Apart, Together at Heart 💕
          </div>
          <div className="absolute bottom-3 left-3 text-lg">🌍</div>
          <div className="absolute bottom-3 right-3 text-lg">💕</div>
          <div className="absolute inset-2 border-2 border-dashed border-blue-300/40 rounded-xl" />
        </div>
      );
    case "cloud-stars":
      return (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-3 right-3 text-xl">☁️</div>
          <div className="absolute top-4 left-4 text-lg">⭐</div>
          <div className="absolute top-3 left-1/2 text-sm">✨</div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xl">🌙</div>
        </div>
      );
    case "bear-bunny":
      return (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-3 left-3 text-2xl">🐻</div>
          <div className="absolute top-3 right-3 text-2xl">🐰</div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-sm">💕</div>
        </div>
      );
    case "love-letter":
      return (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-3 right-3 text-xl">💌</div>
          <div className="absolute top-3 left-3 text-lg">💝</div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-sm handwriting text-red-300">
            With all my love
          </div>
          <div className="absolute inset-2 border-2 border-red-200/40 rounded-xl" />
        </div>
      );
    case "polaroid":
      return (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-2 border border-white/50 rounded" />
        </div>
      );
    case "photobooth-strip":
      return (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-y-0 left-0 w-3 bg-pink-200/60" />
          <div className="absolute inset-y-0 right-0 w-3 bg-pink-200/60" />
          <div className="absolute top-3 right-4 text-sm">📸</div>
        </div>
      );
    case "same-moment":
      return (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-2 border-2 border-lavender-300/40 rounded-xl" />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-lavender-400">
            Same Moment 🕐
          </div>
          <div className="absolute bottom-3 left-3 text-xs text-gray-400">
            📍 Partner 1
          </div>
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            📍 Partner 2
          </div>
        </div>
      );
    default:
      return null;
  }
}
