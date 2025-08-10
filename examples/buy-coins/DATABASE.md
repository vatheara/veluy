# Database Setup - Buy Coins Example

This example uses **Drizzle ORM** with **SQLite** to manage user balances and transaction records.

## 🗄️ Database Schema

### Users Table
- `id` - Unique user identifier
- `email` - User email (unique)
- `name` - User display name
- `balance` - Current coin balance
- `createdAt` / `updatedAt` - Timestamps

### Transactions Table
- `id` - Unique transaction identifier
- `userId` - Reference to user
- `type` - Transaction type (purchase, spend, refund)
- `amount` - USD amount
- `coins` - Coins amount
- `packageId` / `packageName` - Package information
- `status` - Transaction status (pending, completed, failed, cancelled)
- `transactionHash` / `md5Hash` - Payment verification hashes
- `metadata` - Additional JSON data
- `createdAt` / `updatedAt` - Timestamps

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Generate Migrations**
   ```bash
   pnpm db:generate
   ```

3. **View Database** (Optional)
   ```bash
   pnpm db:studio
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```

## 📁 Database Files

- `drizzle.config.ts` - Drizzle configuration
- `src/lib/db/schema.ts` - Database schema definitions
- `src/lib/db/index.ts` - Database connection and setup
- `src/lib/db/operations.ts` - Database operations (CRUD)
- `src/lib/db/migrations/` - Auto-generated migration files
- `src/lib/db/local.db` - SQLite database file (auto-created)

## 🔄 API Endpoints

### User Management
- `GET /api/user?email=demo@example.com` - Get user by email
- `GET /api/user?id=user_123` - Get user by ID
- `POST /api/user` - Create new user
- `PATCH /api/user` - Get or create demo user

### Balance Management
- `GET /api/balance?userId=user_123` - Get user balance
- `POST /api/balance` - Update balance (add/subtract/set)

### Transaction Management
- `GET /api/transactions?userId=user_123` - Get user transactions
- `POST /api/transactions` - Create transaction
- `PATCH /api/transactions` - Update transaction status

## 💡 Features

- ✅ Automatic database initialization on first run
- ✅ Demo user creation for testing
- ✅ Real-time balance updates
- ✅ Transaction history tracking
- ✅ Payment integration with Veluy
- ✅ Type-safe database operations
- ✅ Automatic migrations

## 🔧 Development

The database is automatically seeded with a demo user (`demo@example.com`) when you first run the application. This user starts with 0 coins and can purchase more through the UI.

All database operations are handled through the `UserOperations` and `TransactionOperations` classes in `operations.ts`.
