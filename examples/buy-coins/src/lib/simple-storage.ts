// Simple in-memory storage for demo purposes
// In production, you would replace this with a real database

interface User {
  id: string;
  email: string;
  name: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Transaction {
  id: string;
  userId: string;
  type: 'purchase' | 'spend' | 'refund';
  amount: number;
  coins: number;
  packageId?: string;
  packageName?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionHash?: string;
  md5Hash?: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage
let users: User[] = [];
let transactions: Transaction[] = [];

// Initialize with demo user
const demoUser: User = {
  id: 'demo_user_001',
  email: 'demo@example.com',
  name: 'Demo User',
  balance: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

users.push(demoUser);

export class SimpleStorage {
  // User operations
  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    users.push(user);
    return user;
  }

  static async getUserById(id: string): Promise<User | null> {
    return users.find(user => user.id === id) || null;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return users.find(user => user.email === email) || null;
  }

  static async updateUserBalance(id: string, newBalance: number): Promise<User> {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    users[userIndex].balance = newBalance;
    users[userIndex].updatedAt = new Date();
    return users[userIndex];
  }

  static async incrementUserBalance(id: string, amount: number): Promise<User> {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    users[userIndex].balance += amount;
    users[userIndex].updatedAt = new Date();
    return users[userIndex];
  }

  static async getOrCreateDemoUser(): Promise<User> {
    const demoEmail = 'demo@example.com';
    let user = await this.getUserByEmail(demoEmail);
    
    if (!user) {
      user = await this.createUser({
        email: demoEmail,
        name: 'Demo User',
        balance: 0
      });
    }
    
    return user;
  }

  // Transaction operations
  static async createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const transaction: Transaction = {
      ...transactionData,
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    transactions.push(transaction);
    return transaction;
  }

  static async getTransactionById(id: string): Promise<Transaction | null> {
    return transactions.find(txn => txn.id === id) || null;
  }

  static async getUserTransactions(userId: string): Promise<Transaction[]> {
    return transactions
      .filter(txn => txn.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static async updateTransactionStatus(id: string, status: Transaction['status']): Promise<Transaction> {
    const txnIndex = transactions.findIndex(txn => txn.id === id);
    if (txnIndex === -1) {
      throw new Error('Transaction not found');
    }
    
    transactions[txnIndex].status = status;
    transactions[txnIndex].updatedAt = new Date();
    return transactions[txnIndex];
  }

  // Complete a purchase transaction (atomic operation)
  static async completePurchase(transactionId: string): Promise<{ transaction: Transaction; user: User }> {
    const transaction = await this.getTransactionById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Update transaction status
    transaction.status = 'completed';
    transaction.updatedAt = new Date();

    // Add coins to user balance
    const user = await this.incrementUserBalance(transaction.userId, transaction.coins);

    return { transaction, user };
  }

  // Utility methods for demo
  static getAllUsers(): User[] {
    return users;
  }

  static getAllTransactions(): Transaction[] {
    return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static resetData(): void {
    users = [demoUser];
    transactions = [];
  }
}

export type { User, Transaction };
