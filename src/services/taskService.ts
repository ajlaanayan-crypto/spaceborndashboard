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
import { createNotification, sendBulkNotifications } from "./notificationService";
import { getGroupMembers } from "./groupService";

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

        // Trigger Notification
        if (task.assignedTo && task.assignedTo !== task.assignedBy) {
            await createNotification({
                userId: task.assignedTo,
                type: 'task_assigned',
                title: 'New Task Assigned',
                message: `You have been assigned a new task: "${task.title}"`,
                link: '/employee/tasks', // Default link, can be refined based on role
                isRead: false
            });
        } else if (task.assignedToGroup && task.groupId) {
            // Fetch group members and send bulk notification
            try {
                const members = await getGroupMembers(task.groupId);
                const recipientIds = members
                    .map(m => m.userId)
                    .filter(id => id !== task.assignedBy); // Don't notify creator

                if (recipientIds.length > 0) {
                    await sendBulkNotifications(recipientIds, {
                        type: 'task_assigned',
                        title: 'New Group Task',
                        message: `A new task "${task.title}" has been assigned to your group.`,
                        link: '/employee/tasks',
                        isRead: false
                    });
                }
            } catch (error) {
                console.error("Failed to send group notifications:", error);
            }
        }

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

/*
### Error Handling
- Fixed a `TypeError` where `task.status` was undefined for some legacy or group-assigned tasks.
- Added a `(task.status || 'pending')` fallback in `InternTasksPage` and `EmployeeTasksPage`.
- Verified `AdminTasksPage` already had a similar fallback.

## Results
Users will now see both their individual tasks and any tasks assigned to the groups they belong to in their "Missions" or "Objectives" view, without encountering runtime crashes even if data is inconsistent.
*/

// Get tasks assigned to a user or their groups
export const getUserTasks = async (userId: string, groupIds: string[] = []): Promise<TaskData[]> => {
    try {
        // 1. Query for individual tasks
        const individualQuery = query(
            collection(db, "tasks"),
            where("assignedTo", "==", userId)
        );

        // 2. Query for group tasks (if any)
        const queries = [getDocs(individualQuery)];

        if (groupIds.length > 0) {
            // Firestore 'in' operator supports up to 10-30 values depending on version, 
            // but for typical group counts it's fine.
            const groupQuery = query(
                collection(db, "tasks"),
                where("groupId", "in", groupIds),
                where("type", "==", "group")
            );
            queries.push(getDocs(groupQuery));
        }

        const snapshots = await Promise.all(queries);

        // Use a Map to avoid duplicates if a task happens to be returned by both (though unlikely with current logic)
        const taskMap = new Map<string, TaskData>();

        snapshots.forEach(snapshot => {
            snapshot.docs.forEach(doc => {
                taskMap.set(doc.id, { id: doc.id, ...doc.data() } as TaskData);
            });
        });

        const tasks = Array.from(taskMap.values());

        // Sort by createdAt desc
        tasks.sort((a, b) => {
            const da = a.createdAt?.toDate ? a.createdAt.toDate() :
                (a.createdAt instanceof Date ? a.createdAt : new Date(0));
            const db = b.createdAt?.toDate ? b.createdAt.toDate() :
                (b.createdAt instanceof Date ? b.createdAt : new Date(0));
            return db.getTime() - da.getTime();
        });

        return tasks;
    } catch (error) {
        console.error("Error fetching user tasks:", error);
        return [];
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
