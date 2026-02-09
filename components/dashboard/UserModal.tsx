'use client';

import { X, UserCog, Mail, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { User } from '../../lib/types/users';

interface UserModalProps {
    showModal: boolean;
    onClose: () => void;
    editingUser: User | null;
    formData: any;
    setFormData: (data: any) => void;
    handleSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
}

export default function UserModal({ showModal, onClose, editingUser, formData, setFormData, handleSubmit, isSubmitting }: UserModalProps) {
    if (!showModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Decorative top gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            {editingUser ? 'Edit User' : 'Add New User'}
                        </h3>
                        <p className="text-zinc-400 text-xs mt-1">
                            {editingUser ? 'Update user details below' : 'Create a new account for system access'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 ml-1">USERNAME</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="johndoe"
                                required
                            />
                            <UserCog className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 ml-1">EMAIL ADDRESS</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="john@example.com"
                                required
                            />
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        </div>
                    </div>

                    {!editingUser && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-400 ml-1">PASSWORD</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400 ml-1">ASSIGNED ROLE</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['employee', 'core', 'admin', 'intern'].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: role as any })}
                                    className={cn(
                                        "px-2 py-2 rounded-lg text-xs font-semibold uppercase border transition-all",
                                        formData.role === role
                                            ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                                    )}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-transparent border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-800 transition-all text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all text-sm font-medium shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingUser ? 'Save Changes' : 'Create Account')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
