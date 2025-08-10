import { NextRequest, NextResponse } from 'next/server';
import { UserOperations, TransactionOperations } from '@/lib/db/operations';
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

    // Get or create user in our database
    let user = await UserOperations.getUserById(session.user.id);
    
    if (!user) {
      // Create user in our database if it doesn't exist yet
      user = await UserOperations.createUser({
        id: session.user.id, // Use Better Auth user ID
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified || false,
        image: session.user.image,
      });
    }

    return NextResponse.json({ 
      balance: user.balance,
      userId: user.id,
      email: user.email,
      name: user.name 
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
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

    const body = await request.json();
    const { action, amount } = body;
    const userId = session.user.id;

    let user;

    switch (action) {
      case 'add':
        if (typeof amount !== 'number' || amount <= 0) {
          return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
        }
        user = await UserOperations.incrementUserBalance(userId, amount);
        
        // Create transaction record
        await TransactionOperations.createTransaction({
          userId,
          type: 'purchase',
          amount: 0, // Will be set based on package price in real implementation
          coins: amount,
          status: 'completed',
        });
        break;

      case 'subtract':
        if (typeof amount !== 'number' || amount <= 0) {
          return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
        }
        const currentUser = await UserOperations.getUserById(userId);
        if (!currentUser) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        user = await UserOperations.updateUserBalance(userId, Math.max(0, currentUser.balance - amount));
        
        // Create transaction record
        await TransactionOperations.createTransaction({
          userId,
          type: 'spend',
          amount: 0,
          coins: -amount,
          status: 'completed',
        });
        break;

      case 'set':
        if (typeof amount !== 'number' || amount < 0) {
          return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
        }
        user = await UserOperations.updateUserBalance(userId, amount);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ 
      balance: user.balance,
      userId: user.id,
      action,
      amount
    });
  } catch (error) {
    console.error('Error updating balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
