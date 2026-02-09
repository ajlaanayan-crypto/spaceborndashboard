export interface User {
    id: number;
    username: string;
    email: string;
    role: 'admin' | 'core' | 'employee' | 'intern';
    uid?: string; // Firebase UID for operations
}