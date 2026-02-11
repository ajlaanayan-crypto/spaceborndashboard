"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useState, useEffect } from "react";
import { createResource, getAllResources, ResourceData } from "@/services/communicationService";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Plus, Link as LinkIcon, FileText, Video, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CoreResourcesPage() {
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
                    <h1 className="text-3xl font-bold text-white mb-2">Team Learning Resources</h1>
                    <p className="text-gray-400">Create and share learning materials with your team</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Resource
                </button>
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : resources.length === 0 ? (
                    <p className="col-span-full text-gray-500 text-center py-8 italic">No resources yet. Create your first one!</p>
                ) : (
                    resources.map((resource) => {
                        const Icon = getIcon(resource.type);
                        return (
                            <GlassCard key={resource.id} className="flex flex-col gap-4 hover:border-blue-500/30 transition-colors group">
                                <div className="flex items-start justify-between">
                                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    {resource.category && (
                                        <span className="text-xs px-2 py-1 rounded bg-white/10 text-gray-400">
                                            {resource.category}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white mb-2">{resource.title}</h3>
                                    <p className="text-sm text-gray-400 mb-2">{resource.description}</p>
                                    {resource.createdAt && (
                                        <p className="text-xs text-gray-500">
                                            {formatDistanceToNow(resource.createdAt.toDate(), { addSuffix: true })}
                                        </p>
                                    )}
                                </div>
                                <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-center transition-colors"
                                >
                                    Access Resource
                                </a>
                            </GlassCard>
                        );
                    })
                )}
            </div>

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

                            <div className="grid grid-cols-2 gap-4">
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
