'use client';

import { useState } from 'react';
import {
    LayoutDashboard, Users, CheckSquare,
    LogOut, Bell, Settings
} from 'lucide-react';
import { User } from '../lib/types/users';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { logout } from '../lib/auth';
import { useRouter } from 'next/navigation';
import { registerWithEmail } from '../lib/firebaseAuth';
import { createUserDocument } from '../lib/firebaseUsers';

// Components
import TeamView from './dashboard/TeamView';
import TaskView from './dashboard/TaskView';
import UserModal from './dashboard/UserModal';

interface AdminDashboardProps {
    user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'tasks'>('team');

    // User Modal State (Hoisted to Dashboard level for TeamView)
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'employee' as 'admin' | 'core' | 'employee' | 'intern',
    });

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            toast.error('Logout failed');
        }
    };

    /* --- User Management Handlers (Passed to TeamView) --- */

    const handleOpenModal = (userToEdit?: User) => {
        if (userToEdit) {
            setEditingUser(userToEdit);
            setFormData({
                username: userToEdit.username,
                email: userToEdit.email,
                password: '',
                role: userToEdit.role as any
            });
        } else {
            setEditingUser(null);
            setFormData({ username: '', email: '', password: '', role: 'employee' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ username: '', email: '', password: '', role: 'employee' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingUser) {
                // Update Logic (Simplified for now - requires UID mapping in production)
                toast.info('Update functionality requires backend integration');
            } else {
                if (!formData.password) throw new Error('Password required');

                const { user: firebaseUser } = await registerWithEmail(formData.email, formData.password);

                await createUserDocument(firebaseUser.uid, {
                    username: formData.username,
                    email: formData.email,
                    role: formData.role,
                });

                toast.success('User created successfully');
                handleCloseModal();
                // We need to trigger refresh in TeamView - simplest way is forcing re-render or context
                // For now, TeamView will auto-refresh on mount or we can pass a refresh trigger
                window.location.reload(); // Bruteforce refresh for now to ensure list updates
            }
        } catch (error: any) {
            toast.error(error.message || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-hidden">

            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-800/50 flex flex-col bg-zinc-950/50 backdrop-blur-xl">
                <div className="p-6 border-b border-zinc-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <span className="font-bold text-white">S</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight">Spaceborn</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                        { id: 'team', icon: Users, label: 'Team Management' },
                        { id: 'tasks', icon: CheckSquare, label: 'Task Management' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                                activeTab === item.id
                                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20"
                                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-800/50 space-y-2">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>

                    <div className="flex items-center gap-3 px-3 py-3 mt-4 bg-zinc-900 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                            {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.username}</p>
                            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
                {/* Topbar */}
                <header className="h-16 border-b border-zinc-800/50 flex items-center justify-between px-8 bg-zinc-950/30 backdrop-blur-sm sticky top-0 z-20">
                    <div className="text-sm text-zinc-500">
                        Dashboard / <span className="text-zinc-200 capitalize">{activeTab.replace('-', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors relative">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full ring-2 ring-black" />
                        </button>
                        <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] pb-24">
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <h2 className="text-2xl font-bold">Welcome back, {user.username}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-64 flex flex-col justify-center items-center text-zinc-500">
                                    <p>Activity Chart Placeholder</p>
                                </div>
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 h-64 flex flex-col justify-center items-center text-zinc-500">
                                    <p>Recent Activities Placeholder</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <TeamView currentUser={user} onOpenModal={handleOpenModal} />
                    )}

                    {activeTab === 'tasks' && (
                        <TaskView currentUser={user} />
                    )}
                </div>
            </main>

            <UserModal
                showModal={showModal}
                onClose={handleCloseModal}
                editingUser={editingUser}
                formData={formData}
                setFormData={setFormData}
                handleSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}