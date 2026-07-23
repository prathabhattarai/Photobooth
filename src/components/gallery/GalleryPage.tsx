"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Download,
  Heart,
  Camera,
  BookOpen,
  Clock,
  Grid3X3,
  Check,
  ImagePlus,
  X,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { SAMPLE_MEMORIES } from "@/lib/constants";
import FloatingElements from "@/components/ui/FloatingElements";

interface GalleryMemory {
  id: string;
  caption: string;
  date: string;
  frame: string;
  emoji: string;
  imageUrl?: string;
  isUserMemory?: boolean;
}

const frameGradients: Record<string, string> = {
  "pink-heart": "from-pink-200 via-pink-100 to-rose-100",
  scrapbook: "from-amber-100 via-orange-50 to-yellow-100",
  "miles-apart": "from-blue-200 via-sky-100 to-cyan-100",
  "cloud-stars": "from-indigo-100 via-blue-100 to-purple-50",
  "bear-bunny": "from-amber-100 via-orange-50 to-yellow-50",
  "love-letter": "from-red-100 via-pink-50 to-rose-50",
  polaroid: "from-gray-100 via-gray-50 to-white",
  "photobooth-strip": "from-pink-100 via-rose-50 to-fuchsia-50",
  "same-moment": "from-purple-100 via-violet-50 to-indigo-50",
};

const decorativeEmojis = ["🌸", "💕", "✨", "🎀", "🧸", "☁️", "🌺", "💫", "🌷"];

