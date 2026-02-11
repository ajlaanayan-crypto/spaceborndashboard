import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "./firebase";

// Initialize Firebase Storage
const storage = getStorage(app);

/**
 * Upload a profile image for a user
 * @param userId - User's UID
 * @param file - Image file to upload
 * @returns Download URL of the uploaded image
 */
export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
    try {
        // Create a reference to the file location
        const storageRef = ref(storage, `profile-images/${userId}`);

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        console.error("Error uploading profile image:", error);
        throw error;
    }
};

/**
 * Delete a user's profile image
 * @param userId - User's UID
 */
export const deleteProfileImage = async (userId: string): Promise<void> => {
    try {
        const storageRef = ref(storage, `profile-images/${userId}`);
        await deleteObject(storageRef);
    } catch (error) {
        console.error("Error deleting profile image:", error);
        throw error;
    }
};

/**
 * Get the download URL for a user's profile image
 * @param userId - User's UID
 * @returns Download URL or null if no image exists
 */
export const getProfileImageURL = async (userId: string): Promise<string | null> => {
    try {
        const storageRef = ref(storage, `profile-images/${userId}`);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error: any) {
        // If the file doesn't exist, return null
        if (error.code === 'storage/object-not-found') {
            return null;
        }
        console.error("Error getting profile image URL:", error);
        throw error;
    }
};
