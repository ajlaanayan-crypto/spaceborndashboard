"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { UserPlus, Shield, Loader2, Edit2, Key, ChevronDown, Eye, Trash2, AlertTriangle, PenLine, Filter } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAllUsers, UserData, updateUserStatus, updateUserName, updateUserBatch, addWarning } from "@/services/userService";
import { getAllGroups, GroupData } from "@/services/groupService";
import { SessionManager } from "@/components/admin/SessionManager";
import { auth } from "@/lib/firebase";
import { Search } from "lucide-react";

export default function UserManagementPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>([]);
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState<string>("all");
    const [selectedBatch, setSelectedBatch] = useState<string>("all");
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);

    // Rename State
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renamingUser, setRenamingUser] = useState<UserData | null>(null);
    const [newName, setNewName] = useState("");
    const [newBatch, setNewBatch] = useState(""); // For editing batch
    const [updatingName, setUpdatingName] = useState(false);

    // Form State
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "intern", batch: "" });
    const [newRole, setNewRole] = useState("");
    const [creating, setCreating] = useState(false);
    const [updatingRole, setUpdatingRole] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [resetLink, setResetLink] = useState("");
    const [resetEmail, setResetEmail] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingUser, setDeletingUser] = useState<UserData | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const [usersData, groupsData] = await Promise.all([
                getAllUsers(),
                getAllGroups()
            ]);
            setUsers(usersData);
            setGroups(groupsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError("");
        setSuccess("");
        setResetLink("");

        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch("/api/admin/create-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(newUser),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess("User created successfully!");
            setResetLink(data.passwordResetLink);
            setSuccess("User created successfully!");
            setResetLink(data.passwordResetLink);
            setNewUser({ name: "", email: "", password: "", role: "intern", batch: "" });
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateNameAndBatch = async () => {
        if (!renamingUser) return;
        setUpdatingName(true);
        setError("");

        try {
            const promises = [];
            if (newName.trim() && newName !== renamingUser.name) {
                promises.push(updateUserName(renamingUser.uid, newName.trim()));
            }
            if (renamingUser.role === 'intern' && newBatch.trim() !== renamingUser.batch) {
                promises.push(updateUserBatch(renamingUser.uid, newBatch.trim()));
            }

            await Promise.all(promises);

            setSuccess("User details updated successfully!");
            setTimeout(() => {
                setShowRenameModal(false);
                setSuccess("");
                setRenamingUser(null);
                fetchUsers();
            }, 1000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUpdatingName(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!editingUser) return;
        setUpdatingRole(true);
        setError("");

        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch("/api/admin/update-role", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ uid: editingUser.uid, newRole }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSuccess("Role updated successfully!");
            setTimeout(() => {
                setShowRoleModal(false);
                setSuccess("");
                fetchUsers();
            }, 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUpdatingRole(false);
        }
    };

    const handleResetPassword = async (email: string) => {
        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch("/api/admin/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setResetLink(data.resetLink);
            setResetEmail(email);
            alert("Password reset link generated! Check the notification.");
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    const toggleStatus = async (uid: string, currentStatus: string) => {
        const newStatus = currentStatus === "active" ? "inactive" : "active";
        await updateUserStatus(uid, newStatus as any);
        fetchUsers();
    };

    const handleDeleteUser = async () => {
        if (!deletingUser || deleteConfirmText !== deletingUser.name) return;
        setDeleting(true);
        setError("");

        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch("/api/admin/delete-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ uid: deletingUser.uid }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setShowDeleteModal(false);
            setDeletingUser(null);
            setDeleteConfirmText("");
            setSuccess("User deleted successfully!");
            setTimeout(() => setSuccess(""), 3000);
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    // Derived State for Filters
    const uniqueBatches = useMemo(() => {
        const batches = new Set<string>();
        users.forEach(user => {
            if (user.role === 'intern' && user.batch) {
                batches.add(user.batch);
            }
        });
        return Array.from(batches).sort();
    }, [users]);

    // Filter and Sort Users
    const filteredUsers = users
        .filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = selectedRole === 'all' || user.role === selectedRole;
            const matchesBatch = selectedBatch === 'all' || (user.role === 'intern' && user.batch === selectedBatch);

            return matchesSearch && matchesRole && matchesBatch;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    const getUserGroups = (uid: string) => {
        return groups.filter(g => g.memberIds.includes(uid));
    };

    const handleIssueWarning = async (uid: string, name: string) => {
        if (!confirm(`Are you sure you want to issue a warning to ${name}? 3 warnings will automatically deactivate the account.`)) return;
        try {
            await addWarning(uid);
            fetchUsers();
            setSuccess(`Warning issued to ${name}`);
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            alert("Failed to issue warning");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">User Management</h1>
                    <p className="text-gray-400">Manage access, roles, and credentials.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                >
                    <UserPlus className="w-5 h-5" />
                    Add User
                </button>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Bar */}
                <GlassCard className="p-4 flex items-center gap-4">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="bg-transparent border-none focus:outline-none text-white w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </GlassCard>

                {/* Role Filter */}
                <GlassCard className="p-4 flex items-center gap-4">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        value={selectedRole}
                        onChange={(e) => {
                            setSelectedRole(e.target.value);
                            if (e.target.value !== 'intern') setSelectedBatch('all'); // Reset batch if not intern
                        }}
                        className="bg-transparent border-none focus:outline-none text-white w-full cursor-pointer [&>option]:bg-black"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="core_employee">Core Employee</option>
                        <option value="normal_employee">Normal Employee</option>
                        <option value="intern">Intern</option>
                    </select>
                </GlassCard>

                {/* Batch Filter (Visible only when filtering Interns or All) */}
                <GlassCard className={`p-4 flex items-center gap-4 ${selectedRole !== 'all' && selectedRole !== 'intern' ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        disabled={selectedRole !== 'all' && selectedRole !== 'intern'}
                        className="bg-transparent border-none focus:outline-none text-white w-full cursor-pointer [&>option]:bg-black"
                    >
                        <option value="all">All Batches</option>
                        {uniqueBatches.map(batch => (
                            <option key={batch} value={batch}>{batch}</option>
                        ))}
                    </select>
                </GlassCard>
            </div>

            {/* Password Reset Link Display */}
            {resetLink && (
                <GlassCard className="bg-green-500/10 border-green-500/30">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-green-400 font-bold mb-2">Password Reset Link for {resetEmail}</p>
                            <input
                                type="text"
                                readOnly
                                value={resetLink}
                                className="w-full bg-black/60 border border-green-500/30 rounded p-2 text-xs text-green-300 font-mono select-all"
                                onClick={(e) => {
                                    e.currentTarget.select();
                                    navigator.clipboard.writeText(resetLink);
                                }}
                            />
                            <p className="text-gray-500 text-xs mt-1">Click to copy</p>
                        </div>
                        <button
                            onClick={() => { setResetLink(""); setResetEmail(""); }}
                            className="text-gray-400 hover:text-white ml-4"
                        >
                            ✕
                        </button>
                    </div>
                </GlassCard>
            )}

            <GlassCard className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Groups</th>
                                <th className="px-6 py-4">Warnings</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer group"
                                            onClick={() => router.push(`/admin/users/${user.uid}`)}
                                        >
                                            <UserAvatar name={user.name} photoURL={user.photoURL} size="small" />
                                            <div>
                                                <p className="text-white font-medium group-hover:text-blue-400 transition-colors">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${user.role === 'admin' ? 'bg-red-500/10 text-red-400' :
                                                user.role === 'core_employee' ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-green-500/10 text-green-400'
                                                }`}>
                                                {user.role === 'admin' && <Shield className="w-3 h-3" />}
                                                {user.role ? user.role.replace("_", " ") : "No Role"}
                                            </span>
                                            {user.role === 'intern' && user.batch && (
                                                <span className="text-[10px] text-gray-400 px-2">
                                                    {user.batch}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {getUserGroups(user.uid).length > 0 ? (
                                                getUserGroups(user.uid).map(g => (
                                                    <span key={g.id} className="text-xs bg-white/10 text-gray-300 px-1.5 py-0.5 rounded border border-white/5">
                                                        {g.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-600 italic">No Groups</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1 text-red-500">
                                            {Array.from({ length: user.warnings || 0 }).map((_, i) => (
                                                <span key={i}>❌</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs ${user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {user.status}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setRenamingUser(user);
                                                    setNewName(user.name);
                                                    setNewBatch(user.batch || "");
                                                    setShowRenameModal(true);
                                                }}
                                                className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm px-2 py-1 bg-yellow-500/10 rounded flex items-center gap-1"
                                                title="Edit Details"
                                            >
                                                <PenLine className="w-3 h-3" />
                                                Rename
                                            </button>
                                            <button
                                                onClick={() => handleIssueWarning(user.uid, user.name)}
                                                className="text-orange-400 hover:text-orange-300 transition-colors text-sm px-2 py-1 bg-orange-500/10 rounded flex items-center gap-1"
                                                title="Issue Warning"
                                            >
                                                <AlertTriangle className="w-3 h-3" />
                                                Warn
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingUser(user);
                                                    setNewRole(user.role || "intern");
                                                    setShowRoleModal(true);
                                                }}
                                                className="text-blue-400 hover:text-blue-300 transition-colors text-sm px-2 py-1 bg-blue-500/10 rounded flex items-center gap-1"
                                                title="Change Role"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                                Role
                                            </button>
                                            <button
                                                onClick={() => handleResetPassword(user.email)}
                                                className="text-purple-400 hover:text-purple-300 transition-colors text-sm px-2 py-1 bg-purple-500/10 rounded flex items-center gap-1"
                                                title="Reset Password"
                                            >
                                                <Key className="w-3 h-3" />
                                                Reset
                                            </button>
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => toggleStatus(user.uid, user.status)}
                                                    className="text-gray-400 hover:text-white transition-colors text-sm underline"
                                                >
                                                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                            )}
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeletingUser(user);
                                                        setDeleteConfirmText("");
                                                        setError("");
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="text-red-400 hover:text-red-300 transition-colors text-sm px-2 py-1 bg-red-500/10 rounded flex items-center gap-1"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Rename Modal */}
            {showRenameModal && renamingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-md border-2 border-yellow-500/30">
                        <h2 className="text-xl font-bold text-white mb-4">Rename User</h2>
                        <p className="text-gray-400 text-sm mb-4">
                            Update name for <span className="text-white font-medium">{renamingUser.email}</span>
                        </p>

                        {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded">{error}</p>}
                        {success && <p className="text-green-400 text-sm mb-4 bg-green-500/10 p-2 rounded">{success}</p>}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-yellow-500"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {renamingUser.role === 'intern' && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Batch (Interns Only)</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-yellow-500 [&>option]:bg-black"
                                        value={newBatch}
                                        onChange={(e) => setNewBatch(e.target.value)}
                                    >
                                        <option value="">Select Batch</option>
                                        <option value="Batch 1">Batch 1</option>
                                        <option value="Batch 2">Batch 2</option>
                                        <option value="Batch 3">Batch 3</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRenameModal(false);
                                        setError("");
                                        setSuccess("");
                                    }}
                                    className="flex-1 py-2 rounded bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateNameAndBatch}
                                    disabled={updatingName || !newName.trim()}
                                    className="flex-1 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-500 transition-colors flex items-center justify-center disabled:opacity-50"
                                >
                                    {updatingName ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Name"}
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Role Change Modal */}
            {showRoleModal && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-md border-2 border-blue-500/30">
                        <h2 className="text-xl font-bold text-white mb-4">Change User Role</h2>
                        <p className="text-gray-400 text-sm mb-4">
                            Update role for <span className="text-white font-medium">{editingUser.name}</span>
                        </p>

                        {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded">{error}</p>}
                        {success && <p className="text-green-400 text-sm mb-4 bg-green-500/10 p-2 rounded">{success}</p>}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Current Role</label>
                                <div className="p-2 bg-black/40 border border-white/10 rounded text-white">
                                    {editingUser.role ? editingUser.role.replace("_", " ") : "No Role"}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">New Role</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                >
                                    <option value="intern">Intern</option>
                                    <option value="normal_employee">Normal Employee</option>
                                    <option value="core_employee">Core Employee</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {newUser.role === 'intern' && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Intern Batch</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500 [&>option]:bg-black"
                                        value={newUser.batch}
                                        onChange={(e) => setNewUser({ ...newUser, batch: e.target.value })}
                                    >
                                        <option value="">Select Batch</option>
                                        <option value="Batch 1">Batch 1</option>
                                        <option value="Batch 2">Batch 2</option>
                                        <option value="Batch 3">Batch 3</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRoleModal(false);
                                        setError("");
                                        setSuccess("");
                                    }}
                                    className="flex-1 py-2 rounded bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateRole}
                                    disabled={updatingRole || newRole === editingUser.role}
                                    className="flex-1 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center justify-center disabled:opacity-50"
                                >
                                    {updatingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Role"}
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Session Modal */}
            {showSessionModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-lg border-2 border-red-500/30 relative">
                        <button
                            onClick={() => setShowSessionModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                        <SessionManager userId={selectedUser.uid} userName={selectedUser.name} />
                    </GlassCard>
                </div>
            )}

            {/* Create User Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-md border-2 border-blue-500/30">
                        <h2 className="text-xl font-bold text-white mb-4">Add Team Member</h2>
                        {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded">{error}</p>}
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Role Assignment</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                                >
                                    <option value="intern">Intern</option>
                                    <option value="normal_employee">Normal Employee</option>
                                    <option value="core_employee">Core Employee</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {success && (
                                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded">
                                    <p className="text-green-400 text-sm font-bold mb-2">{success}</p>
                                    {resetLink && (
                                        <div>
                                            <p className="text-gray-400 text-xs mb-2">Password Reset Link (share with user):</p>
                                            <input
                                                type="text"
                                                readOnly
                                                value={resetLink}
                                                className="w-full bg-black/60 border border-green-500/30 rounded p-2 text-xs text-green-300 font-mono select-all"
                                                onClick={(e) => {
                                                    e.currentTarget.select();
                                                    navigator.clipboard.writeText(resetLink);
                                                }}
                                            />
                                            <p className="text-gray-500 text-xs mt-1">Click to copy</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setError("");
                                        setSuccess("");
                                        setResetLink("");
                                    }}
                                    className="flex-1 py-2 rounded bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center justify-center"
                                >
                                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create User"}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}

            {/* Delete User Confirmation Modal */}
            {showDeleteModal && deletingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-md border-2 border-red-500/30">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Delete User</h2>
                                <p className="text-red-400 text-xs">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="bg-red-500/5 border border-red-500/20 rounded p-3 mb-4">
                            <p className="text-gray-300 text-sm">
                                You are about to permanently delete <span className="text-white font-bold">{deletingUser.name}</span> and all their data:
                            </p>
                            <ul className="text-xs text-gray-400 mt-2 space-y-1 list-disc list-inside">
                                <li>Firebase Auth account</li>
                                <li>All tasks, messages & notifications</li>
                                <li>Sessions, reports & feedback</li>
                                <li>Group memberships & weekly plans</li>
                                <li>Audit logs & performance scores</li>
                            </ul>
                        </div>

                        {error && <p className="text-red-400 text-sm mb-3 bg-red-500/10 p-2 rounded">{error}</p>}

                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-1">
                                Type <span className="text-white font-bold">{deletingUser.name}</span> to confirm
                            </label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-red-500/20 rounded p-2 text-white focus:outline-none focus:border-red-500"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder={deletingUser.name}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeletingUser(null);
                                    setDeleteConfirmText("");
                                    setError("");
                                }}
                                className="flex-1 py-2 rounded bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={deleting || deleteConfirmText !== deletingUser.name}
                                className="flex-1 py-2 rounded bg-red-600 text-white hover:bg-red-500 transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <span className="flex items-center gap-1">
                                        <Trash2 className="w-4 h-4" /> Delete Forever
                                    </span>
                                )}
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
