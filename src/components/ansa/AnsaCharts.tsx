"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';
import { AnsaTopic } from '@/services/ansaService';
import { TaskData } from '@/services/taskService';
import { Calendar, Zap, Users } from 'lucide-react';

interface AnsaChartsProps {
    topics?: AnsaTopic[];
    tasks?: TaskData[];
    groups?: any[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
const STATUS_COLORS = {
    completed: '#22c55e', // green-500
    review: '#a855f7', // purple-500
    in_progress: '#3b82f6', // blue-500
    pending: '#6b7280', // gray-500
};

export function WeeklyTrendsChart({ tasks = [] }: AnsaChartsProps) {
    const weekData: { [key: string]: { name: string, created: number, completed: number, sortKey: number } } = {};

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - (i * 7));
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);

        const label = `${monday.getMonth() + 1}/${monday.getDate()}`;
        const key = monday.getTime();
        weekData[label] = { name: label, created: 0, completed: 0, sortKey: key };
    }

    tasks.forEach(task => {
        if (!task.createdAt) return;
        const d = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const label = `${monday.getMonth() + 1}/${monday.getDate()}`;
        if (weekData[label]) {
            weekData[label].created++;
            if (task.status === 'completed') {
                weekData[label].completed++;
            }
        }
    });

    const data = Object.values(weekData).sort((a, b) => a.sortKey - b.sortKey);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="created" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCreated)" />
                <Area type="monotone" dataKey="completed" stroke="#22c55e" fillOpacity={1} fill="url(#colorCompleted)" />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function PriorityEfficiencyChart({ tasks = [] }: AnsaChartsProps) {
    const priorities = ['high', 'medium', 'low'];
    const data = priorities.map(p => {
        const pTasks = tasks.filter(t => t.priority === p);
        const completed = pTasks.filter(t => t.status === 'completed').length;
        const total = pTasks.length;
        const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

        return {
            priority: p.toUpperCase(),
            rate,
            total,
            color: p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#3b82f6'
        };
    });

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="priority" type="category" tick={{ fill: '#9ca3af', fontSize: 12 }} width={70} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={30}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export function GroupProductivityChart({ tasks = [], groups = [] }: AnsaChartsProps) {
    const data = groups.map((g, index) => {
        const groupTasks = tasks.filter(t => t.groupId === g.id);
        const completed = groupTasks.filter(t => t.status === 'completed').length;
        const total = groupTasks.length;

        return {
            name: g.name,
            Assigned: total,
            Completed: completed,
            color: COLORS[index % COLORS.length]
        };
    }).filter(d => d.Assigned > 0);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function OverallProgressPieChart({ topics = [], tasks = [] }: AnsaChartsProps) {
    let data = [];

    if (tasks.length > 0) {
        data = [
            { name: 'Verified', value: tasks.filter(t => t.status === 'completed').length, color: STATUS_COLORS.completed },
            { name: 'In Review', value: tasks.filter(t => t.status === 'review').length, color: STATUS_COLORS.review },
            { name: 'Active', value: tasks.filter(t => t.status === 'in_progress' || t.status === 'pending').length, color: STATUS_COLORS.in_progress },
        ].filter(d => d.value > 0);
    } else {
        data = [
            { name: 'Completed', value: topics.filter(t => t.status === 'completed').length, color: STATUS_COLORS.completed },
            { name: 'In Progress', value: topics.filter(t => t.status === 'in_progress').length, color: STATUS_COLORS.in_progress },
            { name: 'Pending', value: topics.filter(t => t.status === 'pending').length, color: STATUS_COLORS.pending },
        ].filter(d => d.value > 0);
    }

    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} itemStyle={{ color: '#f3f4f6' }} />
                <Legend verticalAlign="bottom" height={36} />
            </PieChart>
        </ResponsiveContainer>
    );
}

export function TopicProgressChart({ topics = [] }: AnsaChartsProps) {
    const data = topics.map(t => ({
        name: t.title.length > 15 ? t.title.substring(0, 15) + '...' : t.title,
        progress: t.progress,
        fullTitle: t.title
    }));

    if (data.length === 0) return null;

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#f3f4f6' }} />
                <Bar dataKey="progress" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.progress === 100 ? STATUS_COLORS.completed : STATUS_COLORS.in_progress} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export function DailyTrendsChart({ tasks = [] }: AnsaChartsProps) {
    const dailyData: { [key: string]: { name: string, created: number, completed: number, sortKey: number } } = {};

    // Last 14 days
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        const key = d.setHours(0, 0, 0, 0);
        dailyData[label] = { name: label, created: 0, completed: 0, sortKey: key };
    }

    tasks.forEach(task => {
        if (!task.createdAt) return;
        const d = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        if (dailyData[label]) {
            dailyData[label].created++;
            if (task.status === 'completed') {
                dailyData[label].completed++;
            }
        }
    });

    const data = Object.values(dailyData).sort((a, b) => a.sortKey - b.sortKey);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}

export function PriorityDistributionPieChart({ tasks = [] }: AnsaChartsProps) {
    const priorities = ['high', 'medium', 'low'];
    const data = priorities.map(p => ({
        name: p.toUpperCase(),
        value: tasks.filter(t => t.priority === p).length,
        color: p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#3b82f6'
    })).filter(d => d.value > 0);

    return (
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} itemStyle={{ color: '#f3f4f6' }} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

export function StatusDistributionPieChart({ tasks = [] }: AnsaChartsProps) {
    const data = [
        { name: 'Verified', value: tasks.filter(t => t.status === 'completed').length, color: STATUS_COLORS.completed },
        { name: 'In Review', value: tasks.filter(t => t.status === 'review').length, color: STATUS_COLORS.review },
        { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: STATUS_COLORS.in_progress },
        { name: 'Pending', value: tasks.filter(t => t.status === 'pending').length, color: STATUS_COLORS.pending },
    ].filter(d => d.value > 0);

    return (
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} itemStyle={{ color: '#f3f4f6' }} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

export function TeamWorkloadChart({ topics = [], tasks = [] }: AnsaChartsProps) {
    const groupCounts: { [key: string]: number } = {};

    if (tasks.length > 0) {
        tasks.forEach(t => {
            const groupName = t.groupName || 'Individual';
            groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;
        });
    } else {
        topics.forEach(t => {
            if (t.assignedGroupNames && t.assignedGroupNames.length > 0) {
                t.assignedGroupNames.forEach(groupName => {
                    groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;
                });
            } else {
                groupCounts['Unassigned'] = (groupCounts['Unassigned'] || 0) + 1;
            }
        });
    }

    const data = Object.keys(groupCounts).map((group, index) => ({
        name: group,
        count: groupCounts[group],
        color: COLORS[index % COLORS.length]
    }));

    if (data.length === 0) return null;

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} itemStyle={{ color: '#f3f4f6' }} />
                <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={40}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
