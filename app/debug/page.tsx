'use client';

import { useEffect, useState } from 'react';
import { auth } from '../../lib/firebase';

export default function DebugPage() {
    const [config, setConfig] = useState<any>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        try {
            // Check if env vars are loaded
            const debugConfig = {
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set ✅' : 'Missing ❌',
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'Set ✅' : 'Missing ❌',
            };
            setConfig(debugConfig);

            console.log('Firebase Config:', debugConfig);
            console.log('Auth Instance:', auth);

        } catch (err: any) {
            setError(err.message);
        }
    }, []);

    return (
        <div className="p-8 text-white min-h-screen bg-slate-900">
            <h1 className="text-2xl font-bold mb-4">Firebase Debug Info</h1>

            {error && (
                <div className="bg-red-500/20 border border-red-500 p-4 rounded mb-4">
                    Error: {error}
                </div>
            )}

            <pre className="bg-slate-800 p-4 rounded overflow-auto">
                {JSON.stringify(config, null, 2)}
            </pre>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-2">Common Fixes:</h2>
                <ul className="list-disc ml-5 space-y-2 text-gray-300">
                    <li>Enable <strong>Email/Password</strong> provider in Firebase Console &gt; Authentication</li>
                    <li>Check if API Key has restrictions in Google Cloud Console</li>
                    <li>Verify <strong>authDomain</strong> matches your project exactly</li>
                </ul>
            </div>
        </div>
    );
}
