"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { SAMPLE_MEMORIES } from "@/lib/constants";

const HEARTS = ["💕", "💗", "💖", "✨", "🥰", "❤️", "🤍", "💝"];

export default function VirtualHug() {
  const { user, memories } = useApp();
  const [isHugging, setIsHugging] = useState(false);
  const [hugCount, setHugCount] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [showMemories, setShowMemories] = useState(false);

  const userAvatar = user?.avatar || null;
  const allPhotos = [
    ...memories.map((m) => m.imageUrl).filter(Boolean),
    ...SAMPLE_MEMORIES.slice(0, 4).map((m) => null),
  ].filter(Boolean) as string[];

  const sendHug = () => {
    setIsHugging(true);
    setHugCount((c) => c + 1);
    setShowMessage(true);
    if (allPhotos.length > 0) {
      setShowMemories(true);
    }
    setTimeout(() => setIsHugging(false), 4000);
    setTimeout(() => setShowMessage(false), 5000);
    setTimeout(() => setShowMemories(false), 5000);
  };

  return (
    <div className="glass-card rounded-3xl p-6">
      <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
        <span className="text-xl">🫂</span> Virtual Hug
      </h3>

      <div className="text-center">
        <div className="relative h-48 flex items-center justify-center overflow-hidden">
          {/* Left person (You) */}
          <motion.div
            animate={isHugging ? { x: 50, scale: 1.1 } : { x: 0, scale: 1 }}
            transition={{ type: "spring", damping: 8, stiffness: 80 }}
            className="relative z-10"
          >
            {userAvatar ? (
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-pink-300 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={userAvatar}
                  alt="You"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-200 to-pink-300 flex items-center justify-center text-4xl border-4 border-pink-300 shadow-lg">
                🧸
              </div>
            )}
            <p className="text-[10px] font-bold text-pink-400 mt-1.5">You</p>
          </motion.div>

          {/* Center hearts / photos */}
          <div className="mx-3 relative z-20">
            <AnimatePresence>
              {isHugging && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="text-4xl"
                >
                  💕
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right person (Partner) */}
          <motion.div
            animate={isHugging ? { x: -50, scale: 1.1 } : { x: 0, scale: 1 }}
            transition={{ type: "spring", damping: 8, stiffness: 80 }}
            className="relative z-10"
          >
            {userAvatar ? (
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-lavender-300 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={userAvatar}
                  alt="Partner"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-lavender-200 to-lavender-300 flex items-center justify-center text-4xl border-4 border-lavender-300 shadow-lg">
                🐰
              </div>
            )}
            <p className="text-[10px] font-bold text-lavender-400 mt-1.5">Partner</p>
          </motion.div>

          {/* Floating hearts during hug */}
          <AnimatePresence>
            {isHugging && (
              <>
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`heart-${i}`}
                    initial={{
                      opacity: 1,
                      y: 0,
                      x: -30 + Math.random() * 60,
                      scale: 0.5 + Math.random() * 0.5,
                    }}
                    animate={{
                      opacity: 0,
                      y: -80 - Math.random() * 50,
                      x: -40 + Math.random() * 80,
                    }}
                    transition={{ duration: 2, delay: i * 0.25 }}
                    className="absolute text-2xl z-30"
                    style={{ left: "50%", top: "20%" }}
                  >
                    {HEARTS[i % HEARTS.length]}
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Floating photos during hug */}
          <AnimatePresence>
            {showMemories && allPhotos.length > 0 && (
              <>
                {allPhotos.slice(0, 6).map((photo, i) => {
                  const angle = (i / Math.min(allPhotos.length, 6)) * 360;
                  const radius = 70 + Math.random() * 30;
                  const tx = Math.cos((angle * Math.PI) / 180) * radius;
                  const ty = Math.sin((angle * Math.PI) / 180) * radius;
                  return (
                    <motion.div
                      key={`photo-${i}`}
                      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        scale: [0, 0.8, 0.8, 0],
                        x: tx,
                        y: ty,
                      }}
                      transition={{ duration: 3.5, delay: 0.3 + i * 0.2 }}
                      className="absolute z-30"
                      style={{ left: "50%", top: "30%" }}
                    >
                      <div
                        className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-lg"
                        style={{
                          transform: `rotate(${-15 + Math.random() * 30}deg)`,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo}
                          alt="Memory"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={sendHug}
          disabled={isHugging}
          className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
            isHugging
              ? "bg-pink-200 text-pink-400 cursor-not-allowed"
              : "bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:shadow-lg hover:shadow-pink-200 active:scale-95"
          }`}
        >
          {isHugging ? "Hugging... 🫂" : "Send a Hug 🫂"}
        </button>

        {hugCount > 0 && (
          <p className="text-xs text-gray-400 mt-3">
            {hugCount} hug{hugCount !== 1 ? "s" : ""} sent today 💕
          </p>
        )}
      </div>

      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 bg-pink-50 rounded-2xl p-4 text-center"
          >
            <p className="handwriting text-lg text-pink-500">
              {allPhotos.length > 0
                ? "Your memories surround you like a warm embrace 🫂💕"
                : "A virtual hug has been sent! 🫂💕"}
            </p>
            {allPhotos.length > 0 && (
              <p className="text-[10px] text-pink-300 mt-1">
                {allPhotos.length} photo{allPhotos.length !== 1 ? "s" : ""} floating around you
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
