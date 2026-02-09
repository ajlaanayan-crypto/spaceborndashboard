'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Plus, Calendar, Clock, CheckCircle2,
    AlertCircle, MoreVertical, Trash2, ArrowRight
} from 'lucide-react';
import { Task } from '../../lib/types/tasks';
import { User } from '../../lib/types/users';
import { getAllTasks, createTask, updateTask, deleteTask } from '../../lib/firebaseTasks';
import { getAllUsers } from '../../lib/firebaseUsers';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

/* --- Components --- */

const TaskCard = ({ task, onStatusChange, onDelete }: { task: Task, onStatusChange: (id: string, status: Task['status']) => void, onDelete: (id: string) => void }) => {
    const priorityColor = {
        high: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
        medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    }[task.priority];

    return (
        <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl hover:bg-zinc-800/50 transition-all group relative">
            <div className="flex justify-between items-start mb-2">
                <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border", priorityColor)}>
                    {task.priority}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onDelete(task.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-zinc-700/50"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <h4 className="font-medium text-zinc-200 text-sm mb-1">{task.title}</h4>
            <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{task.description}</p>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800/50">
                <div className="flex items-center gap-2">
                    {task.assigneePhoto ? (
                        <img src={task.assigneePhoto} alt="Assignee" className="w-5 h-5 rounded-full" />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-400">
                            {task.assigneeName ? task.assigneeName.substring(0, 2).toUpperCase() : 'NA'}
                        </div>
                    )}
                    <span className="text-[10px] text-zinc-500">{task.assigneeName || 'Unassigned'}</span>
                </div>

                {/* Quick Status Move */}
                <div className="flex gap-1">
                    {task.status !== 'todo' && (
                        <button onClick={() => onStatusChange(task.id, 'todo')} className="p-1 hover:bg-zinc-700 rounded text-zinc-500" title="Move to Todo">
                            <div className="w-2 h-2 rounded-full bg-zinc-500" />
                        </button>
                    )}
                    {task.status !== 'in_progress' && (
                        <button onClick={() => onStatusChange(task.id, 'in_progress')} className="p-1 hover:bg-zinc-700 rounded text-amber-500" title="Move to In Progress">
                            <Clock className="w-3 h-3" />
                        </button>
                    )}
                    {task.status !== 'done' && (
                        <button onClick={() => onStatusChange(task.id, 'done')} className="p-1 hover:bg-zinc-700 rounded text-emerald-500" title="Move to Done">
                            <CheckCircle2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const TaskColumn = ({ title, tasks, status, onStatusChange, onDelete }: any) => (
    <div className="flex-1 min-w-[300px] bg-zinc-900/20 rounded-2xl p-4 border border-zinc-800/30 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-semibold text-zinc-400 text-sm flex items-center gap-2">
                {title}
                <span className="bg-zinc-800 text-zinc-500 text-xs px-2 py-0.5 rounded-full">{tasks.length}</span>
            </h3>
        </div>
        <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {tasks.map((task: Task) => (
                <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} onDelete={onDelete} />
            ))}
            {tasks.length === 0 && (
                <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
                    <p className="text-xs text-zinc-600">No tasks</p>
                </div>
            )}
        </div>
    </div>
);

/* --- Main Component --- */

export default function TaskView({ currentUser }: { currentUser: User }) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium' as 'low' | 'medium' | 'high',
        assigneeId: '',
    });

    const refreshData = async () => {
        setLoading(true);
        try {
            const [tasksData, usersData] = await Promise.all([
                getAllTasks(),
                getAllUsers()
            ]);
            setTasks(tasksData);
            setTeamMembers(usersData);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const assignee = teamMembers.find(u => u.uid === newTask.assigneeId);

            await createTask({
                title: newTask.title,
                description: newTask.description,
                status: 'todo', // Default
                priority: newTask.priority,
                assigneeId: newTask.assigneeId,
                assigneeName: assignee?.username || 'Unassigned',
                tags: [],
                createdBy: currentUser.uid
            } as any);

            toast.success('Task created');
            setShowModal(false);
            setNewTask({ title: '', description: '', priority: 'medium', assigneeId: '' });
            refreshData();
        } catch (error) {
            toast.error('Failed to create task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
        // Optimistic update
        const originalTasks = [...tasks];
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

        try {
            await updateTask(taskId, { status: newStatus });
            toast.success(`Moved to ${newStatus.replace('_', ' ')}`);
        } catch (error) {
            setTasks(originalTasks); // Revert
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (taskId: string) => {
        if (!confirm('Delete this task?')) return;
        try {
            await deleteTask(taskId);
            setTasks(tasks.filter(t => t.id !== taskId));
            toast.success('Task deleted');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    // Columns
    const todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'backlog');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const doneTasks = tasks.filter(t => t.status === 'done');

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        Task Board
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">Track project progress and assignments</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="h-4 w-4" />
                    New Task
                </button>
            </div>

            {/* Board */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
            ) : (
                <div className="flex-1 overflow-x-auto">
                    <div className="flex gap-6 h-full min-w-[900px]">
                        <TaskColumn
                            title="To Do"
                            tasks={todoTasks}
                            status="todo"
                            onStatusChange={handleStatusChange}
                            onDelete={handleDelete}
                        />
                        <TaskColumn
                            title="In Progress"
                            tasks={inProgressTasks}
                            status="in_progress"
                            onStatusChange={handleStatusChange}
                            onDelete={handleDelete}
                        />
                        <TaskColumn
                            title="Completed"
                            tasks={doneTasks}
                            status="done"
                            onStatusChange={handleStatusChange}
                            onDelete={handleDelete}
                        />
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-white mb-6">Create New Task</h3>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-zinc-400">TITLE</label>
                                <input
                                    type="text"
                                    required
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full mt-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
                                    placeholder="Task title..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-zinc-400">DESCRIPTION</label>
                                <textarea
                                    required
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    className="w-full mt-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:border-indigo-500 outline-none h-24 resize-none"
                                    placeholder="Details..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-zinc-400">PRIORITY</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}
                                        className="w-full mt-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-zinc-400">ASSIGNEE</label>
                                    <select
                                        value={newTask.assigneeId}
                                        onChange={e => setNewTask({ ...newTask, assigneeId: e.target.value })}
                                        className="w-full mt-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">Unassigned</option>
                                        {teamMembers.map(u => (
                                            <option key={u.uid} value={u.uid}>{u.username}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium">
                                    {isSubmitting ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
