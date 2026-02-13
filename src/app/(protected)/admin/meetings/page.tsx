"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    createMeeting,
    getAllMeetings,
    updateMeeting,
    cancelMeeting,
    deleteMeeting,
    addMeetingParticipant,
    getMeetingParticipants,
    generateMeetLink,
    MeetingData,
    MeetingParticipantData
} from "@/services/meetingService";
import { getAllUsers, UserData } from "@/services/userService";
import { getActiveGroups, GroupData } from "@/services/groupService";
import { Loader2, Plus, Calendar, Users, Video, Trash2, X } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function AdminMeetingsPage() {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState<MeetingData[]>([]);
    const [allUsers, setAllUsers] = useState<UserData[]>([]);
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: 'organization' as 'organization' | 'group' | 'individual',
        targetGroupId: "",
        targetUserIds: [] as string[],
        scheduledDate: "",
        scheduledTime: "",
        duration: 60,
        meetingLink: "",
    });

    useEffect(() => {
        fetchMeetings();
        fetchUsers();
        fetchGroups();
    }, []);

    const fetchMeetings = async () => {
        try {
            const data = await getAllMeetings();
            setMeetings(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const users = await getAllUsers();
            setAllUsers(users.filter(u => u.status === 'active'));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchGroups = async () => {
        try {
            const data = await getActiveGroups();
            setGroups(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError("");
        setSuccess("");

        try {
            // Validate
            if (formData.type === 'group' && !formData.targetGroupId) {
                setError("Please select a group");
                setCreating(false);
                return;
            }
            if (formData.type === 'individual' && formData.targetUserIds.length === 0) {
                setError("Please select at least one participant");
                setCreating(false);
                return;
            }

            // Combine date and time
            const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

            // Generate meet link if not provided
            const meetLink = formData.meetingLink || generateMeetLink();

            const currentUser = allUsers.find(u => u.uid === user?.uid);

            // Construct payload dynamically to avoid undefined values
            const meetingPayload: any = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                scheduledAt,
                duration: formData.duration,
                meetingLink: meetLink,
                createdBy: user?.uid || "system",
                createdByName: currentUser?.name || "Admin",
                status: 'scheduled',
            };

            if (formData.type === 'group') {
                meetingPayload.targetGroupId = formData.targetGroupId;
            } else if (formData.type === 'individual') {
                meetingPayload.targetUserIds = formData.targetUserIds;
            }

            const meetingId = await createMeeting(meetingPayload);

            // Add participants
            if (formData.type === 'organization') {
                // Add all users as participants
                for (const participant of allUsers) {
                    await addMeetingParticipant({
                        meetingId,
                        userId: participant.uid,
                        userName: participant.name,
                        userEmail: participant.email,
                        status: 'invited',
                    });
                }
            } else if (formData.type === 'group' && formData.targetGroupId) {
                // Add group members
                const selectedGroup = groups.find(g => g.id === formData.targetGroupId);
                if (selectedGroup) {
                    for (const memberId of selectedGroup.memberIds) {
                        const memberUser = allUsers.find(u => u.uid === memberId);
                        if (memberUser) {
                            await addMeetingParticipant({
                                meetingId,
                                userId: memberUser.uid,
                                userName: memberUser.name,
                                userEmail: memberUser.email,
                                status: 'invited',
                            });
                        }
                    }
                }
            } else if (formData.type === 'individual') {
                // Add selected individuals
                for (const userId of formData.targetUserIds) {
                    const participant = allUsers.find(u => u.uid === userId);
                    if (participant) {
                        await addMeetingParticipant({
                            meetingId,
                            userId: participant.uid,
                            userName: participant.name,
                            userEmail: participant.email,
                            status: 'invited',
                        });
                    }
                }
            }

            setSuccess("Meeting scheduled successfully!");
            fetchMeetings();
            setTimeout(() => {
                setShowModal(false);
                setSuccess("");
                setFormData({
                    title: "",
                    description: "",
                    type: 'organization',
                    targetGroupId: "",
                    targetUserIds: [],
                    scheduledDate: "",
                    scheduledTime: "",
                    duration: 60,
                    meetingLink: "",
                });
            }, 1500);
        } catch (err: any) {
            setError(err.message || "Failed to create meeting");
        } finally {
            setCreating(false);
        }
    };

    const handleCancel = async (meetingId: string) => {
        if (!confirm("Cancel this meeting?")) return;
        try {
            await cancelMeeting(meetingId);
            fetchMeetings();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (meetingId: string) => {
        if (!confirm("Delete this meeting permanently?")) return;
        try {
            await deleteMeeting(meetingId);
            fetchMeetings();
        } catch (error) {
            console.error(error);
        }
    };

    const toggleUserSelection = (userId: string) => {
        setFormData(prev => ({
            ...prev,
            targetUserIds: prev.targetUserIds.includes(userId)
                ? prev.targetUserIds.filter(id => id !== userId)
                : [...prev.targetUserIds, userId]
        }));
    };

    const scheduledMeetings = meetings.filter(m => m.status === 'scheduled');
    const pastMeetings = meetings.filter(m => m.status === 'completed' || m.status === 'cancelled');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Meeting Management</h1>
                    <p className="text-gray-400">Schedule and manage meetings</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Schedule Meeting
                </button>
            </div>

            {/* Scheduled Meetings */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Upcoming Meetings ({scheduledMeetings.length})</h2>
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : scheduledMeetings.length === 0 ? (
                        <p className="text-gray-500 text-center py-8 italic">No upcoming meetings</p>
                    ) : (
                        scheduledMeetings.map((meeting) => (
                            <GlassCard key={meeting.id} className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white">{meeting.title}</h3>
                                        <p className="text-sm text-gray-400 mt-1">{meeting.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className={`px-2 py-1 rounded text-xs ${meeting.type === 'organization' ? 'bg-purple-500/10 text-purple-400' :
                                            meeting.type === 'group' ? 'bg-blue-500/10 text-blue-400' :
                                                'bg-green-500/10 text-green-400'
                                            }`}>
                                            {meeting.type}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-400" />
                                        <span className="text-white">
                                            {meeting.scheduledAt && format(meeting.scheduledAt.toDate(), "PPP 'at' p")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-purple-400" />
                                        <span className="text-white">{meeting.duration} min</span>
                                    </div>
                                </div>

                                {meeting.meetingLink && (
                                    <a
                                        href={meeting.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        <Video className="w-4 h-4" />
                                        Join Meeting
                                    </a>
                                )}

                                <div className="flex gap-2 pt-2 border-t border-white/10">
                                    <button
                                        onClick={() => handleCancel(meeting.id!)}
                                        className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-white text-sm transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDelete(meeting.id!)}
                                        className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-sm transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            </div>

            {/* Past Meetings */}
            {pastMeetings.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">Past Meetings</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {pastMeetings.slice(0, 5).map((meeting) => (
                            <GlassCard key={meeting.id} className="opacity-60 space-y-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{meeting.title}</h3>
                                        <p className="text-sm text-gray-400">
                                            {meeting.scheduledAt && format(meeting.scheduledAt.toDate(), "PPP")}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs ${meeting.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                        }`}>
                                        {meeting.status}
                                    </span>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Meeting Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <GlassCard className="max-w-2xl w-full my-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Schedule New Meeting</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded">{error}</p>}
                        {success && <p className="text-green-400 text-sm mb-4 bg-green-500/10 p-3 rounded">{success}</p>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Meeting Title *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                        value={formData.scheduledDate}
                                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Time *</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                        value={formData.scheduledTime}
                                        onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Duration (minutes) *</label>
                                <input
                                    type="number"
                                    required
                                    min={15}
                                    step={15}
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Meeting Type *</label>
                                <select
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                >
                                    <option value="organization">Organization-wide</option>
                                    <option value="group">Group Meeting</option>
                                    <option value="individual">Individual Meeting</option>
                                </select>
                            </div>

                            {formData.type === 'group' && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Select Group *</label>
                                    <select
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                        value={formData.targetGroupId}
                                        onChange={(e) => setFormData({ ...formData, targetGroupId: e.target.value })}
                                    >
                                        <option value="">Choose a group...</option>
                                        {groups.map(group => (
                                            <option key={group.id} value={group.id}>{group.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.type === 'individual' && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Select Participants *</label>
                                    <div className="max-h-40 overflow-y-auto space-y-2 bg-black/20 p-3 rounded border border-white/10">
                                        {allUsers.map(user => (
                                            <label key={user.uid} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.targetUserIds.includes(user.uid)}
                                                    onChange={() => toggleUserSelection(user.uid)}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-white text-sm">{user.name} ({user.email})</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{formData.targetUserIds.length} selected</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Google Meet Link (optional)</label>
                                <input
                                    type="url"
                                    placeholder="Auto-generated if left empty"
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={formData.meetingLink}
                                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                />
                            </div>

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
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule Meeting"}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
