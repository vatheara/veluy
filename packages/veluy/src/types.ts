import type * as LogLevel from "effect/LogLevel";

import type {
  ErrorMessage,
  ExtendObjectIf,
  FetchEsque,
  MaybePromise,
} from "@veluy/shared";

import type { LogFormat } from "./_internal/logger";
import type { AnyTransactionRoute, TransactionRoute } from "./_internal/types";

export type { EndpointMetadata, ExpandedRouteConfig } from "@veluy/shared";

export type { UTRegionAlias } from "./_internal/types";

export type { TransactionRoute, AnyTransactionRoute };
export type TransactionRouter = Record<string, AnyTransactionRoute>;

export type inferEndpointInput<TTransactionRoute extends AnyTransactionRoute> =
  TTransactionRoute["$types"]["input"];

export type inferEndpointOutput<TTransactionRoute extends AnyTransactionRoute> =
  TTransactionRoute["$types"]["output"];

export type inferErrorShape<TTransactionRoute extends AnyTransactionRoute> =
  TTransactionRoute["$types"]["errorShape"];

export type RouteHandlerConfig = {
  logLevel?: LogLevel.Literal;
  /**
   * What format log entries should be in
   * @default "pretty" in development, else "json"
   * @see https://effect.website/docs/guides/observability/logging#built-in-loggers
   */
  logFormat?: LogFormat;
  /**
   * The full, absolute URL to where your route handler is hosted. Veluy
   * attempts to automatically detect this value based on the request URL and
   * headers. You can override this if the automatic detection fails.
   * @example URL { https://www.example.com/api/veluy }
   */
  callbackUrl?: string;
  token?: string;
  /**
   * Used to determine whether to run dev hook or not
   * @default `env.NODE_ENV === "development" || env.NODE_ENV === "dev"`
   */
  isDev?: boolean;
  /**
   * Used to override the fetch implementation
   * @default `globalThis.fetch`
   */
  fetch?: FetchEsque;
  /**
   * Set how Veluy should handle the daemon promise before returning a response to the client.
   * You can also provide a synchronous function that will be called before returning a response to
   * the client. This can be useful for things like:
   * -  [`@vercel/functions.waitUntil`](https://vercel.com/docs/functions/functions-api-reference#waituntil)
   * - [`next/after`](https://nextjs.org/blog/next-15-rc#executing-code-after-a-response-with-nextafter-experimental)
   * - or equivalent function from your serverless infrastructure provider that allows asynchronous streaming
   * If deployed on a stateful server, you most likely want "void" to run the daemon in the background.
   * @remarks - `"await"` is not allowed in development environments
   * @default isDev === true ? "void" : "await"
   */
  handleDaemonPromise?:
    | "void"
    | "await"
    | ((promise: Promise<unknown>) => void);
  /**
   * URL override for the banking API server
   */
  bankingApiUrl?: string;
};

export type RouteHandlerOptions<TRouter extends TransactionRouter> = {
  router: TRouter;
  config?: RouteHandlerConfig;
};

export type CheckTransactionOptions<
  TTransactionRoute extends AnyTransactionRoute,
> = {
  /**
   * The MD5 hash to verify
   */
  md5Hash: string;
  /**
   * An AbortSignal to cancel the transaction check
   * Calling `abort()` on the parent AbortController will
   * cause this function to throw a `TransactionAbortedError`
   */
  signal?: AbortSignal | undefined;
  /**
   * Called when transaction verification begins
   */
  onTransactionBegin?: ((opts: { md5Hash: string }) => void) | undefined;
  /**
   * Called continuously as the transaction is being verified
   */
  onTransactionProgress?:
    | ((opts: {
        /** The MD5 hash being verified */
        md5Hash: string;
        /** Current verification step */
        step: string;
        /** Progress percentage */
        progress: number;
      }) => void)
    | undefined;
  /**
   * URL to the Veluy API endpoint
   * @example URL { http://localhost:3000/api/veluy }
   * @example URL { https://www.example.com/api/veluy }
   * @remarks This option is not required when `checkTransaction` has been generated with `genTransactionChecker`
   */
  url: URL;
  /**
   * Set custom headers that'll get sent with requests
   * to your server
   */
  headers?: HeadersInit | (() => MaybePromise<HeadersInit>) | undefined;
  /**
   * The veluy package that is making this request, used to identify the client in the server logs
   * @example "@veluy/react"
   * @remarks This option is not required when `checkTransaction` has been generated with `genTransactionChecker`
   */
  package: string;
} & ExtendObjectIf<
  inferEndpointInput<TTransactionRoute>,
  { input: inferEndpointInput<TTransactionRoute> }
>;

export type CreateTransactionCheckOptions<
  TTransactionRoute extends AnyTransactionRoute,
> = {
  /**
   * The MD5 hash to verify
   */
  md5Hash: string;
  /**
   * Called continuously as the transaction is being verified
   */
  onTransactionProgress?:
    | ((opts: {
        /** The MD5 hash being verified */
        md5Hash: string;
        /** Current verification step */
        step: string;
        /** Progress percentage */
        progress: number;
      }) => void)
    | undefined;
  /**
   * Set custom headers that'll get sent with requests
   * to your server
   */
  headers?: HeadersInit | (() => MaybePromise<HeadersInit>) | undefined;
} & ExtendObjectIf<
  inferEndpointInput<TTransactionRoute>,
  { input: inferEndpointInput<TTransactionRoute> }
>;

export type GenerateTransactionCheckerOptions = {
  /**
   * URL to the Veluy API endpoint. If relative, host will be inferred from
   * either the `VERCEL_URL` environment variable or `window.location.origin`
   *
   * @default (VERCEL_URL ?? window.location.origin) + "/api/veluy"
   * @example /api/veluy
   * @example URL { https://www.example.com/api/veluy }
   */
  url?: string | URL;
  /**
   * Provide a custom fetch implementation.
   * @default `globalThis.fetch`
   */
  fetch?: FetchEsque | undefined;
  /**
   * The veluy package that is making this request
   * @example "@veluy/react"
   *
   * This is used to identify the client in the server logs
   */
  package?: string;
};

export type EndpointArg<
  TRouter extends TransactionRouter,
  TEndpoint extends keyof TRouter,
> = TEndpoint | ((_: RouteRegistry<TRouter>) => TEndpoint);

export type RouteRegistry<TRouter extends TransactionRouter> = {
  [k in keyof TRouter]: k;
};
