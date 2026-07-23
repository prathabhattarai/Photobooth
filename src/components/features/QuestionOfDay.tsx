"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const QUESTIONS = [
  "What was your favorite moment with me?",
  "What's the first thing you noticed about me?",
  "If we could travel anywhere together, where would we go?",
  "What song reminds you of us?",
  "What's your favorite thing about us?",
  "What's a dream you have for our future?",
  "What made you fall in love with me?",
  "What's the funniest thing we've done together?",
  "If you could relive one day with me, which would it be?",
  "What's something you've always wanted to tell me?",
  "What's your favorite memory of our first date?",
  "What's a small thing I do that makes you happy?",
  "If I could visit you right now, what would we do?",
  "What's your favorite way to spend time with me?",
  "What makes you smile when you think of me?",
];

export default function QuestionOfDay() {
  const [questionIdx, useState_] = useState(
    Math.floor(Date.now() / 86400000) % QUESTIONS.length
  );
  const [answer, setAnswer] = useState("");
  const [partnerAnswer, setPartnerAnswer] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const question = QUESTIONS[questionIdx];

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);
    // Simulate partner's answer
    const sampleAnswers = [
      "Every moment with you is my favorite 💕",
      "The way you always know how to make me smile",
      "I love how we can be ourselves together",
      "You make every day special just by being you",
    ];
    setPartnerAnswer(sampleAnswers[Math.floor(Math.random() * sampleAnswers.length)]);
  };

  return (
    <div className="glass-card rounded-3xl p-6">
      <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
        <span className="text-xl">💭</span> Question of the Day
      </h3>

      <div className="bg-gradient-to-r from-lavender-50 to-pink-50 rounded-2xl p-5 text-center mb-4">
        <p className="handwriting text-xl text-gray-600">
          &ldquo;{question}&rdquo;
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="answer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write your answer... 💕"
              className="cute-input text-sm min-h-[80px] resize-none mb-3"
              maxLength={300}
            />
            <button
              onClick={handleSubmit}
              disabled={!answer.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-lavender-400 to-pink-400 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all"
            >
              Submit Answer 💕
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Your answer */}
            <div className="bg-pink-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🐻</span>
                <span className="text-xs font-bold text-pink-500">Your Answer</span>
              </div>
              <p className="text-sm text-gray-600">&ldquo;{answer}&rdquo;</p>
            </div>

            {/* Partner answer (simulated reveal) */}
            {!isRevealed ? (
              <button
                onClick={() => setIsRevealed(true)}
                className="w-full py-3 rounded-2xl bg-lavender-50 border-2 border-dashed border-lavender-200 text-lavender-500 font-bold text-sm hover:bg-lavender-100 transition-colors"
              >
                Tap to reveal partner&apos;s answer 💕
              </button>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-lavender-50 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🐰</span>
                  <span className="text-xs font-bold text-lavender-500">Partner&apos;s Answer</span>
                </div>
                <p className="text-sm text-gray-600">&ldquo;{partnerAnswer}&rdquo;</p>
              </motion.div>
            )}

            {isRevealed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center pt-2"
              >
                <p className="handwriting text-lg text-pink-400">
                  You both mean the world to each other 💕
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
