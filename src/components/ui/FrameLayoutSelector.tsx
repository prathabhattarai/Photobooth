"use client";

import { motion } from "framer-motion";
import { FrameLayoutType } from "@/lib/types";

interface LayoutOption {
  id: FrameLayoutType;
  name: string;
  description: string;
  slots: number;
}

const LAYOUTS: LayoutOption[] = [
  {
    id: "1x4",
    name: "1 × 4 Strip",
    description: "Classic vertical photobooth strip",
    slots: 4,
  },
  {
    id: "2x2",
    name: "2 × 2 Grid",
    description: "Square grid layout",
    slots: 4,
  },
];

interface FrameLayoutSelectorProps {
  value: FrameLayoutType;
  onChange: (layout: FrameLayoutType) => void;
}

function SlotPlaceholder({ index }: { index: number }) {
  return (
    <div className="bg-white/40 border border-dashed border-rose-200/60 rounded flex items-center justify-center">
      <span className="text-[9px] font-bold text-rose-300/60">{index + 1}</span>
    </div>
  );
}

function StripPreview({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-1.5 w-full h-full p-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <SlotPlaceholder key={i} index={i} />
      ))}
    </div>
  );
}

function GridPreview({ count }: { count: number }) {
  const cols = 2;
  const rows = Math.ceil(count / cols);
  return (
    <div
      className="grid grid-cols-2 gap-1.5 w-full h-full p-1.5"
      style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SlotPlaceholder key={i} index={i} />
      ))}
    </div>
  );
}

function LayoutPreview({ layout }: { layout: LayoutOption }) {
  if (layout.id === "1x4") {
    return (
      <div className="w-16 h-28 rounded-lg border border-rose-200/40 bg-gradient-to-b from-rose-50/50 to-lavender-50/50 overflow-hidden">
        <StripPreview count={layout.slots} />
      </div>
    );
  }

  return (
    <div className="w-24 h-24 rounded-lg border border-rose-200/40 bg-gradient-to-br from-rose-50/50 to-lavender-50/50 overflow-hidden">
      <GridPreview count={layout.slots} />
    </div>
  );
}

export default function FrameLayoutSelector({
  value,
  onChange,
}: FrameLayoutSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-warm-gray-500 tracking-wide uppercase text-center">
        Frame Layout
      </p>
      <div className="flex justify-center gap-4">
        {LAYOUTS.map((layout) => {
          const isSelected = value === layout.id;
          return (
            <motion.button
              key={layout.id}
              onClick={() => onChange(layout.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-300 ${
                isSelected
                  ? "bg-gradient-to-b from-rose-50 to-white border-2 border-rose-300 shadow-lg shadow-rose-100/50"
                  : "bg-white/60 border border-warm-gray-100 hover:border-rose-200 hover:bg-white/80 pastel-shadow"
              }`}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  layoutId="layout-indicator"
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}

              <LayoutPreview layout={layout} />

              <div className="text-center">
                <p
                  className={`text-sm font-bold ${
                    isSelected ? "text-rose-600" : "text-warm-gray-600"
                  }`}
                >
                  {layout.name}
                </p>
                <p className="text-[11px] text-warm-gray-400 mt-0.5">
                  {layout.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
