import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserData } from "./userService";

export interface AuditLog {
    action: string;
    targetId?: string; // ID of the object being acted upon (user, task, etc.)
    targetType?: string; // "user", "task", "report", etc.
    performedBy: string; // UID of the user performing the action
    details?: any;
    timestamp?: any;
}

export const logAction = async (log: Omit<AuditLog, "timestamp">) => {
    try {
        await addDoc(collection(db, "auditLogs"), {
            ...log,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to write audit log:", error);
        // We don't want to break the app flow if logging fails, but we should know about it.
    }
};

export interface LoginLog {
    id?: string;
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    timestamp: any;
    userAgent?: string;
    userPhoto?: string;
}

export const logUserLogin = async (user: UserData) => {
    try {
        if (!user.uid) return;

        // 1. Add log entry
        await addDoc(collection(db, "loginLogs"), {
            userId: user.uid,
            userName: user.name,
            userEmail: user.email,
            role: user.role,
            timestamp: serverTimestamp(),
            userAgent: window.navigator.userAgent,
            userPhoto: user.photoURL || null,
        });

        // 2. Update user's lastLogin field
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            lastLogin: serverTimestamp(),
        });

    } catch (error) {
        console.error("Error logging login:", error);
    }
};

export const getRecentLogins = async (limitCount: number = 10): Promise<LoginLog[]> => {
    try {
        const q = query(
            collection(db, "loginLogs"),
            orderBy("timestamp", "desc"),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as LoginLog);
    } catch (error) {
        console.error("Error fetching recent logins:", error);
        return [];
    }
};

export const getUserLoginHistory = async (userId: string): Promise<LoginLog[]> => {
    try {
        const q = query(
            collection(db, "loginLogs"),
            where("userId", "==", userId),
            orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as LoginLog);
    } catch (error) {
        console.error("Error fetching user login history:", error);
        return [];
    }
};
