"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function CoupleStreak() {
  const [streak, setStreak] = useState(0);
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tf_streak");
    const storedDate = localStorage.getItem("tf_lastVisit");

    if (stored && storedDate) {
      const last = new Date(storedDate);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - last.getTime()) / 86400000);

      if (diffDays <= 1) {
        setStreak(parseInt(stored) + (diffDays === 1 ? 1 : 0));
        if (diffDays === 1) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      } else {
        setStreak(1);
      }
    } else {
      setStreak(1);
    }

    localStorage.setItem("tf_streak", streak.toString());
    localStorage.setItem("tf_lastVisit", new Date().toISOString());
  }, []);

  const milestones = [7, 14, 30, 50, 100, 365];
  const nextMilestone = milestones.find((m) => m > streak) || streak + 30;
  const progress = ((streak % nextMilestone) / nextMilestone) * 100;

  return (
    <div className="glass-card rounded-3xl p-6">
      <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
        <span className="text-xl">🔥</span> Couple Streak
      </h3>

      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="mb-4"
        >
          <div className="text-5xl mb-2">🔥</div>
          <div className="handwriting text-4xl font-bold text-gray-700">
            {streak} Day{streak !== 1 ? "s" : ""}
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Memory streak with your partner!
          </p>
        </motion.div>

        {/* Progress bar to next milestone */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Day {streak}</span>
            <span>Goal: {nextMilestone} days</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-orange-400 to-pink-400 rounded-full"
            />
          </div>
        </div>

        {/* Streak badges */}
        <div className="flex justify-center gap-2 flex-wrap">
          {milestones.slice(0, 4).map((m) => (
            <div
              key={m}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${
                streak >= m
                  ? "bg-gradient-to-br from-amber-200 to-orange-200 text-orange-600"
                  : "bg-gray-100 text-gray-300"
              }`}
            >
              {streak >= m ? "🏅" : `${m}`}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          {streak < 7
            ? "Keep going! 7 days for your first badge 🏅"
            : streak < 30
            ? "You're doing great! Keep the streak alive! 🔥"
            : "Incredible dedication! You two are goals! 💕"}
        </p>
      </div>

      {/* Celebration */}
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-3xl p-8 text-center shadow-2xl"
          >
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="font-bold text-gray-700 text-xl">Streak Extended!</h3>
            <p className="text-sm text-gray-400 mt-1">{streak} days and counting!</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
