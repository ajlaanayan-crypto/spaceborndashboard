import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDxBGPRahVeBWdTNxAfRFs9Gd1VH1hwu-g",
    authDomain: "real-dashboard-46d72.firebaseapp.com",
    projectId: "real-dashboard-46d72",
    storageBucket: "real-dashboard-46d72.firebasestorage.app",
    messagingSenderId: "230924861459",
    appId: "1:230924861459:web:aac41f36fe84ab2702ffe6",
    measurementId: "G-72DJ59Y1FX"
};

// Initialize Firebase - only on client side
let app: any;
let auth: any;
let db: any;
let analytics: any;

if (typeof window !== "undefined") {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        try {
            analytics = getAnalytics(app);
        } catch (analyticsError) {
            console.warn("Analytics initialization skipped (likely due to privacy restrictions)");
        }
    } catch (error) {
        console.error("Firebase Client initialization error", error);
    }
}

export { app, auth, db, analytics };
