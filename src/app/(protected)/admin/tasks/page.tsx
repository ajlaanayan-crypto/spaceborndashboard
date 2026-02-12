"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { CheckCircle, Clock, User, MessageSquare, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllTasks, TaskData, createTask } from "@/services/taskService";
import { CommentSection } from "@/components/tasks/CommentSection";
import { TaskForm } from "@/components/tasks/TaskForm";
import { useAuth } from "@/context/AuthContext";

export default function AdminTasksPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTaskForComments, setSelectedTaskForComments] = useState<TaskData | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchTasks = () => {
        getAllTasks()
            .then(setTasks)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Global Task Overwatch</h1>
                    <p className="text-gray-400">Monitoring all active missions across the organization.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Create Mission
                </button>
            </div>

            <GlassCard>
                <div className="space-y-4">
                    {loading ? <p className="text-gray-500">Scanning tasks...</p> : tasks.length === 0 ? (
                        <p className="text-gray-500 italic">No tasks found in the system.</p>
                    ) : tasks.map(task => (
                        <div key={task.id} className="p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                            {task.title}
                                            {task.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                            {task.blockers && task.blockers.length > 0 && (
                                                <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">BLOCKED</span>
                                            )}
                                        </h4>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-1 mb-2">{task.description}</p>

                                    {/* New Fields Display */}
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {task.tags?.map(tag => (
                                            <span key={tag} className="text-[10px] bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-2 py-1 rounded text-xs capitalize ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {task.priority} Priority
                                    </span>
                                    {task.difficulty && (
                                        <span className={`px-2 py-1 rounded text-xs capitalize border border-white/5 ${task.difficulty === 'hard' ? 'text-purple-400' :
                                            task.difficulty === 'medium' ? 'text-gray-300' : 'text-gray-400'
                                            }`}>
                                            {task.difficulty} Diff.
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Due: {task.deadline}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-3 pt-3 border-t border-white/5 text-sm text-gray-400 items-center justify-between">
                                <div className="flex gap-4 items-center">
                                    <span className="uppercase tracking-wider">Status: <span className="text-white">{(task.status || "pending").replace("_", " ")}</span></span>
                                    <span className="flex items-center gap-1"><User className="w-4 h-4" /> <span className="text-white font-mono">{task.assignedTo || "Unassigned"}</span></span>
                                    {task.subtasks && task.subtasks.length > 0 && (
                                        <span className="flex items-center gap-1">
                                            Subtasks:
                                            <span className="text-white">
                                                {task.subtasks.filter(t => t.completed).length}/{task.subtasks.length}
                                            </span>
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setSelectedTaskForComments(task)}
                                    className="flex items-center gap-2 text-blue-400 hover:text-white transition-colors"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>Comms</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Comments Modal */}
            {selectedTaskForComments && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-2xl border-2 border-blue-500/30 relative max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">{selectedTaskForComments.title}</h2>
                                <p className="text-gray-400 text-sm">Mission Communications</p>
                            </div>
                            <button
                                onClick={() => setSelectedTaskForComments(null)}
                                className="text-gray-400 hover:text-white p-2"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <CommentSection taskId={selectedTaskForComments.id!} />
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Create Task Modal */}
            {showCreateModal && user && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <GlassCard className="w-full max-w-3xl border-2 border-blue-500/30 my-8">
                        <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Create New Mission</h2>
                                <p className="text-gray-400 text-sm">Assign objectives to team members or groups</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-white p-2"
                            >
                                ✕
                            </button>
                        </div>
                        <TaskForm
                            creatorId={user.uid}
                            onSubmit={async (taskData) => {
                                await createTask(taskData);
                                setShowCreateModal(false);
                                fetchTasks();
                            }}
                            onCancel={() => setShowCreateModal(false)}
                        />
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
