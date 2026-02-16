"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getRecentLogins, LoginLog } from "@/services/auditService";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ExternalLink, Clock } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { LoginHistoryModal } from "@/components/admin/LoginHistoryModal";

export function LoginAnalyticsWidget() {
    const [logins, setLogins] = useState<LoginLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const fetchLogins = async () => {
            try {
                const data = await getRecentLogins(5);
                setLogins(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogins();
    }, []);

    return (
        <GlassCard className="h-full min-h-[350px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Recent Logins</h3>
                <Clock className="w-5 h-5 text-blue-400" />
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
            ) : logins.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 italic">
                    No login activity recorded yet.
                </div>
            ) : (
                <div className="space-y-3 flex-1 overflow-y-auto">
                    {logins.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors gap-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <UserAvatar name={log.userName} photoURL={log.userPhoto} size="small" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-white text-sm font-medium truncate">{log.userName}</p>
                                    <p className="text-xs text-gray-400 truncate capitalize">{log.role?.replace('_', ' ') || 'User'}</p>
                                </div>
                            </div>
                            <div className="text-right whitespace-nowrap shrink-0">
                                <p className="text-xs text-gray-400">
                                    {log.timestamp ? formatDistanceToNow(log.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4 pt-3 border-t border-white/10">
                <button
                    onClick={() => window.location.href = "/admin/history"}
                    className="w-full py-2 text-sm text-center text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-2"
                >
                    View All History <ExternalLink className="w-3 h-3" />
                </button>
            </div>
        </GlassCard>
    );
}
