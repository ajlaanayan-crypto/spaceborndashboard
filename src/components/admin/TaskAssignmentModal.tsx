"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { createTask, TaskData } from "@/services/taskService";
import { UserData } from "@/services/userService";
import { GroupData } from "@/services/groupService";
import { useState, useEffect } from "react";
import { Loader2, Plus, Users, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface TaskAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: GroupData;
    members: UserData[]; // All members in the group
    onTaskCreated: () => void;
    preSelectedUserId?: string; // Optional: If opening for a specific user
}

export default function TaskAssignmentModal({ isOpen, onClose, group, members, onTaskCreated, preSelectedUserId }: TaskAssignmentModalProps) {
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen) {
            console.log("TaskAssignmentModal Opened:", { group, membersCount: members?.length, preSelectedUserId });
        }
    }, [isOpen, group, members, preSelectedUserId]);

    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assignmentType, setAssignmentType] = useState<'individual' | 'group'>(preSelectedUserId ? 'individual' : 'individual');
    const [assignedTo, setAssignedTo] = useState(preSelectedUserId || "");
    const [deadline, setDeadline] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!group?.id) {
                throw new Error("Group ID is missing");
            }

            // Safe user access
            const currentUserId = user?.uid || "system";

            // Safe assignment logic
            let assignedToId = "";
            let assignedToName = "";

            if (assignmentType === 'individual') {
                if (!assignedTo) throw new Error("Please select a member");
                assignedToId = assignedTo;
                const assignedMember = members.find(m => m.uid === assignedTo);
                assignedToName = assignedMember?.name || "Unknown Member";
            }

            const taskPayload: Omit<TaskData, 'id' | 'createdAt' | 'updatedAt'> = {
                title: title.trim(),
                description: description.trim(),
                status: 'pending',
                priority,
                deadline,
                assignedBy: currentUserId,
                type: assignmentType,
                groupId: group.id,
                groupName: group.name || "Unknown Group",
                assignedTo: assignedToId,
                assignedToName,
                assignedToGroup: assignmentType === 'group' ? group.id : undefined,
            };

            await createTask(taskPayload);
            onTaskCreated();
            onClose();
        } catch (error: any) {
            console.error("Failed to create task:", error);
            alert(error.message || "Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="max-w-xl w-full">
                <h2 className="text-2xl font-bold text-white mb-6">Assign New Task</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Assignment Type Toggle */}
                    <div className="flex gap-2 p-1 bg-white/5 rounded-lg mb-4">
                        <button
                            type="button"
                            onClick={() => setAssignmentType('individual')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-sm transition-colors ${assignmentType === 'individual' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            <User className="w-4 h-4" /> Individual
                        </button>
                        <button
                            type="button"
                            onClick={() => setAssignmentType('group')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-sm transition-colors ${assignmentType === 'group' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            <Users className="w-4 h-4" /> Whole Group
                        </button>
                    </div>

                    {/* Inputs */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Task Title *</label>
                        <input
                            required
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Description</label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {assignmentType === 'individual' && (
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Assign To *</label>
                                <select
                                    required={assignmentType === 'individual'}
                                    value={assignedTo}
                                    onChange={e => setAssignedTo(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Select Member...</option>
                                    {members.map(m => (
                                        <option key={m.uid} value={m.uid}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Deadline</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value as any)}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 rounded bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign Task"}
                        </button>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
}
