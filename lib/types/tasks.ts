import { Timestamp } from 'firebase/firestore';

export interface Task {
    id: string; // Firestore ID
    title: string;
    description: string;
    status: 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled';
    priority: 'low' | 'medium' | 'high';
    assigneeId?: string; // UID of user assigned to
    assigneeName?: string; // Denormalized for display
    assigneePhoto?: string; // Optional avatar
    dueDate?: Timestamp;
    tags?: string[];

    // Audit fields
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
