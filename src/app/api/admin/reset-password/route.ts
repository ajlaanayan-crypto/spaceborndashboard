import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        if (!adminAuth) {
            return NextResponse.json(
                { error: "Firebase Admin is not initialized. Please check server configuration." },
                { status: 500 }
            );
        }

        // Generate password reset link
        const resetLink = await adminAuth.generatePasswordResetLink(email);

        return NextResponse.json({
            success: true,
            resetLink,
            message: "Password reset link generated successfully",
        });
    } catch (error: any) {
        console.error("Error generating password reset:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate reset link" },
            { status: 500 }
        );
    }
}
