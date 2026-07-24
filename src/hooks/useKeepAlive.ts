"use client";

import { useEffect, useRef } from "react";

const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

export function useKeepAlive() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const ping = async () => {
      try {
        await fetch("/api/health", { method: "GET" });
      } catch {}
    };

    timerRef.current = setInterval(ping, PING_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
}
