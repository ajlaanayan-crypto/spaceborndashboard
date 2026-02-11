"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserNotifications, markAsRead, markAllAsRead, getUnreadCount, NotificationData } from "@/services/notificationService";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            fetchNotifications();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.uid]);

    const fetchNotifications = async () => {
        if (!user?.uid) return;
        try {
            const [notifs, count] = await Promise.all([
                getUserNotifications(user.uid),
                getUnreadCount(user.uid)
            ]);
            setNotifications(notifs.slice(0, 10)); // Show last 10
            setUnreadCount(count);
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id);
        fetchNotifications();
    };

    const handleMarkAllRead = async () => {
        if (!user?.uid) return;
        setLoading(true);
        await markAllAsRead(user.uid);
        await fetchNotifications();
        setLoading(false);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'task_assigned': return '📋';
            case 'group_added': return '👥';
            case 'meeting_scheduled': return '📅';
            case 'weekly_plan': return '📊';
            case 'announcement': return '📢';
            default: return '🔔';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                        <div className="sticky top-0 bg-gray-900 border-b border-white/10 p-4 flex items-center justify-between">
                            <h3 className="text-white font-bold">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    disabled={loading}
                                    className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/10">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => {
                                            if (!notif.isRead) handleMarkAsRead(notif.id!);
                                            if (notif.link) window.location.href = notif.link;
                                            setShowDropdown(false);
                                        }}
                                        className={`p-4 cursor-pointer hover:bg-white/5 transition-colors ${!notif.isRead ? 'bg-blue-500/10' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <span className="text-2xl">{getNotificationIcon(notif.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium text-sm">{notif.title}</p>
                                                <p className="text-gray-400 text-xs mt-1">{notif.message}</p>
                                                {notif.createdAt?.toDate && (
                                                    <p className="text-gray-500 text-xs mt-1">
                                                        {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                                                    </p>
                                                )}
                                            </div>
                                            {!notif.isRead && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
