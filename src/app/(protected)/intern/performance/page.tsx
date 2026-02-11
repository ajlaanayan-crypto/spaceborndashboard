"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { TrendingUp, Target, Award, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function InternPerformancePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        tasksCompleted: 0,
        tasksInProgress: 0,
        averageCompletionTime: "N/A",
        performanceScore: 0
    });

    useEffect(() => {
        // Placeholder for future performance data fetching
        setTimeout(() => {
            setStats({
                tasksCompleted: 0,
                tasksInProgress: 0,
                averageCompletionTime: "N/A",
                performanceScore: 0
            });
            setLoading(false);
        }, 500);
    }, [user]);

    const statCards = [
        { label: "Tasks Completed", value: stats.tasksCompleted, icon: Award, color: "text-green-400" },
        { label: "In Progress", value: stats.tasksInProgress, icon: Target, color: "text-blue-400" },
        { label: "Avg. Time", value: stats.averageCompletionTime, icon: Clock, color: "text-purple-400" },
        { label: "Performance Score", value: `${stats.performanceScore}%`, icon: TrendingUp, color: "text-yellow-400" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Performance Dashboard</h1>
                <p className="text-gray-400">Track your progress and achievements.</p>
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
                    );
                })}
            </div>

            <GlassCard>
                <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-gray-500">Loading activity data...</p>
                    ) : (
                        <p className="text-gray-500 text-center py-8 italic">
                            No activity recorded yet. Complete tasks to see your performance metrics.
                        </p>
                    )}
                </div>
            </GlassCard>

            <GlassCard>
                <h3 className="text-xl font-bold text-white mb-4">Skills & Progress</h3>
                <p className="text-gray-500 text-center py-8 italic">
                    Skill tracking coming soon. Keep completing missions to unlock this feature.
                </p>
            </GlassCard>
        </div>
    );
}
