"use client";

import { motion } from "framer-motion";
import { Heart, Camera, ArrowRight } from "lucide-react";
import Link from "next/link";
import FloatingElements from "@/components/ui/FloatingElements";

const steps = [
  {
    num: "I",
    title: "Create Your Space",
    description: "A private room just for you two, connected with a personal code",
    color: "from-rose-100 to-blush",
  },
  {
    num: "II",
    title: "Be Present Together",
    description: "See each other through your cameras, no matter the miles between",
    color: "from-plum-50 to-rose-50",
  },
  {
    num: "III",
    title: "Preserve the Moment",
    description: "Frame your memories with elegant frames and timeless filters",
    color: "from-champagne/50 to-warm-gray-50",
  },
];

export default function HeroSection() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        <FloatingElements />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="w-8 h-px bg-gold/40" />
            <Camera className="w-5 h-5 text-gold" />
            <span className="text-xs font-medium text-gold tracking-[0.3em] uppercase">
              TogetherFrame
            </span>
            <Camera className="w-5 h-5 text-gold" />
            <div className="w-8 h-px bg-gold/40" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-5xl md:text-7xl font-serif font-bold leading-[1.1] mb-6"
          >
            <span className="text-rose-600">Miles Apart.</span>
            <br />
            <span className="text-warm-gray-700">Always</span>{" "}
            <span className="font-script text-gold italic">Together.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-xl text-warm-gray-500 mb-12 max-w-lg mx-auto leading-relaxed"
          >
            A private space for two. Capture your most intimate moments, 
            share them quietly, and hold onto the feeling of being close.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/room">
              <button className="cute-button bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 group">
                <span className="flex items-center gap-2">
                  Begin Together
                  <Heart className="w-4 h-4 group-hover:animate-heartbeat" fill="currentColor" />
                </span>
              </button>
            </Link>
            <Link href="/room?tab=join">
              <button className="cute-button bg-white/80 border border-gold/30 text-warm-gray-600 hover:bg-champagne/30 hover:border-gold/50 group">
                <span className="flex items-center gap-2">
                  Join Your Partner
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Visual Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="relative z-10 mt-20 flex items-center gap-6 md:gap-10"
        >
          <div className="polaroid rotate-[-3deg] animate-float" style={{ animationDelay: "0s" }}>
            <div className="w-36 h-44 md:w-48 md:h-60 bg-gradient-to-br from-rose-100 via-blush to-rose-50 rounded-sm flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-rose-200/60 mx-auto mb-2 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-rose-400" fill="currentColor" />
                </div>
                <span className="text-xs font-medium text-warm-gray-400 tracking-wide">You</span>
              </div>
            </div>
            <p className="handwriting text-center text-warm-gray-400 text-sm mt-2 absolute bottom-4 left-0 right-0">
              always yours
            </p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Heart className="w-5 h-5 text-rose-400" fill="currentColor" />
            </motion.div>
            <span className="text-[10px] text-gold font-medium tracking-widest uppercase">connected</span>
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            >
              <Heart className="w-5 h-5 text-rose-400" fill="currentColor" />
            </motion.div>
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
          </div>

          <div className="polaroid rotate-[3deg] animate-float" style={{ animationDelay: "1.5s" }}>
            <div className="w-36 h-44 md:w-48 md:h-60 bg-gradient-to-br from-plum-50 via-plum-100/50 to-blush rounded-sm flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-plum-100 mx-auto mb-2 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-plum-300" fill="currentColor" />
                </div>
                <span className="text-xs font-medium text-warm-gray-400 tracking-wide">Your love</span>
              </div>
            </div>
            <p className="handwriting text-center text-warm-gray-400 text-sm mt-2 absolute bottom-4 left-0 right-0">
              forever mine
            </p>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="relative py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-medium text-gold tracking-[0.3em] uppercase mb-4 block">
              Simple & Intimate
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-warm-gray-800 mb-4">
              How It <span className="font-script text-rose-500 italic">Works</span>
            </h2>
            <div className="w-16 h-px bg-gold/40 mx-auto mt-4" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card rounded-2xl p-8 text-center hover:shadow-lg transition-all duration-500 group"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center mx-auto mb-5`}>
                  <span className="font-serif text-lg font-bold text-warm-gray-600">{step.num}</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-warm-gray-700 mb-3">
                  {step.title}
                </h3>
                <p className="text-warm-gray-400 text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <div className="w-12 h-px bg-gold/40 mx-auto mb-8" />
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-warm-gray-800 mb-4">
            Begin Your <span className="font-script text-rose-500 italic">Story</span>
          </h2>
          <p className="text-warm-gray-400 mb-10 text-lg leading-relaxed">
            Your most precious memories deserve a beautiful home. 
            Create your private space and start capturing what matters.
          </p>
          <Link href="/room">
            <button className="cute-button bg-gradient-to-r from-rose-500 to-burgundy text-white hover:shadow-rose-200/50 hover:shadow-2xl group">
              <span className="flex items-center gap-2">
                Create Our Space
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 text-center">
        <div className="romantic-divider mb-8" />
        <div className="flex items-center justify-center gap-2 text-warm-gray-400 text-sm">
          <span>Made with</span>
          <Heart className="w-3.5 h-3.5 text-rose-400 animate-heartbeat" fill="currentColor" />
          <span>for lovers everywhere</span>
        </div>
        <p className="text-xs text-warm-gray-300 mt-3 font-serif italic">
          TogetherFrame &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </>
  );
}
