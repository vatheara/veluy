import { HttpApp, HttpRouter, HttpServerResponse, HttpServerRequest } from "@effect/platform";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

import { VeluyError } from "@veluy/shared";

import * as pkgJson from "../../package.json";
import type { AnyTransactionRoute, TransactionRouter, RouteHandlerOptions } from "../types";
import { IsDevelopment } from "./config";
import { makeRuntime } from "./runtime";

export class AdapterArguments extends Context.Tag(
  "veluy/AdapterArguments",
)<AdapterArguments, Record<string, unknown>>() {}

/**
 * Create a request handler adapter for any framework or server library.
 * Refer to the existing adapters for examples on how to use this function.
 * @public
 *
 * @param makeAdapterArgs - Function that takes the args from your framework and returns an Effect that resolves to the adapter args.
 * These args are passed to the `.middleware`, `.onTransactionComplete`, and `.onTransactionError` hooks.
 * @param toRequest - Function that takes the args from your framework and returns an Effect that resolves to a web Request object.
 * @param opts - The router config and other options that are normally passed to `createRequestHandler` of official adapters
 * @param beAdapter - [Optional] The adapter name of the adapter, used for telemetry purposes
 * @returns A function that takes the args from your framework and returns a promise that resolves to a Response object.
 */
export const makeAdapterHandler = <
  Args extends any[],
  AdapterArgs extends Record<string, unknown>,
>(
  makeAdapterArgs: (...args: Args) => Effect.Effect<AdapterArgs>,
  toRequest: (...args: Args) => Effect.Effect<Request>,
  opts: RouteHandlerOptions<TransactionRouter>,
  beAdapter?: string,
): ((...args: Args) => Promise<Response>) => {
  const managed = makeRuntime(
    opts.config?.fetch as typeof globalThis.fetch,
    opts.config,
  );
  const handle = Effect.promise(() =>
    managed.runtime().then(HttpApp.toWebHandlerRuntime),
  );

  const app = (...args: Args) =>
    Effect.map(
      Effect.promise(() =>
        managed.runPromise(createRequestHandler(opts, beAdapter ?? "custom")),
      ),
      Effect.provideServiceEffect(AdapterArguments, makeAdapterArgs(...args)),
    );

    return async (...args: Args) => {
      const result = await handle.pipe(
        Effect.ap(app(...args)),
        Effect.ap(toRequest(...args)),
        Effect.withLogSpan("requestHandler"),
        managed.runPromise,
      );
  
      return result;
    };
};

export const createRequestHandler = <
  TRouter extends Record<string, AnyTransactionRoute>,
>(
  opts: RouteHandlerOptions<TRouter>,
  beAdapter: string,
) =>
  Effect.gen(function* () {
    const isDevelopment = yield* IsDevelopment;

    const handleDaemon = (() => {
      if (opts.config?.handleDaemonPromise) {
        return opts.config.handleDaemonPromise;
      }
      return isDevelopment ? "void" : "await";
    })();
    if (isDevelopment && handleDaemon === "await") {
      return yield* new VeluyError({
        code: "INVALID_SERVER_CONFIG",
        message: 'handleDaemonPromise: "await" is forbidden in development.',
      });
    }

    const GET = Effect.gen(function* () {
      return yield* HttpServerResponse.json({ 
        message: "Veluy Transaction Checker API",
        version: pkgJson.version,
        endpoints: {
          "POST /check": "Check transaction status using MD5 hash"
        }
      });
    });

    const POST = Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      
      // Safely parse JSON body with error handling
      const body = yield* request.json.pipe(
        Effect.catchAll(() => Effect.succeed(null))
      )
      
      if (!body || !body.md5Hash) {
        yield* Effect.logError("Missing md5Hash in request body").pipe(
          Effect.annotateLogs("receivedBody", body)
        );
        return yield* HttpServerResponse.json({
          error: "Missing md5Hash in request body",
          received: body,
          expected: { md5Hash: "string" }
        }, { status: 400 });
      }
      
      const md5Hash = body.md5Hash as string;
      
      // Validate MD5 hash format (32 hex characters)
      if (!/^[a-f0-9]{32}$/i.test(md5Hash)) {
        yield* Effect.logError("Invalid MD5 hash format").pipe(
          Effect.annotateLogs("receivedHash", md5Hash)
        );
        return yield* HttpServerResponse.json({
          error: "Invalid MD5 hash format",
          received: md5Hash,
          expected: "32-character hexadecimal string (e.g., 'd41d8cd98f00b204e9800998ecf8427e')"
        }, { status: 400 });
      }
      
      // Mock banking API call - replace with actual banking API integration
      const bankingResponse = {
        status: "verified",
        transactionId: md5Hash,
        verified: true,
        timestamp: new Date().toISOString()
      };
      
      // Get first route for callbacks
      const routeKey = Object.keys(opts.router)[0];
      if (routeKey) {
        const route = opts.router[routeKey];
        const adapterArgs = yield* AdapterArguments.pipe(
          Effect.catchAll(() => Effect.succeed({}))
        );

        try {
          // Execute middleware
          const metadata = route.middleware({ 
            input: { md5Hash }, 
            ...adapterArgs 
          });
          
          // Execute completion callback
          const result = route.onTransactionComplete({
            metadata,
            transactionId: `tx_${Date.now()}`,
            md5Hash,
            bankingResponse,
            ...adapterArgs
          });
          
          return yield* HttpServerResponse.json({
            success: true,
            md5Hash,
            status: "verified",
            data: result
          });
          
        } catch (error) {
          // Execute error callback
          route.onTransactionError({
            error: new VeluyError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Transaction processing failed"
            }),
            transactionId: `tx_${Date.now()}`,
            md5Hash,
            ...adapterArgs
          });
          
          return yield* HttpServerResponse.json({
            success: false,
            error: "Transaction processing failed"
          }, { status: 500 });
        }
      }
      
      return yield* HttpServerResponse.json({
        message: "Transaction check endpoint",
        md5Hash,
        status: "processed",
        note: "Basic implementation - replace banking API call with actual integration"
      });
    });

    const appendResponseHeaders = Effect.map(
      HttpServerResponse.setHeader("x-veluy-version", pkgJson.version),
    );

    return HttpRouter.empty.pipe(
      HttpRouter.get("*", GET),
      HttpRouter.post("*", POST),
      HttpRouter.use(appendResponseHeaders),
    );
  }).pipe(Effect.withLogSpan("createRequestHandler"));


  const handleCheckTransaction = (md5Hash: string) => {
    return Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const body = yield* request.json.pipe(
        Effect.catchAll(() => Effect.succeed(null))
      )
    })
  }