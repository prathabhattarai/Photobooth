"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, X, Heart } from "lucide-react";

interface AvatarUploaderProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export default function AvatarUploader({
  value,
  onChange,
  size = "lg",
  label,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {label && (
        <label className="block text-sm font-bold text-gray-500">{label}</label>
      )}

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative ${sizeClasses[size]} rounded-full cursor-pointer group`}
        onClick={handleClick}
        onDragOver={(e) => {
          e.preventDefault();
          setIsHovered(true);
        }}
        onDragLeave={() => setIsHovered(false)}
        onDrop={handleDrop}
      >
        {/* Ring decoration */}
        <div className="absolute inset-[-4px] rounded-full border-4 border-dashed border-pink-300 animate-[spin_12s_linear_infinite]" />

        {/* Main circle */}
        <div
          className={`w-full h-full rounded-full overflow-hidden border-4 transition-all duration-300 ${
            isHovered
              ? "border-pink-400 bg-pink-50"
              : value
              ? "border-pink-300 bg-white"
              : "border-gray-200 bg-gradient-to-br from-pink-50 to-lavender-50"
          }`}
        >
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Your avatar"
                className="w-full h-full object-cover"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className={`${iconSizes[size]} text-white`} />
              </div>
              {/* Remove button */}
              <button
                onClick={handleRemove}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-400 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-400" fill="currentColor" />
              </div>
              <span className="text-[10px] font-bold text-gray-400">
                Upload Photo
              </span>
            </div>
          )}
        </div>

        {/* Corner sparkle */}
        {!value && (
          <div className="absolute -bottom-1 -right-1 text-lg">✨</div>
        )}
      </motion.div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {value && (
        <p className="text-xs text-gray-400 text-center">
          Tap to change photo
        </p>
      )}
      {!value && (
        <p className="text-xs text-gray-400 text-center">
          Upload a photo of yourself 💕
        </p>
      )}
    </div>
  );
}
