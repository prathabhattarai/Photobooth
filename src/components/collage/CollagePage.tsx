"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Printer,
  Plus,
  Trash2,
  RotateCcw,
  LayoutGrid,
  Image as ImageIcon,
} from "lucide-react";
import { useApp } from "@/lib/store";
import FloatingElements from "@/components/ui/FloatingElements";

interface CollageSlot {
  id: number;
  imageUrl: string | null;
}

type LayoutType =
  | "2x2"
  | "3x3"
  | "2x1"
  | "1x2"
  | "strip-4"
  | "strip-3"
  | "heart"
  | "polaroid-grid"
  | "cinema"
  | "classic-booth";

interface LayoutDef {
  id: LayoutType;
  name: string;
  emoji: string;
  cols: number;
  rows: number;
  slots: number;
  description: string;
}

const LAYOUTS: LayoutDef[] = [
  { id: "2x2", name: "2×2 Grid", emoji: "⊞", cols: 2, rows: 2, slots: 4, description: "Classic square grid" },
  { id: "3x3", name: "3×3 Grid", emoji: "⊞", cols: 3, rows: 3, slots: 9, description: "Big grid collage" },
  { id: "2x1", name: "2 Horizontal", emoji: "═", cols: 2, rows: 1, slots: 2, description: "Side by side" },
  { id: "1x2", name: "2 Vertical", emoji: "║", cols: 1, rows: 2, slots: 2, description: "Top and bottom" },
  { id: "strip-4", name: "4-Photo Strip", emoji: "🎞️", cols: 1, rows: 4, slots: 4, description: "Photobooth strip" },
  { id: "strip-3", name: "3-Photo Strip", emoji: "🎞️", cols: 1, rows: 3, slots: 3, description: "Short strip" },
  { id: "cinema", name: "Cinema", emoji: "🎬", cols: 3, rows: 1, slots: 3, description: "Movie-style widescreen" },
  { id: "polaroid-grid", name: "Polaroid Grid", emoji: "📸", cols: 2, rows: 2, slots: 4, description: "Polaroid-style cards" },
  { id: "classic-booth", name: "Classic Booth", emoji: "📷", cols: 2, rows: 2, slots: 4, description: "Traditional photobooth" },
  { id: "heart", name: "Heart Shape", emoji: "💕", cols: 3, rows: 3, slots: 5, description: "Heart-shaped layout" },
];

