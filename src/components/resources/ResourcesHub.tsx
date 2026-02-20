"use client";

import { useState, useMemo } from "react";
import { ResourceData } from "@/services/communicationService";
import { ResourceCard } from "./ResourceCard";
import { Search, Filter, Hash } from "lucide-react";

interface ResourcesHubProps {
    resources: ResourceData[];
    loading: boolean;
    onDelete?: (id: string) => void;
    headerAction?: React.ReactNode;
}

const CATEGORIES = [
    "Core Docs",
    "Tech Stack",
    "Department Wise",
    "Learning",
    "Internal Assets",
    "Research Vault",
    "General"
];

export function ResourcesHub({ resources, loading, onDelete, headerAction }: ResourcesHubProps) {
    const [activeTab, setActiveTab] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Extract unique tags from all resources
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        resources.forEach(r => {
            if (r.tags) {
                r.tags.forEach(t => tags.add(t));
            }
        });
        return Array.from(tags).sort();
    }, [resources]);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    // Filter resources based on tab, search, and tags
    const filteredResources = useMemo(() => {
        return resources.filter(resource => {
            // Category Match
            const matchesCategory = activeTab === "All" || (resource.category === activeTab) || (!resource.category && activeTab === "General");

            // Search Match
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                resource.title.toLowerCase().includes(searchLower) ||
                resource.description.toLowerCase().includes(searchLower) ||
                (resource.tags?.some(t => t.toLowerCase().includes(searchLower)));

            // Tag Match
            const matchesTags = selectedTags.length === 0 ||
                (resource.tags && selectedTags.every(t => resource.tags!.includes(t)));

            return matchesCategory && matchesSearch && matchesTags;
        });
    }, [resources, activeTab, searchQuery, selectedTags]);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="flex justify-between items-start w-full lg:w-auto">
                    <div className="pr-4">
                        <h1 className="text-3xl font-bold text-white mb-2">Resources Hub</h1>
                        <p className="text-gray-400 text-sm sm:text-base">Your central library for knowledge, tools, and assets.</p>
                    </div>
                    <div className="block lg:hidden shrink-0 mt-1">
                        {headerAction}
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="hidden lg:block shrink-0">
                        {headerAction}
                    </div>
                    {/* Search Bar */}
                    <div className="relative w-full lg:w-80 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search resources, tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar cursor-grab active:cursor-grabbing">
                <div className="flex gap-2 min-w-max">
                    <button
                        onClick={() => setActiveTab("All")}
                        className={`px-5 py-2.5 rounded-xl font-medium transition-all ${activeTab === "All"
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                            }`}
                    >
                        All Resources
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${activeTab === cat
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tags Filter Section - only show if tags exist */}
            {allTags.length > 0 && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-400 min-w-max">
                        <Filter className="w-4 h-4" />
                        Popular Tags:
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedTags.includes(tag)
                                    ? "bg-purple-600/20 border-purple-500/50 text-purple-300 border"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 border"
                                    }`}
                            >
                                <Hash className="w-3 h-3" />
                                {tag}
                            </button>
                        ))}
                        {selectedTags.length > 0 && (
                            <button
                                onClick={() => setSelectedTags([])}
                                className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1.5 underline underline-offset-2"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Resources Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 bg-white/5 rounded-xl border border-white/10" />
                    ))}
                </div>
            ) : filteredResources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                    <div className="p-4 bg-white/5 rounded-full mb-4">
                        <Search className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No resources found</h3>
                    <p className="text-gray-400 max-w-sm">
                        No resources match your current filters. Try changing categories, clearing tags, or adjusting your search query.
                    </p>
                    {(searchQuery || selectedTags.length > 0 || activeTab !== "All") && (
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedTags([]);
                                setActiveTab("All");
                            }}
                            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                            Reset all filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {filteredResources.map((resource) => (
                        <ResourceCard key={resource.id} resource={resource} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    );
}
