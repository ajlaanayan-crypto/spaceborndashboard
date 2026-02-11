"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { getUserMessages, markMessageAsRead, MessageData } from "@/services/messageService";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Bell, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { format } from "date-fns";

export function MessagesWidget() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (user?.uid) {
            fetchMessages();
        }
    }, [user?.uid]);

    const fetchMessages = async () => {
        if (!user?.uid) return;
        try {
            const msgs = await getUserMessages(user.uid);
            setMessages(msgs.slice(0, 5)); // Show latest 5
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = async (messageId: string) => {
        const newExpanded = new Set(expandedMessages);
        if (newExpanded.has(messageId)) {
            newExpanded.delete(messageId);
        } else {
            newExpanded.add(messageId);
            // Mark as read when expanded
            if (user?.uid) {
                try {
                    await markMessageAsRead(messageId, user.uid);
                } catch (error) {
                    console.error("Error marking message as read:", error);
                }
            }
        }
        setExpandedMessages(newExpanded);
    };

    const unreadCount = messages.filter(
        (msg) => user?.uid && !msg.readBy.includes(user.uid)
    ).length;

    if (loading) {
        return (
            <GlassCard>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
            </GlassCard>
        );
    }

    if (messages.length === 0) {
        return (
            <GlassCard>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    Messages & Announcements
                </h3>
                <p className="text-gray-500 text-sm text-center py-6">No messages yet</p>
            </GlassCard>
        );
    }

    return (
        <GlassCard>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    Messages & Announcements
                </h3>
                {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        {unreadCount} new
                    </span>
                )}
            </div>

            <div className="space-y-2">
                {messages.map((msg) => {
                    const isExpanded = expandedMessages.has(msg.id!);
                    const isUnread = user?.uid && !msg.readBy.includes(user.uid);

                    return (
                        <div
                            key={msg.id}
                            className={`border rounded-lg transition-all ${isUnread
                                    ? "bg-blue-500/10 border-blue-500/30"
                                    : "bg-white/5 border-white/5"
                                }`}
                        >
                            <button
                                onClick={() => toggleExpand(msg.id!)}
                                className="w-full p-3 text-left flex items-start justify-between hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-white font-medium truncate">
                                            {msg.subject}
                                        </h4>
                                        {isUnread && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        From: {msg.fromName} •{" "}
                                        {msg.createdAt?.toDate?.()
                                            ? format(msg.createdAt.toDate(), "MMM d, h:mm a")
                                            : "Just now"}
                                    </p>
                                    {!isExpanded && (
                                        <p className="text-sm text-gray-300 mt-1 line-clamp-1">
                                            {msg.message}
                                        </p>
                                    )}
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                                )}
                            </button>

                            {isExpanded && (
                                <div className="px-3 pb-3">
                                    <div className="pt-2 border-t border-white/10">
                                        <p className="text-sm text-gray-200 whitespace-pre-wrap">
                                            {msg.message}
                                        </p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span
                                                className={`text-xs px-2 py-1 rounded ${msg.type === "broadcast"
                                                        ? "bg-purple-500/10 text-purple-400"
                                                        : msg.type === "group"
                                                            ? "bg-blue-500/10 text-blue-400"
                                                            : "bg-green-500/10 text-green-400"
                                                    }`}
                                            >
                                                {msg.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </GlassCard>
    );
}
