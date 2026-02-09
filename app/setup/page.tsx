'use client';

import { useEffect, useState } from 'react';
import { createAdminUser } from '../../lib/createAdmin';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
    const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
    const router = useRouter();

    const handleCreateAdmin = async () => {
        setStatus('creating');
        setMessage('Creating admin user...');

        try {
            const result = await createAdminUser();
            setStatus('success');
            setMessage('Admin user created successfully!');
            setCredentials(result);
        } catch (error: any) {
            setStatus('error');
            if (error.message?.includes('email-already-in-use')) {
                setMessage('Admin user already exists! You can login with: admin@spaceborn.io');
                setCredentials({ email: 'admin@spaceborn.io', password: 'Admin@123456' });
            } else {
                setMessage(`Error: ${error.message}`);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
                <h1 className="text-3xl font-bold text-white mb-2">Firebase Setup</h1>
                <p className="text-gray-300 mb-6">Create your admin user to get started</p>

                {status === 'idle' && (
                    <button
                        onClick={handleCreateAdmin}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Create Admin User
                    </button>
                )}

                {status === 'creating' && (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-white">{message}</p>
                    </div>
                )}

                {(status === 'success' || status === 'error') && (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-lg ${status === 'success' ? 'bg-green-500/20 border border-green-500/50' : 'bg-yellow-500/20 border border-yellow-500/50'}`}>
                            <p className={`font-semibold ${status === 'success' ? 'text-green-300' : 'text-yellow-300'}`}>
                                {status === 'success' ? '✅ Success!' : '⚠️ Note'}
                            </p>
                            <p className="text-white mt-1">{message}</p>
                        </div>

                        {credentials && (
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                                <p className="text-gray-300 text-sm mb-2">Login Credentials:</p>
                                <div className="space-y-1 font-mono text-sm">
                                    <p className="text-white">
                                        <span className="text-gray-400">Email:</span> {credentials.email}
                                    </p>
                                    <p className="text-white">
                                        <span className="text-gray-400">Password:</span> {credentials.password}
                                    </p>
                                    <p className="text-white">
                                        <span className="text-gray-400">Role:</span> admin
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => router.push('/login')}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            Go to Login
                        </button>
                    </div>
                )}

                <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-gray-400 text-sm text-center">
                        This is a one-time setup page. After creating the admin user, you can access the login page.
                    </p>
                </div>
            </div>
        </div>
    );
}
