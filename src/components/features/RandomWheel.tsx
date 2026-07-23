"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ACTIVITIES = [
  { id: 1, text: "Take a cute photo", emoji: "📸", color: "from-pink-200 to-pink-300" },
  { id: 2, text: "Ask a random question", emoji: "💬", color: "from-lavender-200 to-lavender-300" },
  { id: 3, text: "Watch a movie together", emoji: "🎬", color: "from-blue-200 to-blue-300" },
  { id: 4, text: "Tell a secret", emoji: "🤫", color: "from-purple-200 to-purple-300" },
  { id: 5, text: "Draw each other", emoji: "🎨", color: "from-amber-200 to-amber-300" },
  { id: 6, text: "Send a virtual hug", emoji: "🫂", color: "from-rose-200 to-rose-300" },
  { id: 7, text: "Share a song", emoji: "🎵", color: "from-green-200 to-green-300" },
  { id: 8, text: "Play a game", emoji: "🎮", color: "from-cyan-200 to-cyan-300" },
];

const SEGMENT_ANGLE = 360 / ACTIVITIES.length;

export default function RandomWheel() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<typeof ACTIVITIES[0] | null>(null);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    const idx = Math.floor(Math.random() * ACTIVITIES.length);
    const targetAngle = 360 * 5 + (360 - idx * SEGMENT_ANGLE - SEGMENT_ANGLE / 2);
    setRotation((prev) => prev + targetAngle);

    setTimeout(() => {
      setResult(ACTIVITIES[idx]);
      setShowResult(true);
      setIsSpinning(false);
    }, 4000);
  };

  return (
    <div className="glass-card rounded-3xl p-6">
      <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
        <span className="text-xl">🎡</span> What Should We Do?
      </h3>

      <div className="text-center">
        {/* Wheel */}
        <div className="relative w-52 h-52 mx-auto mb-6">
          {/* Pointer */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 text-2xl">
            ▼
          </div>

          {/* Wheel container */}
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg relative">
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
              className="w-full h-full relative"
            >
              {ACTIVITIES.map((act, i) => {
                const angle = i * SEGMENT_ANGLE;
                return (
                  <div
                    key={act.id}
                    className={`absolute w-full h-full bg-gradient-to-br ${act.color}`}
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(((angle - SEGMENT_ANGLE / 2) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((angle - SEGMENT_ANGLE / 2) * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((angle + SEGMENT_ANGLE / 2) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((angle + SEGMENT_ANGLE / 2) * Math.PI) / 180)}%)`,
                    }}
                  >
                    <div
                      className="absolute text-lg"
                      style={{
                        left: `${50 + 28 * Math.cos((angle * Math.PI) / 180)}%`,
                        top: `${50 + 28 * Math.sin((angle * Math.PI) / 180)}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {act.emoji}
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-sm">
                ✨
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={spin}
          disabled={isSpinning}
          className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
            isSpinning
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-lavender-400 to-pink-400 text-white hover:shadow-lg active:scale-95"
          }`}
        >
          {isSpinning ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Spinning...
            </span>
          ) : (
            "Spin the Wheel 🎡"
          )}
        </button>

        <AnimatePresence>
          {showResult && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`mt-4 bg-gradient-to-r ${result.color} rounded-2xl p-5`}
            >
              <div className="text-4xl mb-2">{result.emoji}</div>
              <p className="font-bold text-gray-700">{result.text}</p>
              <p className="text-xs text-gray-500 mt-1">Let&apos;s do this together! 💕</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
