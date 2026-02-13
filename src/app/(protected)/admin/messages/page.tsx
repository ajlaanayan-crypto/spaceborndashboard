"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/context/AuthContext";
import { getAllUsers, UserData } from "@/services/userService";
import { getUserGroups, getGroupMembers, GroupData } from "@/services/groupService";
import {
    sendMessageToUser,
    sendMessageToGroup,
    sendBroadcastMessage,
    getAllMessages,
    deleteMessage,
    MessageData,
} from "@/services/messageService";
import { useState, useEffect } from "react";
import { Send, Loader2, Users, User, Globe, Mail, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function AdminMessagesPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Form state
    const [messageType, setMessageType] = useState<"individual" | "group" | "broadcast">("broadcast");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersData, messagesData] = await Promise.all([
                getAllUsers(),
                getAllMessages(),
            ]);
            setUsers(usersData);
            setMessages(messagesData);

            // Fetch groups if user is authenticated
            if (user?.uid) {
                const groupsData = await getUserGroups(user.uid);
                setGroups(groupsData);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!subject.trim() || !message.trim()) {
            setError("Subject and message are required");
            return;
        }

        setSending(true);
        setError("");
        setSuccess("");

        try {
            const fromName = user.displayName || user.name || user.email || "Admin";

            if (messageType === "individual") {
                if (selectedUsers.length === 0) {
                    setError("Please select at least one user");
                    setSending(false);
                    return;
                }

                // Send to each selected user
                await Promise.all(
                    selectedUsers.map((userId) =>
                        sendMessageToUser(user.uid, fromName, userId, subject, message)
                    )
                );
                setSuccess(`Message sent to ${selectedUsers.length} user(s)`);
            } else if (messageType === "group") {
                if (!selectedGroup) {
                    setError("Please select a group");
                    setSending(false);
                    return;
                }

                const members = await getGroupMembers(selectedGroup);
                const memberIds = members.map((m) => m.userId);
                await sendMessageToGroup(
                    user.uid,
                    fromName,
                    selectedGroup,
                    memberIds,
                    subject,
                    message
                );
                setSuccess(`Message sent to group (${memberIds.length} members)`);
            } else {
                // Broadcast
                await sendBroadcastMessage(user.uid, fromName, subject, message);
                setSuccess("Broadcast message sent to all users");
            }

            // Reset form
            setSubject("");
            setMessage("");
            setSelectedUsers([]);
            setSelectedGroup("");

            // Refresh messages
            fetchData();
        } catch (err: any) {
            setError(err.message || "Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Admin Messages</h1>
                <p className="text-gray-400">Send announcements and messages to users</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Compose Message */}
                <GlassCard>
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-400" />
                        Compose Message
                    </h2>

                    <form onSubmit={handleSendMessage} className="space-y-4">
                        {/* Message Type */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Message Type</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMessageType("broadcast")}
                                    className={`p-3 rounded-lg border transition-colors ${messageType === "broadcast"
                                        ? "bg-blue-600 border-blue-500 text-white"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                        }`}
                                >
                                    <Globe className="w-5 h-5 mx-auto mb-1" />
                                    <span className="text-xs">Broadcast</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMessageType("group")}
                                    className={`p-3 rounded-lg border transition-colors ${messageType === "group"
                                        ? "bg-blue-600 border-blue-500 text-white"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                        }`}
                                >
                                    <Users className="w-5 h-5 mx-auto mb-1" />
                                    <span className="text-xs">Group</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMessageType("individual")}
                                    className={`p-3 rounded-lg border transition-colors ${messageType === "individual"
                                        ? "bg-blue-600 border-blue-500 text-white"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                        }`}
                                >
                                    <User className="w-5 h-5 mx-auto mb-1" />
                                    <span className="text-xs">Individual</span>
                                </button>
                            </div>
                        </div>

                        {/* Group Selection */}
                        {messageType === "group" && (
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Select Group
                                </label>
                                <select
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white"
                                    required
                                >
                                    <option value="">Choose a group...</option>
                                    {groups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* User Selection */}
                        {messageType === "individual" && (
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Select Users ({selectedUsers.length} selected)
                                </label>
                                <div className="max-h-48 overflow-y-auto bg-black/40 border border-white/10 rounded-lg p-3 space-y-2">
                                    {users.map((u) => (
                                        <label
                                            key={u.uid}
                                            className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(u.uid)}
                                                onChange={() => toggleUserSelection(u.uid)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-white text-sm">{u.name}</span>
                                            <span className="text-gray-400 text-xs ml-auto">
                                                {u.role}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Subject */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white"
                                placeholder="Enter message subject"
                                required
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white"
                                placeholder="Type your message here..."
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send Message
                                </>
                            )}
                        </button>
                    </form>
                </GlassCard>

                {/* Message History */}
                <GlassCard>
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-400" />
                        Recent Messages
                    </h2>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {messages.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No messages sent yet</p>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className="p-4 bg-white/5 border border-white/5 rounded-lg group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-white font-medium">{msg.subject}</h3>
                                            <p className="text-xs text-gray-400">
                                                From: {msg.fromName}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
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
                                            <button
                                                onClick={async () => {
                                                    if (confirm("Are you sure you want to delete this message?")) {
                                                        try {
                                                            await deleteMessage(msg.id!);
                                                            setMessages(prev => prev.filter(m => m.id !== msg.id));
                                                            setSuccess("Message deleted successfully");
                                                        } catch (err) {
                                                            setError("Failed to delete message");
                                                        }
                                                    }
                                                }}
                                                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition-colors"
                                                title="Delete message"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                                        {msg.message}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>
                                            {msg.createdAt?.toDate?.()
                                                ? format(msg.createdAt.toDate(), "MMM d, yyyy h:mm a")
                                                : "Just now"}
                                        </span>
                                        <span>{msg.readBy.length} read</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
