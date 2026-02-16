"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { MessagesWidget } from "@/components/dashboard/MessagesWidget";
import { Briefcase, Users, Plus, ListTodo } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCreatedTasks, TaskData } from "@/services/taskService";
import { useAuth } from "@/context/AuthContext";

export default function CoreDashboard() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getCreatedTasks(user.uid).then(setTasks).finally(() => setLoading(false));
        }
    }, [user]);

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
                        <p className="text-gray-400 text-sm">Active Tasks</p>
                        <h3 className="text-2xl font-bold text-white">{tasks.filter(t => t.status !== 'completed').length}</h3>
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
                <h3 className="text-xl font-bold text-white mb-4">Recent Assignments</h3>
                {loading ? (
                    <p className="text-gray-500">Retrieving data...</p>
                ) : tasks.length === 0 ? (
                    <p className="text-gray-500">No active assignments.</p>
                ) : (
                    <div className="space-y-3">
                        {tasks.slice(0, 5).map(task => (
                            <div key={task.id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors">
                                <div>
                                    <p className="text-white font-medium">{task.title}</p>
                                    <p className="text-xs text-gray-400">Due: {task.deadline}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs capitalize ${task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                    task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {(task.status || "pending").replace("_", " ")}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>

            {/* Messages Widget */}
            <MessagesWidget />
        </div>
    );
}
