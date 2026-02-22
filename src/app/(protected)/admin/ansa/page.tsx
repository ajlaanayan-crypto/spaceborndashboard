"use client";

import { useEffect, useState } from "react";
import { AnsaTopic, getTopics } from "@/services/ansaService";
import { TaskData, subscribeToAllTasks } from "@/services/taskService";
import { GroupData, subscribeToGroups } from "@/services/groupService";
import { Plus, BarChart2, CheckCircle, Clock, TrendingUp, Zap, Users, ShieldCheck, Target, ListTodo, History, Download, ChevronDown } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    OverallProgressPieChart,
    TopicProgressChart,
    TeamWorkloadChart,
    WeeklyTrendsChart,
    DailyTrendsChart,
    PriorityDistributionPieChart,
    StatusDistributionPieChart,
    PriorityEfficiencyChart,
    GroupProductivityChart
} from "@/components/ansa/AnsaCharts";
import { autoSubmitExpiredTasks } from "@/services/taskService";
import { generateWeeklyReportPDF } from "@/services/reportService";
import { WeekPicker } from "@/components/ansa/WeekPicker";

export default function AdminAnsaPage() {
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [topics, setTopics] = useState<AnsaTopic[]>([]);
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [loading, setLoading] = useState(true);
    const [trendView, setTrendView] = useState<'daily' | 'weekly'>('daily');
    const [showWeekPicker, setShowWeekPicker] = useState(false);
    const [downloadingWeek, setDownloadingWeek] = useState(false);

    const handleWeekSelected = async (monday: Date, sunday: Date, label: string) => {
        setDownloadingWeek(true);
        try {
            const weekTasks = tasks.filter(t => {
                if (!t.createdAt) return false;
                const date = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
                return date >= monday && date <= sunday;
            });
            const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
            const groupCounts: { [k: string]: { count: number; color: string } } = {};
            weekTasks.forEach(t => {
                const gn = t.groupName || 'Individual';
                if (!groupCounts[gn]) {
                    groupCounts[gn] = { count: 0, color: COLORS[Object.keys(groupCounts).length % COLORS.length] };
                }
                groupCounts[gn].count++;
            });
            const stats = Object.entries(groupCounts).map(([name, data]) => ({ name, count: data.count, color: data.color }));
            await generateWeeklyReportPDF(weekTasks, label, stats);
        } finally {
            setDownloadingWeek(false);
            setShowWeekPicker(false);
        }
    };

    useEffect(() => {
        setLoading(true);

        // 1. Subscribe to Tasks (The source of truth)
        const unsubscribeTasks = subscribeToAllTasks((data) => {
            setTasks(data);
            setLoading(false);
            autoSubmitExpiredTasks(data);
        });

        // 2. Subscribe to Groups
        const unsubscribeGroups = subscribeToGroups((data) => {
            setGroups(data);
        });

        // 3. Keep Topics legacy support for manual roadmap items
        getTopics().then(setTopics);

        return () => {
            unsubscribeTasks();
            unsubscribeGroups();
        };
    }, []);

    // Derived Statistics
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inReviewTasks = tasks.filter(t => t.status === 'review').length;
    const activeTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'pending').length;

    const totalProgress = tasks.length === 0 ? 0 :
        Math.round((tasks.reduce((acc, t) => acc + (t.status === 'completed' ? 100 : t.status === 'review' ? 90 : t.status === 'in_progress' ? 50 : 0), 0)) / tasks.length);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Ansa Analytics Command Center</h1>
                    <p className="text-gray-400">Real-time mission intelligence &amp; organizational throughput</p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Total Missions</p>
                        <p className="text-xl font-bold text-white">{tasks.length}</p>
                    </div>
                    <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-[10px] text-green-500 uppercase font-bold">Verified</p>
                        <p className="text-xl font-bold text-green-400">{completedTasks}</p>
                    </div>
                    <button
                        onClick={() => setShowWeekPicker(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all shadow-lg shadow-purple-500/30 font-medium text-sm"
                    >
                        <Download className="w-4 h-4" />
                        Weekly Report
                    </button>
                </div>
            </div>

            {/* Calendar Week Picker Modal */}
            {showWeekPicker && (
                <WeekPicker
                    onSelect={handleWeekSelected}
                    onClose={() => setShowWeekPicker(false)}
                    isDownloading={downloadingWeek}
                />
            )}

            {/* Main Trend Chart - Day-wise / Week-wise Toggle */}
            <GlassCard className="p-6">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        Operational Velocity
                    </h3>
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                        <button
                            onClick={() => setTrendView('daily')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${trendView === 'daily' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            DAILY
                        </button>
                        <button
                            onClick={() => setTrendView('weekly')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${trendView === 'weekly' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            WEEKLY
                        </button>
                    </div>
                </div>
                {trendView === 'daily' ? <DailyTrendsChart tasks={tasks} /> : <WeeklyTrendsChart tasks={tasks} />}
            </GlassCard>

            {/* Multi-Dimension Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <GlassCard className="p-6">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                        <Target className="w-4 h-4 text-blue-400" />
                        Status Breakdown
                    </h3>
                    <StatusDistributionPieChart tasks={tasks} />
                </GlassCard>

                <GlassCard className="p-6">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Priority Mix
                    </h3>
                    <PriorityDistributionPieChart tasks={tasks} />
                </GlassCard>

                <GlassCard className="p-6">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4 text-green-400" />
                        Strategic Alignment
                    </h3>
                    <OverallProgressPieChart topics={topics} tasks={tasks} />
                </GlassCard>
            </div>

            {/* Middle Row: Efficiency & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-6">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Priority Performance
                    </h3>
                    <PriorityEfficiencyChart tasks={tasks} />
                </GlassCard>

                <GlassCard className="p-6">
                    <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                        <Users className="w-4 h-4 text-purple-400" />
                        Group Throughput
                    </h3>
                    <GroupProductivityChart tasks={tasks} groups={groups} />
                </GlassCard>
            </div>

            {/* Detailed Distribution */}
            <GlassCard className="p-6">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                    <BarChart2 className="w-4 h-4 text-indigo-400" />
                    Team Workload Distribution
                </h3>
                <TeamWorkloadChart topics={topics} tasks={tasks} />
            </GlassCard>

            {/* Weekly Archives & PDF Reports */}
            <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Mission Archives & PDF Reports</h3>
                            <p className="text-xs text-gray-400">Download high-resolution historical performance audits</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (i * 7));
                        const day = d.getDay();
                        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                        const monday = new Date(d);
                        monday.setDate(diff);
                        monday.setHours(0, 0, 0, 0);

                        const sunday = new Date(monday);
                        sunday.setDate(monday.getDate() + 6);
                        sunday.setHours(23, 59, 59, 999);

                        const label = `${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

                        const handleDownload = async () => {
                            const weekTasks = tasks.filter(t => {
                                if (!t.createdAt) return false;
                                const date = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
                                return date >= monday && date <= sunday;
                            });

                            // Calculate group stats for the pie chart
                            const groupCounts: { [key: string]: { count: number, color: string } } = {};
                            const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

                            weekTasks.forEach(t => {
                                const groupName = t.groupName || 'Individual';
                                if (!groupCounts[groupName]) {
                                    const index = Object.keys(groupCounts).length;
                                    groupCounts[groupName] = { count: 0, color: COLORS[index % COLORS.length] };
                                }
                                groupCounts[groupName].count++;
                            });

                            const stats = Object.entries(groupCounts).map(([name, data]) => ({
                                name,
                                count: data.count,
                                color: data.color
                            }));

                            await generateWeeklyReportPDF(weekTasks, label, stats);
                        };

                        return (
                            <button
                                key={i}
                                onClick={handleDownload}
                                className="group flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-blue-600/10 hover:border-blue-600/50 transition-all text-left"
                            >
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold group-hover:text-blue-400">Archive Week</p>
                                    <p className="text-sm font-medium text-white">{label}</p>
                                </div>
                                <div className="p-2 bg-white/5 rounded-lg text-gray-400 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </GlassCard>
            {/* Task-wise Granular Overview */}
            <GlassCard>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <ListTodo className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Granular Mission Tracking</h3>
                            <p className="text-xs text-gray-400">Individual mission status and priority alignment</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">LIVE SYNC ENABLED</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-gray-500 border-b border-white/5">
                            <tr>
                                <th className="pb-4 font-medium">Mission Title</th>
                                <th className="pb-4 font-medium">Assigned To</th>
                                <th className="pb-4 font-medium">Priority</th>
                                <th className="pb-4 font-medium">Status</th>
                                <th className="pb-4 font-medium text-right">Progress</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tasks.slice(0, 15).map(task => (
                                <tr key={task.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 font-medium text-white">{task.title}</td>
                                    <td className="py-4 text-gray-400 font-mono text-xs">{task.assignedToName || task.groupName}</td>
                                    <td className="py-4">
                                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${task.priority === 'high' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                            task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                            }`}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            {task.status === 'completed' ? (
                                                <span className="flex items-center gap-1 text-green-400 text-[10px] font-bold">
                                                    <ShieldCheck className="w-3 h-3" /> VERIFIED
                                                </span>
                                            ) : task.status === 'review' ? (
                                                <span className="flex items-center gap-1 text-amber-400 text-[10px] font-bold animate-pulse">
                                                    <History className="w-3 h-3" /> IN REVIEW
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-blue-400 text-[10px] font-bold">
                                                    <Clock className="w-3 h-3" /> ACTIVE
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs text-white font-mono">
                                                {task.status === 'completed' ? '100%' : task.status === 'review' ? '90%' : task.status === 'in_progress' ? '50%' : '0%'}
                                            </span>
                                            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${task.status === 'completed' ? 'bg-green-500' :
                                                        task.status === 'review' ? 'bg-amber-500' : 'bg-blue-500'
                                                        }`}
                                                    style={{ width: task.status === 'completed' ? '100%' : task.status === 'review' ? '90%' : task.status === 'in_progress' ? '50%' : '0%' }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
