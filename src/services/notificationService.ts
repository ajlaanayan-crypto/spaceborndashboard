import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface NotificationData {
    id?: string;
    userId: string;
    type: 'task_assigned' | 'group_added' | 'meeting_scheduled' | 'weekly_plan' | 'announcement' | 'general' | 'chat_mention' | 'chat_reply';
    title: string;
    message: string;
    link?: string; // Optional link to relevant page
    isRead: boolean;
    createdAt?: any;
}

// Notification CRUD
export const createNotification = async (notification: Omit<NotificationData, 'id' | 'createdAt'>): Promise<string> => {
    const docRef = await addDoc(collection(db, "notifications"), {
        ...notification,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getUserNotifications = async (userId: string): Promise<NotificationData[]> => {
    try {
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as NotificationData);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
};

export const getUnreadCount = async (userId: string): Promise<number> => {
    try {
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            where("isRead", "==", false)
        );
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error("Error getting unread count:", error);
        return 0;
    }
};

export const markAsRead = async (notificationId: string) => {
    await updateDoc(doc(db, "notifications", notificationId), {
        isRead: true,
    });
};

export const markAllAsRead = async (userId: string) => {
    const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("isRead", "==", false)
    );
    const snapshot = await getDocs(q);

    const updates = snapshot.docs.map(doc =>
        updateDoc(doc.ref, { isRead: true })
    );

    await Promise.all(updates);
};

// Helper function to send notifications to multiple users
export const sendBulkNotifications = async (
    userIds: string[],
    notification: Omit<NotificationData, 'id' | 'userId' | 'createdAt'>
): Promise<void> => {
    const promises = userIds.map(userId =>
        createNotification({ ...notification, userId })
    );
    await Promise.all(promises);
};
