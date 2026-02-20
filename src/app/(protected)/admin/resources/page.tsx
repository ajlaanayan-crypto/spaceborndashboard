"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useState, useEffect } from "react";
import { createResource, getAllResources, deleteResource, ResourceData } from "@/services/communicationService";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ResourcesHub } from "@/components/resources/ResourcesHub";

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
        type: "link" as "pdf" | "video" | "link" | "article" | "youtube" | "playlist" | "instagram" | "other",
        url: "",
        category: "Tech Stack",
        tags: [] as string[],
        targetRoles: [] as string[],
        thumbnailUrl: "",
    });

    const [tagInput, setTagInput] = useState("");
    const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

    const handleFetchMetadata = async () => {
        if (!newResource.url) {
            setError("Please enter a URL first to fetch details.");
            return;
        }

        try {
            // Basic check
            new URL(newResource.url);
        } catch {
            setError("Please enter a valid URL (e.g., https://example.com)");
            return;
        }

        setIsFetchingMetadata(true);
        setError("");

        try {
            const res = await fetch(`/api/fetch-metadata?url=${encodeURIComponent(newResource.url)}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch metadata");
            }

            setNewResource(prev => ({
                ...prev,
                title: data.title || prev.title,
                description: data.description || prev.description,
                thumbnailUrl: data.thumbnailUrl || prev.thumbnailUrl,
            }));

            setSuccess("Metadata fetched successfully!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            console.error("Auto-fetch error:", err);
            setError(err.message || "Could not fetch details from this URL.");
        } finally {
            setIsFetchingMetadata(false);
        }
    };

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
                category: "Tech Stack",
                tags: [],
                targetRoles: [],
                thumbnailUrl: "",
            });
            setTagInput("");
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

    const headerAction = (
        <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium shadow-lg hover:shadow-blue-500/25 whitespace-nowrap"
        >
            <Plus className="w-5 h-5" />
            Add Resource
        </button>
    );

    return (
        <div className="space-y-6">
            <ResourcesHub
                resources={resources}
                loading={loading}
                onDelete={handleDelete}
                headerAction={headerAction}
            />

            {/* Create Resource Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">Create Learning Resource</h2>

                        {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded">{error}</p>}
                        {success && <p className="text-green-400 text-sm mb-4 bg-green-500/10 p-3 rounded">{success}</p>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Resource URL *</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        required
                                        className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                        value={newResource.url}
                                        onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                    <button
                                        type="button"
                                        onClick={handleFetchMetadata}
                                        disabled={isFetchingMetadata || !newResource.url}
                                        className="px-4 py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 hover:text-purple-300 border border-purple-500/30 rounded flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Auto-fetch Title & Description from URL"
                                    >
                                        {isFetchingMetadata ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4" />
                                        )}
                                        <span className="hidden sm:inline">Auto-Fetch</span>
                                    </button>
                                </div>
                            </div>

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
                                        <option value="youtube">YouTube</option>
                                        <option value="playlist">Playlist</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Category *</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                        value={newResource.category}
                                        onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                                    >
                                        <option value="Core Docs">Core Docs</option>
                                        <option value="Tech Stack">Tech Stack</option>
                                        <option value="Department Wise">Department Wise</option>
                                        <option value="Learning">Learning</option>
                                        <option value="Internal Assets">Internal Assets</option>
                                        <option value="Research Vault">Research Vault</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Tags (Press Enter to add)</label>
                                <div className="p-2 bg-black/40 border border-white/10 rounded flex flex-wrap gap-2 items-center focus-within:border-blue-500 transition-colors">
                                    {newResource.tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                                            #{tag}
                                            <button
                                                type="button"
                                                className="hover:text-white"
                                                onClick={() => setNewResource({ ...newResource, tags: newResource.tags.filter(t => t !== tag) })}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        placeholder="Add tag..."
                                        className="bg-transparent text-white focus:outline-none flex-1 min-w-[100px] text-sm"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && tagInput.trim()) {
                                                e.preventDefault();
                                                const newTag = tagInput.trim().toLowerCase();
                                                if (!newResource.tags.includes(newTag)) {
                                                    setNewResource({ ...newResource, tags: [...newResource.tags, newTag] });
                                                }
                                                setTagInput("");
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Hidden Thumbnail Field to prove it fetches */}
                            {newResource.thumbnailUrl && (
                                <div className="p-3 bg-white/5 border border-white/10 rounded flex items-center gap-3">
                                    <img src={newResource.thumbnailUrl} alt="Thumbnail preview" className="w-16 h-10 object-cover rounded" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    <div className="text-xs text-green-400">
                                        <span className="font-semibold block">Thumbnail attached</span>
                                        <span className="text-gray-500 truncate max-w-xs">{newResource.thumbnailUrl}</span>
                                    </div>
                                </div>
                            )}

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
