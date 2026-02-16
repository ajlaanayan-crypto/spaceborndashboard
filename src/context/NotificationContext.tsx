"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    NotificationData
} from "@/services/notificationService";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface NotificationContextType {
    notifications: NotificationData[];
    unreadCount: number;
    loading: boolean;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    markRead: async () => { },
    markAllRead: async () => { },
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        if (user) {
            setLoading(true);
            const q = query(
                collection(db, "notifications"),
                where("userId", "==", user.uid),
                orderBy("createdAt", "desc")
            );

            unsubscribe = onSnapshot(q, (snapshot) => {
                const newNotifications = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as NotificationData));

                setNotifications(newNotifications);
                setUnreadCount(newNotifications.filter(n => !n.isRead).length);
                setLoading(false);
            }, (error) => {
                console.error("Notification listener error:", error);
                setLoading(false);
            });
        } else {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    const markRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await markAsRead(id);
    };

    const markAllRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        if (user) {
            await markAllAsRead(user.uid);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, loading, markRead, markAllRead }}>
            {children}
        </NotificationContext.Provider>
    );
};
