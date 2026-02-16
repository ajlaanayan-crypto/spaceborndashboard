import { app } from "@/lib/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadFile = async (file: Blob | File, path: string): Promise<string> => {
    try {
        if (!app) {
            console.error("Firebase app not initialized");
            throw new Error("Firebase not initialized");
        }
        const storage = getStorage(app);
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};
