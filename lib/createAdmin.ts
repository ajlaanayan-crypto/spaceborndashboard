/**
 * Script to create an admin user in Firebase
 * Run this in your browser console or as a one-time setup page
 */

import { registerWithEmail } from './firebaseAuth';
import { createUserDocument } from './firebaseUsers';

export async function createAdminUser() {
    const adminEmail = 'admin@spaceborn.io';
    const adminPassword = 'Admin@123456';
    const adminUsername = 'Admin';

    try {
        console.log('Creating admin user...');

        // Register with Firebase Auth
        const { user } = await registerWithEmail(adminEmail, adminPassword);
        console.log('✓ Created auth user with UID:', user.uid);

        // Create user document in Firestore
        await createUserDocument(user.uid, {
            username: adminUsername,
            email: adminEmail,
            role: 'admin',
        });

        console.log('✓ Created Firestore document');
        console.log('\n✅ Admin user created successfully!');
        console.log('\nLogin credentials:');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        console.log('Role: admin');

        return {
            success: true,
            email: adminEmail,
            password: adminPassword,
        };
    } catch (error: any) {
        console.log('⚠️ Registration failed, user might exist. Attempting login as fallback...', error.code);

        // Fallback: Try to login if registration fails (for any reason, to be safe)
        try {
            const { signInWithEmail } = require('./firebaseAuth');
            await signInWithEmail(adminEmail, adminPassword);
            console.log('✅ Logged in successfully as admin (fallback)!');

            // Ensure Firestore doc exists
            await createUserDocument(undefined as any, {
                username: adminUsername,
                email: adminEmail,
                role: 'admin',
            });
            console.log('✓ Verified Firestore document');

            return {
                success: true,
                email: adminEmail,
                password: adminPassword,
                message: 'User already exists. Logged in successfully.'
            };
        } catch (loginError: any) {
            // If login also fails, then it's a real error (e.g. wrong password for existing user, or connection issue)
            console.error('❌ Login fallback also failed:', loginError.message);
            // Throw the original error if it wasn't an "already exists" issue, otherwise throw the login error
            if (error.code === 'auth/email-already-in-use' || error.code === 'auth/invalid-credential') {
                throw new Error(`User exists but login failed: ${loginError.message}. Check your password or API key.`);
            }
            throw error; // Throw original registration error
        }
    }
}
