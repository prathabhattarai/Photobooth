"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SURPRISES = [
  { id: 1, type: "note", emoji: "💌", title: "Love Note", content: "You are the reason I smile every day 💕", bg: "from-pink-100 to-pink-200" },
  { id: 2, type: "flower", emoji: "🌷", title: "Virtual Flower", content: "A flower for the most beautiful person 🌸", bg: "from-rose-100 to-red-100" },
  { id: 3, type: "sticker", emoji: "🧸", title: "Cute Teddy", content: "Sending you a warm hug through this teddy 🤗", bg: "from-amber-100 to-orange-100" },
  { id: 4, type: "question", emoji: "💬", title: "Sweet Question", content: "What's your favorite memory of us? 💕", bg: "from-lavender-100 to-purple-100" },
  { id: 5, type: "kiss", emoji: "💋", title: "Virtual Kiss", content: "Mwah! 💋", bg: "from-pink-100 to-rose-100" },
  { id: 6, type: "star", emoji: "⭐", title: "You're My Star", content: "You light up my world like no one else ✨", bg: "from-yellow-100 to-amber-100" },
  { id: 7, type: "hug", emoji: "🫂", title: "Warm Hug", content: "Imagine this is a real hug from me 🤗", bg: "from-blue-100 to-sky-100" },
  { id: 8, type: "promise", emoji: "🤝", title: "Promise", content: "I promise to love you more every single day 💗", bg: "from-green-100 to-emerald-100" },
];

export default function SurpriseBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSurprise, setCurrentSurprise] = useState(SURPRISES[0]);
  const [shake, setShake] = useState(false);

  const handleOpen = () => {
    setShake(true);
    setTimeout(() => {
      const random = SURPRISES[Math.floor(Math.random() * SURPRISES.length)];
      setCurrentSurprise(random);
      setIsOpen(true);
      setShake(false);
    }, 600);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="glass-card rounded-3xl p-6">
      <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
        <span className="text-xl">🎁</span> Surprise Box
      </h3>

      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center"
          >
            <button
              onClick={handleOpen}
              className={`inline-block ${shake ? "animate-wiggle" : ""}`}
            >
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-pink-200 to-lavender-200 rounded-3xl flex items-center justify-center text-6xl hover:scale-110 transition-transform duration-300 shadow-lg hover:shadow-xl cursor-pointer relative">
                🎁
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
            </button>
            <p className="text-sm text-gray-400 mt-4">
              Tap the gift to open your surprise!
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="surprise"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
          >
            <div className={`bg-gradient-to-br ${currentSurprise.bg} rounded-3xl p-8 text-center`}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-6xl mb-4"
              >
                {currentSurprise.emoji}
              </motion.div>
              <h4 className="font-bold text-gray-700 text-lg mb-2">
                {currentSurprise.title}
              </h4>
              <p className="handwriting text-xl text-gray-600 mb-6">
                &ldquo;{currentSurprise.content}&rdquo;
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-full bg-white/80 hover:bg-white text-sm font-bold text-gray-500 transition-all shadow-sm"
              >
                Another surprise 🎁
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
