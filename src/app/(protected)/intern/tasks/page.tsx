"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { CheckCircle, Clock, SendHorizontal, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserTasks, updateTaskStatus, TaskData } from "@/services/taskService";
import { useAuth } from "@/context/AuthContext";
import { getUserGroups } from "@/services/groupService";


export default function InternTasksPage() {
    const { user, activeGroupId } = useAuth();
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshTasks = async () => {
        if (user) {
            setLoading(true);
            try {
                const groups = await getUserGroups(user.uid);
                const groupIds = groups.map(g => g.id).filter(id => !!id) as string[];
                const targetGroups = activeGroupId ? [activeGroupId] : groupIds;
                const userTasks = await getUserTasks(user.uid, targetGroups);
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
    }, [user, activeGroupId]);

    const handleStatusChange = async (taskId: string, newStatus: TaskData["status"]) => {
        await updateTaskStatus(taskId, newStatus);
        refreshTasks();
    };

    const getStatusBadge = (task: TaskData) => {
        if (task.status === 'completed') {
            return (
                <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {task.verifiedByName ? `Verified by ${task.verifiedByName}` : 'Completed'}
                </span>
            );
        }
        if (task.status === 'review') {
            return (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                    Submitted — Pending Group Lead Verification
                </span>
            );
        }
        if (task.status === 'in_progress') {
            return <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">In Progress</span>;
        }
        return <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full capitalize">{(task.status || 'pending').replace('_', ' ')}</span>;
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
                                <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
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

                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5 items-center justify-between">
                                {getStatusBadge(task)}

                                <div className="flex gap-2 ml-auto flex-wrap">
                                    {(task.status || 'pending') === 'pending' && (
                                        <button
                                            onClick={() => handleStatusChange(task.id!, 'in_progress')}
                                            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-colors"
                                        >
                                            Start Mission
                                        </button>
                                    )}
                                    {((task.status || 'pending') === 'pending' || task.status === 'in_progress') && (
                                        <button
                                            onClick={() => handleStatusChange(task.id!, 'review')}
                                            className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                                        >
                                            <SendHorizontal className="w-3.5 h-3.5" />
                                            Submit to Group Lead
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Document submission notice */}
                            {task.status === 'review' && (
                                <p className="mt-2 text-[11px] text-amber-500/70 italic">📄 Task has been submitted to your Group Lead. It will be marked complete only after their verification.</p>
                            )}
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}
