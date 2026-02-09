'use client'

import { signInWithEmail, signOut as firebaseSignOut, getCurrentUserToken } from './firebaseAuth';
import { getUserByEmail, createUserDocument } from './firebaseUsers';

const ACCESS = "accessToken";

export function setTokens(access: string) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(ACCESS, access);
    }
}

export function getAccessToken() {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(ACCESS);
    }
    return null;
}

export function clearTokens() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(ACCESS);
    }
}

export async function login(credentials: { email: string; password: string }) {
    const { email, password } = credentials;

    if (!email || !password) {
        throw new Error('Email and password are required');
    }

    try {
        // Sign in with Firebase
        const { user, token } = await signInWithEmail(email, password);

        // Store token
        setTokens(token);

        // Get user data from Firestore
        let userData = await getUserByEmail(email);

        if (!userData) {
            // Self-healing: If admin logs in but has no firestore doc (e.g. initial setup failed), create it now
            if (email === 'admin@spaceborn.io') {
                console.log('⚠️ Admin data missing in Firestore. Creating it now (Self-Healing)...');
                const { createUserDocument } = await import('./firebaseUsers');
                await createUserDocument(user.uid, {
                    username: 'Admin',
                    email: email,
                    role: 'admin'
                });
                // Fetch again
                userData = await getUserByEmail(email);
            }

            if (!userData) {
                throw new Error('User data not found in database. Please contact support.');
            }
        }

        return {
            access_token: token,
            user: userData
        };
    } catch (error: any) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Failed to login');
    }
}

export async function logout() {
    try {
        await firebaseSignOut();
        clearTokens();
    } catch (error: any) {
        throw new Error(error.message || 'Logout failed');
    }
}

export async function refreshToken() {
    const token = await getCurrentUserToken();
    if (token) {
        setTokens(token);
    }
    return token;
}
