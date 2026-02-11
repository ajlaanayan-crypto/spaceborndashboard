"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { createSession } from "@/services/sessionService";
import { logAction } from "@/services/auditService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check role in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        setError("User record not found. Contact Admin.");
        await signOut(auth);
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const role = userData.role;

      if (userData.status === "inactive") {
        setError("Account is deactivated.");
        await signOut(auth);
        setLoading(false);
        return;
      }

      // Create Session
      const sessionId = await createSession(user.uid, navigator.userAgent);
      if (sessionId) {
        localStorage.setItem("spaceborn_session_id", sessionId);
      } else {
        console.warn("Session creation failed, proceeding with login");
      }

      // Redirect based on role
      switch (role) {
        case "admin":
          router.push("/admin");
          break;
        case "core_employee":
          router.push("/core");
          break;
        case "normal_employee":
          router.push("/employee");
          break;
        case "intern":
          router.push("/intern");
          break;
        default:
          console.error("Unknown role:", role);
          await signOut(auth);
          setError("Unauthorized role configuration.");
          return;
      }
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Better error messages
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Try again later.");
      } else {
        setError("Authentication failed. Please try again.");
      }

      // Log failed attempt
      try {
        await logAction({
          action: "LOGIN_FAILED",
          performedBy: "unknown",
          targetType: "auth",
          details: { email, error: err.message, userAgent: navigator.userAgent }
        });
      } catch (auditError) {
        console.error("Failed to log audit:", auditError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-transparent overflow-hidden relative">
      {/* Background Ambience - Monochrome - REMOVED for global starfield */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 backdrop-blur-xl bg-black/40 border border-white/10 p-8 rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.05)]"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="mb-6">
            <Image
              src="/images/logo.jpg"
              alt="SPACE BORN"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight font-montserrat bg-gradient-to-b from-gray-200 to-gray-400 bg-clip-text text-transparent text-center">
            SPACE BORN
          </h1>
          <p className="text-gray-500 text-sm mt-3 uppercase tracking-widest">Authorized Access Only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Identity</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-700 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all"
              placeholder="officer@spaceborn.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Security Key</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-700 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3.5 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authenticate"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-600 font-mono">
            SECURE CONNECTION // ENCRYPTED
            <br />
            V 1.0.0
          </p>
        </div>
      </motion.div>
    </div>
  );
}
