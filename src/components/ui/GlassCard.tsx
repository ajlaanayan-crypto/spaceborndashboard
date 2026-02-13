import { cn } from "@/lib/utils";

export function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("glass rounded-xl p-4 md:p-6 border border-white/5 shadow-xl backdrop-blur-md", className)}>
            {children}
        </div>
    );
}
