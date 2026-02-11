"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { createBudget, getBudgets, BudgetData } from "@/services/financeService";
import { Loader2, Plus, PieChart, TrendingUp, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function BudgetsPage() {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState<BudgetData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        type: "project" as const,
        allocated: "",
        startDate: "",
        endDate: "",
        description: ""
    });

    useEffect(() => {
        fetchBudgets();
    }, []);

    const fetchBudgets = async () => {
        try {
            const data = await getBudgets();
            setBudgets(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createBudget({
                name: formData.name,
                type: formData.type,
                allocated: parseFloat(formData.allocated),
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
                status: 'active',
                description: formData.description
            });
            setShowModal(false);
            setFormData({ name: "", type: "project", allocated: "", startDate: "", endDate: "", description: "" });
            fetchBudgets();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const calculateProgress = (spent: number, allocated: number) => {
        if (allocated === 0) return 0;
        return Math.min((spent / allocated) * 100, 100);
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 100) return "bg-red-500";
        if (percentage >= 80) return "bg-yellow-500";
        return "bg-blue-500";
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Budget Management</h1>
                    <p className="text-gray-400">Allocate and track funds across projects and teams.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create Budget
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-gray-500">Loading budgets...</div>
                ) : budgets.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500">No active budgets found. Start by creating one.</div>
                ) : (
                    budgets.map((budget) => {
                        const progress = calculateProgress(budget.spent, budget.allocated);
                        const isOverBudget = budget.spent > budget.allocated;
                        const remaining = budget.allocated - budget.spent;

                        const startDate = budget.startDate?.toDate ? budget.startDate.toDate() : new Date(budget.startDate);
                        const endDate = budget.endDate?.toDate ? budget.endDate.toDate() : new Date(budget.endDate);
                        const daysLeft = differenceInDays(endDate, new Date());

                        return (
                            <GlassCard key={budget.id} className="space-y-4 hover:bg-white/5 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${budget.type === 'project' ? 'border-white/30 text-white' : 'border-white/10 text-gray-400'
                                                }`}>
                                                {budget.type}
                                            </span>
                                            {daysLeft < 0 && <span className="text-xs text-gray-500 font-bold">Expired</span>}
                                        </div>
                                        <h3 className="text-lg font-bold text-white">{budget.name}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">Allocated</p>
                                        <p className="font-mono text-white font-bold">{budget.allocated.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-400 line-clamp-2 min-h-[40px]">{budget.description || "No description provided."}</p>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className={isOverBudget ? "text-white font-bold" : "text-gray-300"}>
                                            {budget.spent.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })} spent
                                        </span>
                                        <span className="text-gray-400">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${isOverBudget ? 'bg-white' : 'bg-gray-400'} transition-all duration-500`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <AlertTriangle className={`w-3 h-3 ${isOverBudget ? 'text-white' : 'text-gray-500'}`} />
                                        <span>{remaining.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })} remaining</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>Ends {format(endDate, 'MMM d')}</span>
                                        <span className={`px-1.5 py-0.5 rounded ${daysLeft < 30 ? 'bg-white/10 text-white' : 'bg-white/5'}`}>
                                            {daysLeft > 0 ? `${daysLeft}d left` : 'Ended'}
                                        </span>
                                    </div>
                                </div>
                            </GlassCard>
                        );
                    })
                )}
            </div>

            {/* Create Budget Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-md w-full border-blue-500/30">
                        <h2 className="text-xl font-bold text-white mb-6">Create New Budget</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Budget Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Mars Rover R&D"
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Type</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="project">Project Budget</option>
                                        <option value="team">Team Budget</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Amount (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white font-mono focus:border-blue-500 outline-none"
                                        value={formData.allocated}
                                        onChange={(e) => setFormData({ ...formData, allocated: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none h-20"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex gap-3 mt-6 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2 rounded bg-white/5 text-gray-300 hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Budget"}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
