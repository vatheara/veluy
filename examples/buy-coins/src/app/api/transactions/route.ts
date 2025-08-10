import { NextRequest, NextResponse } from 'next/server';
import { SimpleStorage } from '@/lib/simple-storage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const transactionId = searchParams.get('id');

    if (transactionId) {
      const transaction = await SimpleStorage.getTransactionById(transactionId);
      if (!transaction) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }
      return NextResponse.json(transaction);
    }

    if (userId) {
      const transactions = await SimpleStorage.getUserTransactions(userId);
      return NextResponse.json(transactions);
    }

    const transactions = SimpleStorage.getAllTransactions();
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      type, 
      amount, 
      coins, 
      packageId, 
      packageName, 
      transactionHash,
      md5Hash,
      metadata 
    } = body;

    if (!userId || !type || !amount || !coins) {
      return NextResponse.json({ 
        error: 'userId, type, amount, and coins are required' 
      }, { status: 400 });
    }

    const transaction = await SimpleStorage.createTransaction({
      userId,
      type,
      amount,
      coins,
      packageId,
      packageName,
      transactionHash,
      md5Hash,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      status: 'pending'
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, status, action } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    if (action === 'complete') {
      // Complete purchase and update user balance
      const result = await SimpleStorage.completePurchase(transactionId);
      return NextResponse.json(result);
    }

    if (status) {
      const transaction = await SimpleStorage.updateTransactionStatus(transactionId, status);
      return NextResponse.json(transaction);
    }

    return NextResponse.json({ error: 'Status or action is required' }, { status: 400 });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
