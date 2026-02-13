"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserMeetings, MeetingData } from "@/services/meetingService";
import { Calendar, Users, Video, Clock } from "lucide-react";
import { formatDistanceToNow, format, isPast } from "date-fns";

export default function InternMeetingsPage() {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<MeetingData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        if (user) {
            fetchUserMeetings();
        }
    }, [user]);

    const fetchUserMeetings = async () => {
        if (!user?.uid) return;

        setLoading(true);
        try {
            const userMeetings = await getUserMeetings(user.uid);
            setMeetings(userMeetings);
        } catch (error) {
            console.error("Error fetching meetings:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMeetings = meetings.filter(meeting => {
        const meetingDate = meeting.scheduledAt?.toDate?.() || new Date(meeting.scheduledAt);
        const isUpcoming = !isPast(meetingDate);
        return filter === 'upcoming' ? isUpcoming : !isUpcoming;
    });

    const getMeetingTypeLabel = (meeting: MeetingData) => {
        switch (meeting.type) {
            case 'organization':
                return '🏢 Organization-wide';
            case 'group':
                return '👥 Group Meeting';
            case 'individual':
                return '👤 Individual Meeting';
            default:
                return '📅 Meeting';
        }
    };

    const getMeetingStatus = (meeting: MeetingData) => {
        const meetingDate = meeting.scheduledAt?.toDate?.() || new Date(meeting.scheduledAt);
        const isUpcoming = !isPast(meetingDate);

        if (meeting.status === 'cancelled') {
            return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">Cancelled</span>;
        }
        if (meeting.status === 'completed') {
            return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-semibold">Completed</span>;
        }
        if (isUpcoming) {
            return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">Upcoming</span>;
        }
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">Scheduled</span>;
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Meetings</h1>
                    <p className="text-gray-400">View your scheduled meetings and join links</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('upcoming')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'upcoming'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                >
                    Upcoming
                </button>
                <button
                    onClick={() => setFilter('past')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'past'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                >
                    Past
                </button>
            </div>

            {/* Meetings List */}
            {loading ? (
                <GlassCard>
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-400 mt-4">Loading meetings...</p>
                    </div>
                </GlassCard>
            ) : filteredMeetings.length === 0 ? (
                <GlassCard>
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No {filter} meetings</h3>
                        <p className="text-gray-400">You don't have any {filter} meetings scheduled.</p>
                    </div>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredMeetings.map((meeting) => {
                        const meetingDate = meeting.scheduledAt?.toDate?.() || new Date(meeting.scheduledAt);

                        return (
                            <GlassCard key={meeting.id}>
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-2">{meeting.title}</h3>
                                            <p className="text-sm text-gray-400">{getMeetingTypeLabel(meeting)}</p>
                                        </div>
                                        {getMeetingStatus(meeting)}
                                    </div>

                                    {/* Description */}
                                    {meeting.description && (
                                        <p className="text-gray-300">{meeting.description}</p>
                                    )}

                                    {/* Meeting Details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10">
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <Calendar className="w-5 h-5 text-blue-400" />
                                            <span>{format(meetingDate, "MMMM d, yyyy")}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <Clock className="w-5 h-5 text-green-400" />
                                            <span>{format(meetingDate, "h:mm a")} ({meeting.duration} min)</span>
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="text-sm text-gray-400">
                                        Organized by: <span className="text-white font-medium">{meeting.createdByName}</span>
                                    </div>

                                    {/* Meeting Link */}
                                    {meeting.meetingLink && meeting.status !== 'cancelled' && (
                                        <div className="pt-3 border-t border-white/10">
                                            <a
                                                href={meeting.meetingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                                            >
                                                <Video className="w-5 h-5" />
                                                Join Meeting
                                            </a>
                                        </div>
                                    )}

                                    {/* Time Until Meeting */}
                                    {filter === 'upcoming' && meeting.status === 'scheduled' && (
                                        <div className="text-sm text-blue-400">
                                            Starts {formatDistanceToNow(meetingDate, { addSuffix: true })}
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
