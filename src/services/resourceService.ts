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

        // 2. Resources assigned to "all" (Global) - assuming targetAudience 'all' or no specific assignment means global?
        // Let's standardize on a 'global' audience or 'all_my_groups' if that's what we have.
        // Current 'all_my_groups' is basically a snapshot of group IDs. 
        // We will add a check for explicit 'all' or 'global' if we introduce it, but based on current data:
        // We will query for 'targetAudience' == 'all' if we add it. 
        // For now, let's keep the existing logic but ensure it's robust.

        let groupResources: ResourceData[] = [];
        if (groupIds.length > 0) {
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
                console.log(`[getUserResources] Group Query (chunk: ${chunk}): Found ${chunkResources.length} items`, chunkResources.map(r => r.title));
                groupResources = [...groupResources, ...chunkResources];
            }
        }

        const individualSnapshot = await getDocs(individualQuery);
        const individualResources = individualSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ResourceData);
        console.log(`[getUserResources] Individual Query (user: ${userId}): Found ${individualResources.length} items`, individualResources.map(r => r.title));

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

        console.log(`[getUserResources] Final Result: ${allResources.length} items`);
        return allResources;
    } catch (error) {
        console.error("Error fetching user resources:", error);
        throw error;
    }
};

export const getGroupResourcesForAdmin = async (groupId: string) => {
    try {
        // Fetch resources where this group is included in assignedToGroups OR it is the primary groupId
        // Doing strict filtering for better accuracy.

        // Option A: Primary Owner
        const ownerQuery = query(
            collection(db, "resources"),
            where("groupId", "==", groupId)
        );

        // Option B: Assigned 
        const assignedQuery = query(
            collection(db, "resources"),
            where("assignedToGroups", "array-contains", groupId)
        );

        const [ownerSnapshot, assignedSnapshot] = await Promise.all([
            getDocs(ownerQuery),
            getDocs(assignedQuery)
        ]);

        const allDocs = [...ownerSnapshot.docs, ...assignedSnapshot.docs];
        const uniqueDocs = new Map();

        allDocs.forEach(doc => {
            uniqueDocs.set(doc.id, { id: doc.id, ...doc.data() });
        });

        const sorted = Array.from(uniqueDocs.values()).sort((a: any, b: any) => {
            const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
            const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
            return db.getTime() - da.getTime();
        });

        return sorted as ResourceData[];
    } catch (error) {
        console.error("Error fetching group resources:", error);
        throw error;
    }
}

export const deleteResource = async (resourceId: string) => {
    await deleteDoc(doc(db, "resources", resourceId));
};
