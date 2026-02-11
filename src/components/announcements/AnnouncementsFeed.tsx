"use client";

import { useEffect, useState } from "react";
import { getAllAnnouncements, AnnouncementData } from "@/services/communicationService";
import { GlassCard } from "@/components/ui/GlassCard";
import { Bell, AlertTriangle, Info, Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function AnnouncementsFeed() {
    const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const data = await getAllAnnouncements();
                setAnnouncements(data.slice(0, 5)); // Latest 5
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnnouncements();
    }, []);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "urgent": return "border-red-500/30 bg-red-500/5";
            case "high": return "border-orange-500/30 bg-orange-500/5";
            case "medium": return "border-yellow-500/30 bg-yellow-500/5";
            default: return "border-blue-500/30 bg-blue-500/5";
        }
    };

    const getIcon = (priority: string) => {
        switch (priority) {
            case "urgent": return AlertTriangle;
            case "high": return Megaphone;
            default: return Info;
        }
    };

    return (
        <GlassCard>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" />
                Announcements
            </h3>
            {loading ? (
                <p className="text-gray-500">Loading announcements...</p>
            ) : announcements.length === 0 ? (
                <p className="text-gray-500 italic">No announcements yet.</p>
            ) : (
                <div className="space-y-3">
                    {announcements.map((announcement) => {
                        const Icon = getIcon(announcement.priority);
                        return (
                            <div
                                key={announcement.id}
                                className={`p-4 rounded-lg border ${getPriorityColor(announcement.priority)} transition-colors`}
                            >
                                <div className="flex items-start gap-3">
                                    <Icon className={`w-5 h-5 mt-0.5 ${announcement.priority === "urgent" ? "text-red-400" :
                                            announcement.priority === "high" ? "text-orange-400" :
                                                announcement.priority === "medium" ? "text-yellow-400" :
                                                    "text-blue-400"
                                        }`} />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white mb-1">{announcement.title}</h4>
                                        <p className="text-sm text-gray-400 mb-2">{announcement.message}</p>
                                        <p className="text-xs text-gray-500">
                                            {announcement.createdByName || "System"} •{" "}
                                            {announcement.createdAt && formatDistanceToNow(announcement.createdAt.toDate(), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </GlassCard>
    );
}
