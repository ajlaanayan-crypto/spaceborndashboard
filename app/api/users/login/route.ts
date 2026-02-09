import { NextRequest, NextResponse } from 'next/server';

// Mock user database
const mockUsers = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@spaceborn.io',
        password: 'admin123',
        role: 'admin'
    },
    {
        id: 2,
        username: 'user',
        email: 'user@spaceborn.io',
        password: 'user123',
        role: 'employee'
    },
    {
        id: 3,
        username: 'intern',
        email: 'intern@spaceborn.io',
        password: 'intern123',
        role: 'intern'
    }
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Find user
        const user = mockUsers.find(u => u.email === email && u.password === password);

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Generate mock token (in production, use proper JWT)
        const mockToken = Buffer.from(JSON.stringify({
            userId: user.id,
            email: user.email,
            role: user.role
        })).toString('base64');

        return NextResponse.json({
            access_token: mockToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
