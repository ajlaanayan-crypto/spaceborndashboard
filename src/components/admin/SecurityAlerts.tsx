"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AuditLog {
    id: string;
    action: string;
    details: any;
    timestamp: any;
    performedBy: string;
}

export function SecurityAlerts() {
    const [alerts, setAlerts] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                // Simple query without compound index requirement
                const q = query(
                    collection(db, "auditLogs"),
                    orderBy("timestamp", "desc"),
                    limit(10)
                );

                const snapshot = await getDocs(q);
                const allLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));

                // Filter client-side to avoid needing a compound index
                const securityLogs = allLogs.filter(log =>
                    ["LOGIN_FAILED", "USER_ROLE_CHANGE"].includes(log.action)
                );

                setAlerts(securityLogs.slice(0, 5));
            } catch (error) {
                console.error("Error fetching security alerts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, []);

    if (loading) return <div className="text-gray-500 text-sm">Scanning security logs...</div>;
    if (alerts.length === 0) return (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-green-400">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-sm font-medium">System Secure. No recent anomalies.</span>
        </div>
    );

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Security Feed</h3>
            {alerts.map(alert => (
                <div key={alert.id} className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg flex items-start gap-3 hover:bg-red-500/10 transition-colors">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                    <div>
                        <p className="text-white text-sm font-bold">{alert.action.replace("_", " ")}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {alert.action === "LOGIN_FAILED" ? `Attempt for ${alert.details?.email}` : "Sensitive system change detected"}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1 font-mono">
                            {alert.timestamp?.toDate ? formatDistanceToNow(alert.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
