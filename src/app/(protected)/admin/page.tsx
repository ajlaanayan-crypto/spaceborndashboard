"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { MessagesWidget } from "@/components/dashboard/MessagesWidget";
import { UserActivityWidget } from "@/components/admin/UserActivityWidget";
import { Users, Briefcase, AlertCircle, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllUsers, UserData } from "@/services/userService";
import { SecurityAlerts } from "@/components/admin/SecurityAlerts";
import { getDashboardStats, getActivityHeatmap, DashboardStats, ActivityData } from "@/services/analyticsService";
import { ActivityHeatmap } from "@/components/analytics/AnalyticsCharts";

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserData[]>([]);
    const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, activeProjects: 0, pendingReviews: 0, performance: 0 });
    const [activityData, setActivityData] = useState<ActivityData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersData, statsData, heatmapData] = await Promise.all([
                    getAllUsers(),
                    getDashboardStats(),
                    getActivityHeatmap()
                ]);
                setUsers(usersData);
                setStats(statsData);
                setActivityData(heatmapData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const statCards = [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
        { label: "Active Projects", value: stats.activeProjects, icon: Briefcase, color: "text-purple-400" },
        { label: "Pending Reviews", value: stats.pendingReviews, icon: AlertCircle, color: "text-yellow-400" },
        { label: "Performance", value: `${stats.performance}%`, icon: TrendingUp, color: "text-green-400" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Command Center</h1>
                <p className="text-gray-400">Overview of system status and team.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <GlassCard key={index} className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg bg-white/5 ${stat.color}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-white">{loading ? "-" : stat.value}</h3>
                            </div>
                        </GlassCard>
                    )
                })}
            </div>

            {/* Activity Heatmap */}
            <GlassCard>
                <h3 className="text-xl font-bold text-white mb-4">System Activity (Last 30 Days)</h3>
                {loading ? (
                    <p className="text-gray-500">Analyzing temporal patterns...</p>
                ) : (
                    <div className="space-y-3">
                        <ActivityHeatmap data={activityData} />
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 bg-white/5 rounded-sm"></div>
                                <div className="w-3 h-3 bg-blue-900/40 rounded-sm"></div>
                                <div className="w-3 h-3 bg-blue-700/60 rounded-sm"></div>
                                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                                <div className="w-3 h-3 bg-blue-300 rounded-sm"></div>
                            </div>
                            <span>More</span>
                        </div>
                    </div>
                )}
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Activity Widget */}
                <UserActivityWidget />

                <GlassCard>
                    <h3 className="text-xl font-bold text-white mb-4">Team Members</h3>
                    {loading ? (
                        <p className="text-gray-500">Scanning database...</p>
                    ) : (
                        <div className="space-y-4">
                            {users.slice(0, 5).map((user) => (
                                <div key={user.uid} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar name={user.name} photoURL={user.photoURL} size="small" />
                                        <div>
                                            <p className="text-white font-medium">{user.name}</p>
                                            <p className="text-xs text-gray-400">{user.role}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs ${user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {user.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>

                <GlassCard>
                    <SecurityAlerts />
                </GlassCard>
            </div>
        </div>
    );
}
