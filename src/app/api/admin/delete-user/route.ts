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

        // ── Soft-delete the Firestore user document ──────────────────────────
        // Mark the account as deleted so it doesn't show up as active,
        // but ALL historical data (tasks, reports, feedback, etc.) is preserved.
        try {
            await adminDb.collection("users").doc(uid).update({
                status: "deleted",
                deletedAt: new Date().toISOString(),
                // Clear sensitive login fields so no PII leaks, keep identity fields
                email: `deleted_${uid}@deleted.spaceborn`,
            });
        } catch (error) {
            console.error("Error marking user as deleted in Firestore:", error);
            // If the document doesn't exist, proceed anyway
        }

        // ── Remove from group membership (operational, not historical) ────────
        // We remove group membership so they don't appear in active group lists,
        // but their tasks/contributions remain.
        try {
            const groupMembers = await adminDb
                .collection("groupMembers")
                .where("userId", "==", uid)
                .get();
            const batch = adminDb.batch();
            groupMembers.docs.forEach((doc) => batch.delete(doc.ref));
            if (groupMembers.docs.length > 0) {
                await batch.commit();
            }
        } catch (error) {
            console.error("Error removing from groupMembers:", error);
        }

        // ── Delete active sessions & notifications (transient data) ───────────
        const transientCollections = [
            { name: "sessions", field: "userId" },
            { name: "notifications", field: "userId" },
        ];

        await Promise.all(
            transientCollections.map(async ({ name, field }) => {
                try {
                    const snapshot = await adminDb!
                        .collection(name)
                        .where(field, "==", uid)
                        .get();
                    const batch = adminDb!.batch();
                    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
                    if (snapshot.docs.length > 0) await batch.commit();
                } catch (error) {
                    console.error(`Error cleaning ${name}:`, error);
                }
            })
        );

        // ── Delete Firebase Auth account (prevents login) ─────────────────────
        await adminAuth.deleteUser(uid);

        return NextResponse.json({
            success: true,
            message:
                "User account deactivated. Login access removed. All historical task and performance data has been preserved.",
        });
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete user" },
            { status: 500 }
        );
    }
}
