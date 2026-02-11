"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useState, useEffect } from "react";
import { addAsset, getAssets, AssetData } from "@/services/financeService";
import { Loader2, Plus, Box, Computer, Tag, PenTool } from "lucide-react";
import { format } from "date-fns";

export default function AssetsPage() {
    const [assets, setAssets] = useState<AssetData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        category: "Equipment" as const,
        cost: "",
        purchaseDate: "",
        serialNumber: "",
        status: "active" as const
    });

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const data = await getAssets();
            setAssets(data);
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
            await addAsset({
                name: formData.name,
                category: formData.category,
                cost: parseFloat(formData.cost),
                purchaseDate: new Date(formData.purchaseDate),
                serialNumber: formData.serialNumber,
                status: formData.status
            });
            setShowModal(false);
            setFormData({
                name: "",
                category: "Equipment",
                cost: "",
                purchaseDate: "",
                serialNumber: "",
                status: "active"
            });
            fetchAssets();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const getIcon = (category: string) => {
        switch (category) {
            case 'Equipment': return <Box className="w-5 h-5 text-white" />;
            case 'Software': return <Computer className="w-5 h-5 text-gray-400" />;
            case 'Tool': return <PenTool className="w-5 h-5 text-gray-500" />;
            default: return <Tag className="w-5 h-5 text-gray-600" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Asset Register</h1>
                    <p className="text-gray-400">Track high-value assets and equipment inventory.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Record New Asset
                </button>
            </div>

            <GlassCard className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Asset Name</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Serial No.</th>
                                <th className="px-6 py-4">Purchase Date</th>
                                <th className="px-6 py-4">Cost</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading assets...</td></tr>
                            ) : assets.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No assets recorded.</td></tr>
                            ) : (
                                assets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded bg-white/5">
                                                    {getIcon(asset.category)}
                                                </div>
                                                <span className="text-white font-medium">{asset.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-400">{asset.category}</span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-400">
                                            {asset.serialNumber || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {asset.purchaseDate?.toDate ? format(asset.purchaseDate.toDate(), 'MMM d, yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">
                                            {asset.cost.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs uppercase ${asset.status === 'active' ? 'bg-white/20 text-white' :
                                                asset.status === 'deprecated' ? 'bg-white/5 text-gray-500' :
                                                    'bg-white/10 text-gray-300'
                                                }`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Add Asset Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-md w-full border-blue-500/30">
                        <h2 className="text-xl font-bold text-white mb-6">Record New Asset</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Asset Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                    >
                                        <option value="Equipment">Equipment</option>
                                        <option value="Component">Component</option>
                                        <option value="Tool">Tool</option>
                                        <option value="Software">Software</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Cost (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white font-mono focus:border-blue-500 outline-none"
                                        value={formData.cost}
                                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Serial Number</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none"
                                        value={formData.serialNumber}
                                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Purchase Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-blue-500 outline-none"
                                        value={formData.purchaseDate}
                                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
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
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Asset"}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
