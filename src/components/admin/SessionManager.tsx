"use client";

import { useEffect, useState } from "react";
import { getActiveSessions, endSession, SessionData } from "@/services/sessionService";
import { Smartphone, Monitor, ShieldAlert, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SessionManagerProps {
    userId: string;
    userName: string;
}

export function SessionManager({ userId, userName }: SessionManagerProps) {
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const data = await getActiveSessions(userId);
            setSessions(data);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [userId]);

    const handleRevoke = async (sessionId: string) => {
        if (!confirm("Are you sure you want to revoke this session? The user will be logged out.")) return;
        await endSession(sessionId, userId);
        fetchSessions();
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-400" />
                Active Sessions for {userName}
            </h3>

            {loading ? (
                <p className="text-gray-500">Scanning active links...</p>
            ) : sessions.length === 0 ? (
                <p className="text-gray-500 italic">No active sessions found.</p>
            ) : (
                <div className="space-y-3">
                    {sessions.map(session => (
                        <div key={session.id} className="p-3 bg-white/5 border border-white/5 rounded-lg flex items-center justify-between group hover:border-red-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                    {session.deviceInfo.toLowerCase().includes("mobile") ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium truncate max-w-[200px]" title={session.deviceInfo}>
                                        {session.deviceInfo}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                        <span className="font-mono">{session.ipAddress}</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {session.lastActive?.toDate ? formatDistanceToNow(session.lastActive.toDate(), { addSuffix: true }) : 'Just now'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleRevoke(session.id!)}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                title="Revoke Session"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
