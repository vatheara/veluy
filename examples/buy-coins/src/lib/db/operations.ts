import { eq, sql } from 'drizzle-orm';
import { db, schema, type User, type NewUser, type Transaction, type NewTransaction } from './index';

// User operations
export class UserOperations {
  static async createUser(userData: Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<User> {
    const id = userData.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const [user] = await db.insert(schema.user).values({
      id,
      ...userData,
    }).returning();
    
    return user;
  }

  static async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(schema.user).where(eq(schema.user.id, id));
    return user || null;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(schema.user).where(eq(schema.user.email, email));
    return user || null;
  }

  static async updateUserBalance(id: string, newBalance: number): Promise<User> {
    const [user] = await db.update(schema.user)
      .set({ 
        balance: newBalance,
        updatedAt: sql`(unixepoch())`
      })
      .where(eq(schema.user.id, id))
      .returning();
    
    return user;
  }

  static async incrementUserBalance(id: string, amount: number): Promise<User> {
    const [user] = await db.update(schema.user)
      .set({ 
        balance: sql`${schema.user.balance} + ${amount}`,
        updatedAt: sql`(unixepoch())`
      })
      .where(eq(schema.user.id, id))
      .returning();
    
    return user;
  }

  static async decrementUserBalance(id: string, amount: number): Promise<User> {
    const [user] = await db.update(schema.user)
      .set({ 
        balance: sql`${schema.user.balance} - ${amount}`,
        updatedAt: sql`(unixepoch())`
      })
      .where(eq(schema.user.id, id))
      .returning();
    
    return user;
  }

  static async getAlluser(): Promise<User[]> {
    return await db.select().from(schema.user);
  }

  // Create or get demo user for testing
  static async getOrCreateDemoUser(): Promise<User> {
    const demoEmail = 'demo@example.com';
    let user = await this.getUserByEmail(demoEmail);
    
    if (!user) {
      user = await this.createUser({
        email: demoEmail,
        name: 'Demo User',
        emailVerified: false,
        balance: 0
      });
    }
    
    return user;
  }
}

// Transaction operations
export class TransactionOperations {
  static async createTransaction(transactionData: Omit<NewTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const id = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    const [transaction] = await db.insert(schema.transaction).values({
      id,
      ...transactionData,
    }).returning();
    
    return transaction;
  }

  static async getTransactionById(id: string): Promise<Transaction | null> {
    const [transaction] = await db.select().from(schema.transaction).where(eq(schema.transaction.id, id));
    return transaction || null;
  }

  static async getTransactionByHash(hash: string): Promise<Transaction | null> {
    const [transaction] = await db.select().from(schema.transaction).where(eq(schema.transaction.transactionHash, hash));
    return transaction || null;
  }

  static async getTransactionByMd5Hash(md5Hash: string): Promise<Transaction | null> {
    const [transaction] = await db.select().from(schema.transaction).where(eq(schema.transaction.md5Hash, md5Hash));
    return transaction || null;
  }

  static async updatetransactiontatus(id: string, status: 'pending' | 'completed' | 'failed' | 'cancelled'): Promise<Transaction> {
    const [transaction] = await db.update(schema.transaction)
      .set({ 
        status,
        updatedAt: sql`(unixepoch())`
      })
      .where(eq(schema.transaction.id, id))
      .returning();
    
    return transaction;
  }

  static async getUsertransaction(userId: string): Promise<Transaction[]> {
    return await db.select().from(schema.transaction)
      .where(eq(schema.transaction.userId, userId))
      .orderBy(sql`${schema.transaction.createdAt} DESC`);
  }

  static async getAlltransaction(): Promise<Transaction[]> {
    return await db.select().from(schema.transaction)
      .orderBy(sql`${schema.transaction.createdAt} DESC`);
  }

  // Complete a purchase transaction
  static async completePurchase(transactionId: string): Promise<{ transaction: Transaction; user: User }> {
    return await db.transaction(async (tx) => {
      // Update transaction status
      const [transaction] = await tx.update(schema.transaction)
        .set({ 
          status: 'completed',
          updatedAt: sql`(unixepoch())`
        })
        .where(eq(schema.transaction.id, transactionId))
        .returning();

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Add coins to user balance
      const [user] = await tx.update(schema.user)
        .set({ 
          balance: sql`${schema.user.balance} + ${transaction.coins}`,
          updatedAt: sql`(unixepoch())`
        })
        .where(eq(schema.user.id, transaction.userId))
        .returning();

      if (!user) {
        throw new Error('User not found');
      }

      return { transaction, user };
    });
  }
}
