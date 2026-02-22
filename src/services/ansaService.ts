import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    serverTimestamp,
    orderBy,
    getDoc,
    writeBatch
} from "firebase/firestore";

export interface AnsaTopic {
    id?: string;
    title: string;
    description?: string;
    assignedGroupIds: string[]; // Group IDs assigned to this topic
    assignedGroupNames?: string[]; // Helper for UI
    status: 'pending' | 'in_progress' | 'completed';
    progress: number; // 0 to 100
    totalSubtopics: number;
    completedSubtopics: number;
    createdAt?: any;
    updatedAt?: any;
}

export interface AnsaSubtopic {
    id?: string;
    topicId: string;
    title: string;
    status: 'pending' | 'completed';
    assignedUserId?: string; // Optional: Assign specific person to a subtopic
    createdAt?: any;
}

// --- Topic Operations ---

export const createTopic = async (data: Omit<AnsaTopic, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'totalSubtopics' | 'completedSubtopics'>) => {
    const topicData = {
        ...data,
        progress: 0,
        totalSubtopics: 0,
        completedSubtopics: 0,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "ansa_topics"), topicData);
    return { id: docRef.id, ...topicData };
};

export const getTopics = async (): Promise<AnsaTopic[]> => {
    const q = query(collection(db, "ansa_topics"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnsaTopic));
};

export const updateTopic = async (topicId: string, data: Partial<AnsaTopic>) => {
    const docRef = doc(db, "ansa_topics", topicId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
};

export const deleteTopic = async (topicId: string) => {
    // Delete topic and all its subtopics
    const batch = writeBatch(db);

    // Delete Topic
    const topicRef = doc(db, "ansa_topics", topicId);
    batch.delete(topicRef);

    // Get and Delete Subtopics
    const subtopicsQuery = query(collection(db, "ansa_subtopics"), where("topicId", "==", topicId));
    const subtopicsSnapshot = await getDocs(subtopicsQuery);
    subtopicsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
};

// --- Subtopic Operations ---

export const createSubtopic = async (topicId: string, title: string) => {
    const subtopicData = {
        topicId,
        title,
        status: 'pending',
        createdAt: serverTimestamp(),
    };

    // Add subtopic
    const docRef = await addDoc(collection(db, "ansa_subtopics"), subtopicData);

    // Update parent topic stats
    await recalculateTopicProgress(topicId);

    return { id: docRef.id, ...subtopicData };
};

export const getSubtopics = async (topicId: string): Promise<AnsaSubtopic[]> => {
    const q = query(
        collection(db, "ansa_subtopics"),
        where("topicId", "==", topicId),
        orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnsaSubtopic));
};

export const toggleSubtopicStatus = async (subtopicId: string, currentStatus: 'pending' | 'completed', topicId: string) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    const docRef = doc(db, "ansa_subtopics", subtopicId);

    await updateDoc(docRef, { status: newStatus });
    await recalculateTopicProgress(topicId);
};

export const deleteSubtopic = async (subtopicId: string, topicId: string) => {
    await deleteDoc(doc(db, "ansa_subtopics", subtopicId));
    await recalculateTopicProgress(topicId);
};

// --- Helper ---

const recalculateTopicProgress = async (topicId: string) => {
    // Get all subtopics for this topic
    const q = query(collection(db, "ansa_subtopics"), where("topicId", "==", topicId));
    const snapshot = await getDocs(q);

    const total = snapshot.size;
    const completed = snapshot.docs.filter(doc => doc.data().status === 'completed').length;

    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    let status: AnsaTopic['status'] = 'in_progress';
    if (total === 0) status = 'pending';
    else if (progress === 100) status = 'completed';
    else if (progress === 0) status = 'pending';

    const topicRef = doc(db, "ansa_topics", topicId);
    await updateDoc(topicRef, {
        totalSubtopics: total,
        completedSubtopics: completed,
        progress,
        status,
        updatedAt: serverTimestamp()
    });
};
