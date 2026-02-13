import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, serverTimestamp, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface MeetingData {
    id?: string;
    title: string;
    description: string;
    type: 'organization' | 'group' | 'individual';
    targetGroupId?: string; // for group meetings
    targetUserIds?: string[]; // for individual meetings
    scheduledAt: any;
    duration: number; // in minutes
    meetingLink?: string; // Google Meet link
    createdBy: string;
    createdByName: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    createdAt?: any;
    updatedAt?: any;
}

export interface MeetingParticipantData {
    id?: string;
    meetingId: string;
    userId: string;
    userName: string;
    userEmail: string;
    status: 'invited' | 'accepted' | 'declined' | 'attended' | 'missed';
    joinedAt?: any;
}

// Meeting CRUD
export const createMeeting = async (meeting: Omit<MeetingData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const docRef = await addDoc(collection(db, "meetings"), {
        ...meeting,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getAllMeetings = async (): Promise<MeetingData[]> => {
    const q = query(collection(db, "meetings"), orderBy("scheduledAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MeetingData);
};

export const getUpcomingMeetings = async (): Promise<MeetingData[]> => {
    try {
        const q = query(
            collection(db, "meetings"),
            where("status", "==", "scheduled"),
            orderBy("scheduledAt", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MeetingData);
    } catch (error) {
        console.error("Error fetching upcoming meetings:", error);
        return [];
    }
};

export const getUserMeetings = async (userId: string): Promise<MeetingData[]> => {
    // Get all participant records for this user
    const participantQuery = query(
        collection(db, "meetingParticipants"),
        where("userId", "==", userId)
    );
    const participantSnapshot = await getDocs(participantQuery);
    const meetingIds = participantSnapshot.docs.map(doc => doc.data().meetingId);

    if (meetingIds.length === 0) return [];

    // Get all meetings for these IDs
    const meetings: MeetingData[] = [];
    for (const meetingId of meetingIds) {
        const meetingQuery = query(collection(db, "meetings"), where("__name__", "==", meetingId));
        const meetingSnapshot = await getDocs(meetingQuery);
        if (!meetingSnapshot.empty) {
            meetings.push({ id: meetingSnapshot.docs[0].id, ...meetingSnapshot.docs[0].data() } as MeetingData);
        }
    }

    return meetings.sort((a, b) => b.scheduledAt?.seconds - a.scheduledAt?.seconds);
};

export const updateMeeting = async (meetingId: string, updates: Partial<MeetingData>) => {
    await updateDoc(doc(db, "meetings", meetingId), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
};

export const cancelMeeting = async (meetingId: string) => {
    await updateDoc(doc(db, "meetings", meetingId), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
    });
};

export const completeMeeting = async (meetingId: string) => {
    await updateDoc(doc(db, "meetings", meetingId), {
        status: "completed",
        updatedAt: serverTimestamp(),
    });
};

export const deleteMeeting = async (meetingId: string) => {
    await deleteDoc(doc(db, "meetings", meetingId));
};

// Meeting Participants
export const addMeetingParticipant = async (participant: Omit<MeetingParticipantData, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, "meetingParticipants"), participant);
    return docRef.id;
};

export const getMeetingParticipants = async (meetingId: string): Promise<MeetingParticipantData[]> => {
    const q = query(collection(db, "meetingParticipants"), where("meetingId", "==", meetingId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MeetingParticipantData);
};

export const updateParticipantStatus = async (participantId: string, status: MeetingParticipantData['status']) => {
    await updateDoc(doc(db, "meetingParticipants", participantId), { status });
};

// Helper: Generate Google Meet link (placeholder - in production use Google Calendar API)
export const generateMeetLink = (): string => {
    const randomId = Math.random().toString(36).substring(2, 12);
    return `https://meet.google.com/${randomId}`;
};


