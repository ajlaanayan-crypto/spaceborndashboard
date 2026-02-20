"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export function AnsaChatbot() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hi! I'm ANSA. How can I help you navigate SPACE BORN today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        // Rate Limiting (3 seconds)
        if (lastMessageTime) {
            const timeSinceLastMessage = new Date().getTime() - lastMessageTime.getTime();
            if (timeSinceLastMessage < 3000) {
                setError("Please wait a moment before sending another message.");
                setTimeout(() => setError(null), 3000);
                return;
            }
        }

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: trimmedInput,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setError(null);
        setLastMessageTime(new Date());

        try {
            const response = await fetch("/api/ansa-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: trimmedInput,
                    userId: user?.uid,
                    userName: user?.displayName || user?.email?.split('@')[0] || "Employee"
                })
            });

            if (!response.ok) {
                throw new Error("Failed to communicate with ANSA.");
            }

            const data = await response.json();

            // Add bot message
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reply || "I'm sorry, I encountered an error answering that.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);

        } catch (err: any) {
            console.warn("Chatbot Error:", err.message || err);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Sorry, I am having trouble connecting right now. Please try again later.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">

            {/* Chat Window */}
            {isOpen && (
                <div className="w-[320px] sm:w-[380px] h-[500px] max-h-[70vh] mb-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">ANSA</h3>
                                <div className="flex items-center gap-1.5 hidden sm:flex">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-[10px] text-green-400 font-medium tracking-wide">ONLINE</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-6 h-6 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mt-1">
                                        <Bot className="w-3 h-3" />
                                    </div>
                                )}

                                <div
                                    className={`relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-sm'
                                        : 'bg-white/10 text-gray-200 border border-white/5 rounded-tl-sm'
                                        }`}
                                >
                                    {msg.content}
                                </div>

                                {msg.role === 'user' && (
                                    <div className="w-6 h-6 shrink-0 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400 mt-1">
                                        <User className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-6 h-6 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mt-1">
                                    <Bot className="w-3 h-3" />
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-1 w-[60px] h-[36px]">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Rate Limit Error Toast */}
                    {error && (
                        <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 w-max max-w-[90%] bg-red-500/90 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
                            {error}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 border-t border-white/10 bg-black/40">
                        <form onSubmit={handleSubmit} className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message ANSA..."
                                maxLength={200}
                                disabled={isLoading}
                                className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-12 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-full transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                        {/* Character count */}
                        <div className="flex justify-end mt-1.5 px-2">
                            <span className={`text-[10px] ${input.length >= 200 ? 'text-red-400' : 'text-gray-500'}`}>
                                {input.length}/200
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <MessageCircle className="w-6 h-6 text-white relative z-10" />

                    {/* Notification Dot */}
                    <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-[#0B0E14] rounded-full" />
                </button>
            )}
        </div>
    );
}
