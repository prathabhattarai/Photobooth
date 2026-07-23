"use client";

import { useEffect, useState } from "react";

interface FloatingElement {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

const EMOJIS = ["💕", "✨", "🌙", "🤍", "💫", "🌸", "🦋", "✿"];

export default function FloatingElements() {
  const [elements, setElements] = useState<FloatingElement[]>([]);

  useEffect(() => {
    const els: FloatingElement[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[i % EMOJIS.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 14 + Math.random() * 14,
      delay: Math.random() * 6,
      duration: 6 + Math.random() * 8,
      opacity: 0.08 + Math.random() * 0.1,
    }));
    setElements(els);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {elements.map((el) => (
        <div
          key={el.id}
          className="absolute"
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            fontSize: `${el.size}px`,
            opacity: el.opacity,
            animation: `drift ${el.duration}s ease-in-out ${el.delay}s infinite, breathe ${el.duration * 0.8}s ease-in-out ${el.delay}s infinite`,
          }}
        >
          {el.emoji}
        </div>
      ))}
    </div>
  );
}
