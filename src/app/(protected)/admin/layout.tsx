"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (role !== "admin") {
                // Redirect unauthorized users back to their respective dashboards or login
                if (role === "core_employee") router.push("/core");
                else if (role === "intern") router.push("/intern");
                else router.push("/");
            }
        }
    }, [role, loading, router]);

    if (loading) return (
        <div className="h-full w-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    if (role !== "admin") return null;

    return <>{children}</>;
}
