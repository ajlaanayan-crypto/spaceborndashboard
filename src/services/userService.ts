import { collection, getDocs, query, doc, setDoc, updateDoc, where, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserRole } from "@/context/AuthContext";
import { compressImage } from "@/lib/imageCompression";

export interface UserData {
    uid: string;
    email: string;
    role: UserRole;
    name: string;
    status: "active" | "inactive";
    warnings?: number;
    lastLogin?: any; // Timestamp
    batch?: string; // Optional batch for interns
    photoURL?: string;
    createdAt: string;
}

export const getAllUsers = async () => {
    const q = query(collection(db, "users"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData));
};

export const createUserInFirestore = async (uid: string, data: Omit<UserData, "uid">) => {
    await setDoc(doc(db, "users", uid), data);
};

export const updateUserStatus = async (uid: string, status: "active" | "inactive") => {
    await updateDoc(doc(db, "users", uid), { status });
};

export const updateUserName = async (uid: string, name: string) => {
    await updateDoc(doc(db, "users", uid), { name });
};

export const updateUserBatch = async (uid: string, batch: string) => {
    await updateDoc(doc(db, "users", uid), { batch });
};

export const addWarning = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const currentWarnings = userSnap.data().warnings || 0;
        const newWarnings = currentWarnings + 1;
        const updates: any = { warnings: newWarnings };

        if (newWarnings >= 3) {
            updates.status = "inactive";
        }

        await updateDoc(userRef, updates);
    }
};

export const getUsersByRole = async (role: UserRole) => {
    const q = query(collection(db, "users"), where("role", "==", role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData));
};

/**
 * Upload and update user's profile image (Stored as Base64 in Firestore)
 * @param uid - User's UID
 * @param file - Image file to upload
 */
export const updateUserProfileImage = async (uid: string, file: File): Promise<string> => {
    try {
        // Compress image to Base64 (to fit in Firestore document limits)
        const photoURL = await compressImage(file, 500, 0.7);

        // Update user document with new photoURL (base64 string)
        await updateDoc(doc(db, "users", uid), { photoURL });

        return photoURL;
    } catch (error) {
        console.error("Error updating user profile image:", error);
        throw error;
    }
};

/**
 * Remove user's profile image
 * @param uid - User's UID
 */
export const removeUserProfileImage = async (uid: string): Promise<void> => {
    try {
        // No need to delete from storage as it's just a field in Firestore now
        // await deleteProfileImage(uid); 

        // Remove photoURL from user document
        await updateDoc(doc(db, "users", uid), { photoURL: null });
    } catch (error) {
        console.error("Error removing user profile image:", error);
        throw error;
    }
};

