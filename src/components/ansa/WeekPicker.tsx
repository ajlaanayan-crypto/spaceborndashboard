"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";

interface WeekPickerProps {
    onSelect: (monday: Date, sunday: Date, label: string) => void;
    onClose: () => void;
    isDownloading: boolean;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

export function WeekPicker({ onSelect, onClose, isDownloading }: WeekPickerProps) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedMonday, setSelectedMonday] = useState<Date | null>(null);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };
    const prevYear = () => setViewYear(y => y - 1);
    const nextYear = () => setViewYear(y => y + 1);

    // Build calendar grid (weeks in view month)
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startMonday = getMonday(firstDay);

    const weeks: Date[][] = [];
    let cur = new Date(startMonday);
    while (cur <= lastDay || weeks.length < 1) {
        const week: Date[] = [];
        for (let d = 0; d < 7; d++) {
            week.push(new Date(cur));
            cur.setDate(cur.getDate() + 1);
        }
        weeks.push(week);
        if (cur > lastDay && weeks.length >= 4) break;
    }

    const selectedSunday = selectedMonday
        ? new Date(selectedMonday.getFullYear(), selectedMonday.getMonth(), selectedMonday.getDate() + 6, 23, 59, 59, 999)
        : null;

    const isInSelectedWeek = (date: Date) => {
        if (!selectedMonday || !selectedSunday) return false;
        return date >= selectedMonday && date <= selectedSunday;
    };

    const isToday = (date: Date) => isSameDay(date, today);

    const handleWeekClick = (monday: Date) => {
        setSelectedMonday(new Date(monday));
    };

    const handleDownload = () => {
        if (!selectedMonday) return;
        const sunday = new Date(selectedMonday.getFullYear(), selectedMonday.getMonth(), selectedMonday.getDate() + 6, 23, 59, 59, 999);
        const label = `${selectedMonday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} – ${sunday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        onSelect(selectedMonday, sunday, label);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                    <div>
                        <h2 className="text-white font-bold text-lg">Select a Week</h2>
                        <p className="text-gray-400 text-xs">Choose any week to download its report</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Month + Year Navigation */}
                <div className="px-6 py-4 flex items-center justify-between">
                    {/* Year navigation */}
                    <div className="flex items-center gap-1">
                        <button onClick={prevYear} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-white font-bold text-base w-12 text-center">{viewYear}</span>
                        <button onClick={nextYear} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Month navigation */}
                    <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-white font-semibold text-base w-24 text-center">{MONTHS[viewMonth]}</span>
                        <button onClick={nextMonth} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="px-6 pb-4">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-2">
                        {DAYS.map(d => (
                            <div key={d} className="text-center text-[10px] font-bold text-gray-500 uppercase py-1">{d}</div>
                        ))}
                    </div>

                    {/* Week rows */}
                    {weeks.map((week, wi) => {
                        const weekMonday = week[0];
                        const isSelected = selectedMonday && isSameDay(weekMonday, selectedMonday);
                        const hasToday = week.some(d => isToday(d));

                        return (
                            <div
                                key={wi}
                                onClick={() => handleWeekClick(weekMonday)}
                                className={`grid grid-cols-7 mb-1 rounded-xl cursor-pointer transition-all
                                    ${isSelected
                                        ? 'bg-purple-600/30 ring-1 ring-purple-500/60'
                                        : 'hover:bg-white/5'
                                    }`}
                            >
                                {week.map((date, di) => {
                                    const inMonth = date.getMonth() === viewMonth;
                                    const inSelectedWeek = isInSelectedWeek(date);
                                    const todayDay = isToday(date);

                                    return (
                                        <div
                                            key={di}
                                            className={`flex items-center justify-center h-9 text-sm font-medium transition-colors
                                                ${todayDay
                                                    ? 'text-blue-400 font-bold'
                                                    : inMonth
                                                        ? inSelectedWeek ? 'text-white' : 'text-gray-300'
                                                        : 'text-gray-600'
                                                }`}
                                        >
                                            {todayDay && (
                                                <span className="relative flex items-center justify-center">
                                                    <span className="absolute w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/40" />
                                                    <span className="relative">{date.getDate()}</span>
                                                </span>
                                            )}
                                            {!todayDay && date.getDate()}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Selected Week Info + Download */}
                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02]">
                    {selectedMonday ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Selected Week</p>
                                <p className="text-white font-semibold text-sm mt-0.5">
                                    {selectedMonday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {' – '}
                                    {new Date(selectedMonday.getFullYear(), selectedMonday.getMonth(), selectedMonday.getDate() + 6)
                                        .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white rounded-xl transition-all font-semibold text-sm shadow-lg shadow-purple-500/30"
                            >
                                {isDownloading
                                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <Download className="w-4 h-4" />
                                }
                                {isDownloading ? 'Generating...' : 'Download PDF'}
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm text-center">Click on any row to select that week</p>
                    )}
                </div>
            </div>
        </div>
    );
}
