"use client";

import { TaskForm } from "@/components/tasks/TaskForm";
import { createTask } from "@/services/taskService";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function CreateTaskPage() {
    const { user } = useAuth();
    const router = useRouter();

    const handleCreateTask = async (taskData: any) => {
        if (!user) return;
        await createTask({
            ...taskData,
            assignedBy: user.uid,
        });
        router.push("/core");
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">New Directive</h1>
                <p className="text-gray-400">Assign a new objective to personnel.</p>
            </div>

            <TaskForm
                onSubmit={handleCreateTask}
                creatorId={user?.uid || ""}
                onCancel={() => router.back()}
            />
        </div>
    );
}