const HEART_POSITIONS = [
  { col: 0, row: 0 },
  { col: 2, row: 0 },
  { col: 0, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
];

const CUTE_BORDERS = [
  { id: "none", name: "None", style: "" },
  { id: "pink-hearts", name: "Pink Hearts", style: "border-4 border-pink-300" },
  { id: "dashed", name: "Dashed", style: "border-4 border-dashed border-pink-200" },
  { id: "rounded", name: "Soft Rounded", style: "border-8 border-white rounded-2xl" },
  { id: "polaroid", name: "Polaroid", style: "border-[12px] border-white rounded-sm shadow-lg" },
  { id: "pastel", name: "Pastel Frame", style: "border-6 border-lavender-200 rounded-xl" },
];

const BACKGROUNDS = [
  { id: "white", name: "White", color: "#ffffff" },
  { id: "pink", name: "Pink", color: "#fff0f5" },
  { id: "lavender", name: "Lavender", color: "#f5f0ff" },
  { id: "cream", name: "Cream", color: "#fdf8f0" },
  { id: "peach", name: "Peach", color: "#fff5f0" },
  { id: "blue", name: "Baby Blue", color: "#e8f4fd" },
  { id: "mint", name: "Mint", color: "#f0fdf4" },
  { id: "yellow", name: "Butter", color: "#fefce8" },
];

export default function CollagePage() {
  const { memories } = useApp();
  const [layout, setLayout] = useState<LayoutDef>(LAYOUTS[0]);
  const [slots, setSlots] = useState<CollageSlot[]>([]);
  const [selectedBorder, setSelectedBorder] = useState("polaroid");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [gap, setGap] = useState(8);
  const [caption, setCaption] = useState("");
  const [showCaption, setShowCaption] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activePanel, setActivePanel] = useState<"layout" | "photos" | "style" | "export">("layout");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize slots when layout changes
  useEffect(() => {
    setSlots(
      Array.from({ length: layout.slots }, (_, i) => ({
        id: i,
        imageUrl: slots[i]?.imageUrl || null,
      }))
    );
  }, [layout]);

  const handleAddPhoto = (slotId: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setSlots((prev) =>
            prev.map((s) => (s.id === slotId ? { ...s, imageUrl: ev.target?.result as string } : s))
          );
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleAddFromGallery = (slotId: number, imageUrl: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, imageUrl } : s))
    );
  };

  const handleRemovePhoto = (slotId: number) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, imageUrl: null } : s))
    );
  };

  const handleClearAll = () => {
    setSlots((prev) => prev.map((s) => ({ ...s, imageUrl: null })));
  };

  const filledSlots = slots.filter((s) => s.imageUrl).length;

  const renderCollageToCanvas = useCallback(
    (printMode = false): Promise<string> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const scale = printMode ? 3 : 2;
        const baseW = 1200;
        const baseH = layout.rows >= layout.cols ? 1600 : 1200;
        canvas.width = baseW * scale;
        canvas.height = baseH * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve("");

        ctx.scale(scale, scale);

        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, baseW, baseH);

        // Caption at bottom
        const captionHeight = showCaption && caption ? 80 : 0;
        const collageH = baseH - captionHeight - 40;
        const collageW = baseW - 40;
        const cellW = (collageW - gap * (layout.cols + 1)) / layout.cols;
        const cellH = (collageH - gap * (layout.rows + 1)) / layout.rows;

        let loadCount = 0;
        const totalImages = slots.filter((s) => s.imageUrl).length;

        if (totalImages === 0) {
          // Draw placeholder
          ctx.fillStyle = "#f0f0f0";
          ctx.font = "bold 24px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Add photos to create your collage", baseW / 2, baseH / 2);
          resolve(canvas.toDataURL("image/png"));
          return;
        }

        const drawImage = (
          img: HTMLImageElement,
          x: number,
          y: number,
          w: number,
          h: number
        ) => {
          // Cover fit
          const imgRatio = img.width / img.height;
          const cellRatio = w / h;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          if (imgRatio > cellRatio) {
            sw = img.height * cellRatio;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / cellRatio;
            sy = (img.height - sh) / 2;
          }

          // Border
          if (selectedBorder !== "none") {
            const borderStyle = CUTE_BORDERS.find((b) => b.id === selectedBorder);
            if (selectedBorder === "polaroid") {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(x - 6, y - 6, w + 12, h + 36);
              ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
              // Polaroid label area
              ctx.fillStyle = "#f5f5f5";
              ctx.fillRect(x - 6, y + h - 6, w + 12, 42);
            } else if (selectedBorder === "rounded") {
              ctx.save();
              ctx.beginPath();
              const r = 16;
              ctx.roundRect(x - 8, y - 8, w + 16, h + 16, r);
              ctx.fillStyle = "#ffffff";
              ctx.fill();
              ctx.clip();
              ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
              ctx.restore();
            } else {
              ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
              if (borderStyle?.style) {
                ctx.strokeStyle = "#ffc8de";
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, w, h);
              }
            }
          } else {
            ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
          }
        };

        const onAllLoaded = () => {
          // Caption
          if (showCaption && caption) {
            ctx.fillStyle = "#666666";
            ctx.font = "italic 28px Caveat, cursive, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(caption, baseW / 2, baseH - 30);
          }

          // Watermark
          ctx.fillStyle = "#cccccc";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "right";
          ctx.fillText("TogetherFrame 💕", baseW - 20, baseH - 10);

          resolve(canvas.toDataURL("image/png", 1.0));
        };

        if (totalImages === 0) {
          onAllLoaded();
          return;
        }

        const positions: { col: number; row: number }[] = [];
        if (layout.id === "heart") {
          positions.push(...HEART_POSITIONS);
        } else {
          for (let r = 0; r < layout.rows; r++) {
            for (let c = 0; c < layout.cols; c++) {
              positions.push({ col: c, row: r });
            }
          }
        }

        slots.forEach((slot, i) => {
          if (!slot.imageUrl || i >= positions.length) return;
          const pos = positions[i];
          const x = gap + pos.col * (cellW + gap) + 20;
          const y = gap + pos.row * (cellH + gap) + 20;

          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            drawImage(img, x, y, cellW, cellH);
            loadCount++;
            if (loadCount === totalImages) {
              onAllLoaded();
            }
          };
          img.onerror = () => {
            loadCount++;
            if (loadCount === totalImages) {
              onAllLoaded();
            }
          };
          img.src = slot.imageUrl;
        });
      });
    },
    [layout, slots, bgColor, selectedBorder, gap, caption, showCaption]
  );

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await renderCollageToCanvas(false);
      const link = document.createElement("a");
      link.download = `togetherframe-collage-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await renderCollageToCanvas(true);
      const win = window.open("");
      if (win) {
        win.document.write(`
          <html>
            <head><title>TogetherFrame Collage</title>
            <style>
              @media print { body { margin: 0; } img { max-width: 100%; height: auto; } }
            </style>
            </head>
            <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;">
              <img src="${dataUrl}" style="max-width:90vw;max-height:90vh;box-shadow:0 4px 20px rgba(0,0,0,0.1);" />
              <script>window.onload=function(){setTimeout(function(){window.print();},500);}</script>
            </body>
          </html>
        `);
        win.document.close();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const positions: { col: number; row: number }[] = [];
  if (layout.id === "heart") {
    positions.push(...HEART_POSITIONS);
  } else {
    for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; c++) {
        positions.push({ col: c, row: r });
      }
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingElements />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <Link href="/gallery">
              <button className="w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors pastel-shadow">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
            </Link>
            <div>
              <h1 className="font-bold text-gray-700 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-pink-400" />
                Photo Collage
              </h1>
              <p className="text-xs text-gray-400">Create a beautiful collage to print 💕</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={filledSlots === 0 || isExporting}
              className="px-4 py-2 rounded-full bg-white/80 hover:bg-white text-sm font-bold text-gray-500 pastel-shadow transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={handleDownload}
              disabled={filledSlots === 0 || isExporting}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 text-white text-sm font-bold hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              {isExporting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download HD
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6">
          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="glass-card rounded-3xl p-6">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ backgroundColor: bgColor }}
              >
                <div
                  className="grid w-full"
                  style={{
                    gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
                    gridTemplateRows: layout.id === "heart" ? undefined : `repeat(${layout.rows}, 1fr)`,
                    gap: `${gap}px`,
                    padding: `${gap}px`,
                    aspectRatio: layout.rows >= layout.cols ? "3/4" : layout.id === "cinema" ? "3/1" : "4/3",
                  }}
                >
                  {layout.id === "heart"
                    ? // Heart layout uses absolute positioning
                      Array.from({ length: layout.slots }, (_, i) => {
                        const pos = HEART_POSITIONS[i] || { col: 0, row: 0 };
                        const slot = slots[i];
                        const cellW = 100 / layout.cols;
                        const cellH = 100 / layout.rows;
                        return (
                          <div
                            key={i}
                            className="absolute rounded-xl overflow-hidden group cursor-pointer"
                            style={{
                              left: `${pos.col * cellW + 1}%`,
                              top: `${pos.row * cellH + 1}%`,
                              width: `${cellW - 2}%`,
                              height: `${cellH - 2}%`,
                            }}
                            onClick={() => {
                              if (slot?.imageUrl) handleRemovePhoto(i);
                              else handleAddPhoto(i);
                            }}
                          >
                            {slot?.imageUrl ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={slot.imageUrl} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Trash2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-white/60 flex flex-col items-center justify-center hover:bg-pink-50 transition-colors border-2 border-dashed border-pink-200 rounded-xl">
                                <Plus className="w-6 h-6 text-pink-300 mb-1" />
                                <span className="text-[10px] text-pink-300">Add</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    : // Normal grid
                      Array.from({ length: layout.slots }, (_, i) => {
                        const slot = slots[i];
                        return (
                          <div
                            key={i}
                            className={`relative rounded-xl overflow-hidden group cursor-pointer ${
                              selectedBorder === "polaroid" ? "shadow-lg" : ""
                            }`}
                            onClick={() => {
                              if (slot?.imageUrl) handleRemovePhoto(i);
                              else handleAddPhoto(i);
                            }}
                            style={{
                              aspectRatio:
                                layout.id === "strip-4"
                                  ? "1/1.2"
                                  : layout.id === "strip-3"
                                  ? "1/1.3"
                                  : layout.id === "cinema"
                                  ? "3/1"
                                  : "1/1",
                            }}
                          >
                            {slot?.imageUrl ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={slot.imageUrl} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Trash2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {selectedBorder === "polaroid" && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-white py-1 text-center">
                                    <span className="text-[10px] text-gray-400 handwriting">TogetherFrame</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="w-full h-full bg-white/60 flex flex-col items-center justify-center hover:bg-pink-50 transition-colors border-2 border-dashed border-pink-200">
                                <Plus className="w-6 h-6 text-pink-300 mb-1" />
                                <span className="text-[10px] text-pink-300">Add Photo</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                </div>

                {/* Caption */}
                {showCaption && (
                  <div className="text-center py-3 px-4">
                    <p className="handwriting text-lg text-gray-400">
                      {caption || "Your caption here..."}
                    </p>
                  </div>
                )}
              </div>

              {/* Info bar */}
              <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                <span>{filledSlots}/{layout.slots} photos added</span>
                <span>{layout.name} · {layout.description}</span>
              </div>
            </div>
          </motion.div>

          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl p-6"
          >
            {/* Panel tabs */}
            <div className="flex gap-1 mb-6 bg-white/50 rounded-2xl p-1">
              {[
                { id: "layout" as const, emoji: "📐", label: "Layout" },
                { id: "photos" as const, emoji: "🖼️", label: "Photos" },
                { id: "style" as const, emoji: "🎨", label: "Style" },
                { id: "export" as const, emoji: "💾", label: "Export" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                    activePanel === tab.id
                      ? "bg-pink-100 text-pink-500"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <span>{tab.emoji}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Layout Panel */}
              {activePanel === "layout" && (
                <motion.div key="layout" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <h3 className="font-bold text-gray-600 text-sm mb-3">Choose Layout</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {LAYOUTS.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setLayout(l)}
                        className={`p-3 rounded-2xl text-left transition-all ${
                          layout.id === l.id
                            ? "bg-pink-100 ring-2 ring-pink-400 scale-[1.02]"
                            : "bg-white/60 hover:bg-pink-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{l.emoji}</span>
                          <span className="text-xs font-bold text-gray-600">{l.name}</span>
                        </div>
                        <p className="text-[10px] text-gray-400">{l.description}</p>
                        <div className="flex gap-0.5 mt-2">
                          {Array.from({ length: l.slots }, (_, i) => (
                            <div key={i} className="w-3 h-3 bg-pink-200 rounded-sm" />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Photos Panel */}
              {activePanel === "photos" && (
                <motion.div key="photos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-600 text-sm">Your Photos</h3>
                    <button
                      onClick={handleClearAll}
                      className="text-xs text-red-400 hover:text-red-500 font-bold"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Gallery memories */}
                  {memories.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-400 font-bold mb-2">From Gallery</p>
                      <div className="grid grid-cols-4 gap-2">
                        {memories.slice(0, 8).map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              const emptySlot = slots.find((s) => !s.imageUrl);
                              if (emptySlot) handleAddFromGallery(emptySlot.id, m.imageUrl);
                            }}
                            className="aspect-square rounded-xl overflow-hidden bg-pink-50 hover:ring-2 hover:ring-pink-400 transition-all relative group"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.imageUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center">
                              <Plus className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Slot grid */}
                  <div>
                    <p className="text-xs text-gray-400 font-bold mb-2">Collage Slots</p>
                    <div className="grid grid-cols-4 gap-2">
                      {slots.map((slot, i) => (
                        <div
                          key={slot.id}
                          className="aspect-square rounded-xl overflow-hidden bg-white/60 border-2 border-dashed border-pink-200 cursor-pointer hover:border-pink-400 transition-colors relative group"
                          onClick={() => {
                            if (slot.imageUrl) handleRemovePhoto(i);
                            else handleAddPhoto(i);
                          }}
                        >
                          {slot.imageUrl ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={slot.imageUrl} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center">
                                <Trash2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Plus className="w-5 h-5 text-pink-300" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Style Panel */}
              {activePanel === "style" && (
                <motion.div key="style" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                  {/* Background */}
                  <div>
                    <h3 className="font-bold text-gray-600 text-sm mb-2">Background</h3>
                    <div className="flex flex-wrap gap-2">
                      {BACKGROUNDS.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => setBgColor(bg.color)}
                          className={`w-10 h-10 rounded-xl border-2 transition-all ${
                            bgColor === bg.color
                              ? "border-pink-400 ring-2 ring-pink-200 scale-110"
                              : "border-gray-200 hover:border-pink-300"
                          }`}
                          style={{ backgroundColor: bg.color }}
                          title={bg.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Border */}
                  <div>
                    <h3 className="font-bold text-gray-600 text-sm mb-2">Frame Style</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {CUTE_BORDERS.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBorder(b.id)}
                          className={`p-2 rounded-xl text-center transition-all ${
                            selectedBorder === b.id
                              ? "bg-pink-100 ring-2 ring-pink-400"
                              : "bg-white/60 hover:bg-pink-50"
                          }`}
                        >
                          <span className="text-xs font-bold text-gray-500">{b.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gap */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400 font-bold">Spacing</span>
                      <span className="text-gray-500">{gap}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      value={gap}
                      onChange={(e) => setGap(parseInt(e.target.value))}
                      className="w-full accent-pink-400"
                    />
                  </div>

                  {/* Caption */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-600 text-sm">Caption</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showCaption}
                          onChange={(e) => setShowCaption(e.target.checked)}
                          className="accent-pink-400"
                        />
                        <span className="text-xs text-gray-400">Show</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Add a cute caption..."
                      className="cute-input text-sm py-2"
                      maxLength={100}
                    />
                  </div>
                </motion.div>
              )}

              {/* Export Panel */}
              {activePanel === "export" && (
                <motion.div key="export" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">🖨️</div>
                    <h3 className="font-bold text-gray-700 text-lg mb-2">Ready to Print!</h3>
                    <p className="text-sm text-gray-400 mb-6">
                      Export your collage as a high-resolution image for printing
                    </p>

                    <div className="space-y-3">
                      <button
                        onClick={handleDownload}
                        disabled={filledSlots === 0 || isExporting}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Download HD Image
                      </button>

                      <button
                        onClick={handlePrint}
                        disabled={filledSlots === 0 || isExporting}
                        className="w-full py-3 rounded-2xl bg-white border-2 border-pink-200 text-pink-500 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-pink-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Printer className="w-5 h-5" />
                        Print Collage
                      </button>
                    </div>

                    <p className="text-xs text-gray-300 mt-4">
                      HD export at 3x resolution (3600×4800px) for crisp prints
                    </p>
                  </div>

                  {/* Print tips */}
                  <div className="bg-pink-50 rounded-2xl p-4">
                    <h4 className="font-bold text-gray-600 text-xs mb-2">💡 Print Tips</h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• Best size: 8×10 inches or A4</li>
                      <li>• Use glossy photo paper for best results</li>
                      <li>• Set quality to "High" in print settings</li>
                      <li>• The HD export works great for framing!</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
