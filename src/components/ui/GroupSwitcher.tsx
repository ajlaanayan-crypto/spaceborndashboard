"use client";

import { useAuth } from "@/context/AuthContext";
import { ChevronDown, Users, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function GroupSwitcher() {
    const { userGroups, activeGroupId, setActiveGroupId } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Only show if user has more than 1 group
    if (userGroups.length <= 1) return null;

    const activeGroup = userGroups.find(g => g.id === activeGroupId);

    return (
        <div className="px-3 py-2 border-b border-white/10 relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group/btn"
            >
                <div className="min-w-[24px] flex items-center justify-center">
                    <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5" />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-xs text-gray-400 font-medium truncate">Active Group</p>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-white font-semibold truncate max-w-[120px]">
                            {activeGroup?.name || "Select Group"}
                        </p>
                        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-3 right-3 top-full mt-1 bg-[#1A1F2B] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto">
                        {userGroups.map((group) => (
                            <button
                                key={group.id}
                                onClick={() => {
                                    setActiveGroupId(group.id!);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-white/5 transition-colors ${activeGroupId === group.id ? "text-blue-400 bg-blue-500/10" : "text-gray-300"
                                    }`}
                            >
                                <span className="truncate">{group.name}</span>
                                {activeGroupId === group.id && <Check className="w-3 h-3" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
