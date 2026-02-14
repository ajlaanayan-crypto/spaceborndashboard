"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/context/AuthContext";
import { getGroupById, GroupData } from "@/services/groupService";
import {
    sendGroupChatMessage,
    subscribeToGroupMessages,
    deleteGroupChatMessage,
    ChatMessageData
} from "@/services/messageService";
import { Loader2, Send, Users, ArrowLeft, MoreVertical, Shield, Trash2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { UserAvatar } from "@/components/ui/UserAvatar";

export default function ChatRoomPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const groupId = params.groupId as string;

    const [group, setGroup] = useState<GroupData | null>(null);
    const [messages, setMessages] = useState<ChatMessageData[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (groupId && user) {
            fetchGroupInfo();
            const unsubscribe = subscribeToGroupMessages(groupId, (msgs) => {
                setMessages(msgs);
                scrollToBottom();
            });
            return () => unsubscribe();
        }
    }, [groupId, user]);

    const fetchGroupInfo = async () => {
        try {
            const data = await getGroupById(groupId);
            if (!data) {
                router.push('/chat'); // Group not found
                return;
            }
            setGroup(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Scroll on initial load or new message
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        setSending(true);
        try {
            await sendGroupChatMessage(groupId, newMessage, {
                uid: user.uid,
                name: user.name || "Unknown",
                role: user.role || 'member'
            });
            setNewMessage("");
            scrollToBottom();
        } catch (error) {
            console.error("Failed to send", error);
        } finally {
            setSending(false);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (confirm("Are you sure you want to delete this message?")) {
            try {
                await deleteGroupChatMessage(groupId, messageId);
            } catch (error) {
                console.error("Failed to delete message", error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!group) return null;

    return (
        <div className="flex flex-col h-[calc(100dvh-11rem)] md:h-[calc(100vh-9rem)] relative">
            {/* Header */}
            <GlassCard className="mb-4 py-3 px-4 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {group.name}
                            <span className="text-xs font-normal px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                                {group.memberIds?.length} members
                            </span>
                        </h2>
                        <p className="text-xs text-gray-400 line-clamp-1">{group.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Placeholder for group settings or members list toggle */}
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </GlassCard>

            {/* Main Chat Content - Flex Column */}
            <GlassCard className="flex-1 flex flex-col overflow-hidden relative px-0 pb-0 border-0 md:border md:border-white/10" noHover>

                {/* Scrollable Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center opacity-60">
                            <MessageCircle className="w-12 h-12 mb-2" />
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderId === user?.uid;
                            const isSystem = msg.senderId === "system";
                            const isAdmin = user?.role === 'admin';

                            if (isSystem) {
                                return (
                                    <div key={msg.id} className="flex justify-center my-4">
                                        <span className="text-xs bg-white/10 text-gray-300 px-3 py-1 rounded-full">
                                            {msg.content}
                                        </span>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group/message`}
                                >
                                    <div className={`flex max-w-[80%] md:max-w-[60%] gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                        <UserAvatar
                                            name={msg.senderName}
                                            photoURL={undefined} // Add avatar url if available in message
                                            className="w-8 h-8 shrink-0 mt-1"
                                        />
                                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-gray-300 font-medium">
                                                    {msg.senderName}
                                                    {msg.senderRole === 'admin' && <Shield className="w-3 h-3 inline ml-1 text-yellow-400" />}
                                                </span>
                                                <span className="text-[10px] text-gray-500">
                                                    {msg.createdAt ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                                </span>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => msg.id && handleDeleteMessage(msg.id)}
                                                        className="opacity-0 group-hover/message:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-500"
                                                        title="Delete Message"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <div
                                                className={`p-3 rounded-2xl text-sm leading-relaxed ${isMe
                                                    ? "bg-blue-600 text-white rounded-tr-none"
                                                    : "bg-white/10 text-gray-100 rounded-tl-none border border-white/5"
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area - Natural Flex Item (Stays at bottom) */}
                <div className="p-4 bg-black/60 backdrop-blur-md border-t border-white/10 shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all shadow-lg"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center aspect-square"
                        >
                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>
                </div>
            </GlassCard>
        </div>
    );
}

// Helper icons
function MessageCircle({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
    )
}
