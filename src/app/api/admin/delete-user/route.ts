import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
    try {
        const { uid } = await request.json();

        if (!uid) {
            return NextResponse.json(
                { error: "Missing user ID" },
                { status: 400 }
            );
        }

        if (!adminAuth || !adminDb) {
            return NextResponse.json(
                { error: "Firebase Admin is not initialized." },
                { status: 500 }
            );
        }

        // Collections to clean up for this user
        const collectionsToClean = [
            { name: "tasks", field: "assignedTo" },
            { name: "messages", field: "from" },
            { name: "notifications", field: "userId" },
            { name: "sessions", field: "userId" },
            { name: "reports", field: "userId" },
            { name: "feedback", field: "targetUserId" },
            { name: "performance_scores", field: "userId" },
            { name: "auditLogs", field: "userId" },
            { name: "weeklyPlans", field: "userId" },
        ];

        // Delete related data from all collections
        const deletePromises = collectionsToClean.map(async ({ name, field }) => {
            try {
                const snapshot = await adminDb!.collection(name).where(field, "==", uid).get();
                const batch = adminDb!.batch();
                snapshot.docs.forEach((doc) => batch.delete(doc.ref));
                if (snapshot.docs.length > 0) {
                    await batch.commit();
                }
                return { collection: name, deleted: snapshot.docs.length };
            } catch (error) {
                console.error(`Error cleaning ${name}:`, error);
                return { collection: name, deleted: 0, error: true };
            }
        });

        const results = await Promise.all(deletePromises);

        // Also delete messages sent TO this user
        try {
            const toMsgs = await adminDb.collection("messages").where("to", "array-contains", uid).get();
            const batch = adminDb.batch();
            toMsgs.docs.forEach((doc) => batch.delete(doc.ref));
            if (toMsgs.docs.length > 0) {
                await batch.commit();
            }
        } catch (error) {
            console.error("Error cleaning messages (to):", error);
        }

        // Remove user from group members
        try {
            const groupMembers = await adminDb.collection("groupMembers").where("userId", "==", uid).get();
            const batch = adminDb.batch();
            groupMembers.docs.forEach((doc) => batch.delete(doc.ref));
            if (groupMembers.docs.length > 0) {
                await batch.commit();
            }
        } catch (error) {
            console.error("Error cleaning groupMembers:", error);
        }

        // Delete user document from Firestore
        try {
            await adminDb.collection("users").doc(uid).delete();
        } catch (error) {
            console.error("Error deleting user document:", error);
        }

        // Delete user from Firebase Auth
        await adminAuth.deleteUser(uid);

        return NextResponse.json({
            success: true,
            message: "User and all related data deleted successfully",
            cleanupResults: results,
        });
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete user" },
            { status: 500 }
        );
    }
}
