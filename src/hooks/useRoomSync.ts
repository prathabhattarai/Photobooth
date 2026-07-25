"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface SyncGalleryItem {
  id: string;
  imageUrl: string;
  caption: string;
  frame: string;
  createdAt: string;
  savedBy: string;
}

interface SyncTimelineActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user: string;
}

export function useRoomSync({
  roomCode,
  userName,
}: {
  roomCode: string;
  userName: string;
}) {
  const [gallery, setGallery] = useState<SyncGalleryItem[]>([]);
  const [timeline, setTimeline] = useState<SyncTimelineActivity[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const peerIdRef = useRef(crypto.randomUUID().slice(0, 8));

  const sendWs = useCallback((data: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, []);

  const addGalleryItem = useCallback(
    (item: SyncGalleryItem) => {
      setGallery((prev) => {
        if (prev.some((g) => g.id === item.id)) return prev;
        return [item, ...prev];
      });
      sendWs({ type: "gallery_add", item, peerId: peerIdRef.current });
    },
    [sendWs]
  );

  const deleteGalleryItem = useCallback(
    (memoryId: string) => {
      setGallery((prev) => prev.filter((g) => g.id !== memoryId));
      sendWs({
        type: "gallery_delete",
        memoryId,
        timestamp: new Date().toISOString(),
        peerId: peerIdRef.current,
      });
    },
    [sendWs]
  );

  const addTimelineActivity = useCallback(
    (activity: SyncTimelineActivity) => {
      setTimeline((prev) => [activity, ...prev]);
      sendWs({ type: "timeline_add", activity, peerId: peerIdRef.current });
    },
    [sendWs]
  );

  useEffect(() => {
    if (!roomCode || !userName || roomCode === "local") return;

    const wsUrl = `wss://togetherframe-backend.onrender.com/ws/${roomCode}/${encodeURIComponent(userName)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === "state_sync") {
        const state = msg.state as Record<string, unknown>;
        if (Array.isArray(state.gallery)) {
          setGallery(state.gallery as SyncGalleryItem[]);
        }
        if (Array.isArray(state.timeline)) {
          setTimeline(state.timeline as SyncTimelineActivity[]);
        }
      }

      if (msg.type === "gallery_add" && msg.peerId !== peerIdRef.current) {
        const item = msg.item as SyncGalleryItem;
        setGallery((prev) => {
          if (prev.some((g) => g.id === item.id)) return prev;
          return [item, ...prev];
        });
        if (msg.activity) {
          const activity = msg.activity as SyncTimelineActivity;
          setTimeline((prev) => [activity, ...prev]);
        }
      }

      if (msg.type === "gallery_delete" && msg.peerId !== peerIdRef.current) {
        const memoryId = msg.memoryId as string;
        setGallery((prev) => prev.filter((g) => g.id !== memoryId));
        if (msg.activity) {
          const activity = msg.activity as SyncTimelineActivity;
          setTimeline((prev) => [activity, ...prev]);
        }
      }

      if (msg.type === "timeline_add" && msg.peerId !== peerIdRef.current) {
        const activity = msg.activity as SyncTimelineActivity;
        setTimeline((prev) => [activity, ...prev]);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [roomCode, userName]);

  return {
    gallery,
    timeline,
    connected,
    addGalleryItem,
    deleteGalleryItem,
    addTimelineActivity,
  };
}

export type { SyncGalleryItem, SyncTimelineActivity };
