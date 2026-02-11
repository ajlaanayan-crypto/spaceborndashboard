import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, orderBy, Timestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface WeeklyPlanData {
    id?: string;
    groupId: string;
    groupName?: string;
    userId: string;
    userName: string;
    role?: string; // Added role
    weekStartDate: string;
    weekEndDate?: string;
    weeklyFocus: string; // Renamed from focus
    tasks: string[]; // Restored
    expectedDeliverables: string[]; // Renamed from deliverables
    resources: string[];
    progress: 'not_started' | 'in_progress' | 'completed' | 'blocked';
    notes?: string;
    createdBy?: string;
    createdByName?: string;
    createdAt?: any;
    updatedAt?: any;
}

// Helper functions for week date calculations
export const getMonday = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
};

export const getSunday = (date: Date): string => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() + (day === 0 ? 0 : 7 - day);
    const sunday = new Date(d.setDate(diff));
    return sunday.toISOString().split('T')[0];
};

export const getWeekRange = (date: Date): string => {
    const monday = getMonday(date);
    const sunday = getSunday(date);
    return `${monday} to ${sunday}`;
};

export const getCurrentWeekStartDate = (): string => {
    return getMonday(new Date());
};

// Create new plan
export const createWeeklyPlan = async (plan: Omit<WeeklyPlanData, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = await addDoc(collection(db, "weeklyPlans"), {
        ...plan,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
};

// Update existing plan
export const updateWeeklyPlan = async (planId: string, plan: Partial<WeeklyPlanData>) => {
    await updateDoc(doc(db, "weeklyPlans", planId), {
        ...plan,
        updatedAt: serverTimestamp(),
    });
};

// Create or Update Plan (Upsert logic)
export const saveWeeklyPlan = async (plan: Omit<WeeklyPlanData, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Check if plan exists for this user+group+week
    const q = query(
        collection(db, "weeklyPlans"),
        where("groupId", "==", plan.groupId),
        where("userId", "==", plan.userId),
        where("weekStartDate", "==", plan.weekStartDate)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        // Update existing
        const docId = snapshot.docs[0].id;
        await updateDoc(doc(db, "weeklyPlans", docId), {
            ...plan,
            updatedAt: serverTimestamp(),
        });
        return docId;
    } else {
        // Create new
        const docRef = await addDoc(collection(db, "weeklyPlans"), {
            ...plan,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    }
};

// Convenience function for current week
export const getCurrentWeekPlan = async (groupId: string, userId: string): Promise<WeeklyPlanData | null> => {
    return getWeeklyPlan(groupId, userId, getCurrentWeekStartDate());
};

export const getWeeklyPlan = async (groupId: string, userId: string, weekStartDate: string): Promise<WeeklyPlanData | null> => {
    const q = query(
        collection(db, "weeklyPlans"),
        where("groupId", "==", groupId),
        where("userId", "==", userId),
        where("weekStartDate", "==", weekStartDate)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as WeeklyPlanData;
};

export const getGroupWeeklyPlans = async (groupId: string, weekStartDate: string): Promise<WeeklyPlanData[]> => {
    const q = query(
        collection(db, "weeklyPlans"),
        where("groupId", "==", groupId),
        where("weekStartDate", "==", weekStartDate)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as WeeklyPlanData);
};
