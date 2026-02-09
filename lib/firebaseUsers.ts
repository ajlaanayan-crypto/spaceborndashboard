import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from './types/users';

const USERS_COLLECTION = 'users';

export interface FirestoreUser extends Omit<User, 'id'> {
    uid: string;
    id: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * Create a new user document in Firestore
 */
export async function createUserDocument(
    uid: string,
    userData: {
        username: string;
        email: string;
        role: 'admin' | 'core' | 'employee' | 'intern';
    }
): Promise<void> {
    try {
        // Get the next sequential ID
        const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
        const nextId = usersSnapshot.size + 1;

        const userDoc = {
            uid,
            id: nextId,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        await setDoc(doc(db, USERS_COLLECTION, uid), userDoc);
    } catch (error: any) {
        throw new Error(error.message || 'Failed to create user document');
    }
}

/**
 * Get all users from Firestore
 */
export async function getAllUsers(): Promise<User[]> {
    try {
        const usersSnapshot = await getDocs(
            query(collection(db, USERS_COLLECTION), orderBy('id', 'asc'))
        );

        return usersSnapshot.docs.map(doc => {
            const data = doc.data() as FirestoreUser;
            return {
                id: data.id,
                username: data.username,
                email: data.email,
                role: data.role,
                uid: data.uid, // Include UID for edit/delete operations
            };
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch users');
    }
}

/**
 * Get a single user by UID
 */
export async function getUserByUid(uid: string): Promise<User | null> {
    try {
        const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));

        if (!userDoc.exists()) {
            return null;
        }

        const data = userDoc.data() as FirestoreUser;
        return {
            id: data.id,
            username: data.username,
            email: data.email,
            role: data.role,
        };
    } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch user');
    }
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    try {
        const usersQuery = query(
            collection(db, USERS_COLLECTION),
            where('email', '==', email)
        );
        const querySnapshot = await getDocs(usersQuery);

        if (querySnapshot.empty) {
            return null;
        }

        const data = querySnapshot.docs[0].data() as FirestoreUser;
        return {
            id: data.id,
            username: data.username,
            email: data.email,
            role: data.role,
        };
    } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch user');
    }
}

/**
 * Update user document
 */
export async function updateUserDocument(
    uid: string,
    updates: Partial<{
        username: string;
        email: string;
        role: 'admin' | 'core' | 'employee' | 'intern';
    }>
): Promise<void> {
    try {
        await updateDoc(doc(db, USERS_COLLECTION, uid), {
            ...updates,
            updatedAt: Timestamp.now(),
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to update user');
    }
}

/**
 * Delete user document
 */
export async function deleteUserDocument(uid: string): Promise<void> {
    try {
        await deleteDoc(doc(db, USERS_COLLECTION, uid));
    } catch (error: any) {
        throw new Error(error.message || 'Failed to delete user');
    }
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: string): Promise<User[]> {
    try {
        const usersQuery = query(
            collection(db, USERS_COLLECTION),
            where('role', '==', role),
            orderBy('id', 'asc')
        );
        const querySnapshot = await getDocs(usersQuery);

        return querySnapshot.docs.map(doc => {
            const data = doc.data() as FirestoreUser;
            return {
                id: data.id,
                username: data.username,
                email: data.email,
                role: data.role,
            };
        });
    } catch (error: any) {
        throw new Error(error.message || 'Failed to fetch users by role');
    }
}
