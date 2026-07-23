"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  Download,
  Heart,
  Camera,
  BookOpen,
  Clock,
  Grid3X3,
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
  const { memories, deleteMemoryById } = useApp();
  const [view, setView] = useState<"gallery" | "timeline">("gallery");

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

  const handleDownload = (mem: GalleryMemory) => {
    if (mem.imageUrl) {
      const link = document.createElement("a");
      link.download = `togetherframe-${mem.id}.png`;
      link.href = mem.imageUrl;
      link.click();
    }
  };

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
              <button className="w-10 h-10 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center transition-colors pastel-shadow">
                <ArrowLeft className="w-5 h-5 text-warm-gray-400" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-rose-400" />
              <span className="font-serif font-bold text-warm-gray-700">Memory Scrapbook</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView("gallery")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                view === "gallery"
                  ? "bg-rose-100 text-rose-600"
                  : "bg-white/60 text-warm-gray-400 hover:bg-rose-50"
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" /> Gallery
            </button>
            <button
              onClick={() => setView("timeline")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                view === "timeline"
                  ? "bg-rose-100 text-rose-600"
                  : "bg-white/60 text-warm-gray-400 hover:bg-rose-50"
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
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-warm-gray-800 mb-3">
            Our Memory{" "}
            <span className="font-script text-rose-500 italic">Scrapbook</span>
          </h1>
          <p className="text-warm-gray-400 text-lg">
            Every photo tells our love story
          </p>
          <div className="w-16 h-px bg-gold/40 mx-auto mt-4" />
        </motion.div>

        {/* Empty State */}
        {allMemories.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-5">
              <Camera className="w-8 h-8 text-rose-300" />
            </div>
            <h3 className="text-xl font-serif font-bold text-warm-gray-700 mb-2">
              No memories yet
            </h3>
            <p className="text-warm-gray-400 text-sm mb-6">
              Start by taking your first photo together
            </p>
            <Link href="/booth">
              <button className="cute-button bg-gradient-to-r from-rose-500 to-rose-600 text-white">
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
              {allMemories.map((mem, i) => (
                <motion.div
                  key={mem.id}
                  initial={{ opacity: 0, y: 20, rotate: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="break-inside-avoid"
                >
                  <div
                    className="polaroid hover:scale-105 transition-transform duration-300 group relative"
                    style={{
                      transform: `rotate(${
                        i % 2 === 0 ? -2 + (i % 3) : 1 + (i % 2)
                      }deg)`,
                    }}
                  >
                    {i % 3 === 0 && (
                      <div className="absolute -top-2 left-8 w-14 h-5 bg-amber-100/60 rotate-[-3deg] rounded z-10" />
                    )}

                    <div className="absolute -top-3 -right-3 text-xl z-10">
                      {decorativeEmojis[i % decorativeEmojis.length]}
                    </div>

                    <div
                      className={`aspect-[3/4] rounded bg-gradient-to-br ${
                        frameGradients[mem.frame] || "from-rose-100 to-rose-200"
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
                          <div className="text-xs text-warm-gray-400 font-medium">
                            {mem.frame.replace("-", " ")}
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 border-2 border-white/30 rounded" />
                    </div>

                    <div className="pt-3 pb-1">
                      <p className="handwriting text-center text-warm-gray-600 text-base leading-tight">
                        {mem.caption}
                      </p>
                      <p className="text-center text-warm-gray-300 text-xs mt-1">
                        {mem.date}
                      </p>
                    </div>

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
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
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
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-rose-200 via-gold/30 to-rose-200 hidden md:block" />

              <div className="space-y-12">
                {allMemories.map((mem, i) => (
                  <motion.div
                    key={mem.id}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative flex flex-col md:flex-row items-center gap-6 ${
                      i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    <div
                      className={`w-full md:w-5/12 ${
                        i % 2 === 0 ? "md:text-right" : "md:text-left"
                      }`}
                    >
                      <div className="glass-card rounded-2xl p-5 inline-block max-w-sm hover:scale-105 transition-transform duration-300 group relative">
                        <div
                          className={`aspect-[4/3] rounded-xl mb-3 bg-gradient-to-br ${
                            frameGradients[mem.frame] || "from-rose-100 to-rose-200"
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
                        </div>
                        <p className="font-serif font-bold text-warm-gray-600 text-sm">
                          {mem.caption}
                        </p>
                        <p className="text-warm-gray-400 text-xs mt-1">{mem.date}</p>

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
                              <Trash2 className="w-3 h-3 text-rose-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex w-2/12 justify-center">
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-rose-200 flex items-center justify-center z-10">
                        <Heart
                          className="w-4 h-4 text-rose-400"
                          fill="currentColor"
                        />
                      </div>
                    </div>

                    <div className="hidden md:block w-5/12" />
                  </motion.div>
                ))}
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
            <button className="cute-button bg-gradient-to-r from-rose-500 to-rose-600 text-white">
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
