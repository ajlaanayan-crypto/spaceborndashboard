import { collection, getDocs, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ActivityData {
    date: string; // YYYY-MM-DD
    count: number;
    level: 0 | 1 | 2 | 3 | 4; // 0=none, 4=high
}

export interface DashboardStats {
    totalUsers: number;
    activeProjects: number; // Active tasks
    pendingReviews: number; // Tasks in 'review'
    performance: number; // Completion rate %
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    // Parallel fetch for efficiency
    const [usersSnap, tasksSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "tasks"))
    ]);

    const totalUsers = usersSnap.size;
    const tasks = tasksSnap.docs.map(d => d.data());

    const activeProjects = tasks.filter(t => t.status === 'in_progress').length;
    const pendingReviews = tasks.filter(t => t.status === 'review').length;

    const completed = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const performance = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    return { totalUsers, activeProjects, pendingReviews, performance };
};

export const getActivityHeatmap = async (): Promise<ActivityData[]> => {
    // Aggregate data from audit logs and task creation
    // For now, we'll fetch last 30 days of audit logs to simulate activity
    // In a real app, you might want a dedicated 'daily_stats' collection incremented by cloud functions

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
        collection(db, "auditLogs"),
        where("timestamp", ">=", thirtyDaysAgo),
        orderBy("timestamp", "asc")
    );

    const snapshot = await getDocs(q);

    const activityMap = new Map<string, number>();

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.timestamp) {
            const date = data.timestamp.toDate().toISOString().split('T')[0];
            activityMap.set(date, (activityMap.get(date) || 0) + 1);
        }
    });

    // Fill in missing days
    const result: ActivityData[] = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const count = activityMap.get(dateStr) || 0;

        // Determine level
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (count > 0) level = 1;
        if (count > 5) level = 2;
        if (count > 10) level = 3;
        if (count > 20) level = 4;

        result.push({ date: dateStr, count, level });
    }

    return result.reverse(); // Oldest to newest
};
