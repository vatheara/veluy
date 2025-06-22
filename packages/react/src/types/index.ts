import type {
    ErrorMessage,
    ExtendObjectIf,
    FetchEsque,
    MaybePromise,
    ClassListMerger
  } from "@veluy/shared";
  
  import type {
    AnyTransactionRoute,
    EndpointArg,
    TransactionRouter,
    inferEndpointInput,
    inferEndpointOutput,
    inferErrorShape,
  } from "veluy/types";

  // export interface GenerateTypedHelpersOptions {
  //   /**
  //    * URL to the UploadThing API endpoint
  //    * @example "/api/uploadthing"
  //    * @example "https://www.example.com/api/uploadthing"
  //    *
  //    * If relative, host will be inferred from either the `VERCEL_URL` environment variable or `window.location.origin`
  //    *
  //    * @default (VERCEL_URL ?? window.location.origin) + "/api/uploadthing"
  //    */
  //   url?: string | URL;
  //   /**
  //    * Provide a custom fetch implementation.
  //    * @default `globalThis.fetch`
  //    * @example
  //    * ```ts
  //    * fetch: (input, init) => {
  //    *   if (input.toString().startsWith(MY_SERVER_URL)) {
  //    *     // Include cookies in the request to your API
  //    *     return fetch(input, {
  //    *       ...init,
  //    *       credentials: "include",
  //    *     });
  //    *   }
  //    *
  //    *   return fetch(input, init);
  //    * }
  //    * ```
  //    */
  //   fetch?: FetchEsque | undefined;
  // }
  
  export type UseVeluyProps<
    TFileRoute extends AnyTransactionRoute,
    TServerOutput = inferEndpointOutput<TFileRoute>,
  > = {
    /**
     * Called when presigned URLs have been retrieved and the file upload is about to begin
     */
    onVeluyBegin?: ((hash: string) => void) | undefined;
    onClientVeluyComplete?:
      // | ((res: ClientVeluyCompletedData<TServerOutput>[]) => MaybePromise<void>)
      any
      | undefined;
    /**
     * Called if the upload fails
     */
    onVeluyError?:
      // | ((e: VeluyError<inferErrorShape<TFileRoute>>) => MaybePromise<void>)
      any
      | undefined;
    /**
     * Set custom headers that'll get sent with requests
     * to your server
     */
    headers?: HeadersInit | (() => MaybePromise<HeadersInit>) | undefined;
    /**
     * An AbortSignal to cancel the upload
     * Calling `abort()` on the parent AbortController will cause the
     * upload to throw an `UploadAbortedError`. In a future version
     * the function will not throw in favor of an `onUploadAborted` callback.
     */
    signal?: AbortSignal | undefined;
  };
  
  export type VeluyComponentProps<
    TRouter extends TransactionRouter,
    TEndpoint extends keyof TRouter,
  > = Omit<
  UseVeluyProps<TRouter[TEndpoint]>,
    /**
     * Signal is omitted, component has its own AbortController
     * If you need to control the interruption with more granularity,
     * create your own component and pass your own signal to
     * `useUploadThing`
     * @see https://github.com/pingdotgg/uploadthing/pull/838#discussion_r1624189818
     */
    "signal"
  > & {
    /**
     * Called when the upload is aborted
     */
    onUploadAborted?: (() => MaybePromise<void>) | undefined;
    /**
     * The endpoint from your FileRouter to use for the upload
     */
    endpoint: EndpointArg<TRouter, TEndpoint>;
    /**
     * URL to the UploadThing API endpoint
     * @example URL { /api/uploadthing }
     * @example URL { https://www.example.com/api/uploadthing }
     *
     * If relative, host will be inferred from either the `VERCEL_URL` environment variable or `window.location.origin`
     *
     * @default (VERCEL_URL ?? window.location.origin) + "/api/uploadthing"
     */
    url?: string | URL;
    /**
     * Provide a custom fetch implementation.
     * @default `globalThis.fetch`
     * @example
     * ```ts
     * fetch: (input, init) => {
     *   if (input.toString().startsWith(MY_SERVER_URL)) {
     *     // Include cookies in the request to your API
     *     return fetch(input, {
     *       ...init,
     *       credentials: "include",
     *     });
     *   }
     *
     *   return fetch(input, init);
     * }
     * ```
     */
    fetch?: FetchEsque | undefined;
    config?: {
      mode?: "auto" | "manual";
      appendOnPaste?: boolean;
      /**
       * Override the default class name merger, with e.g. tailwind-merge
       * This may be required if you're customizing the component
       * appearance with additional TailwindCSS classes to ensure
       * classes are sorted and applied in the correct order
       */
      cn?: ClassListMerger;
    };
    disabled?: boolean;
    /**
     * Callback called when files are selected
     *
     * @param acceptedFiles - The files that were accepted.
     */
    onChange?: (files: File[]) => void;
  } & ExtendObjectIf<
      inferEndpointInput<TRouter[TEndpoint]>,
      {
        /**
         * The input to the endpoint, as defined using `.input()` on the FileRouter endpoint
         * @see https://docs.uploadthing.com/api-reference/server#input
         */
        input: inferEndpointInput<TRouter[TEndpoint]>;
      }
    >;
  