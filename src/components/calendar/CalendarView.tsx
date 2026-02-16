"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, Video, List, X, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { TaskData } from "@/services/taskService";
import { MeetingData } from "@/services/meetingService";
import Link from "next/link";

export type CalendarEvent = {
    id: string;
    title: string;
    date: Date;
    type: 'task' | 'meeting';
    status?: string; // for tasks
    link?: string;
    description?: string;
    meetingLink?: string; // for meetings
};

interface CalendarViewProps {
    events: CalendarEvent[];
}

export function CalendarView({ events }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(event.date, day));
    };

    const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
            {/* Calendar Grid */}
            <GlassCard className="flex-1 flex flex-col p-4 relative overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">
                        {format(currentMonth, "MMMM yyyy")}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Week Days */}
                <div className="grid grid-cols-7 mb-2 text-center text-gray-400 font-medium text-sm">
                    {weekDays.map(day => (
                        <div key={day} className="py-2">{day}</div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-2">
                    {days.map((day, i) => {
                        const dayEvents = getEventsForDay(day);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isDayToday = isToday(day);

                        return (
                            <div
                                key={i}
                                onClick={() => setSelectedDate(day)}
                                className={`
                                    relative p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-start justify-start
                                    ${!isCurrentMonth ? "opacity-30 border-transparent" : "border-white/5 bg-white/5 hover:bg-white/10"}
                                    ${isSelected ? "ring-2 ring-blue-500 bg-blue-500/10" : ""}
                                    ${isDayToday ? "border-blue-500/50" : ""}
                                `}
                            >
                                <span className={`text-sm font-medium ${isDayToday ? "text-blue-400" : "text-gray-300"}`}>
                                    {format(day, dateFormat)}
                                </span>

                                {/* Event Dots */}
                                <div className="flex flex-wrap content-end gap-1 mt-auto w-full">
                                    {dayEvents.slice(0, 4).map((event, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-2 h-2 rounded-full ${event.type === 'meeting' ? 'bg-purple-500' :
                                                event.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                                                }`}
                                            title={event.title}
                                        />
                                    ))}
                                    {dayEvents.length > 4 && (
                                        <span className="text-[8px] text-gray-400 leading-none self-center">+{dayEvents.length - 4}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Legend */}
                <div className="mt-4 flex gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Meeting</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Pending Task</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Completed Task</div>
                </div>
            </GlassCard>

            {/* Side Panel: Selected Date Details */}
            <div className={`
                fixed inset-y-0 right-0 w-80 bg-[#161b22] border-l border-white/10 p-6 z-50 transform transition-transform duration-300 shadow-2xl
                lg:relative lg:transform-none lg:w-96 lg:bg-transparent lg:border-none lg:shadow-none lg:p-0
                ${selectedDate ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
            `}>
                <GlassCard className="h-full flex flex-col relative">
                    <button
                        onClick={() => setSelectedDate(null)}
                        className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                        {selectedDate ? format(selectedDate, "EEEE, MMMM do") : "Select a date"}
                    </h3>

                    {!selectedDate ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50">
                            <Clock className="w-16 h-16 mb-4" />
                            <p className="text-center">Click on a date to view <br /> tasks and meetings</p>
                        </div>
                    ) : selectedDayEvents.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <p>No events for this day.</p>
                            <button
                                className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
                                onClick={() => {/* Handler to add event if needed in future */ }}
                            >
                                {/* + Add Event (Future) */}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
                            {selectedDayEvents.map(event => (
                                <div key={event.id} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {event.type === 'meeting' ? (
                                                <Video className="w-4 h-4 text-purple-400" />
                                            ) : (
                                                <List className="w-4 h-4 text-yellow-400" />
                                            )}
                                            <span className={`text-xs font-bold uppercase ${event.type === 'meeting' ? 'text-purple-400' : 'text-yellow-400'
                                                }`}>
                                                {event.type}
                                            </span>
                                        </div>
                                        {event.date && (
                                            <span className="text-xs text-gray-400">
                                                {format(event.date, "h:mm a")}
                                            </span>
                                        )}
                                    </div>

                                    <h4 className="text-white font-medium mb-1">{event.title}</h4>
                                    {event.description && (
                                        <p className="text-sm text-gray-400 line-clamp-2 mb-2">{event.description}</p>
                                    )}

                                    {event.link && (
                                        <Link href={event.link} className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1">
                                            View Details <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    )}

                                    {event.meetingLink && (
                                        <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs bg-purple-500/20 text-purple-300 py-1.5 px-3 rounded text-center hover:bg-purple-500/30 transition-colors">
                                            Join Meeting
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
}
