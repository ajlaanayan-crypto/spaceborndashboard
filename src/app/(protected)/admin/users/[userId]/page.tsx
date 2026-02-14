"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserData } from "@/services/userService";
import { getUserTasks, TaskData } from "@/services/taskService";
import { getReportsByUser, ReportData, getFeedbackForUser, FeedbackData } from "@/services/reportService";
import { updateUserName } from "@/services/userService";
import {
    ArrowLeft,
    Loader2,
    Mail,
    Shield,
    Briefcase,
    CheckCircle,
    Clock,
    AlertCircle,
    TrendingUp,
    Calendar,
    MessageSquare,
    Star,
    Edit2,
    Check,
    X,
} from "lucide-react";

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    const [user, setUser] = useState<UserData | null>(null);
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [reports, setReports] = useState<ReportData[]>([]);
    const [feedback, setFeedback] = useState<FeedbackData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState("");
    const [updatingName, setUpdatingName] = useState(false);

    useEffect(() => {
        if (userId) fetchUserData();
    }, [userId]);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            // Fetch user doc
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
                setUser({ uid: userDoc.id, ...userDoc.data() } as UserData);
            }

            // Fetch tasks, reports, feedback in parallel
            const [userTasks, userReports, userFeedback] = await Promise.all([
                getUserTasks(userId),
                getReportsByUser(userId),
                getFeedbackForUser(userId),
            ]);

            setTasks(userTasks);
            setReports(userReports);
            setFeedback(userFeedback);
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateName = async () => {
        if (!userId || !newName.trim()) return;

        setUpdatingName(true);
        try {
            await updateUserName(userId, newName.trim());
            setIsEditingName(false);
            // Refresh user data
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
                setUser({ uid: userDoc.id, ...userDoc.data() } as UserData);
            }
        } catch (error) {
            console.error("Error updating name:", error);
            alert("Failed to update name");
        } finally {
            setUpdatingName(false);
        }
    };

    const startEditing = () => {
        setNewName(user?.name || "");
        setIsEditingName(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <GlassCard className="text-center py-12">
                <p className="text-gray-400">User not found.</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 text-blue-400 hover:text-blue-300 transition-colors"
                >
                    ← Go Back
                </button>
            </GlassCard>
        );
    }

    // Calculate stats
    const completedTasks = tasks.filter((t) => t.status === "completed");
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
    const pendingTasks = tasks.filter((t) => t.status === "pending");
    const reviewTasks = tasks.filter((t) => t.status === "review");
    const completionRate =
        tasks.length > 0
            ? Math.round((completedTasks.length / tasks.length) * 100)
            : 0;

    const roleColors: Record<string, string> = {
        admin: "bg-red-500/20 text-red-400",
        core_employee: "bg-blue-500/20 text-blue-400",
        normal_employee: "bg-green-500/20 text-green-400",
        intern: "bg-purple-500/20 text-purple-400",
    };

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Users
            </button>

            {/* User Header */}
            <GlassCard className="bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <UserAvatar
                        name={user.name}
                        photoURL={user.photoURL}
                        size="large"
                    />
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            {isEditingName ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xl font-bold focus:outline-none focus:border-blue-500"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleUpdateName}
                                        disabled={updatingName}
                                        className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsEditingName(false)}
                                        className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl font-bold text-white">
                                        {user.name}
                                    </h1>
                                    <button
                                        onClick={startEditing}
                                        className="text-gray-400 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="flex items-center gap-1 text-gray-400">
                                <Mail className="w-4 h-4" />
                                {user.email}
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role || ""] || "bg-gray-500/20 text-gray-400"
                                    }`}
                            >
                                {user.role === "admin" && (
                                    <Shield className="w-3 h-3 inline mr-1" />
                                )}
                                {user.role ? user.role.replace("_", " ") : "No Role"}
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded text-xs ${user.status === "active"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400"
                                    }`}
                            >
                                {user.status}
                            </span>
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-4xl font-bold text-white">
                            {completionRate}%
                        </p>
                        <p className="text-xs text-gray-400">Completion Rate</p>
                    </div>
                </div>
            </GlassCard>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                        <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Total Tasks</p>
                        <p className="text-xl font-bold text-white">
                            {tasks.length}
                        </p>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Completed</p>
                        <p className="text-xl font-bold text-white">
                            {completedTasks.length}
                        </p>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">In Progress</p>
                        <p className="text-xl font-bold text-white">
                            {inProgressTasks.length}
                        </p>
                    </div>
                </GlassCard>

                <GlassCard className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Pending</p>
                        <p className="text-xl font-bold text-white">
                            {pendingTasks.length}
                        </p>
                    </div>
                </GlassCard>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task Breakdown */}
                <GlassCard>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-400" />
                        Task Breakdown
                    </h3>
                    {tasks.length === 0 ? (
                        <p className="text-gray-500 text-center py-6 italic">
                            No tasks assigned
                        </p>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="p-3 bg-white/5 rounded-lg border-l-2 hover:bg-white/10 transition-colors"
                                    style={{
                                        borderLeftColor:
                                            task.status === "completed"
                                                ? "#22c55e"
                                                : task.status === "in_progress"
                                                    ? "#3b82f6"
                                                    : task.status === "review"
                                                        ? "#a855f7"
                                                        : "#6b7280",
                                    }}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-white font-medium text-sm">
                                            {task.title}
                                        </h4>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded capitalize ${task.status === "completed"
                                                ? "bg-green-500/20 text-green-400"
                                                : task.status === "in_progress"
                                                    ? "bg-blue-500/20 text-blue-400"
                                                    : task.status === "review"
                                                        ? "bg-purple-500/20 text-purple-400"
                                                        : "bg-gray-500/20 text-gray-400"
                                                }`}
                                        >
                                            {task.status?.replace("_", " ") || "Pending"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 line-clamp-1">
                                        {task.description}
                                    </p>
                                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {task.deadline}
                                        </span>
                                        <span
                                            className={`px-1.5 py-0.5 rounded ${task.priority === "high"
                                                ? "bg-red-500/20 text-red-400"
                                                : task.priority === "medium"
                                                    ? "bg-yellow-500/20 text-yellow-400"
                                                    : "bg-blue-500/20 text-blue-400"
                                                }`}
                                        >
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>

                {/* Performance & Feedback */}
                <div className="space-y-6">
                    {/* Performance Reports */}
                    <GlassCard>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            Performance Reports
                        </h3>
                        {reports.length === 0 ? (
                            <p className="text-gray-500 text-center py-6 italic">
                                No reports available
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {reports.slice(0, 5).map((report) => (
                                    <div
                                        key={report.id}
                                        className="p-3 bg-white/5 rounded-lg"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-white font-medium text-sm">
                                                {report.period}
                                            </span>
                                            <span className="text-lg font-bold text-green-400">
                                                {report.performanceScore}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-green-500 to-blue-500 h-full rounded-full"
                                                style={{
                                                    width: `${report.performanceScore}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                                            <span>
                                                Tasks: {report.tasksCompleted}/
                                                {report.tasksAssigned}
                                            </span>
                                            {report.remarks && (
                                                <span className="text-gray-400 italic truncate max-w-[200px]">
                                                    {report.remarks}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>

                    {/* Feedback */}
                    <GlassCard>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-yellow-400" />
                            Feedback
                        </h3>
                        {feedback.length === 0 ? (
                            <p className="text-gray-500 text-center py-6 italic">
                                No feedback yet
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {feedback.slice(0, 5).map((fb) => (
                                    <div
                                        key={fb.id}
                                        className="p-3 bg-white/5 rounded-lg"
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-lg">
                                                {fb.type === "praise"
                                                    ? "⭐"
                                                    : fb.type === "improvement"
                                                        ? "📈"
                                                        : "💬"}
                                            </span>
                                            <div>
                                                <p className="text-white text-sm">
                                                    {fb.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    By {fb.createdByName || "Admin"} •{" "}
                                                    {fb.type}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
