"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Users,
  Heart,
  Copy,
  Check,
  LogIn,
  Mail,
  Lock,
  User,
} from "lucide-react";
import { useApp } from "@/lib/store";
import FloatingElements from "@/components/ui/FloatingElements";
import AvatarUploader from "@/components/ui/AvatarUploader";
import * as api from "@/lib/api";

type View = "auth" | "create" | "join";

export default function RoomPage() {
  const router = useRouter();
  const { user, setUser, setCurrentRoomCode } = useApp();
  const [view, setView] = useState<View>(user ? "create" : "auth");
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("bear");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      if (authTab === "register") {
        await api.register(name, email, password, selectedAvatar);
      } else {
        await api.login(email, password);
      }
      const u = api.getUser();
      setUser(u);
      setView("create");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.createRoom(name, selectedAvatar);
      setGeneratedCode(data.room_code);
      setCurrentRoomCode(data.room_code);
      setIsCreated(true);
    } catch {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      setGeneratedCode(code);
      setCurrentRoomCode(code);
      setIsCreated(true);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim() || !roomCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.joinRoom(roomCode, name, selectedAvatar);
      setCurrentRoomCode(data.room_code || roomCode.toUpperCase());
    } catch {
      setCurrentRoomCode(roomCode.toUpperCase());
    } finally {
      setLoading(false);
      router.push("/booth");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingElements />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-10"
        >
          <Link href="/">
            <button className="w-10 h-10 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center transition-colors pastel-shadow">
              <ArrowLeft className="w-5 h-5 text-warm-gray-400" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" fill="currentColor" />
            <span className="font-serif font-bold text-warm-gray-700">TogetherFrame</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-warm-gray-800 mb-3">
            {view === "auth" ? "Welcome" : view === "create" ? "Your Private Room" : "Join Your Partner"}
          </h1>
          <p className="text-warm-gray-400">
            {view === "auth"
              ? "Sign in to preserve your memories, or continue without an account"
              : view === "create"
              ? "A space that belongs only to you two"
              : "Enter the code your partner shared with you"}
          </p>
          <div className="w-12 h-px bg-gold/40 mx-auto mt-4" />
        </motion.div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200/50 text-rose-600 text-sm rounded-xl px-4 py-3 mb-4 text-center">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Auth View */}
          {view === "auth" && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="flex gap-1 p-1 bg-white/50 rounded-xl mb-6 pastel-shadow">
                {(["login", "register"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setAuthTab(t); setError(""); }}
                    className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      authTab === t
                        ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md"
                        : "text-warm-gray-400 hover:text-warm-gray-600"
                    }`}
                  >
                    {t === "login" ? (
                      <><LogIn className="w-4 h-4" /> Sign In</>
                    ) : (
                      <><Plus className="w-4 h-4" /> Create Account</>
                    )}
                  </button>
                ))}
              </div>

              <div className="glass-card rounded-2xl p-8">
                {authTab === "register" && (
                  <div className="mb-5">
                    <label className="block text-xs font-medium text-warm-gray-500 mb-2 tracking-wide uppercase">
                      <User className="w-3.5 h-3.5 inline mr-1.5" /> Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="What should we call you?"
                      className="cute-input"
                      maxLength={20}
                    />
                  </div>
                )}

                <div className="mb-5">
                  <label className="block text-xs font-medium text-warm-gray-500 mb-2 tracking-wide uppercase">
                    <Mail className="w-3.5 h-3.5 inline mr-1.5" /> Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="cute-input"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-medium text-warm-gray-500 mb-2 tracking-wide uppercase">
                    <Lock className="w-3.5 h-3.5 inline mr-1.5" /> Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="cute-input"
                  />
                </div>

                {authTab === "register" && (
                  <div className="mb-8 flex justify-center">
                    <AvatarUploader
                      value={selectedAvatar || null}
                      onChange={(img) => setSelectedAvatar(img || "")}
                      size="lg"
                      label="Your Photo"
                    />
                  </div>
                )}

                <button
                  onClick={handleAuth}
                  disabled={loading || !email.trim() || !password.trim() || (authTab === "register" && !name.trim())}
                  className="cute-button w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Please wait...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {authTab === "login" ? <LogIn className="w-4 h-4" /> : <Heart className="w-4 h-4" fill="currentColor" />}
                      {authTab === "login" ? "Sign In" : "Create Account"}
                    </span>
                  )}
                </button>

                <div className="text-center mt-6 text-sm text-warm-gray-400">
                  {authTab === "login" ? (
                    <>Don&apos;t have an account?{" "}
                      <button onClick={() => { setAuthTab("register"); setError(""); }} className="text-rose-500 font-medium hover:text-rose-600 transition-colors">
                        Create one
                      </button>
                    </>
                  ) : (
                    <>Already have an account?{" "}
                      <button onClick={() => { setAuthTab("login"); setError(""); }} className="text-rose-500 font-medium hover:text-rose-600 transition-colors">
                        Sign in
                      </button>
                    </>
                  )}
                </div>

                <div className="text-center mt-4 pt-4 border-t border-warm-gray-100">
                  <button
                    onClick={() => setView("create")}
                    className="text-xs text-warm-gray-400 hover:text-warm-gray-500 transition-colors"
                  >
                    Continue without an account →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Room Views */}
          {view !== "auth" && (
            <motion.div
              key="rooms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex gap-1 p-1 bg-white/50 rounded-xl mb-6 pastel-shadow">
                {(["create", "join"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setView(t); setIsCreated(false); setError(""); }}
                    className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      view === t
                        ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md"
                        : "text-warm-gray-400 hover:text-warm-gray-600"
                    }`}
                  >
                    {t === "create" ? (
                      <><Plus className="w-4 h-4" /> Create Room</>
                    ) : (
                      <><Users className="w-4 h-4" /> Join Room</>
                    )}
                  </button>
                ))}
              </div>

              {/* Create Room */}
              {view === "create" && (
                <div className="glass-card rounded-2xl p-8">
                  {!isCreated ? (
                    <>
                      <div className="mb-6">
                        <label className="block text-xs font-medium text-warm-gray-500 mb-2 tracking-wide uppercase">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="What should we call you?"
                          className="cute-input"
                          maxLength={20}
                        />
                      </div>

                      <div className="mb-8 flex justify-center">
                        <AvatarUploader
                          value={selectedAvatar || null}
                          onChange={(img) => setSelectedAvatar(img || "")}
                          size="lg"
                          label="Your Photo"
                        />
                      </div>

                      <button
                        onClick={handleCreate}
                        disabled={!name.trim() || loading}
                        className="cute-button w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Heart className="w-4 h-4" fill="currentColor" />
                            Create Our Room
                          </span>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-5">
                        <Heart className="w-8 h-8 text-rose-400" fill="currentColor" />
                      </div>
                      <h3 className="text-xl font-serif font-bold text-warm-gray-800 mb-2">
                        Your Room Is Ready
                      </h3>
                      <p className="text-warm-gray-400 text-sm mb-8">
                        Share this code with your partner
                      </p>

                      <div className="bg-white/80 rounded-2xl p-6 mb-6 pastel-shadow border border-gold/10">
                        <div className="font-serif text-4xl font-bold text-warm-gray-700 tracking-[0.25em] mb-3">
                          {generatedCode}
                        </div>
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-2 mx-auto text-sm text-warm-gray-400 hover:text-rose-500 transition-colors"
                        >
                          {copied ? (
                            <><Check className="w-4 h-4 text-green-500" /> Copied</>
                          ) : (
                            <><Copy className="w-4 h-4" /> Copy code</>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-sm text-warm-gray-400 mb-8">
                        <span>Waiting for your partner</span>
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          ···
                        </motion.span>
                      </div>

                      <button
                        onClick={() => router.push("/booth")}
                        className="cute-button w-full bg-gradient-to-r from-rose-500 to-burgundy text-white"
                      >
                        Enter Your Space
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Join Room */}
              {view === "join" && (
                <div className="glass-card rounded-2xl p-8">
                  <div className="mb-6">
                    <label className="block text-xs font-medium text-warm-gray-500 mb-2 tracking-wide uppercase">
                      Room Code
                    </label>
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="Enter the 6-letter code"
                      className="cute-input text-center text-xl tracking-[0.2em] font-serif font-bold uppercase"
                      maxLength={6}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-medium text-warm-gray-500 mb-2 tracking-wide uppercase">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="What should we call you?"
                      className="cute-input"
                      maxLength={20}
                    />
                  </div>

                  <div className="mb-8 flex justify-center">
                    <AvatarUploader
                      value={selectedAvatar || null}
                      onChange={(img) => setSelectedAvatar(img || "")}
                      size="lg"
                      label="Your Photo"
                    />
                  </div>

                  <button
                    onClick={handleJoin}
                    disabled={!name.trim() || !roomCode.trim() || loading}
                    className="cute-button w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Joining...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Heart className="w-4 h-4" fill="currentColor" />
                        Join Room
                      </span>
                    )}
                  </button>

                  <div className="text-center mt-8 py-4">
                    <p className="text-warm-gray-400 text-sm italic font-serif">
                      Your partner is one code away
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
