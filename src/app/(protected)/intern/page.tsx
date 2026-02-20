"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { MessagesWidget } from "@/components/dashboard/MessagesWidget";
import { CheckCircle, Clock, SendHorizontal, ShieldCheck, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserTasks, getAllTasks, verifyTask, updateTaskStatus, TaskData, subscribeToUserTasks, subscribeToAllTasks } from "@/services/taskService";
import { useAuth } from "@/context/AuthContext";
import { getUserGroups, isUserGroupLead } from "@/services/groupService";

export default function InternDashboard() {
    const { user, activeGroupId } = useAuth();
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLead, setIsLead] = useState(false);
    const [pendingVerification, setPendingVerification] = useState<TaskData[]>([]);
    const [verifying, setVerifying] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        let unsubscribeMy: (() => void) | null = null;
        let unsubscribeLead: (() => void) | null = null;

        // Fetch groups and lead status first
        getUserGroups(user.uid).then(async (groups) => {
            const groupIds = groups.map(g => g.id).filter(id => !!id) as string[];

            // Identify if user is lead
            let leadStatus = false;
            const leadGroupIds: string[] = [];
            for (const g of groups) {
                if (g.id && await isUserGroupLead(user.uid, g.id)) {
                    leadStatus = true;
                    leadGroupIds.push(g.id);
                }
            }
            setIsLead(leadStatus);

            // 1. Subscribe to My Tasks
            unsubscribeMy = subscribeToUserTasks(user.uid, groupIds, (data) => {
                setTasks(data);
                setLoading(false);
            });

            // 2. Subscribe to Verification Queue (if lead)
            if (leadStatus) {
                unsubscribeLead = subscribeToAllTasks((allTasks) => {
                    const pending = allTasks.filter(t =>
                        (t.status || 'pending') === 'review' &&
                        (t.groupId && leadGroupIds.includes(t.groupId))
                    );
                    setPendingVerification(pending);
                });
            }
        });

        return () => {
            if (unsubscribeMy) unsubscribeMy();
            if (unsubscribeLead) unsubscribeLead();
        };
    }, [user, activeGroupId]);

    const refreshTasks = () => {
        // Handled by listeners
    };

    const handleStatusChange = async (taskId: string, newStatus: TaskData["status"]) => {
        await updateTaskStatus(taskId, newStatus);
        refreshTasks();
    };

    const handleVerify = async (taskId: string) => {
        if (!user) return;
        setVerifying(taskId);
        try {
            const displayName = user.displayName || user.email?.split('@')[0] || 'Group Lead';
            await verifyTask(taskId, user.uid, displayName);
            await refreshTasks();
        } finally {
            setVerifying(null);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">My Objectives</h1>
                <p className="text-gray-400">
                    Track and complete assigned missions.
                    {isLead && <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">👑 Group Lead</span>}
                </p>
            </div>

            {/* Group Lead Verification Queue */}
            {isLead && (
                <GlassCard>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Submitted Missions</h3>
                            <p className="text-xs text-gray-400">Team members' submissions awaiting your verification</p>
                        </div>
                        {pendingVerification.length > 0 && (
                            <span className="ml-auto px-2.5 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30">
                                {pendingVerification.length}
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <p className="text-gray-500 text-sm">Loading...</p>
                    ) : pendingVerification.length === 0 ? (
                        <p className="text-gray-500 italic text-sm">✅ All caught up — no submissions pending your verification.</p>
                    ) : (
                        <div className="space-y-3">
                            {pendingVerification.map(task => (
                                <div key={task.id} className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                                    <div>
                                        <p className="text-white font-semibold">{task.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
                                        <span className="text-xs text-gray-500">Submitted by: <span className="text-gray-300">{task.assignedToName || 'Member'}</span></span>
                                    </div>
                                    <button
                                        onClick={() => handleVerify(task.id!)}
                                        disabled={verifying === task.id}
                                        className="shrink-0 flex items-center gap-2 text-sm bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        {verifying === task.id ? 'Verifying...' : 'Verify & Complete'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {/* 1. Active Missions (Started) */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-400" />
                            Active Missions
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">ENGAGED</span>
                        </h3>
                        <div className="space-y-4">
                            {loading ? <p className="text-gray-500">Loading...</p> : tasks.filter(t => t.status === 'in_progress').length === 0 ? (
                                <p className="text-gray-500 text-sm italic py-2">No active missions. Start an unactive mission to begin.</p>
                            ) : tasks.filter(t => t.status === 'in_progress').map(task => (
                                <GlassCard key={task.id} className="relative overflow-hidden group">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                    <div className="pl-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-lg font-bold text-white">{task.title}</h4>
                                            <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{task.deadline}</span>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-4">{task.description}</p>
                                        <div className="flex gap-2 items-center flex-wrap">
                                            <button
                                                onClick={() => handleStatusChange(task.id!, 'review')}
                                                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
                                            >
                                                <SendHorizontal className="w-3.5 h-3.5" />
                                                Submit to Group Lead
                                            </button>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>

                    {/* 2. Unactive Missions (Pending) */}
                    <div className="pt-4">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-400" />
                            Unactive Missions
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30">UNENGAGED</span>
                        </h3>
                        <div className="space-y-4">
                            {loading ? null : tasks.filter(t => !['in_progress', 'review', 'completed'].includes(t.status || 'pending')).length === 0 ? (
                                <p className="text-gray-500 text-sm italic py-2">No unengaged missions. Stand by for orders.</p>
                            ) : tasks.filter(t => !['in_progress', 'review', 'completed'].includes(t.status || 'pending')).map(task => (
                                <GlassCard key={task.id} className="relative overflow-hidden group">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                    <div className="pl-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-lg font-bold text-white">{task.title}</h4>
                                            <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{task.deadline}</span>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-4">{task.description}</p>
                                        <div className="flex gap-2 items-center flex-wrap">
                                            <button
                                                onClick={() => handleStatusChange(task.id!, 'in_progress')}
                                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded transition-colors font-bold shadow-lg shadow-blue-900/20"
                                            >
                                                Start Mission
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(task.id!, 'review')}
                                                className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 border border-white/5"
                                            >
                                                <SendHorizontal className="w-3.5 h-3.5" />
                                                Direct Submit
                                            </button>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>

                    {/* 3. Submitted (In Review) */}
                    {tasks.filter(t => t.status === 'review').length > 0 && (
                        <div className="pt-4">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-400" />
                                Awaiting Verification
                            </h3>
                            <div className="space-y-3">
                                {tasks.filter(t => t.status === 'review').map(task => (
                                    <div key={task.id} className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10 flex justify-between items-center group/review">
                                        <div>
                                            <p className="text-white font-medium">{task.title}</p>
                                            <p className="text-xs text-gray-500">Submitted for review</p>
                                        </div>
                                        <span className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full animate-pulse font-bold">
                                            <Clock className="w-3.5 h-3.5" />
                                            SUBMITTED
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-xl font-bold text-white mb-6">Verified Missions</h3>
                    <GlassCard>
                        <div className="space-y-4">
                            {tasks.filter(t => t.status === 'completed').map(task => (
                                <div key={task.id} className="flex justify-between items-center p-3 rounded bg-green-500/5 border border-green-500/10 hover:bg-green-500/10 transition-colors">
                                    <div>
                                        <span className="text-gray-300 font-medium">{task.title}</span>
                                        {task.verifiedByName ? (
                                            <p className="text-[10px] text-green-400 font-bold flex items-center gap-1 mt-0.5">
                                                <ShieldCheck className="w-3 h-3" />
                                                Verified by {task.verifiedByName}
                                            </p>
                                        ) : (
                                            <p className="text-[10px] text-gray-500 mt-0.5">Completed</p>
                                        )}
                                    </div>
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
