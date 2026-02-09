import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthResult {
    user: FirebaseUser;
    token: string;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();

        return {
            user: userCredential.user,
            token,
        };
    } catch (error: any) {
        throw new Error(error.message || 'Failed to sign in');
    }
}

/**
 * Register new user with email and password
 */
export async function registerWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();

        return {
            user: userCredential.user,
            token,
        };
    } catch (error: any) {
        throw new Error(error.message || 'Failed to register');
    }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
    try {
        await firebaseSignOut(auth);
    } catch (error: any) {
        throw new Error(error.message || 'Failed to sign out');
    }
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
}

/**
 * Get current user
 */
export function getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
}

/**
 * Get current user token
 */
export async function getCurrentUserToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
        return await user.getIdToken();
    } catch (error) {
        return null;
    }
}
