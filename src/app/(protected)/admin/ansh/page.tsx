"use client";

import { useEffect, useState } from "react";
import { AnshTopic, getTopics } from "@/services/anshService";
import { TopicCard } from "@/components/ansh/TopicCard";
import { CreateTopicModal } from "@/components/ansh/CreateTopicModal";
import { Plus, BarChart2, CheckCircle, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { OverallProgressPieChart, TopicProgressChart, TeamWorkloadChart } from "@/components/ansh/AnshCharts";

export default function AdminAnshPage() {
    const [topics, setTopics] = useState<AnshTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            const data = await getTopics();
            setTopics(data);
        } catch (error) {
            console.error("Failed to fetch topics", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate overall stats
    const totalTopics = topics.length;
    const completedTopics = topics.filter(t => t.status === 'completed').length;
    const inProgressTopics = topics.filter(t => t.status === 'in_progress').length;

    // Calculate total progress percentage
    const totalSubtopics = topics.reduce((acc, t) => acc + t.totalSubtopics, 0);
    const totalCompletedSubtopics = topics.reduce((acc, t) => acc + t.completedSubtopics, 0);
    const overallProgress = totalSubtopics === 0 ? 0 : Math.round((totalCompletedSubtopics / totalSubtopics) * 100);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Ansa Progress Tracker</h1>
                    <p className="text-gray-400">MVP Development Status & Team Roadmap</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    New Topic
                </button>
            </div>

            {/* Visual Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Overall Progress */}
                <GlassCard className="p-6 col-span-1">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-blue-400" />
                        Overall Status
                    </h3>
                    <OverallProgressPieChart topics={topics} />
                    <div className="mt-4 text-center">
                        <p className="text-3xl font-bold text-white">{overallProgress}%</p>
                        <p className="text-sm text-gray-400">Total Completion</p>
                    </div>
                </GlassCard>

                {/* Team Workload */}
                <GlassCard className="p-6 col-span-1 lg:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-400" />
                        Team Workload Distribution
                    </h3>
                    <TeamWorkloadChart topics={topics} />
                </GlassCard>

                {/* Topic Progress Detail */}
                <GlassCard className="p-6 col-span-1 lg:col-span-3">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        Topic Progress Breakdown
                    </h3>
                    <TopicProgressChart topics={topics} />
                </GlassCard>
            </div>

            {/* Topics List */}
            <div className="space-y-4">
                {loading ? (
                    <p className="text-gray-500">Loading tracker...</p>
                ) : topics.length === 0 ? (
                    <GlassCard className="text-center py-12">
                        <p className="text-gray-400 mb-4">No topics tracked yet.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="text-blue-400 hover:text-blue-300 underline"
                        >
                            Start by adding a new topic
                        </button>
                    </GlassCard>
                ) : (
                    topics.map(topic => (
                        <TopicCard
                            key={topic.id}
                            topic={topic}
                            onUpdate={fetchTopics}
                        />
                    ))
                )}
            </div>

            {showCreateModal && (
                <CreateTopicModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        fetchTopics();
                    }}
                />
            )}
        </div>
    );
}
