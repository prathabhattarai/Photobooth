"use client";

import { useState, useEffect } from "react";

interface DailyTheme {
  name: string;
  emoji: string;
  color: string;
  bgGradient: string;
  message: string;
  frameStyle: string;
}

const THEMES: DailyTheme[] = [
  { name: "Pink Day", emoji: "🌸", color: "pink", bgGradient: "from-pink-100 to-pink-200", message: "Everything is pink today! 💕", frameStyle: "border-pink-300" },
  { name: "Midnight", emoji: "🌙", color: "indigo", bgGradient: "from-indigo-100 to-purple-200", message: "A dreamy night theme 🌙✨", frameStyle: "border-indigo-300" },
  { name: "Teddy Bear", emoji: "🧸", color: "amber", bgGradient: "from-amber-100 to-orange-100", message: "Cozy and warm like a teddy hug 🧸", frameStyle: "border-amber-300" },
  { name: "Rainbow", emoji: "🌈", color: "multi", bgGradient: "from-pink-100 via-lavender-100 to-blue-100", message: "All the colors of love! 🌈", frameStyle: "border-pink-200" },
  { name: "Ocean", emoji: "🌊", color: "blue", bgGradient: "from-blue-100 to-cyan-100", message: "Deep and beautiful like the ocean 💙", frameStyle: "border-blue-300" },
  { name: "Sakura", emoji: "🌸", color: "rose", bgGradient: "from-rose-100 to-pink-100", message: "Cherry blossom season 🌸", frameStyle: "border-rose-300" },
  { name: "Starry Night", emoji: "⭐", color: "violet", bgGradient: "from-violet-100 to-indigo-100", message: "A sky full of stars for you ✨", frameStyle: "border-violet-300" },
  { name: "Halloween", emoji: "🎃", color: "orange", bgGradient: "from-orange-100 to-amber-100", message: "Spooky cute! 🎃👻", frameStyle: "border-orange-300" },
  { name: "Christmas", emoji: "🎄", color: "green", bgGradient: "from-green-100 to-red-100", message: "Tis the season to be cute! 🎄", frameStyle: "border-green-300" },
  { name: "Birthday", emoji: "🎂", color: "pink", bgGradient: "from-pink-100 to-yellow-100", message: "Happy everyday birthday! 🎂", frameStyle: "border-pink-200" },
  { name: "Love", emoji: "❤️", color: "red", bgGradient: "from-red-100 to-pink-100", message: "Love is in the air! 💕", frameStyle: "border-red-300" },
  { name: "Mint Fresh", emoji: "🍃", color: "emerald", bgGradient: "from-emerald-100 to-teal-100", message: "Fresh and cool! 🍃", frameStyle: "border-emerald-300" },
];

export function getDailyTheme(): DailyTheme {
  const dayOfYear = Math.floor(Date.now() / 86400000);
  return THEMES[dayOfYear % THEMES.length];
}

export default function DailyThemeDisplay() {
  const [theme, setTheme] = useState<DailyTheme>(THEMES[0]);

  useEffect(() => {
    setTheme(getDailyTheme());
  }, []);

  return (
    <div className={`glass-card rounded-3xl p-6 bg-gradient-to-br ${theme.bgGradient} bg-opacity-30`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <span className="text-xl">{theme.emoji}</span> Today&apos;s Theme
          </h3>
          <p className="text-sm text-gray-500 mt-1">{theme.name}</p>
        </div>
        <div className="text-right">
          <p className="handwriting text-sm text-gray-400">{theme.message}</p>
        </div>
      </div>
    </div>
  );
}