export default function GalleryPage() {
  const { memories, deleteMemoryById, setCollagePhotos } = useApp();
  const [view, setView] = useState<"gallery" | "timeline">("gallery");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const userMemories: GalleryMemory[] = memories.map((m) => ({
    id: m.id,
    caption: m.caption,
    date: new Date(m.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    frame: m.frameType,
    emoji: "📸",
    imageUrl: m.imageUrl,
    isUserMemory: true,
  }));

  const sampleMemories: GalleryMemory[] = SAMPLE_MEMORIES.map((m) => ({
    id: m.id,
    caption: m.caption,
    date: m.date,
    frame: m.frame,
    emoji: m.emoji,
  }));

  const allMemories = [...userMemories, ...sampleMemories];

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleMakeCollage = useCallback(() => {
    const urls = allMemories
      .filter((m) => selectedIds.has(m.id) && m.imageUrl)
      .map((m) => m.imageUrl!);
    setCollagePhotos(urls);
    router.push("/collage");
  }, [allMemories, selectedIds, setCollagePhotos, router]);

  const handleDownload = (mem: GalleryMemory) => {
    if (mem.imageUrl) {
      const link = document.createElement("a");
      link.download = `togetherframe-${mem.id}.png`;
      link.href = mem.imageUrl;
      link.click();
    }
  };

  const hasImagesWithUrls = allMemories.some((m) => m.imageUrl);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingElements />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <Link href="/booth">
              <button className="w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors pastel-shadow">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-pink-400" />
              <span className="font-bold text-gray-700">Memory Scrapbook</span>
            </div>
          </div>

          <div className="flex gap-2">
            {selectMode ? (
              <button
                onClick={() => {
                  setSelectMode(false);
                  setSelectedIds(new Set());
                }}
                className="px-3 py-1.5 rounded-full bg-red-100 text-red-500 text-xs font-bold transition-all flex items-center gap-1.5 hover:bg-red-200"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            ) : (
              hasImagesWithUrls && (
                <button
                  onClick={() => setSelectMode(true)}
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-400 to-lavender-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 hover:shadow-lg"
                >
                  <ImagePlus className="w-3.5 h-3.5" /> Select for Collage
                </button>
              )
            )}
            <Link href="/collage">
              <button className="px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-xs font-bold text-gray-500 pastel-shadow transition-all flex items-center gap-1.5">
                🖼️ Empty Collage
              </button>
            </Link>
            <button
              onClick={() => setView("gallery")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                view === "gallery"
                  ? "bg-pink-100 text-pink-500"
                  : "bg-white/60 text-gray-400 hover:bg-pink-50"
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" /> Gallery
            </button>
            <button
              onClick={() => setView("timeline")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                view === "timeline"
                  ? "bg-pink-100 text-pink-500"
                  : "bg-white/60 text-gray-400 hover:bg-pink-50"
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Timeline
            </button>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black text-gray-700 mb-3">
            Our Memory{" "}
            <span className="doodle-underline text-pink-400">Scrapbook</span>{" "}
            📖
          </h1>
          <p className="text-gray-400 text-lg">
            {selectMode
              ? `Tap photos to select them for a collage`
              : "Every photo tells our love story ✨"}
          </p>
        </motion.div>

        {/* Empty State */}
        {allMemories.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto"
          >
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">
              No memories yet!
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Start by taking your first photo together 📸
            </p>
            <Link href="/booth">
              <button className="cute-button bg-gradient-to-r from-pink-400 to-pink-500 text-white">
                <span className="flex items-center gap-2">
                  <Camera className="w-5 h-5" /> Take First Photo
                </span>
              </button>
            </Link>
          </motion.div>
        )}

        {/* Gallery View */}
        <AnimatePresence mode="wait">
          {view === "gallery" && allMemories.length > 0 && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
            >
              {allMemories.map((mem, i) => {
                const isSelected = selectedIds.has(mem.id);
                const canSelect = selectMode && mem.imageUrl;
                return (
                  <motion.div
                    key={mem.id}
                    initial={{ opacity: 0, y: 20, rotate: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="break-inside-avoid"
                  >
                    <div
                      className={`polaroid hover:scale-105 transition-transform duration-300 group relative ${
                        canSelect ? "cursor-pointer" : ""
                      } ${isSelected ? "ring-4 ring-pink-400 ring-offset-2" : ""}`}
                      style={{
                        transform: selectMode
                          ? undefined
                          : `rotate(${
                              i % 2 === 0 ? -2 + (i % 3) : 1 + (i % 2)
                            }deg)`,
                      }}
                      onClick={canSelect ? () => toggleSelect(mem.id) : undefined}
                    >
                      {/* Tape decoration */}
                      {i % 3 === 0 && !selectMode && (
                        <div className="absolute -top-2 left-8 w-14 h-5 bg-amber-100/60 rotate-[-3deg] rounded z-10" />
                      )}

                      {/* Decorative emoji */}
                      {!selectMode && (
                        <div className="absolute -top-3 -right-3 text-xl z-10">
                          {decorativeEmojis[i % decorativeEmojis.length]}
                        </div>
                      )}

                      {/* Select checkbox */}
                      {selectMode && mem.imageUrl && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 left-3 z-30"
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-pink-500 text-white shadow-lg"
                                : "bg-white/80 text-gray-300 border-2 border-gray-200"
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                          </div>
                        </motion.div>
                      )}

                      {/* Photo area */}
                      <div
                        className={`aspect-[3/4] rounded bg-gradient-to-br ${
                          frameGradients[mem.frame] || "from-pink-100 to-pink-200"
                        } flex items-center justify-center relative overflow-hidden`}
                      >
                        {mem.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={mem.imageUrl}
                            alt={mem.caption}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="text-5xl mb-2">{mem.emoji}</div>
                            <div className="text-xs text-gray-400 font-bold">
                              {mem.frame.replace("-", " ")}
                            </div>
                          </div>
                        )}

                        {/* Frame overlay decoration */}
                        <div className="absolute inset-0 border-2 border-white/30 rounded" />

                        {/* Selected overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                              <Check className="w-6 h-6 text-pink-500" strokeWidth={3} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Caption area */}
                      <div className="pt-3 pb-1">
                        <p className="handwriting text-center text-gray-600 text-base leading-tight">
                          {mem.caption}
                        </p>
                        <p className="text-center text-gray-300 text-xs mt-1">
                          {mem.date}
                        </p>
                      </div>

                      {/* Action buttons (hidden in select mode) */}
                      {!selectMode && (
                        <div className="absolute top-12 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          {mem.isUserMemory && mem.imageUrl && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(mem);
                              }}
                              className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
                            >
                              <Download className="w-3.5 h-3.5 text-blue-400" />
                            </button>
                          )}
                          {mem.isUserMemory && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMemoryById(mem.id);
                              }}
                              className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Timeline View */}
          {view === "timeline" && allMemories.length > 0 && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              {/* Timeline line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-200 via-lavender-200 to-peach-200 hidden md:block" />

              <div className="space-y-12">
                {allMemories.map((mem, i) => {
                  const isSelected = selectedIds.has(mem.id);
                  const canSelect = selectMode && mem.imageUrl;
                  return (
                    <motion.div
                      key={mem.id}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`relative flex flex-col md:flex-row items-center gap-6 ${
                        i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                      }`}
                    >
                      {/* Card */}
                      <div
                        className={`w-full md:w-5/12 ${
                          i % 2 === 0 ? "md:text-right" : "md:text-left"
                        }`}
                      >
                        <div
                          className={`glass-card rounded-3xl p-5 inline-block max-w-sm hover:scale-105 transition-transform duration-300 group relative ${
                            canSelect ? "cursor-pointer" : ""
                          } ${isSelected ? "ring-4 ring-pink-400" : ""}`}
                          onClick={canSelect ? () => toggleSelect(mem.id) : undefined}
                        >
                          {/* Select checkbox */}
                          {selectMode && mem.imageUrl && (
                            <div className="absolute top-3 left-3 z-30">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-pink-500 text-white shadow-lg"
                                    : "bg-white/80 text-gray-300 border-2 border-gray-200"
                                }`}
                              >
                                {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                              </div>
                            </div>
                          )}

                          <div
                            className={`aspect-[4/3] rounded-2xl mb-3 bg-gradient-to-br ${
                              frameGradients[mem.frame] || "from-pink-100 to-pink-200"
                            } flex items-center justify-center overflow-hidden relative`}
                          >
                            {mem.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={mem.imageUrl}
                                alt={mem.caption}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-5xl">{mem.emoji}</div>
                            )}
                            {isSelected && (
                              <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                  <Check className="w-5 h-5 text-pink-500" strokeWidth={3} />
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="font-bold text-gray-600 text-sm">
                            {mem.caption}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">{mem.date}</p>

                          {/* Action buttons */}
                          {!selectMode && (
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {mem.isUserMemory && mem.imageUrl && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(mem);
                                  }}
                                  className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow"
                                >
                                  <Download className="w-3 h-3 text-blue-400" />
                                </button>
                              )}
                              {mem.isUserMemory && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteMemoryById(mem.id);
                                  }}
                                  className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow"
                                >
                                  <Trash2 className="w-3 h-3 text-red-400" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Timeline dot */}
                      <div className="hidden md:flex w-2/12 justify-center">
                        <div className="w-10 h-10 rounded-full bg-white border-4 border-pink-300 flex items-center justify-center z-10">
                          <Heart
                            className="w-4 h-4 text-pink-400"
                            fill="currentColor"
                          />
                        </div>
                      </div>

                      {/* Spacer */}
                      <div className="hidden md:block w-5/12" />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Collage Action Bar */}
        <AnimatePresence>
          {selectMode && selectedIds.size > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="glass-card rounded-full px-6 py-3 flex items-center gap-4 pastel-shadow border border-pink-200/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <span className="text-pink-500 font-bold text-sm">
                      {selectedIds.size}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-600">
                    photo{selectedIds.size !== 1 ? "s" : ""} selected
                  </span>
                </div>
                <button
                  onClick={handleMakeCollage}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-pink-400 to-lavender-400 text-white font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <ImagePlus className="w-4 h-4" />
                  Make Collage
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16 mb-8"
        >
          <Link href="/booth">
            <button className="cute-button bg-gradient-to-r from-pink-400 to-lavender-400 text-white">
              <span className="flex items-center gap-2">
                <Camera className="w-5 h-5" /> Take Another Photo
              </span>
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
