import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logAction } from "./auditService";

export interface SessionData {
    id?: string;
    userId: string;
    deviceInfo: string;
    ipAddress?: string;
    loginTime: any;
    lastActive: any;
    isActive: boolean;
}

export const createSession = async (userId: string, deviceInfo: string, ipAddress?: string) => {
    try {
        const docRef = await addDoc(collection(db, "sessions"), {
            userId,
            deviceInfo,
            ipAddress: ipAddress || "unknown",
            loginTime: serverTimestamp(),
            lastActive: serverTimestamp(),
            isActive: true
        });

        await logAction({
            action: "LOGIN",
            performedBy: userId,
            targetId: docRef.id,
            targetType: "session",
            details: { deviceInfo, ipAddress: ipAddress || "unknown" }
        });

        return docRef.id;
    } catch (error) {
        console.error("Error creating session:", error);
        return null;
    }
};

export const endSession = async (sessionId: string, userId: string) => {
    try {
        await updateDoc(doc(db, "sessions", sessionId), {
            isActive: false,
            lastActive: serverTimestamp()
        });

        await logAction({
            action: "LOGOUT",
            performedBy: userId,
            targetId: sessionId,
            targetType: "session"
        });
    } catch (error) {
        console.error("Error ending session:", error);
    }
};

export const getActiveSessions = async (userId: string) => {
    const q = query(collection(db, "sessions"), where("userId", "==", userId), where("isActive", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionData));
};

// Get all active sessions across all users (for admin)
export const getAllActiveSessions = async () => {
    try {
        const q = query(collection(db, "sessions"), where("isActive", "==", true));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionData));
    } catch (error) {
        console.error("Error fetching active sessions:", error);
        return [];
    }
};

// Get all sessions with optional time filter
export const getAllSessionsWithFilter = async (filter?: 'today' | 'week' | 'month') => {
    try {
        let q = query(collection(db, "sessions"));

        if (filter) {
            const now = new Date();
            let startDate = new Date();

            switch (filter) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
            }

            q = query(collection(db, "sessions"), where("loginTime", ">=", startDate));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionData));
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return [];
    }
};

// Get session history for a specific user
export const getUserSessionHistory = async (userId: string) => {
    try {
        const q = query(collection(db, "sessions"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionData));
    } catch (error) {
        console.error("Error fetching user session history:", error);
        return [];
    }
};

// Calculate session duration in minutes
export const calculateSessionDuration = (session: SessionData): number => {
    if (!session.loginTime) return 0;

    const loginTime = session.loginTime.toDate ? session.loginTime.toDate() : new Date(session.loginTime);

    // For active sessions, use current time; for inactive, use last active time
    const endTime = session.isActive
        ? new Date()
        : (session.lastActive?.toDate ? session.lastActive.toDate() : new Date(session.lastActive));

    const durationMs = endTime.getTime() - loginTime.getTime();
    return Math.floor(durationMs / 60000); // Convert to minutes
};

// Format duration to human-readable string
export const formatDuration = (minutes: number): string => {
    if (minutes < 1) return '< 1m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
};
