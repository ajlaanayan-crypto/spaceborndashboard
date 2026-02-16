"use client";

import { useNotifications } from "@/context/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Loader2, Trash2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function NotificationBell() {
    const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleMarkAllRead = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await markAllRead();
    };

    const handleNotificationClick = async (id: string, isRead: boolean) => {
        if (!isRead) {
            await markRead(id);
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse shadow-md border border-black">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 z-50">
                    <GlassCard className="p-0 overflow-hidden shadow-2xl border border-white/20">
                        <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h3 className="text-sm font-bold text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="p-8 flex justify-center">
                                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification.id!, notification.isRead)}
                                        className={`p-3 border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer group ${!notification.isRead ? 'bg-blue-500/5' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notification.isRead ? 'bg-blue-500' : 'bg-transparent'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notification.isRead ? 'text-white font-medium' : 'text-gray-400'
                                                    }`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-gray-500 mt-2">
                                                    {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                                </p>
                                            </div>
                                        </div>
                                        {notification.link && (
                                            <Link href={notification.link} className="absolute inset-0 z-10" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-2 border-t border-white/10 bg-white/5 text-center">
                                <button className="text-xs text-gray-400 hover:text-white transition-colors">
                                    View All History
                                </button>
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
