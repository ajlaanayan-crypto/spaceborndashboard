"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { AnshTopic } from '@/services/anshService';
import { GlassCard } from '@/components/ui/GlassCard';

interface AnshChartsProps {
    topics: AnshTopic[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const STATUS_COLORS = {
    completed: '#22c55e', // green-500
    in_progress: '#3b82f6', // blue-500
    pending: '#6b7280', // gray-500
};

export function OverallProgressPieChart({ topics }: AnshChartsProps) {
    const data = [
        { name: 'Completed', value: topics.filter(t => t.status === 'completed').length, color: STATUS_COLORS.completed },
        { name: 'In Progress', value: topics.filter(t => t.status === 'in_progress').length, color: STATUS_COLORS.in_progress },
        { name: 'Pending', value: topics.filter(t => t.status === 'pending').length, color: STATUS_COLORS.pending },
    ].filter(d => d.value > 0);

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
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                    itemStyle={{ color: '#f3f4f6' }}
                />
                <Legend verticalAlign="bottom" height={36} />
            </PieChart>
        </ResponsiveContainer>
    );
}

export function TopicProgressChart({ topics }: AnshChartsProps) {
    const data = topics.map(t => ({
        name: t.title.length > 15 ? t.title.substring(0, 15) + '...' : t.title,
        progress: t.progress,
        fullTitle: t.title
    }));

    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
                No topic data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                    labelStyle={{ color: '#f3f4f6' }}
                    formatter={(value: number) => [`${value}%`, 'Progress']}
                />
                <Bar dataKey="progress" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.progress === 100 ? STATUS_COLORS.completed : STATUS_COLORS.in_progress} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export function TeamWorkloadChart({ topics }: AnshChartsProps) {
    // Aggregate topics by assigned group
    const groupCounts: { [key: string]: number } = {};

    topics.forEach(t => {
        if (t.assignedGroupNames && t.assignedGroupNames.length > 0) {
            t.assignedGroupNames.forEach(groupName => {
                groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;
            });
        } else {
            groupCounts['Unassigned'] = (groupCounts['Unassigned'] || 0) + 1;
        }
    });

    const data = Object.keys(groupCounts).map((group, index) => ({
        name: group,
        topics: groupCounts[group],
        color: COLORS[index % COLORS.length]
    }));

    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
                No team data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} />
                <YAxis tick={{ fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                    itemStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="topics" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={40}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
