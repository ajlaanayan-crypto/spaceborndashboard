"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserTasks, updateTaskStatus, TaskData } from "@/services/taskService";
import { useAuth } from "@/context/AuthContext";
import { getUserGroups } from "@/services/groupService";

export default function InternTasksPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshTasks = async () => {
        if (user) {
            setLoading(true);
            try {
                // 1. Get user groups
                const groups = await getUserGroups(user.uid);
                const groupIds = groups.map(g => g.id).filter(id => !!id) as string[];

                // 2. Get tasks (both individual and group)
                const userTasks = await getUserTasks(user.uid, groupIds);
                setTasks(userTasks);
            } catch (error) {
                console.error("Error refreshing tasks:", error);
            } finally {
                setLoading(false);
            }
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
                <h1 className="text-3xl font-bold text-white mb-2">My Missions</h1>
                <p className="text-gray-400">Track and complete your assigned objectives.</p>
            </div>

            <GlassCard>
                <div className="space-y-4">
                    {loading ? <p className="text-gray-500">Loading tasks...</p> : tasks.length === 0 ? (
                        <p className="text-gray-500 italic">No tasks assigned yet. Stand by for orders.</p>
                    ) : tasks.map(task => (
                        <div key={task.id} className="p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                        {task.title}
                                        {task.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                    </h4>
                                    <p className="text-gray-400 text-sm mt-1">{task.description}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-2 py-1 rounded text-xs capitalize ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {task.priority} Priority
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Due: {task.deadline}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                                <span className="text-xs text-gray-500 uppercase tracking-wider py-1.5">Status: {(task.status || 'pending').replace("_", " ")}</span>
                                <div className="flex-1"></div>
                                {task.status !== 'completed' && (
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
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}
