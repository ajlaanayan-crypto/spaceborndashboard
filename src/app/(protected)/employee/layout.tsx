"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const { role, loading, canAccessRoute } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!canAccessRoute("/employee")) {
                if (role === "intern") router.push("/intern");
                else router.push("/");
            }
        }
    }, [role, loading, router, canAccessRoute]);

    if (loading) return (
        <div className="h-full w-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    );

    if (!canAccessRoute("/employee")) return null;

    return <>{children}</>;
}
