"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { addComment, subscribeToComments, CommentData } from "@/services/commentService";
import { Send, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function CommentSection({ taskId }: { taskId: string }) {
    const { user, role } = useAuth();
    const [comments, setComments] = useState<CommentData[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToComments(taskId, setComments);
        return () => unsubscribe();
    }, [taskId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user) return;
        setLoading(true);
        try {
            await addComment(taskId, user.uid, input, user.displayName || user.email || role || "User");
            setInput("");
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-black/20 rounded-lg p-4 border border-white/5 h-[400px] flex flex-col">
            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Comms Channel</h3>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                {comments.length === 0 ? (
                    <div className="text-center text-gray-600 mt-10">
                        <p className="text-sm">No transmissions yet.</p>
                    </div>
                ) : comments.map(comment => (
                    <div key={comment.id} className={`flex gap-3 ${comment.userId === user?.uid ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${comment.userId === user?.uid ? 'bg-blue-600' : 'bg-white/10'}`}>
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <div className={`max-w-[80%] rounded-lg p-3 ${comment.userId === user?.uid ? 'bg-blue-600/20 text-blue-100' : 'bg-white/5 text-gray-300'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold opacity-70">{comment.userName}</span>
                                <span className="text-[10px] opacity-50">
                                    {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'Sending...'}
                                </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSend} className="relative">
                <input
                    type="text"
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-4 pr-12 py-3 text-white focus:outline-none focus:border-blue-500 text-sm"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-white transition-colors disabled:opacity-50"
                >
                    <Send className="w-4 h-4 text-blue-400" />
                </button>
            </form>
        </div>
    );
}
