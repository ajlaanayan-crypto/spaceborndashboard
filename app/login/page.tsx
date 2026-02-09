'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { login } from '../../lib/auth'; // Using our auth wrapper
import { toast } from 'sonner';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login({ email, password });
            toast.success('Welcome back, Commander!');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                            Spaceborn
                        </h1>
                        <p className="text-zinc-500 text-sm mt-2">Enter your credentials to access the command center</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-400 ml-1">EMAIL ADDRESS</label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600 group-hover:border-zinc-700"
                                    placeholder="admin@spaceborn.io"
                                    required
                                />
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-400 ml-1">PASSWORD</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600 group-hover:border-zinc-700"
                                    placeholder="••••••••"
                                    required
                                />
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full group relative flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl font-semibold hover:bg-zinc-200 transition-all shadow-lg shadow-white/10 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
                        <p className="text-xs text-zinc-500">
                            Don't have an admin account? <a href="/setup" className="text-indigo-400 hover:text-indigo-300">Run Setup</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
