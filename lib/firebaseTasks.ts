import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    orderBy,
    where,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Task } from './types/tasks';

const TASKS_COLLECTION = 'tasks';

/**
 * Create a new task
 */
export async function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
        const newTask = {
            ...taskData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, TASKS_COLLECTION), newTask);
        return docRef.id;
    } catch (error: any) {
        throw new Error(error.message || 'Failed to create task');
    }
}

/**
 * Get all tasks
 */
export async function getAllTasks(): Promise<Task[]> {
    try {
        // Order by priority (high first) then updated time
        const q = query(
            collection(db, TASKS_COLLECTION),
            orderBy('priority', 'desc'),
            orderBy('updatedAt', 'desc')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Task));
    } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch tasks');
    }
}

/**
 * Update task
 */
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
        const docRef = doc(db, TASKS_COLLECTION, taskId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to update task');
    }
}

/**
 * Delete task
 */
export async function deleteTask(taskId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
    } catch (error: any) {
        throw new Error(error.message || 'Failed to delete task');
    }
}

/**
 * Get tasks assigned to a specific user
 */
export async function getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    try {
        const q = query(
            collection(db, TASKS_COLLECTION),
            where('assigneeId', '==', assigneeId),
            orderBy('dueDate', 'asc') // Sooner due dates first
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Task));
    } catch (error: any) {
        // Index might be required for compound query
        console.error('Index required? Check console link', error);
        throw new Error(error.message || 'Failed to fetch assigned tasks');
    }
}
