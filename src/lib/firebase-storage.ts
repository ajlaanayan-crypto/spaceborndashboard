import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
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

        // Upload the file with progress monitoring
        // const snapshot = await uploadBytes(storageRef, file);

        // Use uploadBytesResumable for better reliability and debugging
        return new Promise((resolve, reject) => {
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    console.error("Upload failed:", error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    } catch (err) {
                        reject(err);
                    }
                }
            );
        });
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
