"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { MessagesWidget } from "@/components/dashboard/MessagesWidget";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserTasks, updateTaskStatus, TaskData } from "@/services/taskService";
import { useAuth } from "@/context/AuthContext";

export default function InternDashboard() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshTasks = () => {
        if (user) {
            setLoading(true);
            getUserTasks(user.uid).then(setTasks).finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        if (user) refreshTasks();
    }, [user]);

    const handleStatusChange = async (taskId: string, newStatus: TaskData["status"]) => {
        await updateTaskStatus(taskId, newStatus);
        refreshTasks();
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">My Objectives</h1>
                <p className="text-gray-400">Track and complete assigned missions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white">Active Missions</h3>
                    {loading ? <p className="text-gray-500">Loading...</p> : tasks.filter(t => t.status !== 'completed').map(task => (
                        <GlassCard key={task.id} className="relative overflow-hidden group">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                }`}></div>
                            <div className="pl-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-lg font-bold text-white">{task.title}</h4>
                                    <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{task.deadline}</span>
                                </div>
                                <p className="text-gray-400 text-sm mb-4">{task.description}</p>
                                <div className="flex gap-2">
                                    {task.status === 'pending' && (
                                        <button
                                            onClick={() => handleStatusChange(task.id!, 'in_progress')}
                                            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors"
                                        >
                                            Start Mission
                                        </button>
                                    )}
                                    {task.status === 'in_progress' && (
                                        <button
                                            onClick={() => handleStatusChange(task.id!, 'review')}
                                            className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors"
                                        >
                                            Submit for Review
                                        </button>
                                    )}
                                    {task.status === 'review' && (
                                        <span className="text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded">
                                            Under Review
                                        </span>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                    {!loading && tasks.filter(t => t.status !== 'completed').length === 0 && (
                        <p className="text-gray-500 italic">No active missions. Stand by for orders.</p>
                    )}
                </div>

                <div>
                    <h3 className="text-xl font-bold text-white mb-6">Mission Log</h3>
                    <GlassCard>
                        <div className="space-y-4">
                            {tasks.filter(t => t.status === 'completed').map(task => (
                                <div key={task.id} className="flex justify-between items-center p-3 rounded bg-white/5 opacity-75">
                                    <span className="text-gray-300 line-through">{task.title}</span>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                            ))}
                            {!loading && tasks.filter(t => t.status === 'completed').length === 0 && (
                                <p className="text-gray-500 text-sm">No completed missions yet.</p>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Messages Widget */}
                <MessagesWidget />
            </div>
        </div>
    );
}
