"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader2, Plus, X, Tag, AlertCircle, Users, User, Building2 } from "lucide-react";
import { UserData, getUsersByRole } from "@/services/userService";
import { TaskData, getAllTasks } from "@/services/taskService";
import { getActiveGroups, GroupData } from "@/services/groupService";

interface TaskFormProps {
    onSubmit: (task: any) => Promise<void>;
    initialData?: Partial<TaskData>;
    creatorId: string;
    onCancel: () => void;
}

export function TaskForm({ onSubmit, initialData, creatorId, onCancel }: TaskFormProps) {
    const [loading, setLoading] = useState(false);
    const [interns, setInterns] = useState<UserData[]>([]);
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [availableTasks, setAvailableTasks] = useState<TaskData[]>([]);
    const [subtaskInput, setSubtaskInput] = useState("");
    const [tagInput, setTagInput] = useState("");

    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        description: initialData?.description || "",
        type: initialData?.type || "individual",
        assignedTo: initialData?.assignedTo || "",
        assignedToName: initialData?.assignedToName || "",
        groupId: initialData?.groupId || "",
        groupName: initialData?.groupName || "",
        deadline: initialData?.deadline || "",
        priority: initialData?.priority || "medium",
        difficulty: initialData?.difficulty || "medium",
        estimatedHours: initialData?.estimatedHours || 1,
        tags: initialData?.tags || [],
        subtasks: initialData?.subtasks || [],
        blockers: initialData?.blockers || []
    });

    useEffect(() => {
        const fetchData = async () => {
            const [internsData, groupsData, tasksData] = await Promise.all([
                getUsersByRole("intern"),
                getActiveGroups(),
                getAllTasks()
            ]);
            setInterns(internsData);
            setGroups(groupsData);
            setAvailableTasks(tasksData.filter(t => t.id !== initialData?.id));
        };
        fetchData();
    }, [initialData?.id]);

    const handleAddSubtask = () => {
        if (!subtaskInput.trim()) return;
        setFormData(prev => ({
            ...prev,
            subtasks: [...(prev.subtasks || []), { id: crypto.randomUUID(), title: subtaskInput, completed: false }]
        }));
        setSubtaskInput("");
    };

    const handleRemoveSubtask = (id: string) => {
        setFormData(prev => ({
            ...prev,
            subtasks: prev.subtasks?.filter(s => s.id !== id)
        }));
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!formData.tags?.includes(tagInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...(prev.tags || []), tagInput.trim()]
                }));
            }
            setTagInput("");
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags?.filter(t => t !== tag)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submissionData = { ...formData };

            // Logic for Individual vs Group
            if (formData.type === 'individual') {
                const selectedIntern = interns.find(i => i.uid === formData.assignedTo);
                if (selectedIntern) {
                    submissionData.assignedToName = selectedIntern.name;
                    // Keep groupId/groupName if set (Associated Group), otherwise they might be empty
                }

                // If a group is selected, ensure groupName is set
                if (submissionData.groupId) {
                    const selectedGroup = groups.find(g => g.id === submissionData.groupId);
                    if (selectedGroup) {
                        submissionData.groupName = selectedGroup.name;
                    }
                }
            } else {
                // Group Task
                const selectedGroup = groups.find(g => g.id === formData.groupId);
                if (selectedGroup) {
                    submissionData.groupName = selectedGroup.name;
                    submissionData.assignedTo = "";
                    submissionData.assignedToName = "";
                }
            }

            await onSubmit(submissionData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassCard>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Objective Title</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Description</label>
                            <textarea
                                required
                                rows={4}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Assignment Type Toggle */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Assignment Type</label>
                            <div className="flex gap-4">
                                <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg border flex-1 transition-colors ${formData.type === 'individual'
                                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                        : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="individual"
                                        checked={formData.type === 'individual'}
                                        onChange={() => setFormData({ ...formData, type: 'individual' })}
                                        className="hidden"
                                    />
                                    <User className="w-4 h-4" />
                                    Individual
                                </label>
                                <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg border flex-1 transition-colors ${formData.type === 'group'
                                        ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                        : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="group"
                                        checked={formData.type === 'group'}
                                        onChange={() => setFormData({ ...formData, type: 'group' })}
                                        className="hidden"
                                    />
                                    <Users className="w-4 h-4" />
                                    Group
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {formData.type === 'individual' ? (
                                <>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Assign To (Person)</label>
                                        <select
                                            required
                                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                            value={formData.assignedTo}
                                            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                        >
                                            <option value="">Select Intern</option>
                                            {interns.map(intern => (
                                                <option key={intern.uid} value={intern.uid}>{intern.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Group Context (Optional)</label>
                                        <select
                                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                            value={formData.groupId}
                                            onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                                        >
                                            <option value="">No Group</option>
                                            {groups.map(group => (
                                                <option key={group.id} value={group.id}>{group.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">Assign To (Group)</label>
                                    <select
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-purple-500"
                                        value={formData.groupId}
                                        onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                                    >
                                        <option value="">Select Group</option>
                                        {groups.map(group => (
                                            <option key={group.id} value={group.id}>{group.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Deadlines etc */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Deadline</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Estimated Hours</label>
                                <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={formData.estimatedHours}
                                    onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Priority</label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map((p) => (
                                        <label key={p} className={`flex-1 cursor-pointer border rounded-lg p-2 text-center capitalize text-sm transition-all ${formData.priority === p
                                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                            : 'border-white/10 text-gray-400 hover:bg-white/5'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="priority"
                                                value={p}
                                                checked={formData.priority === p}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                                className="hidden"
                                            />
                                            {p}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tags & Blockers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Tags (Press Enter)</label>
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="text"
                                className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder="e.g. Frontend, API, Urgent"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.tags?.map(tag => (
                                <span key={tag} className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-white"><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Blockers (Prerequisite Tasks)</label>
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            onChange={(e) => {
                                if (e.target.value && !formData.blockers?.includes(e.target.value)) {
                                    setFormData(prev => ({ ...prev, blockers: [...(prev.blockers || []), e.target.value] }));
                                }
                            }}
                            value=""
                        >
                            <option value="">Add Blocker...</option>
                            {availableTasks.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                        <div className="mt-2 space-y-1">
                            {formData.blockers?.map(blockerId => {
                                const task = availableTasks.find(t => t.id === blockerId);
                                return (
                                    <div key={blockerId} className="flex items-center justify-between text-xs bg-red-500/10 text-red-300 p-2 rounded">
                                        <span className="flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {task?.title || "Unknown Task"}</span>
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, blockers: prev.blockers?.filter(b => b !== blockerId) }))}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Subtasks */}
                <div className="pt-4 border-t border-white/5">
                    <label className="block text-sm text-gray-400 mb-2">Subtasks</label>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            value={subtaskInput}
                            onChange={(e) => setSubtaskInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                            placeholder="Add a subtask..."
                        />
                        <button
                            type="button"
                            onClick={handleAddSubtask}
                            className="bg-blue-600/20 text-blue-400 p-2 rounded hover:bg-blue-600/30 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {formData.subtasks?.map(subtask => (
                            <div key={subtask.id} className="flex items-center gap-3 p-2 bg-white/5 rounded group">
                                <div className={`w-4 h-4 rounded-full border border-gray-500 ${subtask.completed ? 'bg-green-500 border-green-500' : ''}`}></div>
                                <span className="flex-1 text-sm text-gray-300">{subtask.title}</span>
                                <button type="button" onClick={() => handleRemoveSubtask(subtask.id)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-white/5">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center justify-center font-medium shadow-lg shadow-blue-900/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Transmit Orders"}
                    </button>
                </div>
            </form>
        </GlassCard>
    );
}
