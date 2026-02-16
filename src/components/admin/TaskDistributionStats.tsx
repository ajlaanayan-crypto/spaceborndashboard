import { GlassCard } from "@/components/ui/GlassCard";
import { UserData } from "@/services/userService";
import { TaskData } from "@/services/taskService";
import { GroupData } from "@/services/groupService";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Users, User, ChevronDown, ChevronUp } from "lucide-react";

interface TaskDistributionStatsProps {
    users: UserData[];
    tasks: TaskData[];
    groups: GroupData[];
}

interface UserTaskStatus {
    user: UserData;
    hasTask: boolean;
    assignedTasks: {
        title: string;
        isGroupTask: boolean;
        groupName?: string;
    }[];
}

export function TaskDistributionStats({ users, tasks, groups }: TaskDistributionStatsProps) {
    const [userTaskStats, setUserTaskStats] = useState<UserTaskStatus[]>([]);
    const [stats, setStats] = useState({ withTasks: 0, withoutTasks: 0 });
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'with' | 'without'>('all');

    useEffect(() => {
        const calculateStats = () => {
            const stats = users.map(user => {
                // Find direct tasks
                const directTasks = tasks.filter(t => t.assignedTo === user.uid && t.status !== 'completed');

                // Find group tasks
                // 1. Get groups this user is in
                const userGroupIds = groups
                    .filter(g => g.memberIds.includes(user.uid))
                    .map(g => g.id);

                // 2. Find tasks assigned to these groups
                const groupTasks = tasks.filter(t =>
                    t.type === 'group' &&
                    t.groupId &&
                    userGroupIds.includes(t.groupId) &&
                    t.status !== 'completed'
                );

                const allTasks = [
                    ...directTasks.map(t => ({ title: t.title, isGroupTask: false })),
                    ...groupTasks.map(t => ({ title: t.title, isGroupTask: true, groupName: t.groupName }))
                ];

                return {
                    user,
                    hasTask: allTasks.length > 0,
                    assignedTasks: allTasks
                };
            });

            setUserTaskStats(stats);
            setStats({
                withTasks: stats.filter(s => s.hasTask).length,
                withoutTasks: stats.filter(s => !s.hasTask).length
            });
        };

        if (users.length > 0) {
            calculateStats();
        }
    }, [users, tasks, groups]);

    const data = [
        { name: 'With Tasks', value: stats.withTasks, color: '#10B981' }, // Green
        { name: 'Without Tasks', value: stats.withoutTasks, color: '#EF4444' }, // Red
    ];

    const filteredUsers = userTaskStats.filter(stat => {
        if (filter === 'with') return stat.hasTask;
        if (filter === 'without') return !stat.hasTask;
        return true;
    });

    return (
        <div className="space-y-6">
            <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-6">Task Distribution Analytics</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Chart */}
                    <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <p className="text-2xl font-bold text-white">{users.length}</p>
                            <p className="text-xs text-gray-400">Total Users</p>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-full">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Assigned Missions</p>
                                    <p className="text-xl font-bold text-white">{stats.withTasks} Users</p>
                                </div>
                            </div>
                            <span className="text-green-400 font-bold">{users.length ? Math.round((stats.withTasks / users.length) * 100) : 0}%</span>
                        </div>

                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/20 rounded-full">
                                    <XCircle className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">No Active Missions</p>
                                    <p className="text-xl font-bold text-white">{stats.withoutTasks} Users</p>
                                </div>
                            </div>
                            <span className="text-red-400 font-bold">{users.length ? Math.round((stats.withoutTasks / users.length) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Detailed List */}
            <GlassCard className="p-0 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between bg-white/5">
                    <h4 className="font-bold text-white">Detailed Breakdown</h4>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1 rounded text-xs transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            All Users
                        </button>
                        <button
                            onClick={() => setFilter('with')}
                            className={`px-3 py-1 rounded text-xs transition-colors ${filter === 'with' ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            Has Tasks
                        </button>
                        <button
                            onClick={() => setFilter('without')}
                            className={`px-3 py-1 rounded text-xs transition-colors ${filter === 'without' ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            No Tasks
                        </button>
                    </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No users found matching filter.</div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {filteredUsers.map((stat) => (
                                <div key={stat.user.uid} className="bg-transparent hover:bg-white/5 transition-colors">
                                    <div
                                        className="p-4 flex items-center justify-between cursor-pointer"
                                        onClick={() => setExpandedUser(expandedUser === stat.user.uid ? null : stat.user.uid)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <UserAvatar name={stat.user.name} photoURL={stat.user.photoURL} size="small" />
                                            <div>
                                                <p className="text-white font-medium text-sm">{stat.user.name}</p>
                                                <p className="text-xs text-gray-500">{stat.user.role}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className={`px-2 py-1 rounded text-xs flex items-center gap-1.5 ${stat.hasTask ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {stat.hasTask ? (
                                                    <>
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span>{stat.assignedTasks.length} Active Task{stat.assignedTasks.length !== 1 ? 's' : ''}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3 h-3" />
                                                        <span>No Tasks</span>
                                                    </>
                                                )}
                                            </div>
                                            {stat.hasTask && (
                                                <div className="text-gray-400">
                                                    {expandedUser === stat.user.uid ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedUser === stat.user.uid && stat.hasTask && (
                                        <div className="px-14 pb-4 space-y-2">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assigned Missions</p>
                                            {stat.assignedTasks.map((task, idx) => (
                                                <div key={idx} className="p-2 rounded bg-white/5 border border-white/5 flex items-center justify-between">
                                                    <span className="text-sm text-gray-300">{task.title}</span>
                                                    {task.isGroupTask && (
                                                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            via {task.groupName}
                                                        </span>
                                                    )}
                                                    {!task.isGroupTask && (
                                                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            Direct
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
