import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, serverTimestamp, orderBy, Timestamp, writeBatch, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface GroupData {
    id?: string;
    name: string;
    description: string;
    leadId?: string | null;
    leadName?: string | null;
    status: 'active' | 'inactive';
    memberIds: string[];
    createdAt?: any;
    createdBy?: string;
    updatedAt?: any;
    maxMembers?: number;
    lastMessageAt?: any;
    batch?: string; // "Batch 1", "Batch 2", "Batch 3"
}

export interface GroupMemberData {
    id?: string;
    groupId: string;
    userId: string;
    userName: string;
    userEmail: string;
    role: string; // Allow any role string
    isLead: boolean;
    joinedAt?: any;
    status: 'active' | 'removed';
}

// Group CRUD
export const createGroupWithMembers = async (
    groupData: Omit<GroupData, 'id' | 'createdAt' | 'updatedAt'>,
    members: Omit<GroupMemberData, 'id' | 'joinedAt' | 'groupId'>[]
): Promise<string> => {
    const batch = writeBatch(db);

    // 1. Create Group Ref
    const groupRef = doc(collection(db, "groups"));
    const groupId = groupRef.id;

    // 2. Add Group to Batch
    batch.set(groupRef, {
        ...groupData,
        memberIds: members.map(m => m.userId), // Ensure memberIds are synced at creation
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        batch: groupData.batch || null,
    });

    // 3. Add Members to Batch
    const membersCollectionRef = collection(db, "groupMembers");
    members.forEach(member => {
        const memberRef = doc(membersCollectionRef);
        batch.set(memberRef, {
            ...member,
            groupId: groupId,
            joinedAt: serverTimestamp(),
        });
    });

    // 4. Commit Batch
    await batch.commit();
    return groupId;
};

// Group CRUD
export const createGroup = async (group: Omit<GroupData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const docRef = await addDoc(collection(db, "groups"), {
        ...group,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        batch: group.batch || null,
    });
    return docRef.id;
};

export const getAllGroups = async (): Promise<GroupData[]> => {
    const q = query(collection(db, "groups"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as GroupData);
};

export const subscribeToGroups = (callback: (groups: GroupData[]) => void) => {
    const q = query(collection(db, "groups"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as GroupData);
        callback(groups);
    }, (error) => {
        console.error("Error subscribing to groups:", error);
    });
};

export const getActiveGroups = async (): Promise<GroupData[]> => {
    const q = query(
        collection(db, "groups"),
        where("status", "==", "active")
        // orderBy("createdAt", "desc") // Commented out to prevent missing index error
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as GroupData);
};

export const getGroupById = async (groupId: string): Promise<GroupData | null> => {
    const groupDoc = await getDocs(query(collection(db, "groups"), where("__name__", "==", groupId)));
    if (groupDoc.empty) return null;
    return { id: groupDoc.docs[0].id, ...groupDoc.docs[0].data() } as GroupData;
};

export const updateGroup = async (groupId: string, updates: Partial<GroupData>) => {
    await updateDoc(doc(db, "groups", groupId), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
};

export const archiveGroup = async (groupId: string) => {
    await updateDoc(doc(db, "groups", groupId), {
        status: "inactive",
        updatedAt: serverTimestamp(),
    });
};

export const activateGroup = async (groupId: string) => {
    await updateDoc(doc(db, "groups", groupId), {
        status: "active",
        updatedAt: serverTimestamp(),
    });
};

// Group Members
export const addGroupMember = async (member: Omit<GroupMemberData, 'id' | 'joinedAt'>): Promise<string> => {
    const docRef = await addDoc(collection(db, "groupMembers"), {
        ...member,
        joinedAt: serverTimestamp(),
    });

    // Update group memberIds array
    const group = await getGroupById(member.groupId);
    if (group) {
        const updatedMembers = [...(group.memberIds || []), member.userId];
        await updateGroup(member.groupId, { memberIds: updatedMembers });
    }

    return docRef.id;
};

export const getGroupMembers = async (groupId: string): Promise<GroupMemberData[]> => {
    const q = query(
        collection(db, "groupMembers"),
        where("groupId", "==", groupId),
        where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as GroupMemberData);
};

export const getUserGroups = async (userId: string): Promise<GroupData[]> => {
    // Get all group memberships for this user
    const memberQuery = query(
        collection(db, "groupMembers"),
        where("userId", "==", userId),
        where("status", "==", "active")
    );
    const memberSnapshot = await getDocs(memberQuery);
    const groupIds = memberSnapshot.docs.map(doc => doc.data().groupId);

    if (groupIds.length === 0) return [];

    // Get all groups for these IDs
    const groups: GroupData[] = [];
    for (const groupId of groupIds) {
        const group = await getGroupById(groupId);
        if (group && group.status === 'active') {
            groups.push(group);
        }
    }

    return groups;
};

export const getGroupsByBatch = async (batch: string): Promise<GroupData[]> => {
    const q = query(
        collection(db, "groups"),
        where("batch", "==", batch),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as GroupData);
};

export const removeGroupMember = async (groupId: string, userId: string) => {
    // Mark member as removed
    const memberQuery = query(
        collection(db, "groupMembers"),
        where("groupId", "==", groupId),
        where("userId", "==", userId)
    );
    const memberSnapshot = await getDocs(memberQuery);

    if (!memberSnapshot.empty) {
        await updateDoc(memberSnapshot.docs[0].ref, { status: "removed" });
    }

    // Update group memberIds array
    const group = await getGroupById(groupId);
    if (group) {
        const updatedMembers = (group.memberIds || []).filter(id => id !== userId);
        await updateGroup(groupId, { memberIds: updatedMembers });
    }
};

export const isUserGroupLead = async (userId: string, groupId: string): Promise<boolean> => {
    const q = query(
        collection(db, "groupMembers"),
        where("groupId", "==", groupId),
        where("userId", "==", userId),
        where("isLead", "==", true),
        where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
};

// Validation
export const canAddMoreGroups = async (): Promise<boolean> => {
    // Limit removed as per requirement
    return true;
};

export const deleteGroup = async (groupId: string) => {
    // 1. Delete Group Doc
    await deleteDoc(doc(db, "groups", groupId));

    // 2. Delete All Members of this group
    const membersQuery = query(collection(db, "groupMembers"), where("groupId", "==", groupId));
    const membersSnapshot = await getDocs(membersQuery);

    const batch = writeBatch(db);
    membersSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    // 3. Optional: Delete messages collection (if subcollection)
    // Firestore requires recursive delete for subcollections, which is best done via Cloud Functions 
    // or by client-side listing (expensive). For now, we leave subcollections 
    // as they are orphaned and won't be accessed.
};
