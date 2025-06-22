import { createVeluy } from "../../../../../../packages/veluy/src/next";
import { type TransactionRouter } from "../../../../../../packages/veluy/src/types";

const f = createVeluy();

// TransactionRouter for your app, can contain multiple TransactionRoutes
export const ourTransactionRouter = {
    // Define as many TransactionRoutes as you like, each with a unique routeSlug
    transaction: f({
       
    })
      // Set permissions and file types for this FileRoute
      .middleware(async () => {
        // This code runs on your server before checking the transaction
        return { userId: "test" };
      })
      .onTransactionComplete(async ({ metadata, bankingResponse}) => {
        // This code RUNS ON YOUR SERVER after checking the transaction
        console.log("Transaction complete for userId:", metadata.userId);
        console.log("banking response ", bankingResponse)
        // !!! Whatever is returned here is sent to the clientside `onTransactionComplete` callback
        return { transactionBy: metadata.userId };
      })
      ,
  } satisfies TransactionRouter;

export type OurTransactionRouter = typeof ourTransactionRouter;