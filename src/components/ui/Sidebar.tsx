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
    User,
    BookOpen,
    Menu,
    X
} from "lucide-react";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { endSession } from "@/services/sessionService";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { GroupSwitcher } from "./GroupSwitcher";
import { useState } from "react";

type LinkItem = { href: string; label: string; icon: any };
type SidebarGroup = { title: string; items: LinkItem[] };

export function Sidebar() {
    const pathname = usePathname();
    const { user, role, userGroups } = useAuth();
    const router = useRouter();
    const [expandedGroups, setExpandedGroups] = useState<string[]>(["Overview", "Management", "Work", "Communication", "Resources"]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        if (role === "admin") {
            const adminGroups: SidebarGroup[] = [
                {
                    title: "Overview",
                    items: [
                        { href: "/admin", label: "Overview", icon: LayoutDashboard },
                        { href: "/admin/ansh", label: "Ansa Tracker", icon: Shield },
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
                adminGroups[0].items.push({ href: "/group", label: "My Group", icon: Users });
            }
            return adminGroups;
        }

        if (role === "core_employee") {
            return [
                { href: "/core", label: "Dashboard", icon: LayoutDashboard },
                { href: "/chat", label: "Team Chat", icon: MessageCircle },
                { href: "/core/tasks", label: "Task Management", icon: Briefcase },
                { href: "/core/weekly", label: "Weekly Planning", icon: ClipboardList },
                { href: "/calendar", label: "Calendar", icon: Calendar },
                { href: "/group", label: "My Group", icon: Users },
                { href: "/core/team", label: "Team", icon: Users },
                { href: "/resources", label: "Resources Hub", icon: BookOpen },
                { href: "/employee/tasks", label: "Employee Tasks", icon: ClipboardList },
            ];
        }

        if (role === "normal_employee") {
            return [
                { href: "/employee", label: "My Workspace", icon: LayoutDashboard },
                { href: "/chat", label: "Team Chat", icon: MessageCircle },
                { href: "/employee/tasks", label: "My Tasks", icon: ClipboardList },
                { href: "/calendar", label: "Calendar", icon: Calendar },
                { href: "/group", label: "My Group", icon: Users },
                { href: "/resources", label: "Resources Hub", icon: BookOpen },
            ];
        }

        if (role === "intern") {
            return [
                { href: "/intern", label: "Dashboard", icon: LayoutDashboard },
                { href: "/chat", label: "Team Chat", icon: MessageCircle },
                { href: "/group", label: "My Group", icon: Users },
                { href: "/intern/tasks", label: "My Tasks", icon: ClipboardList },
                { href: "/calendar", label: "Calendar", icon: Calendar },
                { href: "/intern/performance", label: "Performance", icon: Shield },
                { href: "/resources", label: "Resources Hub", icon: BookOpen },
            ];
        }

        return [];
    };

    const links = getLinks(role);

    // Reusable Content Renderer logic
    const renderSidebarContent = (isMobile: boolean) => {
        // Desktop uses group-hover to expand text. Mobile is always expanded.
        const textVisClass = isMobile ? "opacity-100 block" : "opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75";

        return (
            <>
                {/* Header Logo & Role */}
                <div className="p-6 border-b border-white/10 flex items-center gap-4 overflow-hidden whitespace-nowrap min-h-[96px]">
                    <div className="min-w-[48px]">
                        <Image
                            src="/images/logo.jpg"
                            alt="SPACE BORN"
                            width={48}
                            height={48}
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div className={`flex flex-col ${textVisClass}`}>
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

                {/* Navigation Links */}
                <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
                    {links.map((item, index) => {
                        if ('items' in item) {
                            // GROUP RENDERER
                            const isExpanded = expandedGroups.includes(item.title);
                            return (
                                <div key={index} className="mb-2">
                                    <button
                                        onClick={() => toggleGroup(item.title)}
                                        className={`w-full items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors ${isMobile ? "flex" : "hidden group-hover:flex"
                                            }`}
                                    >
                                        <span className={`truncate ${textVisClass}`}>
                                            {item.title}
                                        </span>
                                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    </button>

                                    {/* Desktop collapsed state tiny separator */}
                                    {!isMobile && (
                                        <div className="border-t border-white/5 my-2 mx-2 group-hover:hidden"></div>
                                    )}

                                    <div className={isExpanded ? 'block' : 'hidden'}>
                                        <div className={`${isMobile ? "block pl-2 border-l border-white/5 ml-2" : "hidden group-hover:block pl-2 border-l border-white/5 ml-2"}`}>
                                            {item.items.map(link => {
                                                const Icon = link.icon;
                                                const isActive = pathname === link.href;
                                                return (
                                                    <Link
                                                        key={link.href}
                                                        href={link.href}
                                                        onClick={() => isMobile && setIsMobileMenuOpen(false)}
                                                        className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap mb-1 ${isActive ? "bg-white/10 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                                                    >
                                                        <Icon className={`w-5 h-5 min-w-[20px] transition-transform ${isActive ? 'text-white' : ''}`} />
                                                        <span className={`font-medium text-sm ${textVisClass}`}>
                                                            {link.label}
                                                        </span>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                        {/* Desktop collapsed state (just icons) */}
                                        {!isMobile && (
                                            <div className="block group-hover:hidden">
                                                {item.items.map(link => {
                                                    const Icon = link.icon;
                                                    const isActive = pathname === link.href;
                                                    return (
                                                        <Link
                                                            key={link.href}
                                                            href={link.href}
                                                            className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap mb-1 ${isActive ? "bg-white/10 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                                                        >
                                                            <Icon className={`w-5 h-5 min-w-[20px] transition-transform ${isActive ? 'text-white' : ''}`} />
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        } else {
                            // STANDALONE LINK RENDERER
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => isMobile && setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap mb-1 ${isActive ? "bg-white/10 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                                >
                                    <Icon className={`w-5 h-5 min-w-[20px] transition-transform ${isActive ? 'text-white' : ''}`} />
                                    <span className={`font-medium text-sm ${textVisClass}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            )
                        }
                    })}
                </nav>

                {/* Profile Section */}
                <div className="p-3 border-t border-white/10">
                    <Link
                        href="/profile"
                        onClick={() => isMobile && setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${pathname === "/profile" ? "bg-white/10 text-white border border-white/10" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                    >
                        <div className="min-w-[24px]">
                            <UserAvatar
                                name={user?.displayName || user?.name || user?.email || "User"}
                                photoURL={user?.photoURL}
                                size="small"
                            />
                        </div>
                        <span className={`font-medium ${textVisClass}`}>
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
                        <span className={`font-medium leading-none ${textVisClass}`}>Sign Out</span>
                    </button>
                </div>
            </>
        );
    };

    return (
        <>
            {/* Mobile Top Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/90 border-b border-white/10 backdrop-blur-xl z-[40] flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <Image
                        src="/images/logo.jpg"
                        alt="SPACE BORN"
                        width={32}
                        height={32}
                        className="object-contain"
                        priority
                    />
                    <span className="text-sm font-extrabold tracking-tight font-montserrat bg-gradient-to-b from-gray-200 to-gray-400 bg-clip-text text-transparent">
                        SPACE BORN
                    </span>
                </div>
            </div>

            {/* Mobile Overlay Background */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* DECOUPLED MOBILE SIDEBAR */}
            <div className={`md:hidden fixed left-0 top-0 bottom-0 w-[280px] z-[50] flex flex-col bg-black/90 border-r border-white/10 backdrop-blur-xl transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
                {renderSidebarContent(true)}
            </div>

            {/* DECOUPLED DESKTOP SIDEBAR */}
            <div className="hidden md:flex w-20 hover:w-64 h-screen flex-col bg-black/40 border-r border-white/10 backdrop-blur-xl fixed left-0 top-0 z-50 transition-all duration-300 group overflow-hidden">
                {renderSidebarContent(false)}
            </div>
        </>
    );
}
