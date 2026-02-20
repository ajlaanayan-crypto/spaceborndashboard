"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { MessagesWidget } from "@/components/dashboard/MessagesWidget";
import {
    CheckCircle,
    Clock,
    AlertCircle,
    TrendingUp,
    Target,
    Briefcase,
    Award,
    Calendar,
    Users,
    FileText,
    SendHorizontal,
    ShieldCheck
} from "lucide-react";
import { useEffect, useState } from "react";
import { getUserTasks, updateTaskStatus, TaskData, subscribeToUserTasks } from "@/services/taskService";
import { useAuth } from "@/context/AuthContext";
import { getUserGroups } from "@/services/groupService";

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        let unsubscribe: (() => void) | null = null;

        getUserGroups(user.uid).then((groups) => {
            const groupIds = groups.map(g => g.id).filter(id => !!id) as string[];

            unsubscribe = subscribeToUserTasks(user.uid, groupIds, (data) => {
                setTasks(data);
                setLoading(false);
            });
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    const refreshTasks = () => {
        // Handled by listener
    };

    const handleStatusChange = async (taskId: string, newStatus: TaskData["status"]) => {
        await updateTaskStatus(taskId, newStatus);
        refreshTasks();
    };

    // Calculate stats
    const activeTasks = tasks.filter(t => t.status !== 'completed');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const reviewTasks = tasks.filter(t => t.status === 'review');

    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    // High priority tasks
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">My Workspace</h1>
                <p className="text-gray-400">Track your tasks, performance, and stay productive.</p>
            </div>

            {/* Stats Overview - 4 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlassCard className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400">
                        <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Total Tasks</p>
                        <h3 className="text-2xl font-bold text-white">{totalTasks}</h3>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-yellow-500/20 text-yellow-400">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">In Progress</p>
                        <h3 className="text-2xl font-bold text-white">{inProgressTasks.length}</h3>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Active Missions</p>
                        <h3 className="text-2xl font-bold text-white">{pendingTasks.length}</h3>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-500/20 text-green-400">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Completed</p>
                        <h3 className="text-2xl font-bold text-white">{completedTasks.length}</h3>
                    </div>
                </GlassCard>
            </div>

            {/* Main Content - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Active Tasks */}
                <div className="space-y-6">
                    {/* High Priority Alert */}
                    {highPriorityTasks.length > 0 && (
                        <GlassCard className="border-l-4 border-red-500">
                            <div className="flex items-center gap-3 mb-3">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <h3 className="text-lg font-bold text-white">High Priority Tasks</h3>
                                <span className="ml-auto bg-red-500/20 text-red-400 px-2 py-1 rounded text-sm">
                                    {highPriorityTasks.length}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {highPriorityTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="p-2 rounded bg-red-500/10 text-sm">
                                        <p className="text-white font-medium">{task.title}</p>
                                        <p className="text-gray-400 text-xs">Due: {task.deadline}</p>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    )}

                    {/* Active Tasks List */}
                    <GlassCard>
                        <h3 className="text-xl font-bold text-white mb-4">Active Tasks</h3>
                        {loading ? (
                            <p className="text-gray-500 text-center py-6">Loading...</p>
                        ) : activeTasks.length === 0 ? (
                            <p className="text-gray-500 text-center py-6 italic">No active tasks</p>
                        ) : (
                            <div className="space-y-3">
                                {activeTasks.slice(0, 5).map(task => (
                                    <div key={task.id} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors relative overflow-hidden group">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.priority === 'high' ? 'bg-red-500' :
                                            task.priority === 'medium' ? 'bg-yellow-500' :
                                                'bg-blue-500'
                                            }`}></div>
                                        <div className="pl-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-lg font-bold text-white">{task.title}</h4>
                                                {task.status === 'completed' ? (
                                                    <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                        {task.verifiedByName ? `Verified by ${task.verifiedByName}` : 'Completed'}
                                                    </span>
                                                ) : task.status === 'review' ? (
                                                    <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full animate-pulse font-bold">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Submitted
                                                    </span>
                                                ) : (
                                                    <span className={`text-xs px-2 py-1 rounded capitalize ${task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                                                        }`}>
                                                        {(task.status || 'pending').replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {task.deadline}
                                                    </span>
                                                    <span className={`capitalize px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-blue-500/20 text-blue-400'
                                                        }`}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    {((task.status || 'pending') === 'pending' || task.status === 'in_progress') && (
                                                        <>
                                                            {(task.status || 'pending') === 'pending' && (
                                                                <button
                                                                    onClick={() => handleStatusChange(task.id!, 'in_progress')}
                                                                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors"
                                                                >
                                                                    Start
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleStatusChange(task.id!, 'review')}
                                                                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                                                            >
                                                                <SendHorizontal className="w-3.5 h-3.5" />
                                                                Submit
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* Right Column - Performance & Messages */}
                <div className="space-y-6">
                    {/* Performance Overview */}
                    <GlassCard>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            Performance Overview
                        </h3>
                        <div className="space-y-4">
                            {/* Completion Rate */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Completion Rate</span>
                                    <span className="text-white font-bold">{completionRate}%</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-blue-500 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${completionRate}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                <div className="text-center p-3 rounded bg-green-500/10">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                        <p className="text-2xl font-bold text-green-400">{completedTasks.length}</p>
                                    </div>
                                    <p className="text-xs text-gray-500">Completed</p>
                                </div>
                                <div className="text-center p-3 rounded bg-blue-500/10">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Target className="w-4 h-4 text-blue-400" />
                                        <p className="text-2xl font-bold text-blue-400">{inProgressTasks.length}</p>
                                    </div>
                                    <p className="text-xs text-gray-500">In Progress</p>
                                </div>
                                <div className="text-center p-3 rounded bg-purple-500/10">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <FileText className="w-4 h-4 text-purple-400" />
                                        <p className="text-2xl font-bold text-purple-400">{reviewTasks.length}</p>
                                    </div>
                                    <p className="text-xs text-gray-500">Submitted</p>
                                </div>
                                <div className="text-center p-3 rounded bg-yellow-500/10">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Clock className="w-4 h-4 text-yellow-400" />
                                        <p className="text-2xl font-bold text-yellow-400">{pendingTasks.length}</p>
                                    </div>
                                    <p className="text-xs text-gray-500">Active Missions</p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Messages Widget */}
                    <MessagesWidget />

                    {/* Quick Stats */}
                    <GlassCard>
                        <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 rounded bg-white/5">
                                <span className="text-gray-400 flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    Tasks This Week
                                </span>
                                <span className="text-white font-bold">{activeTasks.length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded bg-white/5">
                                <span className="text-gray-400 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Team Projects
                                </span>
                                <span className="text-white font-bold">
                                    {tasks.filter(t => t.type === 'group').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded bg-white/5">
                                <span className="text-gray-400 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Success Rate
                                </span>
                                <span className="text-green-400 font-bold">{completionRate}%</span>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Recent Completions */}
            {completedTasks.length > 0 && (
                <GlassCard>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Recent Completions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {completedTasks.slice(0, 6).map(task => (
                            <div key={task.id} className="p-3 rounded bg-green-500/10 border border-green-500/20">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-300 font-medium truncate">{task.title}</p>
                                        {task.verifiedByName ? (
                                            <p className="text-[10px] text-green-400 font-bold flex items-center gap-1 mt-1">
                                                <ShieldCheck className="w-3 h-3" />
                                                Verified by {task.verifiedByName}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-500 mt-1">Completed: {task.deadline}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}
        </div>
    );
}
