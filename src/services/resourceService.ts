import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ResourceData {
    id?: string;
    title: string;
    url: string;
    description?: string;
    type: 'link' | 'file';
    category: string; // User defined category

    // Assignment Logic
    targetAudience: 'individuals' | 'group' | 'all_my_groups';
    assignedTo?: string[]; // Array of User IDs
    assignedToGroups?: string[]; // Array of Group IDs

    assignedBy: string; // Admin/Lead ID
    groupId: string; // The primary/creation group context
    createdAt?: any;
}

export const createResource = async (resource: Omit<ResourceData, 'id' | 'createdAt'>) => {
    try {
        const docRef = await addDoc(collection(db, "resources"), {
            ...resource,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating resource:", error);
        throw error;
    }
};

export const getUserResources = async (userId: string, groupIds: string[] = []) => {
    try {
        const resourcesRef = collection(db, "resources");

        // 1. Resources assigned to this user specifically
        const individualQuery = query(
            resourcesRef,
            where("assignedTo", "array-contains", userId)
        );

        // 2. Resources assigned to any of the user's groups
        let groupResources: ResourceData[] = [];
        if (groupIds.length > 0) {
            // Firestore 'array-contains-any' limits to 10 items. Batch if needed.
            const chunks = [];
            for (let i = 0; i < groupIds.length; i += 10) {
                chunks.push(groupIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
                const groupQuery = query(
                    resourcesRef,
                    where("assignedToGroups", "array-contains-any", chunk)
                );
                const snapshot = await getDocs(groupQuery);
                const chunkResources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ResourceData);
                groupResources = [...groupResources, ...chunkResources];
            }
        }

        const individualSnapshot = await getDocs(individualQuery);
        const individualResources = individualSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ResourceData);

        // Merge, Deduplicate (by ID), and Sort
        const allMap = new Map<string, ResourceData>();
        [...individualResources, ...groupResources].forEach(r => {
            if (r.id) allMap.set(r.id, r);
        });

        const allResources = Array.from(allMap.values()).sort((a, b) => {
            const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
            const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
            return db.getTime() - da.getTime();
        });

        return allResources;
    } catch (error) {
        console.error("Error fetching user resources:", error);
        throw error;
    }
};

export const getGroupResourcesForAdmin = async (groupId: string) => {
    try {
        // Fetch resources where this group is the primary context OR included in assignedGroups
        // For simplicity in Admin view, we might just show resources created within this context (groupId field)
        const q = query(
            collection(db, "resources"),
            where("groupId", "==", groupId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ResourceData);
    } catch (error) {
        console.error("Error fetching group resources:", error);
        throw error;
    }
}

export const deleteResource = async (resourceId: string) => {
    await deleteDoc(doc(db, "resources", resourceId));
};
