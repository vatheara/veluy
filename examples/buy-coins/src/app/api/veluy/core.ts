import { createVeluy, createVeluyQR } from "../../../../../../packages/veluy/src/next";
import { type TransactionRouter } from "../../../../../../packages/veluy/src/types";
import { SimpleStorage } from "@/lib/simple-storage";

const f = createVeluy({
  errorFormatter: (err) => {
    console.log("Error in transaction", err.message);
    console.log("  - Above error caused by:", err.cause);
    return { message: err.message };
  },
});

// TODO: create router for generate qr string
const qr = createVeluyQR({
  errorFormatter: (err) => {
    console.log("Error in transaction", err.message);
    console.log("  - Above error caused by:", err.cause);
    return { message: err.message };
  },
});

// TransactionRouter for your app, can contain multiple TransactionRoutes
export const ourTransactionRouter = {
  // Define as many TransactionRoutes as you like, each with a unique routeSlug
  monthlySub: f({ any: "any" })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before checking the transaction
      return { userId: "test" };
    })
    .onComplete(async ({ metadata, bankingResponse }) => {
      // This code RUNS ON YOUR SERVER after checking the transaction
      console.log("Transaction complete for userId:", metadata.userId);
      console.log("banking response ", bankingResponse);
      
      try {
        // Get or create demo user for this transaction
        const user = await SimpleStorage.getOrCreateDemoUser();
        
        // Create transaction record (500 coins for monthly sub)
        const transaction = await SimpleStorage.createTransaction({
          userId: user.id,
          type: 'purchase',
          amount: 4.99,
          coins: 500,
          packageId: 'monthly',
          packageName: 'Monthly Subscription',
          status: 'completed',
          metadata: JSON.stringify({ bankingResponse })
        });

        // Add coins to user balance
        const updatedUser = await SimpleStorage.incrementUserBalance(user.id, 500);
        
        console.log("✅ Added 500 coins to user balance");
        return { 
          transactionBy: metadata.userId,
          transactionId: transaction.id,
          coinsAdded: 500,
          newBalance: updatedUser.balance
        };
      } catch (error) {
        console.error("❌ Error processing transaction:", error);
        return { transactionBy: metadata.userId, error: "Failed to process transaction" };
      }
    }),
  yearlySub: f({ any: "any" })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before checking the transaction
      return { userId: "test" };
    })
    .onError((e) => console.log("$$$$$$$$$$$$$$error", e))
    .onComplete(async ({ metadata, bankingResponse }) => {
      // This code RUNS ON YOUR SERVER after checking the transaction
      console.log("Transaction complete for userId:", metadata.userId);
      console.log("banking response ", bankingResponse);
      
      try {
        // Get or create demo user for this transaction
        const user = await SimpleStorage.getOrCreateDemoUser();
        
        // Create transaction record - this will be updated based on the actual package purchased
        const transaction = await SimpleStorage.createTransaction({
          userId: user.id,
          type: 'purchase',
          amount: 0, // Will be updated based on actual package
          coins: 0, // Will be updated based on actual package
          packageId: 'dynamic',
          packageName: 'Coin Purchase',
          status: 'completed',
          metadata: JSON.stringify({ bankingResponse })
        });

        console.log("✅ Transaction recorded, coins will be added based on package selection");
        return { 
          transactionBy: metadata.userId,
          transactionId: transaction.id,
          message: "Transaction recorded successfully"
        };
      } catch (error) {
        console.error("❌ Error processing transaction:", error);
        return { transactionBy: metadata.userId, error: "Failed to process transaction" };
      }
    }),
} //satisfies TransactionRouter;

export type OurTransactionRouter = typeof ourTransactionRouter;
