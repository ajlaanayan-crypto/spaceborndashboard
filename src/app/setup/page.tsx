"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";

export default function SetupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Create Admin Record in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                name: name,
                role: "admin",
                status: "active",
                createdAt: new Date().toISOString(),
                createdBy: "system_setup"
            });

            // 3. Redirect to Admin Panel
            router.push("/admin");
        } catch (err: any) {
            console.error("Setup error:", err);
            
            // Better error messages
            if (err.code === "auth/email-already-in-use") {
                setError("This email is already registered.");
            } else if (err.code === "auth/weak-password") {
                setError("Password must be at least 6 characters.");
            } else if (err.code === "auth/invalid-email") {
                setError("Invalid email format.");
            } else {
                setError(err.message || "Setup failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B0E14] p-4">
            <GlassCard className="w-full max-w-md border-red-500/30">
                <div className="flex flex-col items-center mb-6">
                    <div className="p-3 bg-red-500/20 rounded-full mb-4">
                        <Shield className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">System Override</h1>
                    <p className="text-red-400 text-sm mt-1">For Initial Bootstrap Only</p>
                </div>

                <form onSubmit={handleSetup} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Admin Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-red-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-red-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-red-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initialize Admin Access"}
                    </button>
                </form>
            </GlassCard>
        </div>
    );
}
