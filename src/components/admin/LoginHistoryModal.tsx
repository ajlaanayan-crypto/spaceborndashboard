"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getRecentLogins, LoginLog } from "@/services/auditService";
import { format } from "date-fns";
import { Loader2, X, Search } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface LoginHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginHistoryModal({ isOpen, onClose }: LoginHistoryModalProps) {
    const [logs, setLogs] = useState<LoginLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getRecentLogins(100); // Fetch last 100 logins
            setLogs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <GlassCard className="w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Login History</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex items-center gap-2 mb-4 bg-white/5 p-2 rounded-lg border border-white/10">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="bg-transparent border-none focus:outline-none text-white w-full placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-sm">
                                <th className="p-3">User</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Time</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Platform</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center p-8">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center p-8 text-gray-500">
                                        No logs found.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <UserAvatar name={log.userName} size="small" />
                                                <div>
                                                    <p className="text-white font-medium">{log.userName}</p>
                                                    <p className="text-xs text-gray-400">{log.userEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 rounded text-xs bg-white/10 text-gray-300">
                                                {log.role}
                                            </span>
                                        </td>
                                        <td className="p-3 text-white text-sm">
                                            {log.timestamp ? format(log.timestamp.toDate(), "hh:mm a") : "-"}
                                        </td>
                                        <td className="p-3 text-gray-400 text-sm">
                                            {log.timestamp ? format(log.timestamp.toDate(), "MMM d, yyyy") : "-"}
                                        </td>
                                        <td className="p-3 text-gray-500 text-xs truncate max-w-[150px]" title={log.userAgent}>
                                            {log.userAgent || "Unknown"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                    >
                        Close
                    </button>
                </div>
            </GlassCard>
        </div>
    );
}
