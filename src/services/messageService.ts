import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    updateDoc,
    doc,
    deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface MessageData {
    id?: string;
    from: string; // Admin UID
    fromName: string; // Admin name
    to: string[]; // Array of recipient UIDs (empty array = broadcast to all)
    groupId?: string; // Optional - if sent to specific group
    subject: string;
    message: string;
    type: "individual" | "group" | "broadcast";
    readBy: string[]; // Array of UIDs who have read the message
    createdAt: any;
}

/**
 * Send message to individual user
 */
export const sendMessageToUser = async (
    from: string,
    fromName: string,
    toUserId: string,
    subject: string,
    message: string
): Promise<string> => {
    const messageData: Omit<MessageData, "id"> = {
        from,
        fromName,
        to: [toUserId],
        subject,
        message,
        type: "individual",
        readBy: [],
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "messages"), messageData);
    return docRef.id;
};

/**
 * Send message to all members of a group
 */
export const sendMessageToGroup = async (
    from: string,
    fromName: string,
    groupId: string,
    memberIds: string[],
    subject: string,
    message: string
): Promise<string> => {
    const messageData: Omit<MessageData, "id"> = {
        from,
        fromName,
        to: memberIds,
        groupId,
        subject,
        message,
        type: "group",
        readBy: [],
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "messages"), messageData);
    return docRef.id;
};

/**
 * Send broadcast message to all users
 */
export const sendBroadcastMessage = async (
    from: string,
    fromName: string,
    subject: string,
    message: string
): Promise<string> => {
    const messageData: Omit<MessageData, "id"> = {
        from,
        fromName,
        to: [], // Empty = broadcast to all
        subject,
        message,
        type: "broadcast",
        readBy: [],
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "messages"), messageData);
    return docRef.id;
};

/**
 * Get messages for a specific user
 */
export const getUserMessages = async (userId: string): Promise<MessageData[]> => {
    try {
        // Get messages where user is in 'to' array
        const q1 = query(
            collection(db, "messages"),
            where("to", "array-contains", userId)
        );

        // Get broadcast messages separately
        const q2 = query(
            collection(db, "messages"),
            where("type", "==", "broadcast")
        );

        const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        const messages1 = snapshot1.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as MessageData)
        );
        const messages2 = snapshot2.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as MessageData)
        );

        // Combine, deduplicate by id, and sort by date
        const messageMap = new Map<string, MessageData>();
        [...messages1, ...messages2].forEach(m => {
            if (m.id) messageMap.set(m.id, m);
        });

        const allMessages = Array.from(messageMap.values());
        allMessages.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
            return bTime - aTime;
        });

        return allMessages;
    } catch (error) {
        console.error("Error fetching user messages:", error);
        return []; // Return empty array instead of crashing
    }
};

/**
 * Get all messages (admin only)
 */
export const getAllMessages = async (): Promise<MessageData[]> => {
    try {
        const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MessageData));
    } catch (error) {
        console.error("Error fetching all messages:", error);
        return [];
    }
};

/**
 * Mark message as read by user
 */
export const markMessageAsRead = async (
    messageId: string,
    userId: string
): Promise<void> => {
    const messageRef = doc(db, "messages", messageId);
    const messageDoc = await getDocs(query(collection(db, "messages"), where("id", "==", messageId)));

    if (!messageDoc.empty) {
        const currentReadBy = messageDoc.docs[0].data().readBy || [];
        if (!currentReadBy.includes(userId)) {
            await updateDoc(messageRef, {
                readBy: [...currentReadBy, userId],
            });
        }
    }
};

/**
 * Delete a message (Admin only)
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, "messages", messageId));
    } catch (error) {
        console.error("Error deleting message:", error);
        throw error;
    }
};
