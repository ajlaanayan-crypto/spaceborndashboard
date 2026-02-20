"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserGroups, getGroupMembers, GroupData, GroupMemberData } from "@/services/groupService";
import { getCurrentWeekPlan, WeeklyPlanData } from "@/services/weeklyPlanService";
import { getUserMeetings, MeetingData } from "@/services/meetingService";
import { getGroupTasks, getUserTasks, TaskData } from "@/services/taskService";
import { getAllUsers, UserData } from "@/services/userService";
import { Loader2, Users, Calendar, Target, CheckCircle, Briefcase, FileText, Layout, ChevronDown, ChevronUp, Link } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface MemberWorkload {
    member: GroupMemberData;
    weeklyPlan: WeeklyPlanData | null;
    tasks: TaskData[];
}

export default function GroupDashboardPage() {
    const { user } = useAuth();
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
    const [members, setMembers] = useState<GroupMemberData[]>([]);
    const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingData[]>([]);
    const [groupTasks, setGroupTasks] = useState<TaskData[]>([]);
    const [memberWorkloads, setMemberWorkloads] = useState<MemberWorkload[]>([]);
    const [expandedMember, setExpandedMember] = useState<string | null>(null);
    const [userPhotos, setUserPhotos] = useState<Record<string, string | null>>({});

    useEffect(() => {
        if (user?.uid) {
            fetchGroups();
            fetchMyData();
        }
    }, [user?.uid]);

    useEffect(() => {
        if (selectedGroup) {
            fetchGroupMembers();
            fetchGroupTasks();
        }
    }, [selectedGroup]);

    useEffect(() => {
        if (members.length > 0) {
            fetchMemberWorkloads();
        }
    }, [members]);

    const fetchGroups = async () => {
        if (!user?.uid) return;
        try {
            const userGroups = await getUserGroups(user.uid);
            setGroups(userGroups);
            if (userGroups.length > 0) {
                setSelectedGroup(userGroups[0]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyData = async () => {
        if (!user?.uid) return;
        try {
            const meetings = await getUserMeetings(user.uid);
            setUpcomingMeetings(meetings.filter(m => m.status === 'scheduled').slice(0, 3));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchGroupMembers = async () => {
        if (!selectedGroup) return;
        try {
            const groupMembers = await getGroupMembers(selectedGroup.id!);
            setMembers(groupMembers);

            // Fetch user photos for members
            try {
                const allUsers = await getAllUsers();
                const photosMap: Record<string, string | null> = {};
                allUsers.forEach(u => {
                    photosMap[u.uid] = u.photoURL || null;
                });
                setUserPhotos(photosMap);
            } catch (err) {
                console.error("Failed to fetch user photos", err);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchGroupTasks = async () => {
        if (!selectedGroup?.id) return;
        try {
            const tasks = await getGroupTasks(selectedGroup.id);
            setGroupTasks(tasks);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMemberWorkloads = async () => {
        const workloads: MemberWorkload[] = [];
        for (const member of members) {
            try {
                const [plan, tasks] = await Promise.all([
                    getCurrentWeekPlan(member.groupId, member.userId),
                    getUserTasks(member.userId)
                ]);
                workloads.push({
                    member,
                    weeklyPlan: plan,
                    tasks: tasks.filter(t => t.status !== 'completed') // Show active tasks
                });
            } catch (error) {
                console.error(`Error fetching data for ${member.userName}`, error);
            }
        }
        setMemberWorkloads(workloads);
    };

    const toggleMemberExpand = (userId: string) => {
        setExpandedMember(expandedMember === userId ? null : userId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <GlassCard className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h2 className="text-xl font-bold text-white mb-2">No Group Assigned</h2>
                <p className="text-gray-400">You are not part of any group yet. Contact your admin.</p>
            </GlassCard>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Group Dashboard</h1>
                    <p className="text-gray-400">Collaboration hub for {selectedGroup?.name}</p>
                </div>
                {/* Group Selector */}
                {groups.length > 1 && (
                    <div className="w-64">
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            value={selectedGroup?.id || ""}
                            onChange={(e) => setSelectedGroup(groups.find(g => g.id === e.target.value) || null)}
                        >
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {selectedGroup && (
                <>
                    {/* Header Group Info */}
                    <GlassCard className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-white/10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{selectedGroup.name}</h2>
                                <p className="text-gray-300 text-sm max-w-2xl">{selectedGroup.description}</p>
                            </div>
                            <div className="flex gap-6 text-sm">
                                <div className="text-center">
                                    <p className="text-gray-400 mb-1">Lead</p>
                                    <div className="flex items-center gap-2 text-blue-300 font-medium">
                                        <Users className="w-4 h-4" />
                                        {selectedGroup.leadName}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-400 mb-1">Members</p>
                                    <div className="flex items-center gap-2 text-purple-300 font-medium">
                                        <Users className="w-4 h-4" />
                                        {members.length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* LEFT COLUMN: Group Directives & Meetings */}
                        <div className="space-y-6 lg:col-span-1">
                            {/* Group Directives */}
                            <GlassCard className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                    <Briefcase className="w-5 h-5 text-green-400" />
                                    <h3 className="text-lg font-bold text-white">Group Directives</h3>
                                </div>
                                {groupTasks.length > 0 ? (
                                    <div className="space-y-3">
                                        {groupTasks.map((task) => (
                                            <div key={task.id} className="p-3 bg-white/5 rounded space-y-2 border-l-2 border-green-500 hover:bg-white/10 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-white font-medium text-sm">{task.title}</h4>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-blue-500/20 text-blue-400'
                                                        }`}>{task.priority}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 line-clamp-2">{task.description}</p>
                                                <div className="flex justify-between items-center text-xs pt-1">
                                                    <span className="text-gray-500">{task.deadline}</span>
                                                    <span className={`px-2 py-0.5 rounded ${task.status === 'completed' ? 'text-green-400' : 'text-blue-400'
                                                        }`}>
                                                        {(task.status || 'pending').replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <CheckCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">All group directives cleared</p>
                                    </div>
                                )}
                            </GlassCard>

                            {/* Upcoming Meetings */}
                            <GlassCard className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                    <Calendar className="w-5 h-5 text-purple-400" />
                                    <h3 className="text-lg font-bold text-white">Upcoming Meetings</h3>
                                </div>
                                {upcomingMeetings.length > 0 ? (
                                    <div className="space-y-3">
                                        {upcomingMeetings.map((meeting) => (
                                            <div key={meeting.id} className="p-3 bg-white/5 rounded space-y-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-white font-medium text-sm">{meeting.title}</p>
                                                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                                                        {meeting.type}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {meeting.scheduledAt && format(meeting.scheduledAt.toDate(), "MMM d, h:mm a")}
                                                </p>
                                                {meeting.meetingLink && (
                                                    <a
                                                        href={meeting.meetingLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block text-center text-xs bg-blue-600/20 text-blue-400 py-1.5 rounded hover:bg-blue-600/30 transition-colors mt-2"
                                                    >
                                                        Join Meeting
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic text-sm text-center py-4">No meetings scheduled</p>
                                )}
                            </GlassCard>

                        </div>

                        {/* RIGHT COLUMN: Member Workloads */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Target className="w-5 h-5 text-blue-400" />
                                    Member Workloads
                                </h3>
                                <div className="text-xs text-gray-400">
                                    Weekly Snapshot
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {memberWorkloads.map(({ member, weeklyPlan, tasks }) => (
                                    <GlassCard key={member.id} className="transition-all duration-200">
                                        <div
                                            className="flex items-center justify-between cursor-pointer"
                                            onClick={() => toggleMemberExpand(member.userId)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <UserAvatar name={member.userName} photoURL={userPhotos[member.userId]} size="small" />
                                                <div>
                                                    <p className="text-white font-medium flex items-center gap-2">
                                                        {member.userName}
                                                        {member.isLead && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">Lead</span>}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{(member.role || 'guest').replace('_', ' ')}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {weeklyPlan ? (
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-xs text-gray-500">Weekly Focus</p>
                                                        <p className="text-sm text-blue-300 truncate max-w-[200px]">{weeklyPlan.weeklyFocus}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-600 italic hidden sm:block">No plan set</span>
                                                )}

                                                <div className="flex items-center gap-2 text-xs bg-white/5 px-2 py-1 rounded">
                                                    <span className="text-white">{tasks.length}</span>
                                                    <span className="text-gray-500">Tasks</span>
                                                </div>
                                                {expandedMember === member.userId ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                        </div>

                                        {expandedMember === member.userId && (
                                            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                                {/* Weekly Plan Details */}
                                                <div className="bg-black/20 rounded p-3">
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                                        <Layout className="w-3 h-3" /> Weekly Plan
                                                    </h4>
                                                    {weeklyPlan ? (
                                                        <div className="space-y-2">
                                                            <div>
                                                                <span className="text-xs text-gray-500">Focus:</span>
                                                                <p className="text-sm text-white">{weeklyPlan.weeklyFocus}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs text-gray-500">Deliverables:</span>
                                                                <ul className="list-disc list-inside text-xs text-gray-300 mt-1">
                                                                    {weeklyPlan.expectedDeliverables.map((d: string, i: number) => <li key={i}>{d}</li>)}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-500 italic">No weekly plan submitted for this week.</p>
                                                    )}
                                                </div>

                                                {/* Active Tasks */}
                                                <div className="bg-black/20 rounded p-3">
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                                                        <FileText className="w-3 h-3" /> Active Tasks
                                                    </h4>
                                                    {tasks.length > 0 ? (
                                                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                                            {tasks.map(task => (
                                                                <div key={task.id} className="bg-white/5 p-2 rounded text-xs">
                                                                    <div className="flex justify-between mb-1">
                                                                        <span className="text-white font-medium">{task.title}</span>
                                                                        <span className={`px-1.5 rounded ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                                                            }`}>{task.priority}</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center text-gray-500">
                                                                        <span>Due: {task.deadline}</span>
                                                                        <span>{(task.status || 'pending').replace('_', ' ')}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-gray-500 italic">No active tasks assigned.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
