export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;
}

export interface Room {
  id: string;
  roomCode: string;
  createdBy: string;
  createdAt: string;
  members: RoomMember[];
}

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  user?: User;
  joinedAt: string;
}

export interface Memory {
  id: string;
  roomId: string;
  imageUrl: string;
  caption: string;
  frameType: FrameType;
  createdAt: string;
}

export type FrameType =
  | "pink-heart"
  | "scrapbook"
  | "miles-apart"
  | "cloud-stars"
  | "bear-bunny"
  | "love-letter"
  | "polaroid"
  | "photobooth-strip"
  | "same-moment";

export interface Frame {
  id: FrameType;
  name: string;
  emoji: string;
  description: string;
}

export type FrameLayoutType = "1x4" | "2x2";

export interface FrameLayout {
  id: FrameLayoutType;
  name: string;
  description: string;
  slots: number;
}

export interface Sticker {
  id: string;
  emoji: string;
  label: string;
  category: "hearts" | "stars" | "bows" | "flowers" | "cute" | "love" | "nature";
}

export interface PhotoEditorState {
  selectedFrame: FrameType;
  stickers: PlacedSticker[];
  text: string;
  caption: string;
  date: string;
  filter: string;
}

export interface PlacedSticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
}
