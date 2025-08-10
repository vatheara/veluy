import { NextRequest, NextResponse } from 'next/server';
import { UserOperations } from '@/lib/db/operations';
import { auth } from '../../../auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await UserOperations.getUserById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already exists in our database
    const existingUser = await UserOperations.getUserById(session.user.id);
    if (existingUser) {
      return NextResponse.json(existingUser);
    }

    // Create new user in our database (sync with Better Auth user)
    const user = await UserOperations.createUser({
      id: session.user.id, // Use Better Auth user ID
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified || false,
      image: session.user.image,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
