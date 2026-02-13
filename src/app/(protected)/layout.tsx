"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/ui/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { Loader2 } from "lucide-react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/"); // Redirect to root login
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#0B0E14]">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-[#0B0E14]">
            <Sidebar />
            <main className="flex-1 ml-0 md:ml-20 p-4 pt-20 pb-24 md:p-8 md:pt-24 md:pb-8 overflow-y-auto min-h-screen relative z-10 transition-all duration-300">
                {/* Background elements for protected pages */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl pointer-events-none -z-10 opacity-20"></div>
                <div className="absolute bottom-0 left-20 w-[300px] h-[300px] bg-white/5 rounded-full blur-3xl pointer-events-none -z-10 opacity-20"></div>

                <div className="fixed top-4 right-4 md:top-6 md:right-8 z-50">
                    <NotificationBell />
                </div>

                {children}
            </main>
        </div>
    );
}
