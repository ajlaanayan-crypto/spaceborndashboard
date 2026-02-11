"use client";

import { motion } from "framer-motion";
import { ActivityData } from "@/services/analyticsService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Assume exist or create basic one

export const ActivityHeatmap = ({ data }: { data: ActivityData[] }) => {
    // 7 rows (days of week), ~5 cols (weeks) 
    // Simplified: Just a grid of the last 30 days

    return (
        <div className="flex gap-1 flex-wrap max-w-full">
            {data.map((day, i) => (
                <TooltipProvider key={day.date}>
                    <Tooltip>
                        <TooltipTrigger>
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.02 }}
                                className={`w-3 h-3 rounded-sm ${day.level === 0 ? 'bg-white/5' :
                                        day.level === 1 ? 'bg-blue-900/40' :
                                            day.level === 2 ? 'bg-blue-700/60' :
                                                day.level === 3 ? 'bg-blue-500' :
                                                    'bg-blue-300'
                                    }`}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{day.date}: {day.count} activities</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
        </div>
    );
};

export const TrendChart = ({ data, color = "#3b82f6" }: { data: number[], color?: string }) => {
    const max = Math.max(...data, 1);
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (val / max) * 100;
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="w-full h-16 relative">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    d={`M0,100 L${points} L100,100 Z`}
                    fill={`url(#gradient-${color})`}
                    opacity="0.2"
                />
                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    d={`M${points}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                />
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};
