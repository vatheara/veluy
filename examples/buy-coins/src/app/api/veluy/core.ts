import { createVeluy } from "../../../../../../packages/veluy/next";
import { type FileRouter } from "../../../../../../packages/veluy/types";

const f = createVeluy();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    imageUploader: f({
      image: {
        /**
         * For full list of options and defaults, see the File Route API reference
         * @see https://docs.uploadthing.com/file-routes#route-config
         */
        maxFileSize: "4MB",
        maxFileCount: 1,
      },
    })
      // Set permissions and file types for this FileRoute
      .middleware(async () => {
        // This code runs on your server before upload
        return { userId: "test" };
      })
      .onUploadComplete(async ({ metadata, file }) => {
        // This code RUNS ON YOUR SERVER after upload
        console.log("Upload complete for userId:", metadata.userId);
        console.log("file url", file.ufsUrl);
        // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
        return { uploadedBy: metadata.userId };
      }),
  } satisfies FileRouter;
  export type OurFileRouter = typeof ourFileRouter;