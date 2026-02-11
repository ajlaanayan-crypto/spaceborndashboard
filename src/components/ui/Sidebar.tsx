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
} from "lucide-react";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { endSession } from "@/services/sessionService";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { User } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const { user, role } = useAuth();
    const router = useRouter();



    const handleSignOut = async () => {
        const sessionId = localStorage.getItem("spaceborn_session_id");
        if (sessionId && auth.currentUser) {
            await endSession(sessionId, auth.currentUser.uid);
            localStorage.removeItem("spaceborn_session_id");
        }
        await auth.signOut();
        router.push("/");
    };

    const getLinks = (role: UserRole) => {
        const baseLinks = [];

        // Admin gets all routes
        if (role === "admin") {
            return [
                { href: "/admin", label: "Admin Overview", icon: LayoutDashboard },
                { href: "/admin/users", label: "User Management", icon: Users },
                { href: "/admin/groups", label: "Group Management", icon: Users },
                { href: "/admin/messages", label: "Messages", icon: Mail },
                { href: "/admin/finance", label: "Finance & Revenue", icon: DollarSign },
                { href: "/admin/meetings", label: "Meetings", icon: ClipboardList },
                { href: "/admin/tasks", label: "All Tasks", icon: ClipboardList },
                { href: "/admin/resources", label: "Manage Resources", icon: UserPlus },
                { href: "/core/tasks", label: "Task Creation", icon: Briefcase },
            ];
        }

        // Core Employee: own + employee + intern routes
        if (role === "core_employee") {
            return [
                { href: "/core", label: "Dashboard", icon: LayoutDashboard },
                { href: "/core/tasks", label: "Task Management", icon: Briefcase },
                { href: "/core/weekly", label: "Weekly Planning", icon: ClipboardList },
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
                { href: "/employee/tasks", label: "My Tasks", icon: ClipboardList },
                { href: "/group", label: "My Group", icon: Users },
                { href: "/intern/resources", label: "Resources", icon: UserPlus },
            ];
        }

        // Intern: only own routes
        if (role === "intern") {
            return [
                { href: "/intern", label: "Dashboard", icon: LayoutDashboard },
                { href: "/group", label: "My Group", icon: Users },
                { href: "/intern/tasks", label: "My Tasks", icon: ClipboardList },
                { href: "/intern/performance", label: "Performance", icon: Shield },
                { href: "/intern/resources", label: "Resources", icon: UserPlus },
            ];
        }

        return [];
    };

    const links = getLinks(role);

    return (
        <div className="w-20 hover:w-64 h-screen bg-black/40 border-r border-white/10 backdrop-blur-xl flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 group overflow-hidden">

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

            <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${isActive
                                ? "bg-white/10 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <Icon className={`w-6 h-6 min-w-[24px] transition-transform ${isActive ? 'text-white' : ''}`} />
                            <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                                {link.label}
                            </span>
                        </Link>
                    );
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
                    <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">Sign Out</span>
                </button>
            </div>
        </div>
    );
}
