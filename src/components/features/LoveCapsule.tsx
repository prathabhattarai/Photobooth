"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoveCapsule {
  id: string;
  from: string;
  message: string;
  createdAt: string;
  isOpened: boolean;
}

const SAMPLE_CAPSULES: LoveCapsule[] = [
  {
    id: "1",
    from: "Pratha",
    message: "I miss you more than words can say. Can't wait to see your smile again 💕",
    createdAt: "2026-07-22",
    isOpened: false,
  },
  {
    id: "2",
    from: "Partner",
    message: "Every moment apart makes our time together even more special 🌙",
    createdAt: "2026-07-21",
    isOpened: false,
  },
];

export default function LoveCapsule() {
  const [capsules, setCapsules] = useState<SloveCapsule[]>(SAMPLE_CAPSULES);
  const [showComposer, setShowComposer] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [newFrom, setNewFrom] = useState("");
  const [openedCapsule, setOpenedCapsule] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newMessage.trim() || !newFrom.trim()) return;
    const capsule: LoveCapsule = {
      id: `c-${Date.now()}`,
      from: newFrom,
      message: newMessage,
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      isOpened: false,
    };
    setCapsules([capsule, ...capsules]);
    setNewMessage("");
    setShowComposer(false);
  };

  const handleOpen = (id: string) => {
    setOpenedCapsule(id);
    setCapsules((prev) => prev.map((c) => (c.id === id ? { ...c, isOpened: true } : c)));
  };

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <span className="text-xl">💌</span> Daily Love Capsule
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Leave a sweet message for your partner
          </p>
        </div>
        <button
          onClick={() => setShowComposer(!showComposer)}
          className="px-3 py-1.5 rounded-full bg-pink-100 text-pink-500 text-xs font-bold hover:bg-pink-200 transition-colors"
        >
          {showComposer ? "Cancel" : "+ New"}
        </button>
      </div>

      <AnimatePresence>
        {showComposer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-white/60 rounded-2xl p-4 space-y-3">
              <input
                type="text"
                value={newFrom}
                onChange={(e) => setNewFrom(e.target.value)}
                placeholder="Your name..."
                className="cute-input text-sm py-2"
                maxLength={20}
              />
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write something sweet... 💕"
                className="cute-input text-sm py-2 min-h-[80px] resize-none"
                maxLength={300}
              />
              <button
                onClick={handleCreate}
                disabled={!newMessage.trim() || !newFrom.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-400 to-pink-500 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                Seal with a Kiss 💋
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {capsules.map((capsule) => (
          <motion.div
            key={capsule.id}
            layout
            className="relative"
          >
            {!capsule.isOpened ? (
              <button
                onClick={() => handleOpen(capsule.id)}
                className="w-full bg-gradient-to-r from-pink-50 to-lavender-50 rounded-2xl p-4 text-left hover:from-pink-100 hover:to-lavender-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-200 to-pink-300 flex items-center justify-center text-2xl group-hover:animate-wiggle">
                    💌
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-600 text-sm">
                      From {capsule.from}
                    </p>
                    <p className="text-xs text-gray-400">{capsule.createdAt}</p>
                  </div>
                  <span className="text-xs text-pink-400 font-bold px-3 py-1 rounded-full bg-pink-100">
                    Tap to open 🔒
                  </span>
                </div>
              </button>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-r from-pink-100 to-lavender-100 rounded-2xl p-5 text-center"
              >
                <div className="text-3xl mb-2">💕</div>
                <p className="handwriting text-xl text-gray-600 mb-2">
                  &ldquo;{capsule.message}&rdquo;
                </p>
                <p className="text-xs text-gray-400">
                  From {capsule.from} · {capsule.createdAt}
                </p>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {capsules.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">💌</div>
          <p className="text-sm text-gray-400">No love capsules yet</p>
          <p className="text-xs text-gray-300">Send one to your partner!</p>
        </div>
      )}
    </div>
  );
}

type SloveCapsule = LoveCapsule;
