"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface City {
  name: string;
  country: string;
  timezone: string;
  emoji: string;
}

const CITIES: City[] = [
  { name: "Kathmandu", country: "Nepal", timezone: "Asia/Kathmandu", emoji: "🏔️" },
  { name: "London", country: "UK", timezone: "Europe/London", emoji: "🇬🇧" },
  { name: "New York", country: "USA", timezone: "America/New_York", emoji: "🗽" },
  { name: "Tokyo", country: "Japan", timezone: "Asia/Tokyo", emoji: "🗼" },
  { name: "Sydney", country: "Australia", timezone: "Australia/Sydney", emoji: "🦘" },
  { name: "Dubai", country: "UAE", timezone: "Asia/Dubai", emoji: "🏙️" },
  { name: "Paris", country: "France", timezone: "Europe/Paris", emoji: "🗼" },
  { name: "Seoul", country: "Korea", timezone: "Asia/Seoul", emoji: "🇰🇷" },
  { name: "Singapore", country: "Singapore", timezone: "Asia/Singapore", emoji: "🇸🇬" },
  { name: "Mumbai", country: "India", timezone: "Asia/Kolkata", emoji: "🇮🇳" },
  { name: "Berlin", country: "Germany", timezone: "Europe/Berlin", emoji: "🇩🇪" },
  { name: "São Paulo", country: "Brazil", timezone: "America/Sao_Paulo", emoji: "🇧🇷" },
];

const DISTANCES: Record<string, number> = {
  "Kathmandu-London": 6800,
  "Kathmandu-New York": 12000,
  "Kathmandu-Tokyo": 4800,
  "Kathmandu-Sydney": 10200,
  "London-New York": 5570,
  "London-Tokyo": 9560,
  "New York-Tokyo": 10840,
  "Kathmandu-Dubai": 2850,
  "Kathmandu-Paris": 6750,
  "Kathmandu-Seoul": 4500,
  "Kathmandu-Singapore": 4150,
  "Kathmandu-Mumbai": 1800,
  "Kathmandu-Berlin": 6500,
  "Kathmandu-São Paulo": 15500,
};

function getDistance(city1: string, city2: string): number {
  const key1 = `${city1}-${city2}`;
  const key2 = `${city2}-${city1}`;
  return DISTANCES[key1] || DISTANCES[key2] || Math.floor(3000 + Math.random() * 10000);
}

function getTimeInTimezone(tz: string): { time: string; hour: number; isDay: boolean } {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const hour = parseInt(now.toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", hour12: false }));
    return { time: timeStr, hour, isDay: hour >= 6 && hour < 18 };
  } catch {
    return { time: "--:--", hour: 12, isDay: true };
  }
}

export default function DistanceCounter() {
  const [city1Idx, setCity1Idx] = useState(0);
  const [city2Idx, setCity2Idx] = useState(1);
  const [showPicker, setShowPicker] = useState<"1" | "2" | null>(null);
  const [time1, setTime1] = useState(getTimeInTimezone(CITIES[0].timezone));
  const [time2, setTime2] = useState(getTimeInTimezone(CITIES[1].timezone));
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTime1(getTimeInTimezone(CITIES[city1Idx].timezone));
      setTime2(getTimeInTimezone(CITIES[city2Idx].timezone));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [city1Idx, city2Idx]);

  const c1 = CITIES[city1Idx];
  const c2 = CITIES[city2Idx];
  const distance = getDistance(c1.name, c2.name);

  return (
    <div className="glass-card rounded-3xl p-6">
      <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
        <span className="text-xl">🌍</span> Miles Apart
      </h3>

      <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center mb-4">
        {/* City 1 */}
        <button
          onClick={() => setShowPicker(showPicker === "1" ? null : "1")}
          className="text-center bg-white/60 rounded-2xl p-4 hover:bg-white/80 transition-colors relative"
        >
          <div className="text-3xl mb-1">{c1.emoji}</div>
          <div className="font-bold text-gray-700 text-sm">{c1.name}</div>
          <div className="text-xs text-gray-400">{c1.country}</div>
          <div className="mt-2 font-bold text-gray-600 text-lg">
            {time1.isDay ? "☀️" : "🌙"} {time1.time}
          </div>
        </button>

        {/* Connection */}
        <div className="flex flex-col items-center gap-1">
          <Heart className="w-4 h-4 text-pink-400 animate-heartbeat" fill="currentColor" />
          <div className="handwriting text-pink-400 text-sm font-bold whitespace-nowrap">
            {distance.toLocaleString()} km
          </div>
          <Heart className="w-4 h-4 text-pink-400 animate-heartbeat" fill="currentColor" />
        </div>

        {/* City 2 */}
        <button
          onClick={() => setShowPicker(showPicker === "2" ? null : "2")}
          className="text-center bg-white/60 rounded-2xl p-4 hover:bg-white/80 transition-colors relative"
        >
          <div className="text-3xl mb-1">{c2.emoji}</div>
          <div className="font-bold text-gray-700 text-sm">{c2.name}</div>
          <div className="text-xs text-gray-400">{c2.country}</div>
          <div className="mt-2 font-bold text-gray-600 text-lg">
            {time2.isDay ? "☀️" : "🌙"} {time2.time}
          </div>
        </button>
      </div>

      {/* Message */}
      <div className="text-center bg-pink-50 rounded-2xl py-3 px-4">
        <p className="handwriting text-lg text-gray-500">
          {time1.isDay !== time2.isDay
            ? `It's ${time1.isDay ? "daytime" : "nighttime"} for you, but we're still spending time together 🌙☀️`
            : `${distance.toLocaleString()} km apart, but 1 heart close 💕`}
        </p>
      </div>

      {/* City Picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4"
          >
            <div className="bg-white/60 rounded-2xl p-3 grid grid-cols-4 gap-2">
              {CITIES.map((city, i) => (
                <button
                  key={city.name}
                  onClick={() => {
                    if (showPicker === "1") setCity1Idx(i);
                    else setCity2Idx(i);
                    setShowPicker(null);
                  }}
                  className={`p-2 rounded-xl text-center transition-all text-xs ${
                    (showPicker === "1" ? i === city1Idx : i === city2Idx)
                      ? "bg-pink-100 ring-2 ring-pink-400"
                      : "bg-white/60 hover:bg-pink-50"
                  }`}
                >
                  <div className="text-lg">{city.emoji}</div>
                  <div className="font-bold text-gray-600">{city.name}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Heart(props: React.SVGProps<SVGSVGElement> & { fill?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
