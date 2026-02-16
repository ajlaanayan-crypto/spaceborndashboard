import { createTopic } from "@/services/anshService";
import { GroupData, getAllGroups } from "@/services/groupService";
import { GlassCard } from "@/components/ui/GlassCard";
import { X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface CreateTopicModalProps {
    onClose: () => void;
    onCreated: () => void;
}

export function CreateTopicModal({ onClose, onCreated }: CreateTopicModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingGroups, setFetchingGroups] = useState(true);

    useEffect(() => {
        const loadGroups = async () => {
            try {
                const data = await getAllGroups();
                setGroups(data);
            } catch (error) {
                console.error("Failed to load groups", error);
            } finally {
                setFetchingGroups(false);
            }
        };
        loadGroups();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const groupNames = groups
            .filter(g => selectedGroups.includes(g.id!))
            .map(g => g.name);

        try {
            await createTopic({
                title,
                description,
                assignedGroupIds: selectedGroups,
                assignedGroupNames: groupNames,
                status: 'pending' // Add the required status property
            });
            onCreated();
        } catch (error) {
            console.error("Failed to create topic", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (groupId: string) => {
        if (selectedGroups.includes(groupId)) {
            setSelectedGroups(prev => prev.filter(id => id !== groupId));
        } else {
            setSelectedGroups(prev => [...prev, groupId]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <h2 className="text-xl font-bold text-white">Create New Topic</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Topic Title *</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Authentication Module"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Description</label>
                        <textarea
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief details about this topic..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Assign Teams (Optional)</label>
                        {fetchingGroups ? (
                            <p className="text-xs text-gray-500">Loading teams...</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {groups.map(group => (
                                    <button
                                        key={group.id}
                                        type="button"
                                        onClick={() => toggleGroup(group.id!)}
                                        className={`px-3 py-1 text-sm rounded border transition-colors ${selectedGroups.includes(group.id!)
                                                ? 'bg-blue-600 border-blue-500 text-white'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {group.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 rounded bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title.trim()}
                            className="flex-1 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Tracker"}
                        </button>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
}
