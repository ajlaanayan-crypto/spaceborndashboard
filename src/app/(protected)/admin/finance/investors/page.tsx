"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useState, useEffect } from "react";
import { addInvestor, getInvestors, InvestorData } from "@/services/financeService";
import { Loader2, Plus, TrendingUp, Mail, Phone, ExternalLink } from "lucide-react";

export default function InvestorsPage() {
    const [investors, setInvestors] = useState<InvestorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        type: "VC" as const,
        committedAmount: "",
        receivedAmount: "",
        email: "",
        phone: "",
        representative: "",
        notes: ""
    });

    useEffect(() => {
        fetchInvestors();
    }, []);

    const fetchInvestors = async () => {
        try {
            const data = await getInvestors();
            setInvestors(data);
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
            await addInvestor({
                name: formData.name,
                type: formData.type,
                committedAmount: parseFloat(formData.committedAmount),
                receivedAmount: parseFloat(formData.receivedAmount || "0"),
                contactInfo: {
                    email: formData.email,
                    phone: formData.phone,
                    representative: formData.representative
                },
                status: 'active',
                notes: formData.notes
            });
            setShowModal(false);
            setFormData({
                name: "",
                type: "VC",
                committedAmount: "",
                receivedAmount: "",
                email: "",
                phone: "",
                representative: "",
                notes: ""
            });
            fetchInvestors();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Investor Relations</h1>
                    <p className="text-gray-400">Manage investors, commitments, and funding rounds.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Investor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-gray-500">Loading investors...</div>
                ) : investors.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500">No investors recorded.</div>
                ) : (
                    investors.map((investor) => {
                        const percentFunded = (investor.receivedAmount / investor.committedAmount) * 100;

                        return (
                            <GlassCard key={investor.id} className="space-y-4 hover:bg-white/5 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-full ${investor.type === 'VC' ? 'bg-white/10 text-white' :
                                            investor.type === 'Angel' ? 'bg-white/5 text-gray-400' :
                                                'bg-white/20 text-white'
                                            }`}>
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{investor.name}</h3>
                                            <p className="text-xs text-gray-400">{investor.type} Investor</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${investor.status === 'active' ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-500'
                                            }`}>
                                            {investor.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-white/5">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Committed</p>
                                        <p className="text-lg font-mono text-white font-bold">{investor.committedAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 mb-1">Received</p>
                                        <p className="text-lg font-mono text-gray-300 font-bold">{investor.receivedAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Funding Progress</span>
                                        <span>{Math.round(percentFunded)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-white" style={{ width: `${percentFunded}%` }}></div>
                                    </div>
                                </div>

                                <div className="pt-2 text-sm space-y-2">
                                    {investor.contactInfo.representative && (
                                        <p className="text-gray-300">Rep: {investor.contactInfo.representative}</p>
                                    )}
                                    <div className="flex gap-4 text-gray-400 text-xs">
                                        {investor.contactInfo.email && (
                                            <a href={`mailto:${investor.contactInfo.email}`} className="flex items-center gap-1 hover:text-blue-400">
                                                <Mail className="w-3 h-3" /> {investor.contactInfo.email}
                                            </a>
                                        )}
                                        {investor.contactInfo.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {investor.contactInfo.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        );
                    })
                )}
            </div>

            {/* Add Investor Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-md w-full border-blue-500/30">
                        <h2 className="text-xl font-bold text-white mb-6">Add Investor</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Investor Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Type</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="VC">Venture Capital</option>
                                        <option value="Angel">Angel Investor</option>
                                        <option value="Grant">Grant / Govt</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Committed (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white font-mono focus:border-blue-500 outline-none"
                                        value={formData.committedAmount}
                                        onChange={(e) => setFormData({ ...formData, committedAmount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Received So Far (₹)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max={formData.committedAmount}
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white font-mono focus:border-blue-500 outline-none"
                                    value={formData.receivedAmount}
                                    onChange={(e) => setFormData({ ...formData, receivedAmount: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Rep Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none"
                                        value={formData.representative}
                                        onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
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
                                    className="flex-1 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
