"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "admin" | "core_employee" | "normal_employee" | "intern" | "guest" | null;

// Extended user type with custom fields
export interface CustomUser extends User {
    role?: UserRole;
    name?: string;
}

interface AuthContextType {
    user: CustomUser | null;
    role: UserRole;
    loading: boolean;
    canAccessRoute: (route: string) => boolean;
    hasPermission: (requiredRole: UserRole) => boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    canAccessRoute: () => false,
    hasPermission: () => false,
    refreshUser: async () => { },
});

// Role hierarchy: admin > core_employee > normal_employee > intern
const roleHierarchy: Record<string, number> = {
    admin: 4,
    core_employee: 3,
    normal_employee: 2,
    intern: 1,
    guest: 0,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<CustomUser | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);

    const loadUserData = async (currentUser: User) => {
        try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setRole(userData.role as UserRole);
                // Extend user object with custom fields
                const extendedUser: CustomUser = {
                    ...currentUser,
                    role: userData.role,
                    name: userData.name,
                    photoURL: userData.photoURL || currentUser.photoURL,
                };
                setUser(extendedUser);
            } else {
                console.warn("User document not found in Firestore for UID:", currentUser.uid);
                setRole("guest");
                setUser(currentUser as CustomUser);
            }
        } catch (error: any) {
            if (error?.code === 'permission-denied') {
                console.warn("Firestore permission denied, defaulting to guest role");
                setRole("guest");
            } else {
                console.error("Error fetching user role:", error);
                setRole(null);
            }
            setUser(currentUser as CustomUser);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                await loadUserData(currentUser);
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Check if user can access a specific route based on hierarchy
    const canAccessRoute = (route: string): boolean => {
        if (!role) return false;

        // Admin can access everything
        if (role === "admin") return true;

        // Extract the role from the route
        if (route.includes("/admin")) return false;
        if (route.includes("/core")) return roleHierarchy[role] >= roleHierarchy["core_employee"];
        if (route.includes("/employee")) return roleHierarchy[role] >= roleHierarchy["normal_employee"];
        if (route.includes("/intern")) return roleHierarchy[role] >= roleHierarchy["intern"];

        return true; // Public routes
    };

    // Check if user has permission equal to or higher than required role
    const hasPermission = (requiredRole: UserRole): boolean => {
        if (!role || !requiredRole) return false;
        if (role === "guest" || requiredRole === "guest") return false;
        return roleHierarchy[role] >= roleHierarchy[requiredRole];
    };

    const refreshUser = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            await loadUserData(currentUser);
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, canAccessRoute, hasPermission, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
