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
