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
  UserPlus,
  Mail,
  Lock,
  User,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useApp } from "@/lib/store";
import FloatingElements from "@/components/ui/FloatingElements";
import AvatarUploader from "@/components/ui/AvatarUploader";
import * as api from "@/lib/api";

type Step = "choose" | "create" | "join" | "created" | "signin" | "signup";

export default function RoomPage() {
  const router = useRouter();
  const { user, setUser, setCurrentRoomCode, setPartnerAvatar, logout } = useApp();
  const [step, setStep] = useState<Step>(user ? "choose" : "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(user?.avatar || null);
  const [partnerAvatarInput, setPartnerAvatarInput] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const saveGuestUser = (avatar: string, guestName: string) => {
    const guest = { id: `guest-${Date.now()}`, name: guestName, email: "", avatar };
    setUser(guest);
    if (typeof window !== "undefined") localStorage.setItem("tf_user", JSON.stringify(guest));
  };

  const savePartnerAvatar = () => {
    if (partnerAvatarInput) setPartnerAvatar(partnerAvatarInput);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    const avatarUrl = selectedAvatar || "";
    try {
      const data = await api.createRoom(name, avatarUrl);
      setGeneratedCode(data.room_code);
      setCurrentRoomCode(data.room_code);
      savePartnerAvatar();
      if (avatarUrl && !api.isLoggedIn()) saveGuestUser(avatarUrl, name);
      setStep("created");
    } catch {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      setGeneratedCode(code);
      setCurrentRoomCode(code);
      savePartnerAvatar();
      if (avatarUrl && !api.isLoggedIn()) saveGuestUser(avatarUrl, name);
      setStep("created");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim() || !roomCode.trim()) return;
    setLoading(true);
    setError("");
    const avatarUrl = selectedAvatar || "";
    try {
      const data = await api.joinRoom(roomCode, name, avatarUrl);
      setCurrentRoomCode(data.room_code || roomCode.toUpperCase());
      savePartnerAvatar();
      if (avatarUrl && !api.isLoggedIn()) saveGuestUser(avatarUrl, name);
    } catch {
      setCurrentRoomCode(roomCode.toUpperCase());
      savePartnerAvatar();
      if (avatarUrl && !api.isLoggedIn()) saveGuestUser(avatarUrl, name);
    } finally {
      setLoading(false);
      router.push("/booth");
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.login(email, password);
      const u = api.getUser();
      setUser(u);
      savePartnerAvatar();
      setStep("choose");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.register(name, email, password, selectedAvatar || "");
      const u = api.getUser();
      setUser(u);
      savePartnerAvatar();
      setStep("choose");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logout();
    setSelectedAvatar(null);
    setName("");
    setEmail("");
    setPassword("");
    setStep("choose");
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingElements />
      <div className="relative z-10 max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="w-10 h-10 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center transition-colors pastel-shadow">
                <ArrowLeft className="w-5 h-5 text-warm-gray-400" />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" fill="currentColor" />
              <span className="font-serif font-bold text-warm-gray-700">TogetherFrame</span>
            </div>
          </div>

          {/* Auth buttons in header */}
          {user ? (
            <div className="flex items-center gap-2">
              {user.avatar && (
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gold/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.avatar} alt="You" className="w-full h-full object-cover" />
                </div>
              )}
              <span className="text-xs font-medium text-warm-gray-500 hidden sm:inline">{user.name}</span>
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-full bg-white/60 hover:bg-rose-50 flex items-center justify-center transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5 text-warm-gray-400" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setStep("signin"); setError(""); setEmail(""); setPassword(""); }}
                className="px-4 py-2 rounded-full text-sm font-medium text-warm-gray-500 hover:text-rose-500 hover:bg-rose-50 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => { setStep("signup"); setError(""); setName(""); setEmail(""); setPassword(""); setSelectedAvatar(null); }}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
              >
                Sign Up
              </button>
            </div>
          )}
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-50 border border-rose-200/50 text-rose-600 text-sm rounded-xl px-4 py-3 mb-4 text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ==================== CHOOSE STEP ==================== */}
          {step === "choose" && (
            <motion.div key="choose" {...pageVariants}>
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-warm-gray-800 mb-3">
                  {user ? `Welcome back, ${user.name}` : "Start Together"}
                </h1>
                <p className="text-warm-gray-400">
                  {user
                    ? "Create a new room or join your partner"
                    : "A private photobooth for you two"}
                </p>
                <div className="w-12 h-px bg-gold/40 mx-auto mt-4" />
              </div>

              <div className="space-y-4">
                {/* Create Room Card */}
                <button
                  onClick={() => setStep("create")}
                  className="w-full glass-card rounded-2xl p-6 text-left group hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-bold text-warm-gray-800 text-lg mb-1">
                        Create a Room
                      </h3>
                      <p className="text-sm text-warm-gray-400">
                        Start a new space and share the code with your partner
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-warm-gray-300 group-hover:text-rose-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </button>

                {/* Join Room Card */}
                <button
                  onClick={() => setStep("join")}
                  className="w-full glass-card rounded-2xl p-6 text-left group hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lavender-400 to-lavender-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-bold text-warm-gray-800 text-lg mb-1">
                        Join a Room
                      </h3>
                      <p className="text-sm text-warm-gray-400">
                        Enter the code your partner shared with you
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-warm-gray-300 group-hover:text-lavender-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================== SIGN IN ==================== */}
          {step === "signin" && (
            <motion.div key="signin" {...pageVariants}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif font-bold text-warm-gray-800 mb-2">
                  Welcome Back
                </h1>
                <p className="text-warm-gray-400 text-sm">
                  Sign in to your account
                </p>
                <div className="w-12 h-px bg-gold/40 mx-auto mt-4" />
              </div>

              <div className="glass-card rounded-2xl p-8">
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
                    autoFocus
                  />
                </div>

                <div className="mb-8">
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

                <button
                  onClick={handleSignIn}
                  disabled={loading || !email.trim() || !password.trim()}
                  className="cute-button w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </span>
                  )}
                </button>

                <div className="text-center mt-5 pt-4 border-t border-warm-gray-100">
                  <p className="text-sm text-warm-gray-400">
                    Don&apos;t have an account?{" "}
                    <button
                      onClick={() => { setStep("signup"); setError(""); setName(""); setEmail(""); setPassword(""); setSelectedAvatar(null); }}
                      className="text-rose-500 font-medium hover:text-rose-600 transition-colors"
                    >
                      Sign up
                    </button>
                  </p>
                </div>

                <div className="text-center mt-3">
                  <button
                    onClick={() => { setStep("choose"); setError(""); }}
                    className="text-sm text-warm-gray-400 hover:text-warm-gray-600 transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== SIGN UP ==================== */}
          {step === "signup" && (
            <motion.div key="signup" {...pageVariants}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif font-bold text-warm-gray-800 mb-2">
                  Create Account
                </h1>
                <p className="text-warm-gray-400 text-sm">
                  Save your memories across sessions
                </p>
                <div className="w-12 h-px bg-gold/40 mx-auto mt-4" />
              </div>

              <div className="glass-card rounded-2xl p-8">
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
                    autoFocus
                  />
                </div>

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

                <div className="mb-8 flex justify-center">
                  <AvatarUploader
                    value={selectedAvatar}
                    onChange={(img) => setSelectedAvatar(img)}
                    size="lg"
                    label="Your Photo"
                  />
                </div>

                <button
                  onClick={handleSignUp}
                  disabled={loading || !name.trim() || !email.trim() || !password.trim()}
                  className="cute-button w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Create Account
                    </span>
                  )}
                </button>

                <div className="text-center mt-5 pt-4 border-t border-warm-gray-100">
                  <p className="text-sm text-warm-gray-400">
                    Already have an account?{" "}
                    <button
                      onClick={() => { setStep("signin"); setError(""); setEmail(""); setPassword(""); }}
                      className="text-rose-500 font-medium hover:text-rose-600 transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                </div>

                <div className="text-center mt-3">
                  <button
                    onClick={() => { setStep("choose"); setError(""); }}
                    className="text-sm text-warm-gray-400 hover:text-warm-gray-600 transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== CREATE ROOM ==================== */}
          {step === "create" && (
            <motion.div key="create" {...pageVariants}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif font-bold text-warm-gray-800 mb-2">
                  Your Private Room
                </h1>
                <p className="text-warm-gray-400 text-sm">
                  Set up your space — your partner will join with a code
                </p>
                <div className="w-12 h-px bg-gold/40 mx-auto mt-4" />
              </div>

              <div className="glass-card rounded-2xl p-8">
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
                    autoFocus
                  />
                </div>

                <div className="flex justify-center gap-8 mb-8">
                  <AvatarUploader
                    value={selectedAvatar}
                    onChange={(img) => setSelectedAvatar(img)}
                    size="lg"
                    label="Your Photo"
                  />
                  <AvatarUploader
                    value={partnerAvatarInput}
                    onChange={(img) => setPartnerAvatarInput(img)}
                    size="lg"
                    label="Partner's Photo"
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

                <div className="text-center mt-5 pt-4 border-t border-warm-gray-100">
                  <button
                    onClick={() => { setStep("choose"); setError(""); }}
                    className="text-sm text-warm-gray-400 hover:text-warm-gray-600 transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== JOIN ROOM ==================== */}
          {step === "join" && (
            <motion.div key="join" {...pageVariants}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif font-bold text-warm-gray-800 mb-2">
                  Join Your Partner
                </h1>
                <p className="text-warm-gray-400 text-sm">
                  Enter the code your partner shared with you
                </p>
                <div className="w-12 h-px bg-gold/40 mx-auto mt-4" />
              </div>

              <div className="glass-card rounded-2xl p-8">
                <div className="mb-6">
                  <label className="block text-xs font-medium text-warm-gray-500 mb-2 tracking-wide uppercase text-center">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ABCDEF"
                    className="cute-input text-center text-2xl tracking-[0.3em] font-serif font-bold uppercase"
                    maxLength={6}
                    autoFocus
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
                    value={selectedAvatar}
                    onChange={(img) => setSelectedAvatar(img)}
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

                <div className="text-center mt-5 pt-4 border-t border-warm-gray-100">
                  <button
                    onClick={() => { setStep("choose"); setError(""); }}
                    className="text-sm text-warm-gray-400 hover:text-warm-gray-600 transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== ROOM CREATED ==================== */}
          {step === "created" && (
            <motion.div key="created" {...pageVariants}>
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center mx-auto mb-5">
                  <Heart className="w-10 h-10 text-rose-400" fill="currentColor" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-warm-gray-800 mb-2">
                  Your Room Is Ready
                </h1>
                <p className="text-warm-gray-400 text-sm">
                  Share this code with your partner
                </p>
              </div>

              <div className="glass-card rounded-2xl p-8">
                <div className="bg-white/80 rounded-2xl p-8 mb-6 pastel-shadow border border-gold/10 text-center">
                  <p className="text-xs font-medium text-warm-gray-400 uppercase tracking-widest mb-4">
                    Room Code
                  </p>
                  <div className="font-serif text-5xl font-bold text-warm-gray-700 tracking-[0.25em] mb-4">
                    {generatedCode}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-sm font-medium text-rose-500 transition-colors"
                  >
                    {copied ? (
                      <><Check className="w-4 h-4" /> Copied!</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copy Code</>
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
                  <span className="flex items-center justify-center gap-2">
                    Enter Your Space
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>

                <div className="text-center mt-5 pt-4 border-t border-warm-gray-100">
                  <button
                    onClick={() => { setStep("choose"); setError(""); }}
                    className="text-sm text-warm-gray-400 hover:text-warm-gray-600 transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
