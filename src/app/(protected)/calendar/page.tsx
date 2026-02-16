"use client";

import { useEffect, useState } from "react";
import { CalendarView, CalendarEvent } from "@/components/calendar/CalendarView";
import { getUserTasks, TaskData } from "@/services/taskService";
import { getUserMeetings, MeetingData } from "@/services/meetingService";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function CalendarPage() {
    const { user, loading: authLoading } = useAuth();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchCalendarData();
        }
    }, [user]);

    const fetchCalendarData = async () => {
        setLoading(true);
        try {
            if (!user) return;

            // Fetch Tasks & Meetings in parallel
            const [tasks, meetings] = await Promise.all([
                getUserTasks(user.uid),
                getUserMeetings(user.uid)
            ]);

            // Transform Tasks to CalendarEvents
            const taskEvents: CalendarEvent[] = tasks
                .filter(t => t.deadline) // Only tasks with deadlines
                .map(t => ({
                    id: t.id!,
                    title: `Task: ${t.title}`,
                    date: new Date(t.deadline),
                    type: 'task',
                    status: t.status,
                    link: t.type === 'group' ? '/employee/tasks' : '/employee/tasks', // Simplification, could be dynamic
                    description: t.description
                }));

            // Transform Meetings to CalendarEvents
            const meetingEvents: CalendarEvent[] = meetings.map(m => ({
                id: m.id!,
                title: `Meeting: ${m.title}`,
                date: m.scheduledAt?.toDate ? m.scheduledAt.toDate() : new Date(m.scheduledAt),
                type: 'meeting',
                description: m.description,
                meetingLink: m.meetingLink
            }));

            setEvents([...taskEvents, ...meetingEvents]);
        } catch (error) {
            console.error("Failed to fetch calendar data", error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Interactive Calendar</h1>
            <p className="text-gray-400">View your tasks and upcoming meetings.</p>
            <CalendarView events={events} />
        </div>
    );
}
