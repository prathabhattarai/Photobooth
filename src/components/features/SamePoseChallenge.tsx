"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const POSES = [
  { id: 1, text: "Make a heart with your hands", emoji: "💕", difficulty: "Easy" },
  { id: 2, text: "Strike your funniest pose", emoji: "😂", difficulty: "Easy" },
  { id: 3, text: "Look surprised!", emoji: "😮", difficulty: "Easy" },
  { id: 4, text: "Peace sign!", emoji: "✌️", difficulty: "Easy" },
  { id: 5, text: "Blow a kiss", emoji: "😘", difficulty: "Easy" },
  { id: 6, text: "Hug yourself", emoji: "🤗", difficulty: "Easy" },
  { id: 7, text: "Wink at the camera", emoji: "😉", difficulty: "Medium" },
  { id: 8, text: "Make your best model face", emoji: "💃", difficulty: "Medium" },
  { id: 9, text: "Do a silly dance", emoji: "🕺", difficulty: "Hard" },
  { id: 10, text: "Balance something on your head", emoji: "🎩", difficulty: "Hard" },
];

export default function SamePoseChallenge() {
  const [currentPose, setCurrentPose] = useState<typeof POSES[0] | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const rollPose = () => {
    setIsRolling(true);
    setCurrentPose(null);
    let count = 0;
    const interval = setInterval(() => {
      setCurrentPose(POSES[Math.floor(Math.random() * POSES.length)]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        const finalPose = POSES[Math.floor(Math.random() * POSES.length)];
        setCurrentPose(finalPose);
        setIsRolling(false);
      }
    }, 80);
  };

  const handleComplete = () => {
    setCompletedCount((c) => c + 1);
    setCurrentPose(null);
  };

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          <span className="text-xl">📸</span> Same Pose Challenge
        </h3>
        {completedCount > 0 && (
          <span className="text-xs bg-pink-100 text-pink-500 font-bold px-2 py-1 rounded-full">
            {completedCount} done!
          </span>
        )}
      </div>

      <div className="text-center">
        <AnimatePresence mode="wait">
          {!currentPose ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-6"
            >
              <div className="text-5xl mb-3">📸</div>
              <p className="text-sm text-gray-400 mb-4">
                Get the same pose at the same time!
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={currentPose.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="py-4"
            >
              <motion.div
                animate={!isRolling ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
                className="text-5xl mb-3"
              >
                {currentPose.emoji}
              </motion.div>
              <p className="font-bold text-gray-700 text-lg mb-1">
                {currentPose.text}
              </p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                currentPose.difficulty === "Easy"
                  ? "bg-green-100 text-green-600"
                  : currentPose.difficulty === "Medium"
                  ? "bg-yellow-100 text-yellow-600"
                  : "bg-red-100 text-red-600"
              }`}>
                {currentPose.difficulty}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 justify-center">
          <button
            onClick={rollPose}
            disabled={isRolling}
            className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
              isRolling
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-pink-400 to-pink-500 text-white hover:shadow-lg active:scale-95"
            }`}
          >
            {isRolling ? "Rolling..." : currentPose ? "New Pose 🎲" : "Roll a Pose 🎲"}
          </button>
          {currentPose && !isRolling && (
            <button
              onClick={handleComplete}
              className="px-5 py-2.5 rounded-full bg-green-100 text-green-600 font-bold text-sm hover:bg-green-200 transition-all"
            >
              Done! ✅
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
