"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserRole } from "@/context/AuthContext";
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    Briefcase,
    LogOut,
    Shield,
    UserPlus,
    DollarSign,
    Mail,
    Calendar,
    MessageCircle,
    ChevronDown,
    ChevronRight,
    User
} from "lucide-react";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { endSession } from "@/services/sessionService";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { GroupSwitcher } from "./GroupSwitcher";
import { useState, useEffect } from "react";

type LinkItem = { href: string; label: string; icon: any };
type SidebarGroup = { title: string; items: LinkItem[] };

export function Sidebar() {
    const pathname = usePathname();
    const { user, role, userGroups } = useAuth();
    const router = useRouter();
    const [expandedGroups, setExpandedGroups] = useState<string[]>(["Overview", "Management", "Work", "Communication", "Resources"]); // Default expand all or specific ones

    const toggleGroup = (groupTitle: string) => {
        setExpandedGroups(prev =>
            prev.includes(groupTitle)
                ? prev.filter(t => t !== groupTitle)
                : [...prev, groupTitle]
        );
    };

    const handleSignOut = async () => {
        const sessionId = localStorage.getItem("spaceborn_session_id");
        if (sessionId && auth.currentUser) {
            await endSession(sessionId, auth.currentUser.uid);
            localStorage.removeItem("spaceborn_session_id");
        }
        await auth.signOut();
        router.push("/");
    };

    const getLinks = (role: UserRole): (LinkItem | SidebarGroup)[] => {
        // Admin gets grouped routes
        if (role === "admin") {
            const adminGroups: SidebarGroup[] = [
                {
                    title: "Overview",
                    items: [
                        { href: "/admin", label: "Overview", icon: LayoutDashboard },
                        { href: "/admin/ansh", label: "Ansh Tracker", icon: Shield },
                        { href: "/calendar", label: "Calendar", icon: Calendar },
                    ]
                },
                {
                    title: "Management",
                    items: [
                        { href: "/admin/users", label: "Users", icon: Users },
                        { href: "/admin/groups", label: "Groups", icon: Users },
                        { href: "/admin/finance", label: "Finance", icon: DollarSign },
                        { href: "/admin/resources", label: "Resources", icon: UserPlus },
                    ]
                },
                {
                    title: "Work",
                    items: [
                        { href: "/admin/tasks", label: "All Tasks", icon: ClipboardList },
                        { href: "/core/tasks", label: "Task Creation", icon: Briefcase },
                        { href: "/admin/meetings", label: "Meetings", icon: ClipboardList },
                    ]
                },
                {
                    title: "Communication",
                    items: [
                        { href: "/chat", label: "Team Chat", icon: MessageCircle },
                        { href: "/admin/messages", label: "Broadcasts", icon: Mail },
                    ]
                }
            ];

            if (userGroups && userGroups.length > 0) {
                // Add "My Group" to Overview or its own
                adminGroups[0].items.push({ href: "/group", label: "My Group", icon: Users });
            }

            return adminGroups;
        }

        // Core Employee: own + employee + intern routes
        if (role === "core_employee") {
            return [
                { href: "/core", label: "Dashboard", icon: LayoutDashboard },
                { href: "/chat", label: "Team Chat", icon: MessageCircle },
                { href: "/core/tasks", label: "Task Management", icon: Briefcase },
                { href: "/core/weekly", label: "Weekly Planning", icon: ClipboardList },
                { href: "/calendar", label: "Calendar", icon: Calendar },
                { href: "/group", label: "My Group", icon: Users },
                { href: "/core/team", label: "Team", icon: Users },
                { href: "/core/resources", label: "Manage Resources", icon: UserPlus },
                { href: "/employee/tasks", label: "Employee Tasks", icon: ClipboardList },
            ];
        }

        // Normal Employee: Full featured access
        if (role === "normal_employee") {
            return [
                { href: "/employee", label: "My Workspace", icon: LayoutDashboard },
                { href: "/chat", label: "Team Chat", icon: MessageCircle },
                { href: "/employee/tasks", label: "My Tasks", icon: ClipboardList },
                { href: "/calendar", label: "Calendar", icon: Calendar },
                { href: "/group", label: "My Group", icon: Users },
                { href: "/intern/resources", label: "Resources", icon: UserPlus },
            ];
        }

        // Intern: only own routes
        if (role === "intern") {
            return [
                { href: "/intern", label: "Dashboard", icon: LayoutDashboard },
                { href: "/chat", label: "Team Chat", icon: MessageCircle },
                { href: "/group", label: "My Group", icon: Users },
                { href: "/intern/tasks", label: "My Tasks", icon: ClipboardList },
                { href: "/calendar", label: "Calendar", icon: Calendar },
                { href: "/intern/performance", label: "Performance", icon: Shield },
                { href: "/intern/resources", label: "Resources", icon: UserPlus },
            ];
        }

        return [];
    };

    const links = getLinks(role);

    // Flatten links for mobile menu
    const mobileLinks: LinkItem[] = links.flatMap(item => {
        if ('items' in item) return item.items;
        return item;
    });

    const renderLink = (link: LinkItem) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
            <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap mb-1 ${isActive
                    ? "bg-white/10 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
            >
                <Icon className={`w-5 h-5 min-w-[20px] transition-transform ${isActive ? 'text-white' : ''}`} />
                <span className="font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                    {link.label}
                </span>
            </Link>
        );
    };

    return (
        <>
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden md:flex w-20 hover:w-64 h-screen bg-black/40 border-r border-white/10 backdrop-blur-xl flex-col fixed left-0 top-0 z-50 transition-all duration-300 group overflow-hidden">

                <div className="p-6 border-b border-white/10 flex items-center gap-4 overflow-hidden whitespace-nowrap">
                    <div className="min-w-[48px]"> {/* Fixed width for logo icon to prevent jumping */}
                        <Image
                            src="/images/logo.jpg"
                            alt="SPACE BORN"
                            width={48}
                            height={48}
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-xl font-extrabold tracking-tight font-montserrat bg-gradient-to-b from-gray-200 to-gray-400 bg-clip-text text-transparent">
                            SPACE BORN
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${role === 'admin' ? 'bg-red-500' : role === 'core_employee' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                                {role?.replace("_", " ")}
                            </p>
                        </div>
                    </div>
                </div>

                <GroupSwitcher />

                <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
                    {links.map((item, index) => {
                        if ('items' in item) {
                            // It's a group
                            const isExpanded = expandedGroups.includes(item.title);
                            return (
                                <div key={index} className="mb-2">
                                    <button
                                        onClick={() => toggleGroup(item.title)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors group-hover:flex hidden"
                                    >
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 truncate">
                                            {item.title}
                                        </span>
                                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    </button>

                                    {/* Separator for collapsed state */}
                                    <div className="border-t border-white/5 my-2 mx-2 group-hover:hidden"></div>

                                    <div className={isExpanded ? 'block' : 'hidden'}>
                                        {/* In collapsed sidebar, we just show all icons. In expanded, we respect collapse state */}
                                        <div className="hidden group-hover:block pl-2 border-l border-white/5 ml-2">
                                            {item.items.map(link => renderLink(link))}
                                        </div>
                                        {/* For collapsed sidebar state (width 20), show icons flat without nesting */}
                                        <div className="block group-hover:hidden">
                                            {item.items.map(link => renderLink(link))}
                                        </div>
                                    </div>
                                </div>
                            );
                        } else {
                            // It's a standalone link
                            return renderLink(item);
                        }
                    })}
                </nav>

                {/* Profile Section */}
                <div className="p-3 border-t border-white/10">
                    <Link
                        href="/profile"
                        className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${pathname === "/profile"
                            ? "bg-white/10 text-white border border-white/10"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                    >
                        <div className="min-w-[24px]">
                            <UserAvatar
                                name={user?.displayName || user?.name || user?.email || "User"}
                                photoURL={user?.photoURL}
                                size="small"
                            />
                        </div>
                        <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                            Profile
                        </span>
                    </Link>
                </div>

                <div className="p-3 border-t border-white/10">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-4 px-3 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg w-full transition-all whitespace-nowrap"
                    >
                        <LogOut className="w-6 h-6 min-w-[24px]" />
                        <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 leading-none">Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Mobile Bottom Navigation - Visible only on mobile */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 backdrop-blur-xl z-50 pb-safe">
                <nav className="flex items-center justify-around px-2 py-2">
                    {mobileLinks.slice(0, 4).map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px] ${isActive
                                    ? "bg-white/10 text-white"
                                    : "text-gray-400"
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                                <span className="text-[10px] font-medium truncate max-w-[60px]">
                                    {link.label.split(' ')[0]}
                                </span>
                            </Link>
                        );
                    })}
                    <Link
                        href="/profile"
                        className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px] ${pathname === "/profile"
                            ? "bg-white/10 text-white"
                            : "text-gray-400"
                            }`}
                    >
                        <User className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Profile</span>
                    </Link>
                </nav>
            </div>
        </>
    );
}
