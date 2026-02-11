import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST() {
    try {
        if (!adminDb) {
            return NextResponse.json({ error: "Firebase Admin not initialized" }, { status: 500 });
        }

        const groupsRef = adminDb.collection("groups");
        const existingRules = await groupsRef.limit(1).get();

        if (!existingRules.empty) {
            return NextResponse.json({ message: "Database already initialized" }, { status: 200 });
        }

        // Create Default Groups
        const groups = [
            {
                name: "Alpha Team",
                description: "Primary development unit",
                status: "active",
                createdAt: new Date(),
                updatedAt: new Date(),
                memberIds: [],
                leadName: "System Lead",
                leadId: "system_lead"
            },
            {
                name: "Beta Squad",
                description: "Research and design",
                status: "active",
                createdAt: new Date(),
                updatedAt: new Date(),
                memberIds: [],
                leadName: "Unassigned",
                leadId: null
            }
        ];

        for (const group of groups) {
            await groupsRef.add(group);
        }

        return NextResponse.json({ message: "Default groups created successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
