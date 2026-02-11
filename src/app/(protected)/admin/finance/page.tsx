"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, PieChart, Activity, AlertCircle, CreditCard, ArrowRight } from "lucide-react";
import { getFinancialSummary, getTransactions, TransactionData } from "@/services/financeService";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/AuthContext";

export default function FinanceDashboard() {
    const { role } = useAuth();
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        balance: 0,
        burnRate: 0,
        runway: 0
    });
    const [transactions, setTransactions] = useState<TransactionData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const summaryData = await getFinancialSummary();
                const txData = await getTransactions();
                setSummary(summaryData);
                setTransactions(txData.slice(0, 5)); // Recent 5
            } catch (error) {
                console.error("Error fetching finance data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    if (role === 'intern' || role === 'normal_employee') {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center p-8 bg-white/5 rounded-xl border border-white/10">
                    <AlertCircle className="w-12 h-12 text-white mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
                    <p className="text-gray-400">You do not have permission to view financial data.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Finance & Revenue</h1>
                    <p className="text-gray-400">Financial overview, burn rate, and budget tracking.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/finance/expenses">
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center gap-2">
                            Expenses
                        </button>
                    </Link>
                    <Link href="/admin/finance/budgets">
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center gap-2">
                            Budgets
                        </button>
                    </Link>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <GlassCard className="space-y-2">
                    <div className="flex items-center justify-between text-gray-400 text-sm">
                        <span>Current Balance</span>
                        <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-white">{formatCurrency(summary.balance)}</p>
                    <p className="text-xs text-gray-500">Available Funds</p>
                </GlassCard>

                <GlassCard className="space-y-2">
                    <div className="flex items-center justify-between text-gray-400 text-sm">
                        <span>Total Revenue</span>
                        <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-white">{formatCurrency(summary.totalRevenue)}</p>
                    <p className="text-xs text-gray-500">All Time Funding</p>
                </GlassCard>

                <GlassCard className="space-y-2">
                    <div className="flex items-center justify-between text-gray-400 text-sm">
                        <span>Monthly Burn Rate</span>
                        <Activity className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{formatCurrency(summary.burnRate)}</p>
                    <p className="text-xs text-gray-500">Avg. Monthly Expenses</p>
                </GlassCard>

                <GlassCard className="space-y-2">
                    <div className="flex items-center justify-between text-gray-400 text-sm">
                        <span>Runway</span>
                        <TrendingDown className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{summary.runway.toFixed(1)} Months</p>
                    <p className="text-xs text-gray-500">Based on current burn</p>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Transactions */}
                <div className="lg:col-span-2">
                    <GlassCard className="h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
                            <Link href="/admin/finance/expenses" className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                                View All <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                <p className="text-gray-500 text-center py-4">Loading financial data...</p>
                            ) : transactions.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No recent transactions recorded.</p>
                            ) : (
                                transactions.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${t.type === 'credit' ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400'}`}>
                                                {t.type === 'credit' ? <TrendingUp className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{t.description}</p>
                                                <p className="text-xs text-gray-400 flex items-center gap-2">
                                                    <span>{t.category}</span>
                                                    <span>•</span>
                                                    <span>{t.date?.toDate ? formatDistanceToNow(t.date.toDate(), { addSuffix: true }) : 'Just now'}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${t.type === 'credit' ? 'text-white' : 'text-gray-400'}`}>
                                                {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                                            </p>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${t.status === 'cleared' ? 'bg-white/20 text-white' :
                                                t.status === 'rejected' ? 'bg-white/5 text-gray-500' :
                                                    'bg-white/10 text-gray-300'
                                                }`}>
                                                {t.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Quick Actions / Shortcuts */}
                <div className="space-y-6">
                    <Link href="/admin/finance/investors">
                        <GlassCard className="hover:bg-white/5 transition-colors cursor-pointer group mb-6">
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white transition-colors">Investor Management</h3>
                            <p className="text-sm text-gray-400">Track pending commitments and manage investor profiles.</p>
                        </GlassCard>
                    </Link>

                    <Link href="/admin/finance/assets">
                        <GlassCard className="hover:bg-white/5 transition-colors cursor-pointer group mb-6">
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white transition-colors">Asset Register</h3>
                            <p className="text-sm text-gray-400">Manage equipment, hardware components, and software licenses.</p>
                        </GlassCard>
                    </Link>

                    <GlassCard>
                        <h3 className="text-lg font-bold text-white mb-4">Financial Health</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400">Budget Utilization (Q1)</span>
                                    <span className="text-white">64%</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-white w-[64%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400">R&D Spend</span>
                                    <span className="text-white">42%</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-400 w-[42%]"></div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
