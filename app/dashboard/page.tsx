'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserByEmail } from '../../lib/firebaseUsers';
import { User } from '../../lib/types/users';
import AdminDashboard from '../../components/AdminDashboard';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Fetch user details from Firestore
                    const userData = await getUserByEmail(firebaseUser.email || '');
                    if (userData) {
                        setUser(userData);
                    } else {
                        // If auth exists but no db entry (rare edge case), maybe redirect to setup or error
                        console.error('User authenticated but no database entry found');
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                // Not authenticated
                router.push('/login');
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                    <p className="text-zinc-500 text-sm animate-pulse">Initializing Command Center...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect in useEffect
    }

    return <AdminDashboard user={user} />;
}
