import { initializeApp, getApps, cert, getApp, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Helper to handle the private key with newlines
const getServiceAccount = () => {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        }
        return {
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };
    } catch (e) {
        return {};
    }
}

const serviceAccount = getServiceAccount();

let app: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    try {
        const firebaseAdminConfig = {
            credential: cert(serviceAccount),
        };
        app = !getApps().length ? initializeApp(firebaseAdminConfig) : getApp();
        adminAuth = getAuth(app);
        adminDb = getFirestore(app);
    } catch (error) {
        console.error("Firebase Admin initialization error", error);
    }
}

export { adminAuth, adminDb };
