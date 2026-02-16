"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { CheckCircle, Clock, User, MessageSquare, Plus, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllTasks, TaskData, createTask, deleteTask, updateTask } from "@/services/taskService";
import { CommentSection } from "@/components/tasks/CommentSection";
import { TaskForm } from "@/components/tasks/TaskForm";
import { useAuth } from "@/context/AuthContext";
import { UserData, getAllUsers } from "@/services/userService";
import { GroupData, getAllGroups } from "@/services/groupService";
import { TaskDistributionStats } from "@/components/admin/TaskDistributionStats";
import { LayoutDashboard, ListTodo } from "lucide-react";

export default function AdminTasksPage() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTaskForComments, setSelectedTaskForComments] = useState<TaskData | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTask, setEditingTask] = useState<TaskData | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'distribution'>('list');
    const [users, setUsers] = useState<UserData[]>([]);
    const [groups, setGroups] = useState<GroupData[]>([]);

    const fetchTasks = () => {
        setLoading(true);
        Promise.all([
            getAllTasks(),
            getAllUsers(),
            getAllGroups()
        ])
            .then(([tasksData, usersData, groupsData]) => {
                setTasks(tasksData);
                setUsers(usersData);
                setGroups(groupsData);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleDelete = async (taskId: string) => {
        if (!confirm("Are you sure you want to delete this mission? This action cannot be undone.")) return;
        try {
            await deleteTask(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (error) {
            alert("Failed to delete task");
        }
    };

    const handleUpdate = async (taskData: any) => {
        if (!editingTask) return;
        try {
            await updateTask(editingTask.id!, taskData);
            setEditingTask(null);
            fetchTasks(); // Refresh to get latest data
        } catch (error) {
            alert("Failed to update task");
        }
    };

    const handleCreate = async (taskData: any) => {
        try {
            await createTask({
                ...taskData,
                assignedBy: user?.uid || "system"
            });
            setShowCreateModal(false);
            fetchTasks();
        } catch (error) {
            alert("Failed to create task");
        }
    };

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

            {/* View Toggle */}
            <div className="flex bg-white/5 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <ListTodo className="w-4 h-4" />
                    Task List
                </button>
                <button
                    onClick={() => setViewMode('distribution')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all ${viewMode === 'distribution' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Distribution Analytics
                </button>
            </div>

            {viewMode === 'distribution' ? (
                <TaskDistributionStats users={users} tasks={tasks} groups={groups} />
            ) : (
                <GlassCard>
                    <div className="space-y-4">
                        {loading ? <p className="text-gray-500">Scanning tasks...</p> : tasks.length === 0 ? (
                            <p className="text-gray-500 italic">No tasks found in the system.</p>
                        ) : tasks.map(task => (
                            <div key={task.id} className="p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group relative">
                                {/* Action Buttons */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setEditingTask(task)}
                                        className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded"
                                        title="Edit Mission"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(task.id!)}
                                        className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded"
                                        title="Delete Mission"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex justify-between items-start mb-2 pr-20"> {/* pr-20 for actions */}
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
                                        <span className="flex items-center gap-1"><User className="w-4 h-4" />
                                            <span className="text-white font-mono">
                                                {task.assignedToName || (task.type === 'group' ? task.groupName : task.assignedTo) || "Unassigned"}
                                            </span>
                                        </span>
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
                                        className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Comments
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Create Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="w-full max-w-3xl my-8">
                            <TaskForm
                                creatorId={user?.uid || ""}
                                onSubmit={handleCreate}
                                onCancel={() => setShowCreateModal(false)}
                            />
                        </div>
                    </div>
                )
            }

            {/* Edit Modal */}
            {
                editingTask && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="w-full max-w-3xl my-8">
                            <TaskForm
                                creatorId={user?.uid || ""}
                                onSubmit={handleUpdate}
                                initialData={editingTask}
                                onCancel={() => setEditingTask(null)}
                            />
                        </div>
                    </div>
                )
            }

            {/* Comments Modal */}
            {
                selectedTaskForComments && (
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
                )
            }

            {/* Create Task Modal */}
            {
                showCreateModal && user && (
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
                )
            }
        </div >
    );
}
