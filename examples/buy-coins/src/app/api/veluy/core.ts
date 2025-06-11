import { createVeluy } from "../../../../../../packages/veluy/src/next";
import { type TransactionRouter } from "../../../../../../packages/veluy/src/types";

const f = createVeluy();

// FileRouter for your app, can contain multiple FileRoutes
export const ourTransactionRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    transaction: f({
       
    })
      // Set permissions and file types for this FileRoute
      .middleware(async () => {
        // This code runs on your server before upload
        return { userId: "test" };
      })
      .onTransactionComplete(async ({ metadata, bankingResponse}) => {
        // This code RUNS ON YOUR SERVER after upload
        console.log("Upload complete for userId:", metadata.userId);
        console.log("banking response ", bankingResponse)
        // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
        return { uploadedBy: metadata.userId };
      })
      ,
  } satisfies TransactionRouter;
  export type OurTransactionRouter = typeof ourTransactionRouter;