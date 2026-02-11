"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { ResourceData, getGroupResourcesForAdmin, deleteResource } from "@/services/resourceService";
import { GroupData } from "@/services/groupService";
import { useState, useEffect } from "react";
import { Loader2, Link as LinkIcon, Trash2, ExternalLink, FileText, User, Users, Layers } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ResourceListModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: GroupData;
    onAddResource: () => void;
}

export default function ResourceListModal({ isOpen, onClose, group, onAddResource }: ResourceListModalProps) {
    const [resources, setResources] = useState<ResourceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && group.id) {
            fetchResources();
        }
    }, [isOpen, group.id]);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const data = await getGroupResourcesForAdmin(group.id!);
            setResources(data);
        } catch (error) {
            console.error("Failed to fetch resources", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (resourceId: string) => {
        if (!confirm("Are you sure you want to delete this resource?")) return;
        setDeletingId(resourceId);
        try {
            await deleteResource(resourceId);
            setResources(resources.filter(r => r.id !== resourceId));
        } catch (error) {
            console.error("Failed to delete resource", error);
            alert("Failed to delete resource");
        } finally {
            setDeletingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="max-w-3xl w-full max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <LinkIcon className="w-6 h-6 text-purple-400" />
                            Group Resources
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Managing resources for <span className="text-white font-medium">{group.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={onAddResource}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                        <LinkIcon className="w-4 h-4" />
                        Share New Resource
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <LinkIcon className="w-12 h-12 mb-2 opacity-50" />
                            <p>No resources found for this group context.</p>
                        </div>
                    ) : (
                        resources.map((resource) => (
                            <div key={resource.id} className="bg-white/5 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                {resource.category || 'General'}
                                            </span>
                                            <h3 className="text-white font-medium text-lg">{resource.title}</h3>
                                        </div>

                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 text-sm hover:underline flex items-center gap-1 mb-3 truncate max-w-md"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            {resource.url}
                                        </a>

                                        <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                                            <div className="flex items-center gap-1.5" title="Target Audience">
                                                {resource.targetAudience === 'individuals' ? (
                                                    <User className="w-3 h-3 text-yellow-400" />
                                                ) : resource.targetAudience === 'group' ? (
                                                    <Users className="w-3 h-3 text-purple-400" />
                                                ) : (
                                                    <Layers className="w-3 h-3 text-emerald-400" />
                                                )}
                                                <span className="capitalize">{resource.targetAudience?.replace(/_/g, ' ')}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <span className="text-gray-500">Created {formatDistanceToNow(resource.createdAt?.toDate ? resource.createdAt.toDate() : new Date(), { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(resource.id!)}
                                        disabled={deletingId === resource.id}
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                                        title="Delete Resource"
                                    >
                                        {deletingId === resource.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-6 border-t border-white/10 pt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </GlassCard>
        </div>
    );
}
