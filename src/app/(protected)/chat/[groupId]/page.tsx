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
import { uploadFile } from "@/services/storageService";
import { Loader2, Send, Users, ArrowLeft, MoreVertical, Shield, Trash2, X, ArrowRight, Mic } from "lucide-react";
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
    const [replyTo, setReplyTo] = useState<ChatMessageData | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (groupId && user) {
            fetchGroupInfo();
            const unsubscribe = subscribeToGroupMessages(groupId, (msgs) => {
                setMessages(msgs);
                // Only scroll to bottom if we are near bottom or it's initial load
                // For now, simple scroll to bottom on new message
                setTimeout(scrollToBottom, 100);
            });
            return () => unsubscribe();
        }
    }, [groupId, user]);

    // Voice Recording Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await sendVoiceMessage(audioBlob, recordingDuration);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);

            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop(); // This triggers onstop
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const cancelRecording = () => {
        // ... (existing helper) ...
        if (mediaRecorderRef.current && isRecording) {
            // Nullify handlers to prevent sending
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.ondataavailable = null;
            mediaRecorderRef.current.stop();
            // ...
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setRecordingDuration(0);
        }
    };

    const sendVoiceMessage = async (audioBlob: Blob, duration: number) => {
        if (!user) return;
        setSending(true);
        try {
            // Upload to Firebase Storage
            const filename = `voice_messages/${groupId}/${Date.now()}.webm`;
            const fileUrl = await uploadFile(audioBlob, filename);

            await sendGroupChatMessage(
                groupId,
                "🎤 Voice Message", // Fallback content
                {
                    uid: user.uid,
                    name: user.name || "Unknown",
                    role: user.role || 'member',
                    photoURL: user.photoURL || undefined
                },
                undefined, // No reply for now (could add)
                undefined,
                'audio',
                fileUrl,
                duration
            );
            scrollToBottom();
        } catch (error: any) {
            console.error("Failed to send voice message", error);
            alert(`Failed to send voice message: ${error.message}`);
        } finally {
            setSending(false);
            setRecordingDuration(0);
        }
    };

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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        setSending(true);
        try {
            // Detect Mentions (simple regex for @Name)
            // In a real app, you'd want a user picker. Here we just parse text.
            const mentionRegex = /@(\w+)/g;
            const mentions: string[] = [];
            const matches = newMessage.match(mentionRegex);

            // This is a placeholder. Real mention logic needs a way to map Name -> UID.
            // For now, we will just store the text matches or if we had a list of members we could map.
            // Let's assume we don't have full member list loaded with names -> uids easily here without fetching all.
            // So for now, we will just send the message content.
            // IMPROVEMENT: If we want real notifications, we need to map names to UIDs.
            // Let's fetch group members to map names.

            // Send Message
            const replyData = replyTo ? {
                id: replyTo.id!,
                content: replyTo.content,
                senderName: replyTo.senderName
            } : undefined;

            await sendGroupChatMessage(
                groupId,
                newMessage,
                {
                    uid: user.uid,
                    name: user.name || "Unknown",
                    role: user.role || 'member',
                    photoURL: user.photoURL || undefined
                },
                replyData,
                mentions
            );

            setNewMessage("");
            setReplyTo(null);
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

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] relative bg-black text-white font-sans selection:bg-zinc-800 selection:text-white">

            {/* Header - Premium Minimalist */}
            <div className="flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-md border-b border-white/5 shrink-0 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-all text-zinc-400 hover:text-white active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase">{group.name}</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] text-zinc-500 tracking-wider font-medium">{group.memberIds?.length} ONLINE</span>
                        </div>
                    </div>
                </div>

                {/* Optional: Add minimal menu trigger here if needed */}
                <div className="w-8"></div>
            </div>

            {/* Scrollable Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-6 relative bg-black">

                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-center opacity-40 animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 border border-zinc-900 bg-zinc-900/50 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl grayscale opacity-50">💬</span>
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-medium">Start a conversation</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.senderId === user?.uid;
                        const isSystem = msg.senderId === "system";
                        const isAdmin = user?.role === 'admin';
                        const showAvatar = !isMe && (index === messages.length - 1 || messages[index + 1]?.senderId !== msg.senderId);
                        const showName = !isMe && (index === 0 || messages[index - 1]?.senderId !== msg.senderId);

                        if (isSystem) {
                            return (
                                <div key={msg.id} className="flex justify-center my-6 animate-in fade-in duration-500">
                                    <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest border-b border-zinc-900/50 pb-0.5">
                                        {msg.content}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={msg.id}
                                className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group/message animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out`}
                            >
                                <div className={`flex max-w-[90%] md:max-w-[70%] gap-3 ${isMe ? "flex-row-reverse" : "flex-row items-end"}`}>

                                    {/* Minimal Avatar */}
                                    {!isMe && (
                                        <div className="w-8 shrink-0 flex flex-col justify-end mb-0.5">
                                            {showAvatar ? (
                                                <UserAvatar
                                                    name={msg.senderName}
                                                    photoURL={msg.senderPhoto}
                                                    className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 grayscale"
                                                />
                                            ) : (
                                                <div className="w-8 h-8" />
                                            )}
                                        </div>
                                    )}

                                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>

                                        {/* Sender Name */}
                                        {showName && (
                                            <span className="text-[10px] text-zinc-600 mb-1.5 tracking-wider uppercase font-medium ml-1">
                                                {msg.senderName}
                                            </span>
                                        )}

                                        {/* Message Bubble - Premium Minimal */}
                                        <div className={`relative group/bubble max-w-full text-sm`}>

                                            {/* Action Buttons */}
                                            <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "-left-12 pr-3" : "-right-12 pl-3"} flex items-center opacity-0 group-hover/bubble:opacity-100 transition-all duration-300 gap-2 scale-90 group-hover/bubble:scale-100`}>
                                                <button
                                                    onClick={() => setReplyTo(msg)}
                                                    className="text-zinc-600 hover:text-white transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => msg.id && handleDeleteMessage(msg.id)}
                                                        className="text-zinc-600 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Reply Context */}
                                            {msg.replyTo && (
                                                <div className={`mb-1.5 text-[10px] px-3 py-1.5 bg-zinc-900/50 border-l-[3px] border-zinc-700/50 rounded-r-md text-zinc-400 w-full flex flex-col gap-0.5`}>
                                                    <span className="font-semibold text-zinc-300 text-[9px] uppercase tracking-wide">{msg.replyTo.senderName}</span>
                                                    <span className="opacity-70 truncate italic font-serif">{msg.replyTo.content}</span>
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div
                                                className={`px-5 py-3 text-[14px] leading-relaxed shadow-none break-words relative overflow-hidden ${isMe
                                                    ? "bg-white text-black rounded-[20px] rounded-tr-md font-medium"
                                                    : "bg-[#111111] text-zinc-300 border border-zinc-800/80 rounded-[20px] rounded-tl-md font-light"
                                                    }`}
                                            >
                                                {msg.type === 'audio' && msg.fileUrl ? (
                                                    <div className="flex items-center gap-4 min-w-[200px]">
                                                        <button
                                                            onClick={() => {
                                                                const audio = new Audio(msg.fileUrl);
                                                                audio.play();
                                                            }}
                                                            className={`p-2.5 rounded-full ${isMe ? "bg-black text-white hover:bg-black/80" : "bg-white text-black hover:bg-white/90"} transition-all hover:scale-105 active:scale-95`}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                                        </button>
                                                        <div className="flex flex-col gap-1 w-full">
                                                            <div className={`h-1 w-full rounded-full overflow-hidden ${isMe ? "bg-black/5" : "bg-white/10"}`}>
                                                                <div className={`h-full w-1/3 rounded-full ${isMe ? "bg-black" : "bg-white"}`} />
                                                            </div>
                                                            <div className="flex justify-between items-center px-0.5">
                                                                <span className={`text-[9px] font-mono opacity-60 uppercase tracking-wider ${isMe ? "text-black" : "text-white"}`}>
                                                                    Voice Note
                                                                </span>
                                                                <span className={`text-[9px] font-mono font-medium ${isMe ? "text-black" : "text-white"}`}>
                                                                    {msg.duration ? formatDuration(msg.duration) : "0:00"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    msg.content
                                                )}
                                            </div>

                                            {/* Timestamp (Revealed on Group Hover) */}
                                            <div className={`text-[9px] mt-1.5 text-zinc-600 text-center font-mono opacity-0 group-hover/message:opacity-100 transition-all duration-300 absolute -bottom-5 w-full whitespace-nowrap z-10 block`}>
                                                {msg.createdAt ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                {/* Scroll Anchor */}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Premium Minimalist Input Area */}
            <div className="p-4 bg-black border-t border-zinc-900 shrink-0 z-30 pb-8 md:pb-6">

                {/* Reply Preview */}
                {replyTo && (
                    <div className="flex items-center justify-between px-4 py-2.5 mb-2 bg-zinc-900/50 border border-zinc-800 rounded-lg animate-in slide-in-from-bottom-2 fade-in">
                        <div className="flex items-center gap-3 text-xs text-zinc-400 overflow-hidden">
                            <span className="w-1 h-8 bg-zinc-700 rounded-full shrink-0"></span>
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-[10px] uppercase tracking-wide text-zinc-500">Replying to</span>
                                <span className="text-zinc-200 font-medium truncate">{replyTo.senderName}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setReplyTo(null)}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                <div className="max-w-4xl mx-auto flex items-end gap-3">
                    <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-3 bg-[#0A0A0A] border border-zinc-800 rounded-2xl px-1.5 py-1.5 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-800/50 transition-all shadow-lg shadow-black/50">
                        <div className="flex-1 px-3 py-1.5">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="w-full bg-transparent border-none text-white placeholder-zinc-600 text-[15px] focus:ring-0 focus:outline-none p-0 h-9"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                        </div>
                        {newMessage.trim() ? (
                            <button
                                type="submit"
                                disabled={sending}
                                className="p-2.5 bg-white text-black rounded-xl hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" strokeWidth={2.5} />}
                            </button>
                        ) : (
                            <div className="p-2.5 text-zinc-700 cursor-default">
                                <span className="block w-5 h-5 rounded-full border-2 border-zinc-800 border-t-zinc-700 animate-[spin_3s_linear_infinite]" />
                            </div>
                        )}
                    </form>
                </div>
            </div>
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
