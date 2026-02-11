import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
