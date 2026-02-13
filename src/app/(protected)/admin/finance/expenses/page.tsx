"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { addTransaction, getTransactions, updateTransactionStatus, TransactionData } from "@/services/financeService";
import { Loader2, Plus, Upload, FileText, Check, X, Filter } from "lucide-react";
import { format } from "date-fns";

export default function ExpensesPage() {
    const { user, role } = useAuth();
    const [transactions, setTransactions] = useState<TransactionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>("All");

    const [formData, setFormData] = useState<{
        amount: string;
        category: string;
        description: string;
        paymentMode: string;
        type: 'credit' | 'debit';
    }>({
        amount: "",
        category: "R&D",
        description: "",
        paymentMode: "Bank Transfer",
        type: "debit"
    });

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const data = await getTransactions();
            setTransactions(data);
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
            await addTransaction({
                type: formData.type,
                category: formData.category as any,
                amount: parseFloat(formData.amount),
                date: new Date(),
                description: formData.description,
                paymentMode: formData.paymentMode,
                createdBy: user?.uid || "unknown",
            });
            setShowModal(false);
            setFormData({ amount: "", category: "R&D", description: "", paymentMode: "Bank Transfer", type: "debit" });
            fetchTransactions();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'cleared' | 'rejected') => {
        if (role !== 'admin') return;
        try {
            await updateTransactionStatus(id, status, user?.uid);
            fetchTransactions();
        } catch (error) {
            console.error(error);
        }
    };

    const filteredTransactions = filterCategory === "All"
        ? transactions
        : transactions.filter(t => t.category === filterCategory);

    const categories = ["All", "R&D", "Hardware", "Salaries", "Cloud", "Legal", "Marketing", "Ops", "Grant", "Investment", "Other"];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Expenses & Transactions</h1>
                    <p className="text-gray-400">Track company spending and revenue streams.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Record Transaction
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${filterCategory === cat
                            ? 'bg-white text-black'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <GlassCard className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading records...</td></tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No transactions found.</td></tr>
                            ) : (
                                filteredTransactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-300">
                                            {t.date?.toDate ? format(t.date.toDate(), 'MMM d, yyyy') : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-white font-medium text-sm">{t.description}</p>
                                            <p className="text-xs text-gray-500">{t.paymentMode}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded text-xs bg-white/10 text-gray-300 border border-white/5">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 font-mono font-bold ${t.type === 'credit' ? 'text-white' : 'text-gray-400'}`}>
                                            {t.type === 'credit' ? '+' : '-'}{Math.abs(t.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs uppercase ${t.status === 'cleared' ? 'bg-white/20 text-white' :
                                                t.status === 'rejected' ? 'bg-white/5 text-gray-500' :
                                                    'bg-white/10 text-gray-300'
                                                }`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {t.status === 'pending' && role === 'admin' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(t.id!, 'cleared')}
                                                        className="p-1.5 rounded bg-white/10 text-white hover:bg-white/20"
                                                        title="Approve"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(t.id!, 'rejected')}
                                                        className="p-1.5 rounded bg-white/5 text-gray-500 hover:bg-white/10"
                                                        title="Reject"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Add Transaction Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-md w-full border-blue-500/30">
                        <h2 className="text-xl font-bold text-white mb-6">Record Transaction</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex gap-4">
                                <label className="flex-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="type"
                                        className="peer sr-only"
                                        checked={formData.type === 'debit'}
                                        onChange={() => setFormData({ ...formData, type: 'debit' })}
                                    />
                                    <div className="text-center p-2 rounded border border-white/10 peer-checked:bg-white/20 peer-checked:border-white text-gray-400 peer-checked:text-white transition-all">
                                        Expense
                                    </div>
                                </label>
                                <label className="flex-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="type"
                                        className="peer sr-only"
                                        checked={formData.type === 'credit'}
                                        onChange={() => setFormData({ ...formData, type: 'credit' })}
                                    />
                                    <div className="text-center p-2 rounded border border-white/10 peer-checked:bg-white/20 peer-checked:border-white text-gray-400 peer-checked:text-white transition-all">
                                        Income
                                    </div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white font-mono focus:border-white/50 outline-none"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-white/50 outline-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-white/50 outline-none"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {categories.filter(c => c !== "All").map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Payment Mode</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-white/50 outline-none"
                                        value={formData.paymentMode}
                                        onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                                    >
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Credit Card">Credit Card</option>
                                        <option value="PayPal">PayPal</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Crypto">Crypto</option>
                                    </select>
                                </div>
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
                                    className="flex-1 py-2 rounded bg-white text-black hover:bg-gray-200 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Record"}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
