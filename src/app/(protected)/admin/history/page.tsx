"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { getRecentLogins, LoginLog } from "@/services/auditService";
import { format } from "date-fns";
import { Loader2, Search, ArrowLeft } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useRouter } from "next/navigation";

export default function LoginHistoryPage() {
    const [logs, setLogs] = useState<LoginLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getRecentLogins(200); // Fetch more logs for full page
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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Login History</h1>
                    <p className="text-gray-400">Detailed audit log of user access.</p>
                </div>
            </div>

            <GlassCard>
                <div className="flex items-center gap-2 mb-6 bg-white/5 p-3 rounded-xl border border-white/10">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or role..."
                        className="bg-transparent border-none focus:outline-none text-white w-full placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-sm">
                                <th className="p-4">User</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Platform</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-12">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-12 text-gray-500">
                                        No login records found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <UserAvatar name={log.userName} photoURL={log.userPhoto} size="small" />
                                                <div>
                                                    <p className="text-white font-medium">{log.userName}</p>
                                                    <p className="text-xs text-gray-400">{log.userEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs capitalize ${log.role === 'admin' ? 'bg-red-500/10 text-red-400' :
                                                log.role === 'core_employee' ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-green-500/10 text-green-400'
                                                }`}>
                                                {(log.role || 'user').replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-white text-sm font-mono">
                                            {log.timestamp ? format(log.timestamp.toDate(), "hh:mm a") : "-"}
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {log.timestamp ? format(log.timestamp.toDate(), "MMM d, yyyy") : "-"}
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm max-w-[200px] truncate" title={log.userAgent}>
                                            {log.userAgent || "Unknown"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
