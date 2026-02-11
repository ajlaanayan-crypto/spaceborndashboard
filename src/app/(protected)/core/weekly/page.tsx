"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    createWeeklyPlan,
    getGroupWeeklyPlans,
    updateWeeklyPlan,
    getMonday,
    getSunday,
    getWeekRange,
    WeeklyPlanData
} from "@/services/weeklyPlanService";
import { getUserGroups, getGroupMembers, GroupData, GroupMemberData } from "@/services/groupService";
import { Loader2, Plus, Edit2, Check, X } from "lucide-react";
import { format } from "date-fns";

export default function CoreWeeklyPlanningPage() {
    const { user } = useAuth();
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
    const [members, setMembers] = useState<GroupMemberData[]>([]);
    const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlanData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<WeeklyPlanData | null>(null);
    const [creating, setCreating] = useState(false);

    const currentWeekStart = getMonday(new Date());
    const currentWeekEnd = getSunday(new Date());

    const [formData, setFormData] = useState({
        userId: "",
        userName: "",
        focus: "",
        tasks: [""],
        deliverables: [""],
        resources: [""],
        progress: 'not_started' as WeeklyPlanData['progress'],
        notes: "",
    });

    useEffect(() => {
        if (user?.uid) {
            fetchUserGroups();
        }
    }, [user?.uid]);

    useEffect(() => {
        if (selectedGroup) {
            fetchGroupData();
        }
    }, [selectedGroup]);

    const fetchUserGroups = async () => {
        if (!user?.uid) return;
        try {
            const userGroups = await getUserGroups(user.uid);
            setGroups(userGroups);
            if (userGroups.length > 0) {
                setSelectedGroup(userGroups[0]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroupData = async () => {
        if (!selectedGroup) return;
        try {
            const [groupMembers, plans] = await Promise.all([
                getGroupMembers(selectedGroup.id!),
                getGroupWeeklyPlans(selectedGroup.id!, currentWeekStart)
            ]);
            setMembers(groupMembers);
            setWeeklyPlans(plans);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenModal = (member?: GroupMemberData, plan?: WeeklyPlanData) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                userId: plan.userId,
                userName: plan.userName,
                focus: plan.focus,
                tasks: plan.tasks,
                deliverables: plan.deliverables,
                resources: plan.resources,
                progress: plan.progress,
                notes: plan.notes || "",
            });
        } else if (member) {
            setEditingPlan(null);
            setFormData({
                userId: member.userId,
                userName: member.userName,
                focus: "",
                tasks: [""],
                deliverables: [""],
                resources: [""],
                progress: 'not_started',
                notes: "",
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup || !user?.uid) return;

        setCreating(true);
        try {
            const planData = {
                groupId: selectedGroup.id!,
                groupName: selectedGroup.name,
                userId: formData.userId,
                userName: formData.userName,
                weekStartDate: currentWeekStart,
                weekEndDate: currentWeekEnd,
                focus: formData.focus,
                tasks: formData.tasks.filter(t => t.trim()),
                deliverables: formData.deliverables.filter(d => d.trim()),
                resources: formData.resources.filter(r => r.trim()),
                progress: formData.progress,
                notes: formData.notes,
                createdBy: user.uid,
                createdByName: user.displayName || user.email || "Unknown",
            };

            if (editingPlan) {
                await updateWeeklyPlan(editingPlan.id!, planData);
            } else {
                await createWeeklyPlan(planData);
            }

            fetchGroupData();
            setShowModal(false);
        } catch (error) {
            console.error(error);
        } finally {
            setCreating(false);
        }
    };

    const addArrayField = (field: 'tasks' | 'deliverables' | 'resources') => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], ""]
        }));
    };

    const updateArrayField = (field: 'tasks' | 'deliverables' | 'resources', index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].map((item, i) => i === index ? value : item)
        }));
    };

    const removeArrayField = (field: 'tasks' | 'deliverables' | 'resources', index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const getMemberPlan = (userId: string) => {
        return weeklyPlans.find(p => p.userId === userId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <GlassCard className="text-center py-12">
                <p className="text-gray-400">You are not assigned to any groups yet.</p>
            </GlassCard>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Weekly Planning</h1>
                <p className="text-gray-400">Plan and track weekly progress for your team</p>
                <p className="text-sm text-blue-400 mt-1">Week: {getWeekRange(new Date())}</p>
            </div>

            {/* Group Selector */}
            {groups.length > 1 && (
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Select Group</label>
                    <select
                        className="bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                        value={selectedGroup?.id || ""}
                        onChange={(e) => setSelectedGroup(groups.find(g => g.id === e.target.value) || null)}
                    >
                        {groups.map(group => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Team Members Weekly Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map((member) => {
                    const plan = getMemberPlan(member.userId);
                    return (
                        <GlassCard key={member.id} className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{member.userName}</h3>
                                    <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400">
                                        {member.role.replace('_', ' ')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleOpenModal(member, plan)}
                                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm flex items-center gap-1"
                                >
                                    {plan ? <><Edit2 className="w-3 h-3" /> Edit</> : <><Plus className="w-3 h-3" /> Create</>}
                                </button>
                            </div>

                            {plan ? (
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <p className="text-gray-400 text-xs">Focus</p>
                                        <p className="text-white">{plan.focus}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Tasks ({plan.tasks.length})</p>
                                        <ul className="list-disc list-inside text-white">
                                            {plan.tasks.slice(0, 3).map((task, i) => (
                                                <li key={i} className="truncate">{task}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <span className={`px-2 py-1 rounded text-xs ${plan.progress === 'completed' ? 'bg-green-500/10 text-green-400' :
                                                plan.progress === 'in_progress' ? 'bg-blue-500/10 text-blue-400' :
                                                    plan.progress === 'blocked' ? 'bg-red-500/10 text-red-400' :
                                                        'bg-gray-500/10 text-gray-400'
                                            }`}>
                                            {plan.progress.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm italic">No plan for this week</p>
                            )}
                        </GlassCard>
                    );
                })}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <GlassCard className="max-w-2xl w-full my-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {editingPlan ? 'Edit' : 'Create'} Weekly Plan - {formData.userName}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Main Focus *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={formData.focus}
                                    onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Tasks</label>
                                {formData.tasks.map((task, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                            value={task}
                                            onChange={(e) => updateArrayField('tasks', index, e.target.value)}
                                        />
                                        {formData.tasks.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeArrayField('tasks', index)}
                                                className="px-2 text-red-400 hover:text-red-300"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addArrayField('tasks')}
                                    className="text-sm text-blue-400 hover:text-blue-300"
                                >
                                    + Add Task
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Deliverables</label>
                                {formData.deliverables.map((deliverable, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                            value={deliverable}
                                            onChange={(e) => updateArrayField('deliverables', index, e.target.value)}
                                        />
                                        {formData.deliverables.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeArrayField('deliverables', index)}
                                                className="px-2 text-red-400 hover:text-red-300"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addArrayField('deliverables')}
                                    className="text-sm text-blue-400 hover:text-blue-300"
                                >
                                    + Add Deliverable
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Resources Needed</label>
                                {formData.resources.map((resource, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                            value={resource}
                                            onChange={(e) => updateArrayField('resources', index, e.target.value)}
                                        />
                                        {formData.resources.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeArrayField('resources', index)}
                                                className="px-2 text-red-400 hover:text-red-300"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addArrayField('resources')}
                                    className="text-sm text-blue-400 hover:text-blue-300"
                                >
                                    + Add Resource
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Progress Status</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={formData.progress}
                                    onChange={(e) => setFormData({ ...formData, progress: e.target.value as any })}
                                >
                                    <option value="not_started">Not Started</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="blocked">Blocked</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Notes (Optional)</label>
                                <textarea
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2 rounded bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center justify-center"
                                >
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : editingPlan ? "Update Plan" : "Create Plan"}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
