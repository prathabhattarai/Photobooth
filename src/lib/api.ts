const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("tf_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || "API error");
  }
  return res.json();
}

export async function register(name: string, email: string, password: string, avatar: string) {
  const data = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, avatar }),
  });
  if (typeof window !== "undefined") {
    localStorage.setItem("tf_token", data.access_token);
    localStorage.setItem("tf_user", JSON.stringify(data.user));
  }
  return data;
}

export async function login(email: string, password: string) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (typeof window !== "undefined") {
    localStorage.setItem("tf_token", data.access_token);
    localStorage.setItem("tf_user", JSON.stringify(data.user));
  }
  return data;
}

export async function createRoom(name: string, avatar: string) {
  return request("/rooms/create", {
    method: "POST",
    body: JSON.stringify({ name, avatar }),
  });
}

export async function joinRoom(roomCode: string, name: string, avatar: string) {
  return request("/rooms/join", {
    method: "POST",
    body: JSON.stringify({ room_code: roomCode, name, avatar }),
  });
}

export async function getRoom(roomCode: string) {
  return request(`/rooms/${roomCode}`);
}

export async function saveMemory(roomCode: string, imageUrl: string, caption: string, frameType: string) {
  return request(`/memories?room_code=${roomCode}`, {
    method: "POST",
    body: JSON.stringify({ image_url: imageUrl, caption, frame_type: frameType }),
  });
}

export async function getMemories(roomCode: string) {
  return request(`/memories/${roomCode}`);
}

export async function deleteMemory(memoryId: string) {
  return request(`/memories/${memoryId}`, { method: "DELETE" });
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tf_token");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const u = localStorage.getItem("tf_user");
  return u ? JSON.parse(u) : null;
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("tf_token");
  localStorage.removeItem("tf_user");
}

export function isLoggedIn() {
  return !!getToken();
}
