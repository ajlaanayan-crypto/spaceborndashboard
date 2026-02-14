"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/context/AuthContext";
import { getUserGroups, getActiveGroups, GroupData } from "@/services/groupService";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Users, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ChatDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchGroups();
        }
    }, [user]);

    const fetchGroups = async () => {
        try {
            if (user?.role === 'admin') {
                const allGroups = await getActiveGroups();
                // Sort by lastMessageAt or updatedAt
                const sorted = allGroups.sort((a, b) => {
                    const timeA = a.lastMessageAt?.toMillis() || a.updatedAt?.toMillis() || 0;
                    const timeB = b.lastMessageAt?.toMillis() || b.updatedAt?.toMillis() || 0;
                    return timeB - timeA;
                });
                setGroups(sorted);
            } else {
                const userGroups = await getUserGroups(user!.uid);
                // Sort by lastMessageAt or updatedAt
                const sorted = userGroups.sort((a, b) => {
                    const timeA = a.lastMessageAt?.toMillis() || a.updatedAt?.toMillis() || 0;
                    const timeB = b.lastMessageAt?.toMillis() || b.updatedAt?.toMillis() || 0;
                    return timeB - timeA;
                });
                setGroups(sorted);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
                <p className="text-gray-400">Join your team discussions</p>
            </div>

            {groups.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white">No Groups Found</h3>
                    <p className="text-gray-400 mt-2">You haven't been added to any groups yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <GlassCard
                            key={group.id}
                            className="group hover:border-blue-500/50 transition-all cursor-pointer relative overflow-hidden"
                            onClick={() => router.push(`/chat/${group.id}`)}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all"></div>

                            <div className="flex items-start justify-between relative z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                        {group.name}
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{group.description}</p>
                                </div>
                                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                    <MessageCircle className="w-5 h-5 text-blue-400" />
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between text-sm relative z-10">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Users className="w-4 h-4" />
                                    <span>{group.memberIds?.length || 0} Members</span>
                                </div>
                                {group.lastMessageAt ? (
                                    <span className="text-xs text-blue-400 font-medium">
                                        Active {formatDistanceToNow(group.lastMessageAt.toDate(), { addSuffix: true })}
                                    </span>
                                ) : group.updatedAt ? (
                                    <span className="text-xs text-gray-500">
                                        Created {formatDistanceToNow(group.updatedAt.toDate(), { addSuffix: true })}
                                    </span>
                                ) : null}
                            </div>

                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                <ArrowRight className="w-5 h-5 text-white" />
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
