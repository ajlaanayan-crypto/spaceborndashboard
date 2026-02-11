"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Users, Mail, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UserData {
    uid: string;
    name: string;
    email: string;
    role: string;
    status: string;
    photoURL?: string;
}

export default function CoreTeamPage() {
    const [interns, setInterns] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                // Fetch all interns
                const q = query(collection(db, "users"), where("role", "==", "intern"));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => doc.data() as UserData);
                setInterns(data);
            } catch (error) {
                console.error("Error fetching team:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeam();
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Team Overview</h1>
                <p className="text-gray-400">Manage and monitor your intern squad.</p>
            </div>

            <GlassCard>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Active Interns
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <p className="text-gray-500">Loading team data...</p>
                    ) : interns.length === 0 ? (
                        <p className="text-gray-500 italic">No interns assigned yet.</p>
                    ) : interns.map(intern => (
                        <div key={intern.uid} className="p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                            <div className="flex items-start justify-between mb-4">
                                <UserAvatar
                                    name={intern.name}
                                    photoURL={intern.photoURL}
                                    size="medium"
                                />
                                <span className={`px-2 py-0.5 rounded text-xs border ${intern.status === 'active' ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'
                                    }`}>
                                    {intern.status}
                                </span>
                            </div>

                            <h4 className="text-lg font-bold text-white mb-1">{intern.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                <Mail className="w-3 h-3" />
                                {intern.email}
                            </div>

                            <div className="pt-3 border-t border-white/5 mt-3 flex justify-between items-center">
                                <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Intern</span>
                                <button
                                    onClick={() => {
                                        setSelectedUser(intern);
                                        setShowProfileModal(true);
                                    }}
                                    className="text-xs text-gray-400 hover:text-white transition-colors"
                                >
                                    View Profile &rarr;
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>

            {/* Profile Modal */}
            {showProfileModal && selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <GlassCard className="max-w-lg w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Team Member Profile</h2>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Avatar and Name */}
                            <div className="flex items-center gap-4">
                                <UserAvatar
                                    name={selectedUser.name}
                                    photoURL={selectedUser.photoURL}
                                    size="large"
                                />
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{selectedUser.name}</h3>
                                    <span className="text-sm px-3 py-1 rounded bg-blue-500/10 text-blue-400 inline-block mt-1">
                                        {selectedUser.role.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Email Address</p>
                                    <p className="text-white flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-blue-400" />
                                        {selectedUser.email}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Status</p>
                                    <span className={`px-3 py-1 rounded text-sm ${selectedUser.status === 'active'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                        }`}>
                                        {selectedUser.status}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-400 mb-1">User ID</p>
                                    <p className="text-white font-mono text-xs bg-black/40 px-3 py-2 rounded">
                                        {selectedUser.uid}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowProfileModal(false)}
                                    className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
