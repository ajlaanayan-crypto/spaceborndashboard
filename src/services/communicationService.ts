import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AnnouncementData {
    id?: string;
    title: string;
    message: string;
    priority: "low" | "medium" | "high" | "urgent";
    targetRoles?: string[]; // If empty, visible to all
    createdBy: string;
    createdByName?: string;
    createdAt?: any;
}

export interface ResourceData {
    id?: string;
    title: string;
    description: string;
    type: "pdf" | "video" | "link" | "article" | "youtube" | "playlist" | "instagram" | "other";
    url: string;
    thumbnailUrl?: string;
    category?: "Core Docs" | "Tech Stack" | "Department Wise" | "Learning" | "Internal Assets" | "Research Vault" | string;
    tags?: string[];
    targetRoles?: string[]; // If empty, visible to all
    createdBy: string;
    createdAt?: any;
}

// Announcements
export const createAnnouncement = async (announcement: Omit<AnnouncementData, "id" | "createdAt">) => {
    const docRef = await addDoc(collection(db, "announcements"), {
        ...announcement,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getAllAnnouncements = async (): Promise<AnnouncementData[]> => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AnnouncementData);
};

export const deleteAnnouncement = async (id: string) => {
    await deleteDoc(doc(db, "announcements", id));
};

// Resources
export const createResource = async (resource: Omit<ResourceData, "id" | "createdAt">) => {
    const docRef = await addDoc(collection(db, "resources"), {
        ...resource,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getAllResources = async (): Promise<ResourceData[]> => {
    const q = query(collection(db, "resources"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ResourceData);
};

export const deleteResource = async (id: string) => {
    await deleteDoc(doc(db, "resources", id));
};
