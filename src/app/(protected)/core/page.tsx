"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { MessagesWidget } from "@/components/dashboard/MessagesWidget";
import { Briefcase, Users, Plus, ListTodo, ShieldCheck, Clock, SendHorizontal, Target, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCreatedTasks, getAllTasks, verifyTask, updateTaskStatus, TaskData, getUserTasks, subscribeToAllTasks, subscribeToUserTasks } from "@/services/taskService";
import { useAuth } from "@/context/AuthContext";
import { getUserGroups, isUserGroupLead } from "@/services/groupService";

export default function CoreDashboard() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [myTasks, setMyTasks] = useState<TaskData[]>([]);
    const [pendingVerification, setPendingVerification] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        let unsubscribeAll: (() => void) | null = null;
        let unsubscribeMy: (() => void) | null = null;

        // Fetch groups and lead status first
        getUserGroups(user.uid).then(async (groups) => {
            const groupIds = groups.map(g => g.id).filter(id => !!id) as string[];
            const leadGroupIds: string[] = [];

            for (const g of groups) {
                if (g.id && await isUserGroupLead(user.uid, g.id)) {
                    leadGroupIds.push(g.id);
                }
            }

            // 1. Subscribe to All Tasks (for oversight & verification queue)
            unsubscribeAll = subscribeToAllTasks((allTasks) => {
                // Tasks created by me
                setTasks(allTasks.filter(t => t.assignedBy === user.uid));

                // Tasks awaiting verification
                setPendingVerification(allTasks.filter(t =>
                    (t.status || 'pending') === 'review' && (
                        t.assignedBy === user.uid ||
                        (t.groupId && leadGroupIds.includes(t.groupId))
                    )
                ));
                setLoading(false);
            });

            // 2. Subscribe to My Tasks (assigned to me)
            unsubscribeMy = subscribeToUserTasks(user.uid, groupIds, (data) => {
                setMyTasks(data);
            });
        });

        return () => {
            if (unsubscribeAll) unsubscribeAll();
            if (unsubscribeMy) unsubscribeMy();
        };
    }, [user]);

    const fetchData = () => {
        // Handled by listeners
    };

    const handleVerify = async (taskId: string) => {
        if (!user) return;
        setVerifying(taskId);
        try {
            const displayName = user.displayName || user.email?.split('@')[0] || 'Group Lead';
            await verifyTask(taskId, user.uid, displayName);
            await fetchData(); // Refresh to remove from pending list
        } finally {
            setVerifying(null);
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: TaskData["status"]) => {
        await updateTaskStatus(taskId, newStatus);
        fetchData();
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Mission Control</h1>
                <p className="text-gray-400">Oversee operations and assign objectives.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400">
                        <ListTodo className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Total Missions</p>
                        <h3 className="text-2xl font-bold text-white">{tasks.length}</h3>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Team Size</p>
                        <h3 className="text-2xl font-bold text-white">8</h3>
                    </div>
                </GlassCard>

                <Link href="/core/tasks" className="block h-full">
                    <GlassCard className="flex items-center justify-center gap-2 h-full bg-blue-600/20 hover:bg-blue-600/30 transition-colors border-blue-500/50 cursor-pointer group">
                        <Plus className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="text-blue-100 font-medium">Assign New Task</span>
                    </GlassCard>
                </Link>
            </div>

            <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Submitted Missions</h3>
                        <p className="text-xs text-gray-400">Objectives completed by team members awaiting your verification</p>
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
                    <p className="text-gray-500 italic text-sm">✅ All caught up — no tasks pending verification.</p>
                ) : (
                    <div className="space-y-3">
                        {pendingVerification.map(task => (
                            <div key={task.id} className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                                <div>
                                    <p className="text-white font-semibold">{task.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
                                    <div className="flex gap-3 mt-1">
                                        <span className="text-xs text-gray-500">Assigned to: <span className="text-gray-300">{task.assignedToName || 'Team'}</span></span>
                                        <span className="text-xs text-gray-500">Due: <span className="text-gray-300">{task.deadline}</span></span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleVerify(task.id!)}
                                    disabled={verifying === task.id}
                                    className="shrink-0 flex items-center gap-2 text-sm bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    {verifying === task.id ? 'Verifying...' : 'Verify & Complete'}
                                </button>
                            </div>
                        ))}

                        {/* Added Recently Verified missions as requested */}
                        {tasks.filter(t => t.status === 'completed').length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recently Verified</p>
                                {tasks.filter(t => t.status === 'completed')
                                    .sort((a, b) => (b.verifiedAt?.seconds || 0) - (a.verifiedAt?.seconds || 0))
                                    .slice(0, 3)
                                    .map(task => (
                                        <div key={task.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between opacity-60">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                <div>
                                                    <p className="text-xs text-gray-300 font-medium">{task.title}</p>
                                                    <p className="text-[10px] text-gray-500">Subject: {task.assignedToName || 'Team'}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                                                <ShieldCheck className="w-3 h-3" /> VERIFIED
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                )}
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Objectives Section */}
                <GlassCard>
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-blue-400" />
                        <h3 className="text-xl font-bold text-white">My Objectives</h3>
                    </div>
                    {loading ? (
                        <p className="text-gray-500 text-sm">Loading...</p>
                    ) : myTasks.length === 0 ? (
                        <p className="text-gray-500 italic text-sm">No missions assigned to you.</p>
                    ) : (
                        <div className="space-y-4">
                            {myTasks.filter(t => t.status !== 'completed').map(task => (
                                <div key={task.id} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors relative overflow-hidden group">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                    <div className="pl-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-lg font-bold text-white">{task.title}</h4>
                                            <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{task.deadline}</span>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-4">{task.description}</p>
                                        <div className="flex gap-2 items-center flex-wrap">
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
                                            {(task.status || 'pending') === 'review' && (
                                                <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full animate-pulse">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Submitted
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Completed My Tasks */}
                            {myTasks.filter(t => t.status === 'completed').length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Recent Completions</p>
                                    {myTasks.filter(t => t.status === 'completed').slice(0, 3).map(task => (
                                        <div key={task.id} className="flex justify-between items-center p-2 rounded bg-green-500/5 border border-green-500/10">
                                            <div className="min-w-0">
                                                <p className="text-gray-300 text-xs font-medium truncate">{task.title}</p>
                                                {task.verifiedByName && (
                                                    <p className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                                                        <ShieldCheck className="w-2.5 h-2.5" />
                                                        Verified by {task.verifiedByName}
                                                    </p>
                                                )}
                                            </div>
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </GlassCard>

                {/* Team Assignments Overwatch */}
                <div className="space-y-6">
                    {/* Integrated Oversight for Core Leads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-blue-400">{tasks.filter(t => t.status === 'in_progress').length}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Active Missions</p>
                            </div>
                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/10 flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-yellow-400">{tasks.filter(t => !['in_progress', 'review', 'completed'].includes(t.status || 'pending')).length}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Unactive Missions</p>
                            </div>
                            <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        </div>
                    </div>

                    <GlassCard>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                Recent Verification Audit
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {tasks.filter(t => t.status === 'completed').length === 0 ? (
                                <p className="text-xs text-gray-500 italic">No missions verified by you recently.</p>
                            ) : tasks.filter(t => t.status === 'completed').sort((a, b) => (b.verifiedAt?.seconds || 0) - (a.verifiedAt?.seconds || 0)).slice(0, 3).map(task => (
                                <div key={task.id} className="p-3 rounded bg-green-500/5 border border-green-500/10 flex items-center justify-between gap-3 text-xs">
                                    <div className="min-w-0">
                                        <p className="text-white font-medium truncate">{task.title}</p>
                                        <p className="text-gray-500">Subject: {task.assignedToName || 'Team'}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-green-400 font-bold">Verified</p>
                                        <p className="text-[10px] text-gray-500">
                                            {task.verifiedAt ? new Date(task.verifiedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-green-400" />
                                Team Assignments Overwatch
                            </h3>
                            <Link href="/core/tasks" className="text-xs text-blue-400 hover:underline">View All</Link>
                        </div>
                        {loading ? (
                            <p className="text-gray-500">Retrieving data...</p>
                        ) : tasks.length === 0 ? (
                            <p className="text-gray-500">No active assignments.</p>
                        ) : (
                            <div className="space-y-3">
                                {tasks.filter(t => t.status !== 'completed').slice(0, 50).map(task => (
                                    <div key={task.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors">
                                        <div>
                                            <p className="text-white font-medium">{task.title}</p>
                                            <p className="text-xs text-gray-400">Due: {task.deadline}</p>
                                        </div>
                                        {task.status === 'completed' ? (
                                            <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full font-bold">
                                                <ShieldCheck className="w-3 h-3" />
                                                VERIFIED
                                            </span>
                                        ) : task.status === 'review' ? (
                                            <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse font-bold">
                                                <Clock className="w-3.5 h-3.5" />
                                                SUBMITTED
                                            </span>
                                        ) : task.status === 'in_progress' ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">
                                                ACTIVE
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400">
                                                UNACTIVE
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* Messages Widget */}
                <MessagesWidget />
            </div>
        </div>
    );
}
