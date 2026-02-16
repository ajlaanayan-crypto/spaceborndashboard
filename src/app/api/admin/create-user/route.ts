import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { headers } from "next/headers";

export async function POST(request: Request) {
    if (!adminAuth || !adminDb) {
        return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
    }

    try {
        const headersList = await headers();
        const idToken = headersList.get("Authorization")?.split("Bearer ")[1];

        if (!idToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify the ID token first
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const callerUid = decodedToken.uid;

        // Authorization check
        const callerDoc = await adminDb.collection("users").doc(callerUid).get();
        if (!callerDoc.exists || callerDoc.data()?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        const { email, password, name, role, batch } = await request.json();

        if (!email || !password || !name || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate role
        const validRoles = ["admin", "core_employee", "normal_employee", "intern"];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
            emailVerified: true, // Auto-verify since admin created it
        });

        // We don't need a reset link if password is provided
        const resetLink = "";

        // Create user in Firestore
        await adminDb.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            email,
            name,
            role,
            batch: role === 'intern' ? batch || null : null, // Only store batch for interns
            status: "active",
            createdAt: new Date().toISOString(),
            createdBy: callerUid,
        });

        // Log action
        await adminDb.collection("auditLogs").add({
            action: "USER_CREATED",
            performedBy: callerUid,
            targetId: userRecord.uid,
            targetType: "user",
            details: { email, name, role, batch },
            timestamp: new Date(),
        });

        return NextResponse.json({
            message: "User created successfully",
            uid: userRecord.uid,
            passwordResetLink: resetLink // Admin can share this link with the user
        });
    } catch (error: any) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
