import { AnshTopic, AnshSubtopic, createSubtopic, getSubtopics, toggleSubtopicStatus, deleteSubtopic, deleteTopic } from "@/services/anshService";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChevronDown, ChevronUp, CheckCircle, Circle, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

interface TopicCardProps {
    topic: AnshTopic;
    onUpdate: () => void;
}

export function TopicCard({ topic, onUpdate }: TopicCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [subtopics, setSubtopics] = useState<AnshSubtopic[]>([]);
    const [newSubtopicTitle, setNewSubtopicTitle] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (expanded) {
            fetchSubtopics();
        }
    }, [expanded]);

    const fetchSubtopics = async () => {
        const data = await getSubtopics(topic.id!);
        setSubtopics(data);
    };

    const handleAddSubtopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtopicTitle.trim()) return;

        setLoading(true);
        await createSubtopic(topic.id!, newSubtopicTitle);
        setNewSubtopicTitle("");
        await fetchSubtopics();
        onUpdate(); // Update parent stats
        setLoading(false);
    };

    const handleToggleStatus = async (subtopic: AnshSubtopic) => {
        await toggleSubtopicStatus(subtopic.id!, subtopic.status, topic.id!);
        await fetchSubtopics();
        onUpdate();
    };

    const handleDeleteSubtopic = async (subtopicId: string) => {
        if (!confirm("Delete this subtopic?")) return;
        await deleteSubtopic(subtopicId, topic.id!);
        await fetchSubtopics();
        onUpdate();
    };

    const handleDeleteTopic = async () => {
        if (!confirm("Delete this entire topic and all subtopics?")) return;
        await deleteTopic(topic.id!);
        onUpdate();
    };

    const getStatusColor = (status: AnshTopic['status']) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'in_progress': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <GlassCard className="transition-all hover:bg-white/5">
            <div className="flex items-center justify-between">
                <div
                    className="flex-1 cursor-pointer flex items-center gap-4"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className={`w-2 h-12 rounded-full ${getStatusColor(topic.status)}`}></div>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {topic.title}
                            {topic.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {topic.completedSubtopics} / {topic.totalSubtopics} Subtopics completed ({topic.progress}%)
                        </p>

                        {/* Progress Bar */}
                        <div className="w-48 h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
                            <div
                                className={`h-full ${getStatusColor(topic.status)} transition-all duration-500`}
                                style={{ width: `${topic.progress}%` }}
                            ></div>
                        </div>

                        {topic.assignedGroupNames && topic.assignedGroupNames.length > 0 && (
                            <div className="flex gap-2 mt-2">
                                {topic.assignedGroupNames.map((name, i) => (
                                    <span key={i} className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-300">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleDeleteTopic}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                        title="Delete Topic"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="hidden md:inline">Manage Subtopics</span>
                        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Expanded Section: Subtopics */}
            {
                expanded && (
                    <div className="mt-6 pl-6 border-l-2 border-white/10 ml-1 space-y-4">
                        {/* Add Subtopic Form */}
                        <form onSubmit={handleAddSubtopic} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Add new subtopic..."
                                className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                                value={newSubtopicTitle}
                                onChange={(e) => setNewSubtopicTitle(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={loading || !newSubtopicTitle.trim()}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded flex items-center gap-1 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" /> Add
                            </button>
                        </form>

                        {/* Subtopics List */}
                        <div className="space-y-2">
                            {subtopics.length === 0 ? (
                                <p className="text-gray-500 italic text-sm">No subtopics yet.</p>
                            ) : (
                                subtopics.map(sub => (
                                    <div key={sub.id} className="flex items-center justify-between group p-2 hover:bg-white/5 rounded">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer select-none"
                                            onClick={() => handleToggleStatus(sub)}
                                        >
                                            {sub.status === 'completed' ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-gray-500" />
                                            )}
                                            <span className={`text-white ${sub.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                                                {sub.title}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSubtopic(sub.id!)}
                                            className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )
            }
        </GlassCard >
    );
}
