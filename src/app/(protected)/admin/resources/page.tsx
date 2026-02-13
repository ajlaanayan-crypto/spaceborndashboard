"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useState, useEffect } from "react";
import { createResource, getAllResources, deleteResource, ResourceData } from "@/services/communicationService";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Plus, Trash2, Link as LinkIcon, FileText, Video, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminResourcesPage() {
    const { user } = useAuth();
    const [resources, setResources] = useState<ResourceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [newResource, setNewResource] = useState({
        title: "",
        description: "",
        type: "link" as "pdf" | "video" | "link" | "article",
        url: "",
        category: "technical",
        targetRoles: [] as string[],
    });

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const data = await getAllResources();
            setResources(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError("");
        setSuccess("");

        try {
            await createResource({
                ...newResource,
                createdBy: user?.uid || "system",
            });

            setSuccess("Resource created successfully!");
            setNewResource({
                title: "",
                description: "",
                type: "link",
                url: "",
                category: "technical",
                targetRoles: [],
            });
            fetchResources();
            setTimeout(() => {
                setShowModal(false);
                setSuccess("");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to create resource");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this resource?")) return;
        try {
            await deleteResource(id);
            fetchResources();
        } catch (error) {
            console.error(error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "pdf": return FileText;
            case "video": return Video;
            case "link": return LinkIcon;
            default: return BookOpen;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Learning Resources</h1>
                    <p className="text-gray-400">Create and manage learning materials for your team</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Resource
                </button>
            </div>

            {/* Resources Table */}
            <GlassCard>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : resources.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 italic">No resources yet. Create your first one!</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Resource</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Type</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Category</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Created</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resources.map((resource) => {
                                    const Icon = getIcon(resource.type);
                                    return (
                                        <tr key={resource.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{resource.title}</p>
                                                        <p className="text-sm text-gray-400 mt-1">{resource.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-2 py-1 rounded text-xs bg-purple-500/10 text-purple-400">
                                                    {resource.type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm text-gray-300">{resource.category || "General"}</span>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-400">
                                                {resource.createdAt && formatDistanceToNow(resource.createdAt.toDate(), { addSuffix: true })}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a
                                                        href={resource.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                                    >
                                                        View
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(resource.id!)}
                                                        className="text-red-400 hover:text-red-300 p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>

            {/* Create Resource Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">Create Learning Resource</h2>

                        {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded">{error}</p>}
                        {success && <p className="text-green-400 text-sm mb-4 bg-green-500/10 p-3 rounded">{success}</p>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={newResource.title}
                                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description *</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={newResource.description}
                                    onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Type *</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                        value={newResource.type}
                                        onChange={(e) => setNewResource({ ...newResource, type: e.target.value as any })}
                                    >
                                        <option value="link">Link</option>
                                        <option value="pdf">PDF</option>
                                        <option value="video">Video</option>
                                        <option value="article">Article</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Category *</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                        value={newResource.category}
                                        onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                                    >
                                        <option value="onboarding">Onboarding</option>
                                        <option value="technical">Technical</option>
                                        <option value="soft-skills">Soft Skills</option>
                                        <option value="general">General</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">URL *</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://..."
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={newResource.url}
                                    onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
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
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Resource"}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
