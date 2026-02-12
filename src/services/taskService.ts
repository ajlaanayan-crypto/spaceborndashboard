import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    serverTimestamp,
    orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

export interface TaskData {
    id?: string;
    title: string;
    description: string;
    assignedTo?: string; // userId (optional if group task)
    assignedToGroup?: string; // New field for group assignment
    assignedToName?: string;
    assignedBy: string;
    type: 'individual' | 'group'; // New field
    groupId?: string; // New field for group association
    groupName?: string;
    priority: "low" | "medium" | "high";
    status: "pending" | "in_progress" | "review" | "completed";
    deadline: string;
    difficulty?: "easy" | "medium" | "hard";
    estimatedHours?: number;
    tags?: string[];
    subtasks?: Subtask[];
    blockers?: string[];
    createdAt?: any;
    completedAt?: any;
}

export const createTask = async (task: Omit<TaskData, 'id' | 'createdAt'>) => {
    try {
        const docRef = await addDoc(collection(db, "tasks"), {
            ...task,
            subtasks: task.subtasks || [],
            blockers: task.blockers || [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating task:", error);
        throw error;
    }
};

export const updateTaskStatus = async (taskId: string, status: TaskData['status']) => {
    try {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, {
            status,
            updatedAt: serverTimestamp(), // Add updatedAt
            // completedAt: status === 'completed' ? serverTimestamp() : null // Removed completedAt
        });
    } catch (error) {
        console.error("Error updating task:", error);
        throw error;
    }
};

// Get tasks assigned to a user
export const getUserTasks = async (userId: string, groupIds: string[] = []): Promise<TaskData[]> => {
    try {
        // Simple query: Get all tasks where user is assignedTo
        const q = query(
            collection(db, "tasks"),
            where("assignedTo", "==", userId)
        );

        const snapshot = await getDocs(q);
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TaskData);

        // Sort by createdAt
        tasks.sort((a, b) => {
            const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
            const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
            return db.getTime() - da.getTime();
        });

        return tasks;
    } catch (error) {
        console.error("Error fetching user tasks:", error);
        return []; // Return empty array instead of throwing
    }
};

export const getGroupTasks = async (groupId: string) => {
    try {
        const q = query(
            collection(db, "tasks"),
            where("groupId", "==", groupId),
            where("type", "==", "group"),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as TaskData[];
    } catch (error) {
        console.error("Error fetching group tasks:", error);
        throw error;
    }
};

export const getCreatedTasks = async (userId: string) => {
    try {
        const q = query(
            collection(db, "tasks"),
            where("assignedBy", "==", userId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as TaskData[];
    } catch (error) {
        console.error("Error fetching created tasks:", error);
        throw error;
    }
};

export const getAllTasks = async () => {
    try {
        const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as TaskData[];
    } catch (error) {
        console.error("Error fetching all tasks:", error);
        throw error;
    }
};

export const deleteTask = async (taskId: string) => {
    try {
        await deleteDoc(doc(db, "tasks", taskId));
    } catch (error) {
        console.error("Error deleting task:", error);
        throw error;
    }
};

export const updateTask = async (taskId: string, updates: Partial<TaskData>) => {
    try {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating task:", error);
        throw error;
    }
};
