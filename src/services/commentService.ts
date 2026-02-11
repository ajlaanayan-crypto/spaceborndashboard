import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface CommentData {
    id?: string;
    taskId: string;
    userId: string;
    content: string;
    createdAt?: any;
    userName?: string; // Optional, for display if we denormalize or fetch
}

export const addComment = async (taskId: string, userId: string, content: string, userName?: string) => {
    await addDoc(collection(db, "comments"), {
        taskId,
        userId,
        content,
        userName: userName || "Unknown",
        createdAt: serverTimestamp()
    });
};

export const getTaskComments = async (taskId: string) => {
    const q = query(
        collection(db, "comments"),
        where("taskId", "==", taskId),
        orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommentData));
};

// Real-time listener
export const subscribeToComments = (taskId: string, callback: (comments: CommentData[]) => void) => {
    const q = query(
        collection(db, "comments"),
        where("taskId", "==", taskId),
        orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommentData));
        callback(comments);
    });
};
