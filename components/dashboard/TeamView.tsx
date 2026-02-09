'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    UserPlus, Edit, Trash2, Search,
    ShieldCheck, Users, UserCog, GraduationCap
} from 'lucide-react';
import { User } from '../../lib/types/users';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { getAllUsers, deleteUserDocument } from '../../lib/firebaseUsers';
import { Loader2 } from 'lucide-react';

/* --- Shared Components --- */

export const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 p-4 rounded-xl flex items-center gap-4 hover:bg-zinc-800/50 transition-colors cursor-default group">
        <div className={cn("p-3 rounded-lg bg-opacity-10 group-hover:scale-110 transition-transform duration-300", color)}>
            <Icon className={cn("w-6 h-6", color.replace('bg-', 'text-'))} />
        </div>
        <div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</p>
            <h4 className="text-2xl font-bold text-zinc-100">{value}</h4>
        </div>
    </div>
);

export const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
        admin: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
        core: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]',
        employee: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
        intern: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
    };

    return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border", styles[role] || 'bg-zinc-800 text-zinc-400')}>
            {role}
        </span>
    );
};

/* --- Main Component --- */

interface TeamViewProps {
    currentUser: User;
    onOpenModal: (user?: User) => void;
}

export default function TeamView({ currentUser, onOpenModal }: TeamViewProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load users.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const stats = useMemo(() => ({
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        interns: users.filter(u => u.role === 'intern').length,
        active: users.length
    }), [users]);

    const handleDelete = async (userId: number) => {
        if (!confirm('Are you sure? This cannot be undone.')) return;
        try {
            const userToDelete = users.find(u => u.id === userId);
            if (!userToDelete || !userToDelete.uid) {
                throw new Error('User not found or UID missing');
            }

            await deleteUserDocument(userToDelete.uid);
            toast.success('User deleted successfully');
            await fetchUsers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete user');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & Stats */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                            Team Management
                        </h1>
                        <p className="text-zinc-400 text-sm mt-1">Manage system access and permissions</p>
                    </div>
                    <button
                        onClick={() => onOpenModal()}
                        className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl transition-all text-sm font-semibold shadow-lg shadow-white/5 active:scale-95"
                    >
                        <UserPlus className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        Add Member
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Users} label="Total Users" value={stats.total} color="bg-blue-500" />
                    <StatCard icon={ShieldCheck} label="Administrators" value={stats.admins} color="bg-rose-500" />
                    <StatCard icon={GraduationCap} label="Interns" value={stats.interns} color="bg-amber-500" />
                    <StatCard icon={UserCog} label="Active Sessions" value={stats.active} color="bg-emerald-500" />
                </div>
            </div>

            {/* Filters & Table */}
            <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl">
                {/* Toolbar */}
                <div className="p-4 border-b border-zinc-800/50 flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-zinc-950/50 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder-zinc-600 transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-800/50 bg-zinc-900/20 text-xs uppercase tracking-wider text-zinc-500">
                                <th className="px-6 py-4 font-semibold">User Profile</th>
                                <th className="px-6 py-4 font-semibold hidden sm:table-cell">Contact</th>
                                <th className="px-6 py-4 font-semibold">Role Access</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50 text-sm">
                            {isLoading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-10 w-32 bg-zinc-800 rounded-lg" /></td>
                                        <td className="px-6 py-4 hidden sm:table-cell"><div className="h-4 w-48 bg-zinc-800 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-6 w-16 bg-zinc-800 rounded-full" /></td>
                                        <td className="px-6 py-4"><div className="h-8 w-16 bg-zinc-800 rounded-lg ml-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="group hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/20">
                                                    {u.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                                                        {u.username}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 sm:hidden">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 hidden sm:table-cell font-mono text-xs">
                                            {u.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(u.role)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => onOpenModal(u)}
                                                    className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(u.id)}
                                                    disabled={u.id === currentUser.id}
                                                    className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="mx-auto w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-3">
                                            <Search className="h-5 w-5 text-zinc-500" />
                                        </div>
                                        <h3 className="text-zinc-300 font-medium">No users found</h3>
                                        <p className="text-zinc-500 text-sm mt-1">Try adjusting your search terms</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
