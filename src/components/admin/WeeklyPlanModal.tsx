"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { WeeklyPlanData, saveWeeklyPlan, getCurrentWeekStartDate } from "@/services/weeklyPlanService";
import { UserData } from "@/services/userService";
import { GroupData } from "@/services/groupService";
import { useState, useEffect } from "react";
import { Loader2, Save, Plus, Trash2, Link as LinkIcon, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface WeeklyPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: GroupData;
    memberUser: UserData; // The user whose plan is being edited
    initialPlan: WeeklyPlanData | null;
    onSave: () => void;
    isReadOnly: boolean;
}

export default function WeeklyPlanModal({ isOpen, onClose, group, memberUser, initialPlan, onSave, isReadOnly }: WeeklyPlanModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [weekStart, setWeekStart] = useState("");

    const [formData, setFormData] = useState<Omit<WeeklyPlanData, 'id' | 'createdAt' | 'updatedAt'>>({
        groupId: group.id!,
        userId: memberUser.uid!,
        weekStartDate: "",
        role: memberUser.role || "member",
        weeklyFocus: "",
        expectedDeliverables: [],
        resources: []
    });

    const [newDeliverable, setNewDeliverable] = useState("");
    const [newResource, setNewResource] = useState("");

    useEffect(() => {
        if (isOpen) {
            const currentWeek = getCurrentWeekStartDate();
            setWeekStart(currentWeek);

            if (initialPlan) {
                setFormData({
                    ...initialPlan,
                    // Ensure id/createdAt/updatedAt are stripped if we strictly follow the type, 
                    // or just rely on the spread. But for the state we only need editable fields.
                    groupId: initialPlan.groupId,
                    userId: initialPlan.userId,
                    weekStartDate: initialPlan.weekStartDate,
                    role: initialPlan.role,
                    weeklyFocus: initialPlan.weeklyFocus,
                    expectedDeliverables: initialPlan.expectedDeliverables || [],
                    resources: initialPlan.resources || []
                });
            } else {
                setFormData({
                    groupId: group.id!,
                    userId: memberUser.uid!,
                    weekStartDate: currentWeek,
                    role: memberUser.role || "member",
                    weeklyFocus: "",
                    expectedDeliverables: [],
                    resources: []
                });
            }
        }
    }, [isOpen, initialPlan, group, memberUser]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await saveWeeklyPlan(formData);
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to save plan:", error);
            alert("Failed to save plan");
        } finally {
            setLoading(false);
        }
    };

    const addDeliverable = () => {
        if (!newDeliverable.trim()) return;
        setFormData(prev => ({
            ...prev,
            expectedDeliverables: [...prev.expectedDeliverables, newDeliverable.trim()]
        }));
        setNewDeliverable("");
    };

    const removeDeliverable = (index: number) => {
        setFormData(prev => ({
            ...prev,
            expectedDeliverables: prev.expectedDeliverables.filter((_, i) => i !== index)
        }));
    };

    const addResource = () => {
        if (!newResource.trim()) return;
        setFormData(prev => ({
            ...prev,
            resources: [...prev.resources, newResource.trim()]
        }));
        setNewResource("");
    };

    const removeResource = (index: number) => {
        setFormData(prev => ({
            ...prev,
            resources: prev.resources.filter((_, i) => i !== index)
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Weekly Plan</h2>
                        <p className="text-gray-400 text-sm">
                            {memberUser.name} • {memberUser.role?.replace('_', ' ')} • Week of {formData.weekStartDate}
                        </p>
                    </div>
                    {/* Can add week selector here later */}
                    <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20 flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> Current Week
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Weekly Focus */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Weekly Focus</label>
                        <textarea
                            disabled={isReadOnly}
                            value={formData.weeklyFocus}
                            onChange={e => setFormData({ ...formData, weeklyFocus: e.target.value })}
                            placeholder="What is the main goal for this week?"
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        />
                    </div>

                    {/* Expected Deliverables */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Expected Deliverables</label>
                        <div className="space-y-2 mb-3">
                            {formData.expectedDeliverables.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white/5 p-2 rounded">
                                    <span className="flex-1 text-sm text-gray-300">{item}</span>
                                    {!isReadOnly && (
                                        <button onClick={() => removeDeliverable(i)} className="text-red-400 hover:text-red-300">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {formData.expectedDeliverables.length === 0 && (
                                <p className="text-xs text-gray-600 italic">No deliverables added.</p>
                            )}
                        </div>
                        {!isReadOnly && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newDeliverable}
                                    onChange={e => setNewDeliverable(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addDeliverable()}
                                    placeholder="Add deliverable..."
                                    className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                                <button onClick={addDeliverable} className="p-2 bg-blue-600 hover:bg-blue-500 rounded text-white">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Resources */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Resources & References</label>
                        <div className="space-y-2 mb-3">
                            {formData.resources.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white/5 p-2 rounded">
                                    <LinkIcon className="w-3 h-3 text-blue-400" />
                                    <span className="flex-1 text-sm text-blue-300 truncate underline cursor-pointer" onClick={() => window.open(item.startsWith('http') ? item : `https://${item}`, '_blank')}>
                                        {item}
                                    </span>
                                    {!isReadOnly && (
                                        <button onClick={() => removeResource(i)} className="text-red-400 hover:text-red-300">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {formData.resources.length === 0 && (
                                <p className="text-xs text-gray-600 italic">No resources added.</p>
                            )}
                        </div>
                        {!isReadOnly && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newResource}
                                    onChange={e => setNewResource(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addResource()}
                                    placeholder="Add URL or resource name..."
                                    className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                                <button onClick={addResource} className="p-2 bg-blue-600 hover:bg-blue-500 rounded text-white">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                    >
                        Close
                    </button>
                    {!isReadOnly && (
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 py-2 rounded bg-green-600 hover:bg-green-500 text-white transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Weekly Plan
                        </button>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
