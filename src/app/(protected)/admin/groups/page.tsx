"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useState, useEffect } from "react";
import { useAuth, UserRole } from "@/context/AuthContext";
import {
    createGroup,
    createGroupWithMembers,
    getAllGroups,
    updateGroup,
    archiveGroup,
    activateGroup,
    addGroupMember,
    getGroupMembers,
    removeGroupMember,
    canAddMoreGroups,
    deleteGroup,
    GroupData,
    GroupMemberData
} from "@/services/groupService";
import { getAllUsers, UserData } from "@/services/userService";
import { Loader2, Plus, Edit2, Archive, CheckCircle, Users, Trash2, Calendar, ClipboardList, Link as LinkIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import WeeklyPlanModal from "@/components/admin/WeeklyPlanModal";
import TaskAssignmentModal from "@/components/admin/TaskAssignmentModal";
import ResourceAssignmentModal from "@/components/admin/ResourceAssignmentModal";
import ResourceListModal from "@/components/admin/ResourceListModal";
import { getWeeklyPlan, getCurrentWeekStartDate, WeeklyPlanData } from "@/services/weeklyPlanService";

export default function AdminGroupsPage() {
    const { user } = useAuth();
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [allUsers, setAllUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
    const [groupMembers, setGroupMembers] = useState<GroupMemberData[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        leadId: "",
        leadName: "",
        maxMembers: 10,
    });

    // Weekly Plan & Task State
    const [showWeeklyPlanModal, setShowWeeklyPlanModal] = useState(false);
    const [selectedMemberForPlan, setSelectedMemberForPlan] = useState<GroupMemberData | null>(null);
    const [currentWeeklyPlan, setCurrentWeeklyPlan] = useState<WeeklyPlanData | null>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [showResourceListModal, setShowResourceListModal] = useState(false);

    useEffect(() => {
        fetchGroups();
        fetchUsers();
    }, []);

    const fetchGroups = async () => {
        try {
            const data = await getAllGroups();
            setGroups(data);
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

    const handleOpenModal = (group?: GroupData) => {
        setSelectedMemberIds([]); // Reset selected members
        if (group) {
            setEditingGroup(group);
            setFormData({
                name: group.name,
                description: group.description,
                leadId: group.leadId || "",
                leadName: group.leadName || "",
                maxMembers: group.maxMembers || 10,
            });
        } else {
            setEditingGroup(null);
            setFormData({
                name: "",
                description: "",
                leadId: "",
                leadName: "",
                maxMembers: 10,
            });
        }
        setShowModal(true);
        setError("");
        setSuccess("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError("");
        setSuccess("");

        try {
            if (!editingGroup) {
                // Create new group
                // Removed limit check as per requirement
                // const canAdd = await canAddMoreGroups();

                const leadUser = formData.leadId ? allUsers.find(u => u.uid === formData.leadId) : null;

                // Prepare members list
                const membersToAdd: any[] = [];

                // Add Lead as member (if exists)
                if (leadUser && formData.leadId) {
                    membersToAdd.push({
                        userId: leadUser.uid!,
                        userName: leadUser.name || "Unknown",
                        userEmail: leadUser.email || "",
                        role: (leadUser.role === 'admin' ? 'core_employee' : (leadUser.role || 'member')) as 'core_employee' | 'intern', // Map admin to core for type safety or keep original
                        isLead: true,
                        status: 'active',
                    });
                }

                // Add Selected Members
                for (const memberId of selectedMemberIds) {
                    // Skip if already added as lead
                    if (memberId === formData.leadId) continue;

                    const memberUser = allUsers.find(u => u.uid === memberId);
                    if (memberUser) {
                        membersToAdd.push({
                            userId: memberUser.uid!,
                            userName: memberUser.name || "Unknown",
                            userEmail: memberUser.email || "",
                            role: (memberUser.role === 'admin' ? 'core_employee' : (memberUser.role || 'member')) as 'core_employee' | 'intern',
                            isLead: false,
                            status: 'active',
                        });
                    }
                }

                // Atomic Batch Creation
                await createGroupWithMembers({
                    ...formData,
                    leadId: formData.leadId || null,
                    leadName: leadUser?.name || "Unassigned",
                    status: 'active',
                    memberIds: [], // Will be overwritten by the service function with correct IDs
                    createdBy: user?.uid || "system",
                }, membersToAdd);

                setSuccess("Group created successfully!");
            } else {
                // Update existing group
                await updateGroup(editingGroup.id!, formData);
                setSuccess("Group updated successfully!");
            }

            fetchGroups();
            setTimeout(() => {
                setShowModal(false);
                setSuccess("");
            }, 1500);
        } catch (err: any) {
            console.error(err);
            setError(err.message || JSON.stringify(err) || "Failed to save group");
        } finally {
            setCreating(false);
        }
    };

    const handleArchive = async (groupId: string) => {
        if (!confirm("Archive this group? Members will lose access.")) return;
        try {
            await archiveGroup(groupId);
            fetchGroups();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (groupId: string) => {
        if (!confirm("Permanently DELETE this group and remove all members? This cannot be undone.")) return;
        try {
            await deleteGroup(groupId);
            fetchGroups();
        } catch (error) {
            console.error(error);
            alert("Failed to delete group");
        }
    };

    const handleActivate = async (groupId: string) => {
        try {
            // Limit check removed
            await activateGroup(groupId);
            fetchGroups();
        } catch (error) {
            console.error(error);
        }
    };

    const handleManageMembers = async (group: GroupData) => {
        setSelectedGroup(group);
        try {
            const members = await getGroupMembers(group.id!);
            setGroupMembers(members);
            setShowMembersModal(true);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddMember = async (userId: string) => {
        if (!selectedGroup) return;

        try {
            const selectedUser = allUsers.find(u => u.uid === userId);
            if (!selectedUser) return;

            await addGroupMember({
                groupId: selectedGroup.id!,
                userId: selectedUser.uid!,
                userName: selectedUser.name,
                userEmail: selectedUser.email,
                role: selectedUser.role || 'member', // Default to member if no role
                isLead: false,
                status: 'active',
            });

            const members = await getGroupMembers(selectedGroup.id!);
            setGroupMembers(members);
            fetchGroups();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!selectedGroup) return;
        if (!confirm("Remove this member from the group?")) return;

        try {
            await removeGroupMember(selectedGroup.id!, userId);
            const members = await getGroupMembers(selectedGroup.id!);
            setGroupMembers(members);
            fetchGroups();
        } catch (error) {
            console.error(error);
        }
    };

    const handleManageResources = (group: GroupData) => {
        setSelectedGroup(group);
        setShowResourceListModal(true);
    };

    const activeGroups = groups.filter(g => g.status === 'active');
    const inactiveGroups = groups.filter(g => g.status === 'inactive');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Group Management</h1>
                    <p className="text-gray-400">Manage teams and assign group leads ({activeGroups.length} active)</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            if (!confirm("Initialize database with default groups?")) return;
                            try {
                                const res = await fetch('/api/admin/init-groups', { method: 'POST' });
                                const data = await res.json();
                                alert(data.message || data.error);
                                window.location.reload();
                            } catch (e) {
                                alert("Failed to initialize");
                            }
                        }}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                    >
                        Auto-Initialize DB
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Group
                    </button>
                </div>
            </div>

            {/* Active Groups */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Active Groups</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading ? (
                        <div className="col-span-full flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : activeGroups.length === 0 ? (
                        <p className="col-span-full text-gray-500 text-center py-8 italic">No active groups</p>
                    ) : (
                        activeGroups.map((group) => (
                            <GlassCard key={group.id} className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white">{group.name}</h3>
                                        <p className="text-sm text-gray-400 mt-1">{group.description}</p>
                                    </div>
                                    <span className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-400">
                                        Active
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        <span className="text-gray-400">Lead:</span>
                                        <span className="text-white">{group.leadName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-purple-400" />
                                        <span className="text-gray-400">Members:</span>
                                        <span className="text-white">{group.memberIds?.length || 0}</span>
                                    </div>
                                    {group.createdAt && (
                                        <p className="text-xs text-gray-500">
                                            Created {formatDistanceToNow(group.createdAt.toDate(), { addSuffix: true })}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-white/10">
                                    <button
                                        onClick={() => handleOpenModal(group)}
                                        className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4 inline mr-1" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleManageMembers(group)}
                                        className="flex-1 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white text-sm transition-colors"
                                    >
                                        <Users className="w-4 h-4 inline mr-1" />
                                        Members
                                    </button>
                                    <button
                                        onClick={() => handleManageResources(group)}
                                        className="flex-1 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm transition-colors"
                                    >
                                        <LinkIcon className="w-4 h-4 inline mr-1" />
                                        Resources
                                    </button>
                                    <button
                                        onClick={() => handleArchive(group.id!)}
                                        className="py-2 px-3 rounded bg-yellow-600 hover:bg-yellow-500 text-white text-sm transition-colors"
                                        title="Archive Group"
                                    >
                                        <Archive className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(group.id!)}
                                        className="py-2 px-3 rounded bg-red-600 hover:bg-red-500 text-white text-sm transition-colors"
                                        title="Delete Group"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            </div>

            {/* Inactive Groups */}
            {inactiveGroups.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">Archived Groups</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {inactiveGroups.map((group) => (
                            <GlassCard key={group.id} className="opacity-60 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{group.name}</h3>
                                        <p className="text-sm text-gray-400">{group.leadName} (Lead)</p>
                                    </div>
                                    <span className="px-2 py-1 rounded text-xs bg-gray-500/10 text-gray-400">
                                        Archived
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleActivate(group.id!)}
                                    className="w-full py-2 rounded bg-green-600 hover:bg-green-500 text-white text-sm transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4 inline mr-1" />
                                    Reactivate
                                </button>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingGroup ? "Edit Group" : "Create New Group"}
                        </h2>

                        {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded">{error}</p>}
                        {success && <p className="text-green-400 text-sm mb-4 bg-green-500/10 p-3 rounded">{success}</p>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Group Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description *</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Group Lead (Optional)</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={formData.leadId}
                                    onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                                >
                                    <option value="">No Group Lead</option>
                                    {allUsers.map(user => (
                                        <option key={user.uid} value={user.uid}>
                                            {user.name} ({user.role ? user.role.replace('_', ' ') : 'Guest'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Enable Member Selection only for New Groups */}
                            {!editingGroup && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Add Initial Members (Optional)</label>
                                    <div className="max-h-40 overflow-y-auto border border-white/10 rounded p-2 space-y-2 bg-black/20">
                                        {allUsers
                                            .filter(u => u.uid !== formData.leadId) // Exclude selected lead
                                            .map(user => (
                                                <label key={user.uid} className="flex items-center gap-2 p-1 hover:bg-white/5 rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-600 bg-gray-800 text-blue-600"
                                                        checked={selectedMemberIds.includes(user.uid!)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedMemberIds([...selectedMemberIds, user.uid!]);
                                                            } else {
                                                                setSelectedMemberIds(selectedMemberIds.filter(id => id !== user.uid));
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-sm text-gray-300">
                                                        {user.name} <span className="text-xs text-gray-500">({user.role?.replace('_', ' ') || 'Member'})</span>
                                                    </span>
                                                </label>
                                            ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Selected: {selectedMemberIds.length} members
                                    </p>
                                </div>
                            )}

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
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : editingGroup ? "Update Group" : "Create Group"}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* Members Modal */}
            {showMembersModal && selectedGroup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            Manage Members - {selectedGroup.name}
                        </h2>

                        {/* Current Members */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white mb-3">Current Members ({groupMembers.length})</h3>
                            <div className="space-y-2">
                                {groupMembers.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded">
                                        <div>
                                            <p className="text-white font-medium">{member.userName}</p>
                                            <p className="text-sm text-gray-400">{member.userEmail}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400">
                                                {member.role?.replace('_', ' ') || 'Member'}
                                            </span>
                                            {member.isLead && (
                                                <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400">
                                                    Lead
                                                </span>
                                            )}
                                            {!member.isLead && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.userId)}
                                                    className="text-red-400 hover:text-red-300 p-1"
                                                    title="Remove Member"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={async () => {
                                                    setSelectedMemberForPlan(member);
                                                    const plan = await getWeeklyPlan(member.groupId, member.userId, getCurrentWeekStartDate());
                                                    setCurrentWeeklyPlan(plan);
                                                    setShowWeeklyPlanModal(true);
                                                }}
                                                className="text-blue-400 hover:text-blue-300 p-1"
                                                title="Weekly Plan"
                                            >
                                                <Calendar className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Add Member */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Add Member</h3>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                onChange={(e) => e.target.value && handleAddMember(e.target.value)}
                                value=""
                            >
                                <option value="">Select a user...</option>
                                {allUsers
                                    .filter(u => !groupMembers.find(m => m.userId === u.uid))
                                    .map(user => (
                                        <option key={user.uid} value={user.uid}>
                                            {user.name} ({user.email}) - {user.role?.replace('_', ' ') || 'Unknown'}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowMembersModal(false)}
                                className="flex-1 py-2 rounded bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => setShowTaskModal(true)}
                                className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Assign Task
                            </button>
                            <button
                                onClick={() => setShowResourceModal(true)}
                                className="flex-1 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center justify-center gap-2"
                            >
                                <LinkIcon className="w-4 h-4" /> Share Resource
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Weekly Plan Modal */}
            {showWeeklyPlanModal && selectedGroup && selectedMemberForPlan && (
                <WeeklyPlanModal
                    isOpen={showWeeklyPlanModal}
                    onClose={() => setShowWeeklyPlanModal(false)}
                    group={selectedGroup}
                    memberUser={{
                        uid: selectedMemberForPlan.userId,
                        name: selectedMemberForPlan.userName,
                        email: selectedMemberForPlan.userEmail,
                        role: selectedMemberForPlan.role as UserRole,
                        status: 'active',
                        createdAt: new Date().toISOString(),
                    }} // Minimal UserData for display
                    initialPlan={currentWeeklyPlan} // Pass fetched plan
                    onSave={() => {
                        // refreshing not strictly needed if we don't show plan data in the list immediately
                    }}
                    isReadOnly={false} // Admin can edit
                />
            )}

            {/* Task Assignment Modal */}
            {showTaskModal && selectedGroup && (
                <TaskAssignmentModal
                    isOpen={showTaskModal}
                    onClose={() => setShowTaskModal(false)}
                    group={selectedGroup}
                    members={groupMembers.map(m => ({
                        uid: m.userId,
                        name: m.userName,
                        email: m.userEmail,
                        role: m.role as UserRole,
                        status: 'active',
                        createdAt: new Date().toISOString(),
                    }))} // Map GroupMemberData to UserData
                    onTaskCreated={() => {
                        alert("Task Assigned Successfully");
                    }}
                />
            )}

            {/* Resource List Modal */}
            {showResourceListModal && selectedGroup && (
                <ResourceListModal
                    isOpen={showResourceListModal}
                    onClose={() => setShowResourceListModal(false)}
                    group={selectedGroup}
                    onAddResource={() => {
                        setShowResourceListModal(false);
                        // Fetch members if not already loaded (they might be if we came from Members modal but safer to check)
                        // But Resources are often typically shared from ResourceListModal.
                        // But ResourceAssignmentModal needs `members` prop.
                        // So we should fetch members here too.
                        getGroupMembers(selectedGroup.id!).then(members => {
                            setGroupMembers(members);
                            setShowResourceModal(true);
                        });
                    }}
                />
            )}

            {/* Resource Assignment Modal */}
            {showResourceModal && selectedGroup && (
                <ResourceAssignmentModal
                    isOpen={showResourceModal}
                    onClose={() => setShowResourceModal(false)}
                    group={selectedGroup}
                    members={groupMembers.map(m => ({
                        uid: m.userId,
                        name: m.userName,
                        email: m.userEmail,
                        role: m.role as UserRole,
                        status: 'active',
                        createdAt: new Date().toISOString(),
                    }))}
                    onResourceCreated={() => {
                        alert("Resource Shared Successfully");
                    }}
                />
            )}
        </div>
    );
}
