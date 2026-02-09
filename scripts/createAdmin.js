// Script to create an admin user in Firebase
// Run with: node scripts/createAdmin.js

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
// You'll need to download your service account key from Firebase Console
// Go to: Project Settings > Service Accounts > Generate new private key

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
    try {
        console.log('\n=== Create Admin User ===\n');

        const email = await question('Enter admin email: ');
        const password = await question('Enter admin password (min 6 characters): ');
        const username = await question('Enter admin username: ');

        console.log('\nCreating admin user...');

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            emailVerified: true
        });

        console.log(`✓ Created auth user with UID: ${userRecord.uid}`);

        // Get next ID
        const usersSnapshot = await db.collection('users').get();
        const nextId = usersSnapshot.size + 1;

        // Create user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            id: nextId,
            username: username,
            email: email,
            role: 'admin',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✓ Created Firestore document with ID: ${nextId}`);
        console.log('\n✅ Admin user created successfully!');
        console.log(`\nLogin credentials:`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: admin\n`);

    } catch (error) {
        console.error('\n❌ Error creating admin user:', error.message);
    } finally {
        rl.close();
        process.exit();
    }
}

createAdminUser();
