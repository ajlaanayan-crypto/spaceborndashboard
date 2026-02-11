"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { BookOpen, Video, Link as LinkIcon, FileText, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllResources, ResourceData } from "@/services/communicationService";

export default function InternResourcesPage() {
    const [resources, setResources] = useState<ResourceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
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
        fetchResources();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case "pdf": return FileText;
            case "video": return Video;
            case "link": return LinkIcon;
            default: return BookOpen;
        }
    };

    const filtered = filter === "all" ? resources : resources.filter(r => r.category === filter);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Learning Resources</h1>
                <p className="text-gray-400">Expand your knowledge and skills.</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {["all", "onboarding", "technical", "soft-skills"].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 rounded-lg transition-all ${filter === cat
                                ? "bg-blue-600 text-white"
                                : "bg-white/5 text-gray-400 hover:bg-white/10"
                            }`}
                    >
                        {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
                    </button>
                ))}
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="text-gray-500 col-span-full">Loading resources...</p>
                ) : filtered.length === 0 ? (
                    <p className="text-gray-500 col-span-full italic">No resources found in this category.</p>
                ) : (
                    filtered.map((resource) => {
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
                                    <p className="text-sm text-gray-400">{resource.description}</p>
                                </div>
                                <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-center transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Access Resource
                                </a>
                            </GlassCard>
                        );
                    })
                )}
            </div>
        </div>
    );
}
