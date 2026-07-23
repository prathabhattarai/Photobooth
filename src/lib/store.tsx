"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  Memory,
  FrameType,
  PhotoEditorState,
  PlacedSticker,
} from "./types";
import { getUser, isLoggedIn, logout as apiLogout, getMemories, deleteMemory as apiDeleteMemory, saveMemory } from "./api";

interface AppState {
  user: { id: string; name: string; email: string; avatar: string } | null;
  isAuthenticated: boolean;
  currentRoomCode: string | null;
  memories: Memory[];
  editorState: PhotoEditorState;
  collagePhotos: string[];
  setUser: (user: { id: string; name: string; email: string; avatar: string } | null) => void;
  setCurrentRoomCode: (code: string | null) => void;
  loadMemories: (roomCode: string) => Promise<void>;
  addMemory: (memory: Memory) => void;
  deleteMemoryById: (id: string) => Promise<void>;
  saveMemoryToAPI: (roomCode: string, imageUrl: string, caption: string, frameType: string) => Promise<void>;
  updateEditorState: (update: Partial<PhotoEditorState>) => void;
  addSticker: (sticker: PlacedSticker) => void;
  removeSticker: (id: string) => void;
  resetEditor: () => void;
  setCollagePhotos: (photos: string[]) => void;
  logout: () => void;
}

const defaultEditorState: PhotoEditorState = {
  selectedFrame: "polaroid",
  stickers: [],
  text: "",
  caption: "",
  date: new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  filter: "none",
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<{ id: string; name: string; email: string; avatar: string } | null>(null);
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [editorState, setEditorState] = useState<PhotoEditorState>({
    ...defaultEditorState,
  });
  const [collagePhotos, setCollagePhotosState] = useState<string[]>([]);

  useEffect(() => {
    if (isLoggedIn()) {
      const u = getUser();
      setUserState(u);
    }
  }, []);

  const setUser = useCallback((u: { id: string; name: string; email: string; avatar: string } | null) => {
    setUserState(u);
  }, []);

  const loadMemories = useCallback(async (roomCode: string) => {
    try {
      const data = await getMemories(roomCode);
      const mapped: Memory[] = data.map((m: Record<string, string>) => ({
        id: m.id,
        roomId: m.room_id,
        imageUrl: m.image_url,
        caption: m.caption,
        frameType: m.frame_type as FrameType,
        createdAt: m.created_at,
      }));
      setMemories(mapped);
    } catch {
      // silently fail if API not available
    }
  }, []);

  const addMemory = useCallback((memory: Memory) => {
    setMemories((prev) => [memory, ...prev]);
  }, []);

  const deleteMemoryById = useCallback(async (id: string) => {
    try {
      await apiDeleteMemory(id);
    } catch {}
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const saveMemoryToAPI = useCallback(async (roomCode: string, imageUrl: string, caption: string, frameType: string) => {
    try {
      const data = await saveMemory(roomCode, imageUrl, caption, frameType);
      const newMem: Memory = {
        id: data.id,
        roomId: data.room_id,
        imageUrl: data.image_url,
        caption: data.caption,
        frameType: data.frame_type as FrameType,
        createdAt: data.created_at,
      };
      setMemories((prev) => [newMem, ...prev]);
    } catch {
      // fallback: add locally
      const local: Memory = {
        id: `local-${Date.now()}`,
        roomId: roomCode,
        imageUrl,
        caption,
        frameType: frameType as FrameType,
        createdAt: new Date().toISOString(),
      };
      setMemories((prev) => [local, ...prev]);
    }
  }, []);

  const updateEditorState = useCallback((update: Partial<PhotoEditorState>) => {
    setEditorState((prev) => ({ ...prev, ...update }));
  }, []);

  const addSticker = useCallback((sticker: PlacedSticker) => {
    setEditorState((prev) => ({
      ...prev,
      stickers: [...prev.stickers, sticker],
    }));
  }, []);

  const removeSticker = useCallback((id: string) => {
    setEditorState((prev) => ({
      ...prev,
      stickers: prev.stickers.filter((s) => s.id !== id),
    }));
  }, []);

  const resetEditor = useCallback(() => {
    setEditorState({ ...defaultEditorState });
  }, []);

  const setCollagePhotos = useCallback((photos: string[]) => {
    setCollagePhotosState(photos);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUserState(null);
    setCurrentRoomCode(null);
    setMemories([]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        currentRoomCode,
        memories,
        editorState,
        collagePhotos,
        setUser,
        setCurrentRoomCode,
        loadMemories,
        addMemory,
        deleteMemoryById,
        saveMemoryToAPI,
        updateEditorState,
        addSticker,
        removeSticker,
        resetEditor,
        setCollagePhotos,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
