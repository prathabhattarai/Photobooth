"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PETS = {
  name: "Mochi",
  emoji: "🐶",
  maxLevel: 10,
  maxHunger: 100,
  maxHappiness: 100,
};

interface PetState {
  name: string;
  level: number;
  hunger: number;
  happiness: number;
  lastFed: string;
  accessories: string[];
  equippedAccessory: string;
}

const DEFAULT_PET: PetState = {
  name: "Mochi",
  level: 1,
  hunger: 80,
  happiness: 70,
  lastFed: new Date().toISOString(),
  accessories: ["🎀"],
  equippedAccessory: "🎀",
};

const ACCESSORIES = [
  { id: "none", emoji: "❌", label: "None" },
  { id: "🎀", emoji: "🎀", label: "Ribbon" },
  { id: "👑", emoji: "👑", label: "Crown" },
  { id: "🧢", emoji: "🧢", label: "Cap" },
  { id: "🎀", emoji: "🎀", label: "Bow" },
  { id: "💝", emoji: "💝", label: "Gift" },
  { id: "⭐", emoji: "⭐", label: "Star" },
  { id: "🌸", emoji: "🌸", label: "Flower" },
];

export default function CouplePet() {
  const [pet, setPet] = useState<PetState>(DEFAULT_PET);
  const [showAccessoryPicker, setShowAccessoryPicker] = useState(false);
  const [feedAnimation, setFeedAnimation] = useState(false);
  const [playAnimation, setPlayAnimation] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPet((prev) => ({
        ...prev,
        hunger: Math.max(0, prev.hunger - 2),
        happiness: Math.max(0, prev.happiness - 1),
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const feedPet = () => {
    if (pet.hunger >= PETS.maxHunger) return;
    setFeedAnimation(true);
    setTimeout(() => setFeedAnimation(false), 1000);
    setPet((prev) => {
      const newHunger = Math.min(PETS.maxHunger, prev.hunger + 20);
      const newHappiness = prev.happiness + 10;
      const newLevel = newHappiness >= PETS.maxHappiness ? Math.min(PETS.maxLevel, prev.level + 1) : prev.level;
      if (newLevel > prev.level) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }
      return { ...prev, hunger: newHunger, happiness: newHappiness, level: newLevel, lastFed: new Date().toISOString() };
    });
  };

  const playWithPet = () => {
    if (pet.happiness >= PETS.maxHappiness) return;
    setPlayAnimation(true);
    setTimeout(() => setPlayAnimation(false), 1000);
    setPet((prev) => ({
      ...prev,
      happiness: Math.min(PETS.maxHappiness, prev.happiness + 20),
      hunger: Math.max(0, prev.hunger - 5),
    }));
  };

  const mood = pet.happiness > 70 ? "happy" : pet.happiness > 40 ? "neutral" : "sad";
  const moodEmoji = mood === "happy" ? "😊" : mood === "neutral" ? "😐" : "😢";

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          <span className="text-xl">🐾</span> Our Pet
        </h3>
        <span className="text-xs text-gray-400 font-bold">Lv.{pet.level}</span>
      </div>

      {/* Pet Display */}
      <div className="text-center mb-4">
        <div className="relative inline-block">
          <motion.div
            animate={
              feedAnimation
                ? { y: [-5, 0], scale: [1, 1.1, 1] }
                : playAnimation
                ? { rotate: [-5, 5, -5, 0], scale: [1, 1.1, 1] }
                : { y: [0, -3, 0] }
            }
            transition={{ duration: 0.6, repeat: playAnimation ? 0 : Infinity, repeatDelay: 2 }}
            className="text-7xl"
          >
            {PETS.emoji}
          </motion.div>
          <div className="absolute -top-2 -right-2 text-2xl">
            {pet.equippedAccessory !== "none" ? pet.equippedAccessory : ""}
          </div>
          <AnimatePresence>
            {feedAnimation && (
              <motion.div
                initial={{ opacity: 1, y: -10 }}
                animate={{ opacity: 0, y: -40 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 text-2xl"
              >
                🍖
              </motion.div>
            )}
            {playAnimation && (
              <motion.div
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 2 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 text-2xl"
              >
                💕
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="font-bold text-gray-700 text-sm mt-2">{pet.name}</p>
        <p className="text-xs text-gray-400">{moodEmoji} {mood === "happy" ? "Feeling great!" : mood === "neutral" ? "Okay" : "Needs attention"}</p>
      </div>

      {/* Stats */}
      <div className="space-y-2 mb-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">🍖 Hunger</span>
            <span className="text-gray-500 font-bold">{pet.hunger}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pet.hunger > 60 ? "bg-green-400" : pet.hunger > 30 ? "bg-yellow-400" : "bg-red-400"
              }`}
              style={{ width: `${pet.hunger}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">💕 Happiness</span>
            <span className="text-gray-500 font-bold">{pet.happiness}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pet.happiness > 60 ? "bg-pink-400" : pet.happiness > 30 ? "bg-yellow-400" : "bg-red-400"
              }`}
              style={{ width: `${pet.happiness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={feedPet}
          disabled={pet.hunger >= PETS.maxHunger}
          className="flex-1 py-2.5 rounded-xl bg-amber-100 text-amber-600 text-xs font-bold hover:bg-amber-200 transition-colors disabled:opacity-40"
        >
          Feed 🍖
        </button>
        <button
          onClick={playWithPet}
          disabled={pet.happiness >= PETS.maxHappiness}
          className="flex-1 py-2.5 rounded-xl bg-pink-100 text-pink-600 text-xs font-bold hover:bg-pink-200 transition-colors disabled:opacity-40"
        >
          Play 💕
        </button>
        <button
          onClick={() => setShowAccessoryPicker(!showAccessoryPicker)}
          className="flex-1 py-2.5 rounded-xl bg-lavender-100 text-lavender-500 text-xs font-bold hover:bg-lavender-200 transition-colors"
        >
          Dress Up 🎀
        </button>
      </div>

      {/* Accessory Picker */}
      <AnimatePresence>
        {showAccessoryPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 p-3 bg-white/60 rounded-2xl">
              {ACCESSORIES.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setPet((p) => ({ ...p, equippedAccessory: acc.id }))}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    pet.equippedAccessory === acc.id
                      ? "bg-pink-100 ring-2 ring-pink-400 scale-110"
                      : "bg-white/60 hover:bg-pink-50"
                  }`}
                >
                  {acc.emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="font-bold text-gray-700 text-xl">Level Up!</h3>
              <p className="text-sm text-gray-400 mt-1">{pet.name} is now Level {pet.level}!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
