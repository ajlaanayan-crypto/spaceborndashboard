import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
    try {
        const { uid, newRole } = await request.json();

        if (!uid || !newRole) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate role
        const validRoles = ['admin', 'core_employee', 'normal_employee', 'intern'];
        if (!validRoles.includes(newRole)) {
            return NextResponse.json(
                { error: "Invalid role" },
                { status: 400 }
            );
        }

        if (!adminAuth || !adminDb) {
            return NextResponse.json(
                { error: "Firebase Admin is not initialized. Please check server configuration." },
                { status: 500 }
            );
        }

        // Update user's custom claims in Firebase Auth
        await adminAuth.setCustomUserClaims(uid, { role: newRole });

        // ALSO update the role in Firestore users document
        await adminDb.collection("users").doc(uid).update({
            role: newRole,
            updatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message: `User role updated to ${newRole}`,
        });
    } catch (error: any) {
        console.error("Error updating user role:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update role" },
            { status: 500 }
        );
    }
}
