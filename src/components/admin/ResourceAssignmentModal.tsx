import { GlassCard } from "@/components/ui/GlassCard";
import { createResource, ResourceData } from "@/services/resourceService";
import { UserData } from "@/services/userService";
import { GroupData, getUserGroups } from "@/services/groupService";
import { useState, useEffect } from "react";
import { Loader2, Link as LinkIcon, Users, User, Layers, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ResourceAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: GroupData;
    members: UserData[]; // Members of the CURRENT group
    onResourceCreated: () => void;
}

export default function ResourceAssignmentModal({ isOpen, onClose, group, members, onResourceCreated }: ResourceAssignmentModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [category, setCategory] = useState("");

    // Assignment State
    const [targetAudience, setTargetAudience] = useState<'individuals' | 'group' | 'all_my_groups'>('individuals');
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [myGroups, setMyGroups] = useState<GroupData[]>([]);

    // Fetch Admin's Groups for "All My Groups" option
    useEffect(() => {
        if (user?.uid && targetAudience === 'all_my_groups') {
            getUserGroups(user.uid).then(setMyGroups).catch(console.error);
        }
    }, [user?.uid, targetAudience]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Determine Assignment Lists
            let finalAssignedTo: string[] = [];
            let finalAssignedToGroups: string[] = [];

            if (targetAudience === 'individuals') {
                if (selectedMemberIds.length === 0) {
                    alert("Please select at least one member.");
                    setLoading(false);
                    return;
                }
                finalAssignedTo = selectedMemberIds;
            } else if (targetAudience === 'group') {
                finalAssignedToGroups = [group.id!];
            } else if (targetAudience === 'all_my_groups') {
                // Fetch if not already fetched, but we rely on useEffect. 
                // If myGroups is empty, it might be loading or user has no groups? 
                // Fallback to current group if myGroups load failed or something? 
                // Ideally we wait or use the fetched list. 
                // Let's assume myGroups is populated or we fetch fresh here to be safe?
                const groups = myGroups.length > 0 ? myGroups : await getUserGroups(user!.uid);
                finalAssignedToGroups = groups.map(g => g.id!);
            }

            const resourcePayload: Omit<ResourceData, 'id' | 'createdAt'> = {
                title,
                url,
                category: category || "General",
                type: 'link',
                description: "",
                assignedBy: user?.uid || "system",
                groupId: group.id!, // Primary Context

                targetAudience,

                assignedTo: finalAssignedTo,
                assignedToGroups: finalAssignedToGroups
            };

            await createResource(resourcePayload);
            onResourceCreated();
            onClose();
        } catch (error) {
            console.error("Failed to assign resource:", error);
            alert("Failed to assign resource");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Filter out admins/self from member list
    const eligibleMembers = members.filter(m => m.uid !== user?.uid && m.role !== 'admin');

    const toggleMember = (uid: string) => {
        if (selectedMemberIds.includes(uid)) {
            setSelectedMemberIds(selectedMemberIds.filter(id => id !== uid));
        } else {
            setSelectedMemberIds([...selectedMemberIds, uid]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <GlassCard className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <LinkIcon className="w-6 h-6 text-blue-400" />
                    Share Resource
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Basic Info */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Title *</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. React Patterns"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">URL *</label>
                            <input
                                required
                                type="url"
                                placeholder="https://..."
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Category *</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Documentation, Tutorial, Assets"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Audience Selection */}
                    <div className="pt-2">
                        <label className="block text-sm text-gray-400 mb-2">Share With</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setTargetAudience('individuals')}
                                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg text-xs transition-colors border ${targetAudience === 'individuals'
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <User className="w-4 h-4" /> Selected Members
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetAudience('group')}
                                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg text-xs transition-colors border ${targetAudience === 'group'
                                    ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <Users className="w-4 h-4" /> This Group
                            </button>
                            <button
                                type="button"
                                onClick={() => setTargetAudience('all_my_groups')}
                                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg text-xs transition-colors border ${targetAudience === 'all_my_groups'
                                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <Layers className="w-4 h-4" /> All My Groups
                            </button>
                        </div>
                    </div>

                    {/* Conditional Member Selection */}
                    {targetAudience === 'individuals' && (
                        <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Select Members</h4>
                            <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                {eligibleMembers.length > 0 ? eligibleMembers.map(m => (
                                    <div
                                        key={m.uid}
                                        onClick={() => toggleMember(m.uid)}
                                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${selectedMemberIds.includes(m.uid) ? 'bg-blue-500/20 text-blue-200' : 'hover:bg-white/5 text-gray-400'
                                            }`}
                                    >
                                        <span className="text-sm">{m.name}</span>
                                        {selectedMemberIds.includes(m.uid) && <Check className="w-3 h-3" />}
                                    </div>
                                )) : (
                                    <p className="text-xs text-gray-500 italic p-2">No eligible members found in this group.</p>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-right">
                                {selectedMemberIds.length} selected
                            </p>
                        </div>
                    )}

                    {/* Conditional Info for Group Selection */}
                    {targetAudience === 'all_my_groups' && (
                        <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                            <p className="text-xs text-emerald-300">
                                This resource will be added to <b>{myGroups.length} groups</b> checking... (Create to confirm).
                            </p>
                        </div>
                    )}

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
                            disabled={loading}
                            className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share Component"}
                        </button>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
}
