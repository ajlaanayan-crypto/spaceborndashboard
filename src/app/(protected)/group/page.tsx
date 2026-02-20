"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserGroups, getGroupMembers, GroupData, GroupMemberData } from "@/services/groupService";
import { getCurrentWeekPlan, WeeklyPlanData } from "@/services/weeklyPlanService";
import { getUserMeetings, MeetingData } from "@/services/meetingService";
import { getGroupTasks, getUserTasks, verifyTask, TaskData, subscribeToAllTasks } from "@/services/taskService";
import { getAllUsers, UserData } from "@/services/userService";
import { Loader2, Users, Calendar, Target, CheckCircle, Briefcase, FileText, Layout, ChevronDown, ChevronUp, Link, ShieldCheck, Clock, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface MemberWorkload {
    member: GroupMemberData;
    weeklyPlan: WeeklyPlanData | null;
    tasks: TaskData[];
    pendingTasks: TaskData[];
    inProgressTasks: TaskData[];
    reviewTasks: TaskData[];
    completedTasks: TaskData[];
    totalTasks: number;
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
    const [isLeadOfGroup, setIsLeadOfGroup] = useState(false);
    const [pendingVerification, setPendingVerification] = useState<TaskData[]>([]);
    const [verifying, setVerifying] = useState<string | null>(null);

    useEffect(() => {
        if (user?.uid) {
            fetchGroups();
            fetchMyData();
        }
    }, [user?.uid]);

    useEffect(() => {
        if (selectedGroup) {
            fetchGroupMembers();
            checkLeadStatus();
        }
    }, [selectedGroup]);

    useEffect(() => {
        if (members.length > 0) {
            // Plans are still one-time fetch or we can subscribe
            fetchMemberWorkloadPlans();
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

    const checkLeadStatus = async () => {
        if (!user?.uid || !selectedGroup?.id) return;
        try {
            const groupMembers = await getGroupMembers(selectedGroup.id);
            const userMember = groupMembers.find(m => m.userId === user.uid);
            setIsLeadOfGroup(!!userMember?.isLead);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMemberWorkloadPlans = async () => {
        const workloads: MemberWorkload[] = [];
        for (const member of members) {
            try {
                const plan = await getCurrentWeekPlan(member.groupId, member.userId);
                workloads.push({
                    member,
                    weeklyPlan: plan,
                    tasks: [], // Will be populated by the task listener
                    pendingTasks: [],
                    inProgressTasks: [],
                    reviewTasks: [],
                    completedTasks: [],
                    totalTasks: 0
                });
            } catch (error) {
                console.error(`Error fetching plan for ${member.userName}`, error);
            }
        }

        setMemberWorkloads(prev => {
            return workloads.map(w => {
                const existing = prev.find(p => p.member.userId === w.member.userId);
                return {
                    ...w,
                    tasks: existing?.tasks || [],
                    pendingTasks: existing?.pendingTasks || [],
                    inProgressTasks: existing?.inProgressTasks || [],
                    reviewTasks: existing?.reviewTasks || [],
                    completedTasks: existing?.completedTasks || [],
                    totalTasks: existing?.totalTasks || 0
                };
            });
        });
    };

    useEffect(() => {
        if (!selectedGroup?.id) return;

        // Subscribe to all tasks in the group for real-time updates
        const unsubscribe = subscribeToAllTasks((allTasks) => {
            const currentGroupTasks = allTasks.filter(t => t.groupId === selectedGroup.id);
            setGroupTasks(currentGroupTasks);

            // Update pending verification
            setPendingVerification(currentGroupTasks.filter(t => (t.status || 'pending') === 'review'));

            // Update member workloads based on new tasks
            if (members.length > 0) {
                const workloads = members.map(member => {
                    // Filter from ALL tasks to catch individual missions AND group missions for this user
                    const memberAllTasks = allTasks.filter(t =>
                        t.assignedTo === member.userId ||
                        (t.groupId === member.groupId && (!t.assignedTo || t.type === 'group'))
                    );

                    const pendingTasks = memberAllTasks.filter(t => !['in_progress', 'review', 'completed'].includes(t.status || 'pending'));
                    const inProgressTasks = memberAllTasks.filter(t => t.status === 'in_progress');
                    const reviewTasks = memberAllTasks.filter(t => t.status === 'review');
                    const completedTasks = memberAllTasks.filter(t => t.status === 'completed');

                    return {
                        member,
                        weeklyPlan: null,
                        tasks: memberAllTasks.filter(t => t.status !== 'completed'), // Active for display
                        pendingTasks,
                        inProgressTasks,
                        reviewTasks,
                        completedTasks,
                        totalTasks: memberAllTasks.length,
                    };
                });

                setMemberWorkloads(prev => {
                    return workloads.map(w => {
                        const existing = prev.find(p => p.member.userId === w.member.userId);
                        return { ...w, weeklyPlan: existing?.weeklyPlan || null };
                    });
                });
            }
        });

        return () => unsubscribe();
    }, [selectedGroup?.id, members.length]);

    const handleVerify = async (taskId: string) => {
        if (!user) return;
        setVerifying(taskId);
        try {
            const displayName = user.displayName || user.email?.split('@')[0] || 'Group Lead';
            await verifyTask(taskId, user.uid, displayName);
        } catch (error) {
            console.error("Verification failed", error);
        } finally {
            setVerifying(null);
        }
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

                    {/* Pending Verification Section for Leads */}
                    {isLeadOfGroup && pendingVerification.length > 0 && (
                        <GlassCard className="border-amber-500/30 bg-amber-500/5 mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Pending Member Submissions</h3>
                                    <p className="text-xs text-gray-400">Tasks awaiting your verification in this group</p>
                                </div>
                                <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                                    {pendingVerification.length}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {pendingVerification.map(task => (
                                    <div key={task.id} className="p-3 rounded-lg bg-black/20 border border-white/5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                                        <div>
                                            <p className="text-white font-medium text-sm">{task.title}</p>
                                            <p className="text-[11px] text-gray-500">Submitted by: <span className="text-gray-300">{task.assignedToName || 'Member'}</span></p>
                                        </div>
                                        <button
                                            onClick={() => handleVerify(task.id!)}
                                            disabled={verifying === task.id}
                                            className="shrink-0 flex items-center gap-2 text-xs bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white px-3 py-1.5 rounded transition-colors"
                                        >
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            {verifying === task.id ? 'Verifying...' : 'Verify'}
                                        </button>
                                    </div>
                                ))}

                                {/* Show some recently verified tasks here too as requested */}
                                {groupTasks.filter(t => t.status === 'completed').length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recently Verified</p>
                                        {groupTasks.filter(t => t.status === 'completed')
                                            .sort((a, b) => (b.verifiedAt?.seconds || 0) - (a.verifiedAt?.seconds || 0))
                                            .slice(0, 2)
                                            .map(task => (
                                                <div key={task.id} className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between opacity-60">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                                        <span className="text-xs text-gray-300">{task.title}</span>
                                                    </div>
                                                    <span className="text-[9px] text-gray-500">By {task.verifiedByName || 'Lead'}</span>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    )}

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
                                                <div className="flex justify-between items-center text-[10px] pt-1">
                                                    <span className="text-gray-500">{task.deadline}</span>
                                                    {task.status === 'completed' ? (
                                                        <span className="flex items-center gap-1 text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                                                            <ShieldCheck className="w-2.5 h-2.5" />
                                                            {task.verifiedByName ? `By ${task.verifiedByName}` : 'Verified'}
                                                        </span>
                                                    ) : task.status === 'review' ? (
                                                        <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded animate-pulse">
                                                            <Clock className="w-2.5 h-2.5" />
                                                            Review
                                                        </span>
                                                    ) : (
                                                        <span className={`px-1.5 py-0.5 rounded capitalize ${task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                                                            }`}>
                                                            {(task.status || 'pending').replace('_', ' ')}
                                                        </span>
                                                    )}
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
                                {memberWorkloads.map((workload) => {
                                    const { member, weeklyPlan, tasks } = workload;
                                    return (
                                        <GlassCard key={member.id} className="transition-all duration-200">
                                            <div
                                                className="flex flex-col sm:flex-row items-center justify-between cursor-pointer gap-4"
                                                onClick={() => toggleMemberExpand(member.userId)}
                                            >
                                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                                    <div className="relative">
                                                        <UserAvatar name={member.userName} photoURL={userPhotos[member.userId]} size="medium" />
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-black"></div>
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold flex items-center gap-2 text-lg">
                                                            {member.userName}
                                                            {member.isLead && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-tighter">Lead</span>}
                                                        </p>
                                                        <p className="text-xs text-gray-500 font-mono">{(member.role || 'guest').replace('_', ' ')}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
                                                    {/* Progress Section */}
                                                    <div className="flex flex-col gap-1 w-full sm:w-48">
                                                        <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold">
                                                            <span>Mission Progress</span>
                                                            <span>{Math.round(((workload.completedTasks?.length || 0) / (workload.totalTasks || 1)) * 100) || 0}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                                                                style={{ width: `${Math.round(((workload.completedTasks?.length || 0) / (workload.totalTasks || 1)) * 100) || 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-3 text-[10px] bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                            <div className="flex flex-col items-center border-r border-white/5 pr-3">
                                                                <span className="text-blue-400 font-bold text-xs">{workload.inProgressTasks?.length || 0}</span>
                                                                <span className="text-[8px] text-gray-500 uppercase">Active</span>
                                                            </div>
                                                            <div className="flex flex-col items-center border-r border-white/5 px-3">
                                                                <span className="text-yellow-400 font-bold text-xs">{workload.pendingTasks?.length || 0}</span>
                                                                <span className="text-[8px] text-gray-500 uppercase">Unactive</span>
                                                            </div>
                                                            <div className="flex flex-col items-center pl-3">
                                                                <span className="text-amber-400 font-bold text-xs">{(workload.reviewTasks?.length || 0) + (workload.completedTasks?.length || 0)}</span>
                                                                <span className="text-[8px] text-gray-500 uppercase">Submit</span>
                                                            </div>
                                                        </div>
                                                        {expandedMember === member.userId ? (
                                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                                        ) : (
                                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                                        )}
                                                    </div>
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

                                                    {/* Active Tasks Grid */}
                                                    <div className="space-y-4">
                                                        {/* Row 1: Active Missions */}
                                                        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                                            <h4 className="text-[11px] font-black text-blue-400 uppercase mb-4 flex items-center gap-2 tracking-widest">
                                                                <Clock className="w-3.5 h-3.5" /> Active Missions ({workload.inProgressTasks?.length || 0})
                                                            </h4>
                                                            <div className="space-y-3">
                                                                {(workload.inProgressTasks?.length || 0) > 0 ? (
                                                                    workload.inProgressTasks.map((task: any) => (
                                                                        <div key={task.id} className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-blue-500/30 transition-all group/task">
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <span className="text-white font-bold text-sm group-hover/task:text-blue-300 transition-colors">{task.title}</span>
                                                                                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border bg-blue-500/20 text-blue-400 border-blue-500/30">OPERATIONAL</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center bg-black/40 rounded p-2 border border-white/5">
                                                                                <span className="text-[10px] text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {task.deadline}</span>
                                                                                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">Running...</span>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-[10px] text-gray-600 italic py-2">No missions currently in progress.</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Unactive Missions */}
                                                        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                                            <h4 className="text-[11px] font-black text-yellow-400 uppercase mb-4 flex items-center gap-2 tracking-widest">
                                                                <AlertCircle className="w-3.5 h-3.5" /> Unactive Missions ({workload.pendingTasks?.length || 0})
                                                            </h4>
                                                            <div className="space-y-3">
                                                                {(workload.pendingTasks?.length || 0) > 0 ? (
                                                                    workload.pendingTasks.map((task: any) => (
                                                                        <div key={task.id} className="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-yellow-500/30 transition-all group/task">
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <span className="text-white font-bold text-sm group-hover/task:text-yellow-300 transition-colors">{task.title}</span>
                                                                                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold border bg-yellow-500/20 text-yellow-400 border-yellow-500/30">PENDING</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center bg-black/40 rounded p-2 border border-white/5">
                                                                                <span className="text-[10px] text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {task.deadline}</span>
                                                                                <span className="text-[10px] text-yellow-500/60 font-medium">Awaiting Start</span>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-[10px] text-gray-600 italic py-2">All assigned missions have been engaged.</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Row 3: Submission Audit (Submitted + Verified) */}
                                                        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                                            <h4 className="text-[11px] font-black text-amber-400 uppercase mb-4 flex items-center gap-2 tracking-widest">
                                                                <Clock className="w-3.5 h-3.5" /> Submission Audit ({(workload.reviewTasks?.length || 0) + (workload.completedTasks?.length || 0)})
                                                            </h4>
                                                            <div className="space-y-3">
                                                                {/* Sort reviewed first, then completed */}
                                                                {[...(workload.reviewTasks || []), ...(workload.completedTasks || [])].length > 0 ? (
                                                                    [...(workload.reviewTasks || []), ...(workload.completedTasks || [])]
                                                                        .sort((a, b) => {
                                                                            // Sort by status (review first) then by date
                                                                            if (a.status === 'review' && b.status !== 'review') return -1;
                                                                            if (a.status !== 'review' && b.status === 'review') return 1;
                                                                            return 0;
                                                                        })
                                                                        .map((task: any) => (
                                                                            <div key={task.id} className={`p-3 rounded-lg border transition-all group/task ${task.status === 'completed'
                                                                                ? 'bg-green-500/5 border-green-500/10 hover:border-green-500/30'
                                                                                : 'bg-white/5 border-white/5 hover:border-amber-500/30'
                                                                                }`}>
                                                                                <div className="flex justify-between items-start mb-2">
                                                                                    <span className={`font-bold text-sm transition-colors ${task.status === 'completed' ? 'text-green-300' : 'text-white group-hover/task:text-amber-300'
                                                                                        }`}>{task.title}</span>
                                                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${task.status === 'completed'
                                                                                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                                                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                                                                                        }`}>
                                                                                        {task.status === 'completed' ? 'VERIFIED' : 'SUBMITTED'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex justify-between items-center bg-black/40 rounded p-2 border border-white/5">
                                                                                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                                                        <Calendar className="w-3 h-3" />
                                                                                        {task.status === 'completed'
                                                                                            ? `Verified ${task.verifiedAt ? new Date(task.verifiedAt.seconds * 1000).toLocaleDateString() : 'recently'}`
                                                                                            : `Submitted ${task.submittedAt ? new Date(task.submittedAt.seconds * 1000).toLocaleDateString() : ''}`
                                                                                        }
                                                                                    </span>
                                                                                    <span className={`text-[10px] font-bold ${task.status === 'completed' ? 'text-green-400' : 'text-amber-400'
                                                                                        }`}>
                                                                                        {task.status === 'completed' ? (
                                                                                            <span className="flex items-center gap-1 underline decoration-green-500/30">
                                                                                                <ShieldCheck className="w-3 h-3" /> Logged
                                                                                            </span>
                                                                                        ) : 'In Review'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                ) : (
                                                                    <p className="text-[10px] text-gray-600 italic py-2">No missions submitted yet.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </GlassCard>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Integrated Oversight Insights for Group Lead */}
                    {isLeadOfGroup && (
                        <div className="mt-8 space-y-8">
                            <h3 className="text-xl font-bold text-white border-b border-white/5 pb-2">Group Performance Oversight</h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                                            <div>
                                                <p className="text-2xl font-bold text-blue-400">{groupTasks.filter(t => t.status === 'in_progress').length}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Active Missions</p>
                                            </div>
                                            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/10 flex items-center justify-between">
                                            <div>
                                                <p className="text-2xl font-bold text-yellow-400">{groupTasks.filter(t => !['in_progress', 'review', 'completed'].includes(t.status || 'pending')).length}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Unactive Missions</p>
                                            </div>
                                            <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                                                <AlertCircle className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Deployment: Active */}
                                        <GlassCard>
                                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-blue-400" />
                                                Active Deployment
                                            </h3>
                                            <div className="space-y-3">
                                                {groupTasks.filter(t => t.status === 'in_progress').length === 0 ? (
                                                    <p className="text-xs text-gray-500 italic py-4 text-center">No missions currently active.</p>
                                                ) : groupTasks.filter(t => t.status === 'in_progress').slice(0, 100).map(t => (
                                                    <div key={t.id} className="p-2.5 rounded bg-blue-500/5 border border-blue-500/10 flex justify-between items-center text-[11px]">
                                                        <div className="min-w-0">
                                                            <p className="text-white font-medium truncate">{t.title}</p>
                                                            <p className="text-gray-500">{t.assignedToName || 'Member'}</p>
                                                        </div>
                                                        <span className="shrink-0 px-2 py-0.5 rounded-[4px] font-bold bg-blue-500/20 text-blue-400 text-[9px]">ACTIVE</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </GlassCard>

                                        {/* Deployment: Unactive */}
                                        <GlassCard>
                                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-yellow-400" />
                                                Unactive Reserves
                                            </h3>
                                            <div className="space-y-3">
                                                {groupTasks.filter(t => !['in_progress', 'review', 'completed'].includes(t.status || 'pending')).length === 0 ? (
                                                    <p className="text-xs text-gray-500 italic py-4 text-center">All missions have been engaged.</p>
                                                ) : groupTasks.filter(t => !['in_progress', 'review', 'completed'].includes(t.status || 'pending')).slice(0, 50).map(t => (
                                                    <div key={t.id} className="p-2.5 rounded bg-yellow-500/5 border border-yellow-500/10 flex justify-between items-center text-[11px]">
                                                        <div className="min-w-0">
                                                            <p className="text-white font-medium truncate">{t.title}</p>
                                                            <p className="text-gray-500">{t.assignedToName || 'Unassigned'}</p>
                                                        </div>
                                                        <span className="shrink-0 px-2 py-0.5 rounded-[4px] font-bold bg-yellow-500/20 text-yellow-400 text-[9px]">UNACTIVE</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </GlassCard>
                                    </div>
                                </div>
                                {/* 2. Group Verification History */}
                                <GlassCard>
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        Verification Audit
                                    </h3>
                                    <div className="space-y-3">
                                        {groupTasks.filter(t => t.status === 'completed').length === 0 ? (
                                            <p className="text-sm text-gray-500 italic text-center py-8">No missions verified in this group yet.</p>
                                        ) : groupTasks.filter(t => t.status === 'completed').sort((a, b) => (b.verifiedAt?.seconds || 0) - (a.verifiedAt?.seconds || 0)).slice(0, 50).map(task => (
                                            <div key={task.id} className="p-3 rounded bg-green-500/5 border border-green-500/10 flex items-center justify-between gap-3 text-xs">
                                                <div className="min-w-0">
                                                    <p className="text-white font-medium truncate">{task.title}</p>
                                                    <p className="text-gray-500">Subject: {task.assignedToName || 'Member'}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-green-400 font-bold">By {task.verifiedByName || 'Lead'}</p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {task.verifiedAt ? format(task.verifiedAt.toDate(), "MMM d, HH:mm") : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
