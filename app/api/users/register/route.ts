import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (will reset on server restart)
let users: any[] = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@spaceborn.io',
        role: 'admin'
    },
    {
        id: 2,
        username: 'user',
        email: 'user@spaceborn.io',
        role: 'employee'
    },
    {
        id: 3,
        username: 'intern',
        email: 'intern@spaceborn.io',
        role: 'intern'
    }
];

let nextId = 4;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, email, password, role } = body;

        // Check if user already exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return NextResponse.json(
                { detail: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Create new user
        const newUser = {
            id: nextId++,
            username,
            email,
            role: role || 'employee'
        };

        users.push(newUser);

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
        );
    }
}
