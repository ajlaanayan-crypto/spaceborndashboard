import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ReportData {
    id?: string;
    userId: string; // Intern or employee being reported on
    userName?: string;
    period: string; // e.g., "2024-01", "Q1-2024"
    performanceScore: number; // 0-100
    tasksCompleted: number;
    tasksAssigned: number;
    averageCompletionTime?: number; // in days
    strengths?: string;
    weaknesses?: string;
    remarks?: string;
    createdBy: string; // Admin or Core Employee who created the report
    createdAt?: any;
    updatedAt?: any;
}

export interface FeedbackData {
    id?: string;
    targetUserId: string; // User receiving feedback
    targetUserName?: string;
    type: "praise" | "improvement" | "general";
    message: string;
    createdBy: string;
    createdByName?: string;
    createdAt?: any;
}

export interface PerformanceScoreData {
    id?: string;
    userId: string;
    period: string; // Monthly: "2024-01"
    score: number; // 0-100
    criteria: {
        taskCompletion: number;
        quality: number;
        timeliness: number;
        collaboration: number;
    };
    notes?: string;
    reviewedBy: string;
    createdAt?: any;
}

// Reports
export const createReport = async (report: Omit<ReportData, "id" | "createdAt" | "updatedAt">) => {
    const docRef = await addDoc(collection(db, "reports"), {
        ...report,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getReportsByUser = async (userId: string): Promise<ReportData[]> => {
    const q = query(
        collection(db, "reports"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ReportData);
};

export const getAllReports = async (): Promise<ReportData[]> => {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as ReportData);
};

// Feedback
export const addFeedback = async (feedback: Omit<FeedbackData, "id" | "createdAt">) => {
    const docRef = await addDoc(collection(db, "feedback"), {
        ...feedback,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getFeedbackForUser = async (userId: string): Promise<FeedbackData[]> => {
    const q = query(
        collection(db, "feedback"),
        where("targetUserId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FeedbackData);
};

// Performance Scores
export const addPerformanceScore = async (score: Omit<PerformanceScoreData, "id" | "createdAt">) => {
    const docRef = await addDoc(collection(db, "performance_scores"), {
        ...score,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getPerformanceScores = async (userId: string): Promise<PerformanceScoreData[]> => {
    const q = query(
        collection(db, "performance_scores"),
        where("userId", "==", userId),
        orderBy("period", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as PerformanceScoreData);
};
