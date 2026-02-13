import { GlassCard } from "@/components/ui/GlassCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Users, Clock, Activity, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllActiveSessions, getAllSessionsWithFilter, calculateSessionDuration, formatDuration, SessionData } from "@/services/sessionService";
import { getAllUsers, UserData } from "@/services/userService";

interface SessionWithUser extends SessionData {
    userName?: string;
    userEmail?: string;
    userPhotoURL?: string;
}

export function UserActivityWidget() {
    const [activeSessions, setActiveSessions] = useState<SessionWithUser[]>([]);
    const [allSessions, setAllSessions] = useState<SessionWithUser[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
        // Refresh every 30 seconds
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [filter, showModal]); // Add showModal to dependencies

    const loadData = async () => {
        try {
            const [activeSessionsData, usersData] = await Promise.all([
                getAllActiveSessions(),
                getAllUsers()
            ]);

            setUsers(usersData);

            // Enrich sessions with user data
            const enrichedActiveSessions = activeSessionsData.map(session => {
                const user = usersData.find(u => u.uid === session.userId);
                return {
                    ...session,
                    userName: user?.name || user?.email || "Unknown",
                    userEmail: user?.email,
                    userPhotoURL: user?.photoURL
                };
            });

            setActiveSessions(enrichedActiveSessions);

            // Always load all sessions data for modal
            const filterValue = filter === 'all' ? undefined : filter;
            const sessionsData = await getAllSessionsWithFilter(filterValue);
            const enrichedSessions = sessionsData.map(session => {
                const user = usersData.find(u => u.uid === session.userId);
                return {
                    ...session,
                    userName: user?.name || user?.email || "Unknown",
                    userEmail: user?.email,
                    userPhotoURL: user?.photoURL
                };
            });
            setAllSessions(enrichedSessions.sort((a, b) => {
                const aTime = a.loginTime?.toDate?.() || new Date(a.loginTime);
                const bTime = b.loginTime?.toDate?.() || new Date(b.loginTime);
                return bTime.getTime() - aTime.getTime();
            }));
        } catch (error) {
            console.error("Error loading activity data:", error);
        }
    };

    const filteredSessions = allSessions.filter(session =>
        session.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalActiveUsers = activeSessions.length;
    const todayLogins = allSessions.filter(s => {
        if (!s.loginTime) return false;
        const loginDate = s.loginTime.toDate ? s.loginTime.toDate() : new Date(s.loginTime);
        const today = new Date();
        return loginDate.toDateString() === today.toDateString();
    }).length;

    return (
        <>
            <div
                className="cursor-pointer hover:scale-[1.02] transition-all"
                onClick={() => setShowModal(true)}
            >
                <GlassCard>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-green-500/10">
                                <Activity className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">User Activity</h3>
                                <p className="text-sm text-gray-400">Live Sessions & History</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">🟢 Live Users</span>
                            <span className="text-2xl font-bold text-green-400">{totalActiveUsers}</span>
                        </div>

                        {activeSessions.length > 0 && (
                            <div className="flex -space-x-2 overflow-hidden">
                                {activeSessions.slice(0, 6).map((session, idx) => (
                                    <div key={idx} className="relative group">
                                        <UserAvatar
                                            name={session.userName || "User"}
                                            photoURL={session.userPhotoURL}
                                            size="medium"
                                        />
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                                    </div>
                                ))}
                                {activeSessions.length > 6 && (
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs text-gray-400 border-2 border-black">
                                        +{activeSessions.length - 6}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="text-center pt-2 border-t border-white/10">
                            <p className="text-xs text-blue-400">📊 Click to view detailed activity</p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">User Activity Dashboard</h2>
                                <p className="text-sm text-gray-400">Monitor user sessions and activity</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="p-6 border-b border-white/10 space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {(['today', 'week', 'month', 'all'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === f
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-white/5">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">{totalActiveUsers}</div>
                                <div className="text-sm text-gray-400">Currently Online</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-400">{todayLogins}</div>
                                <div className="text-sm text-gray-400">Logins Today</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-400">{allSessions.length}</div>
                                <div className="text-sm text-gray-400">Total Sessions</div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-auto max-h-[500px]">
                            <table className="w-full">
                                <thead className="bg-white/5 sticky top-0 z-10">
                                    <tr>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-400">User</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Login Time</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Last Active</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Duration</th>
                                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSessions.map((session, idx) => {
                                        const loginTime = session.loginTime?.toDate?.() || new Date(session.loginTime);
                                        const lastActive = session.lastActive?.toDate?.() || new Date(session.lastActive);
                                        const duration = calculateSessionDuration(session);

                                        return (
                                            <tr key={idx} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <UserAvatar
                                                            name={session.userName || "User"}
                                                            photoURL={session.userPhotoURL}
                                                            size="small"
                                                        />
                                                        <div>
                                                            <div className="text-white font-medium">{session.userName}</div>
                                                            <div className="text-xs text-gray-400">{session.userEmail}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-300 text-sm">
                                                    {loginTime.toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="p-4 text-gray-300 text-sm">
                                                    {lastActive.toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="p-4 text-gray-300 text-sm font-mono">
                                                    {formatDuration(duration)}
                                                </td>
                                                <td className="p-4">
                                                    {session.isActive ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                                                            🟢 Online
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-semibold">
                                                            ⚪ Offline
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredSessions.length === 0 && (
                                <div className="text-center py-12 text-gray-400">
                                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No sessions found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
