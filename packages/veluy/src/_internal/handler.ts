import {
  HttpApp,
  HttpRouter,
  HttpServerResponse,
  HttpServerRequest,
} from "@effect/platform";
import * as HttpClient from "@effect/platform/HttpClient";
import * as HttpClientRequest from "@effect/platform/HttpClientRequest";
import * as FetchHttpClient from "@effect/platform/FetchHttpClient";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

import { VeluyError, getStatusCodeFromError } from "@veluy/shared";
import { formatError } from "./error-formatter";

import * as pkgJson from "../../package.json";
import type {
  AnyTransactionRoute,
  TransactionRouter,
  RouteHandlerOptions,
} from "../types";
import { IsDevelopment } from "./config";
import { makeRuntime } from "./runtime";
import { extractRouterConfig } from "./route-config";
import { CheckTransactionMD5Payload } from "./shared-schemas";

export class AdapterArguments extends Context.Tag("veluy/AdapterArguments")<
  AdapterArguments,
  Record<string, unknown>
>() {}

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
    const routerConfig = yield* extractRouterConfig(opts.router);

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
        router: routerConfig,
      });
    });

    const POST = Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;

      const { slug } = yield* HttpRouter.schemaParams(
        Schema.Struct({
          slug: Schema.String,
        }),
      );

      const route = opts.router[slug];
      if (!route) {
        const msg = `No route found for slug ${slug}`;
        yield* Effect.logError(msg);
        return yield* new VeluyError({
          code: "NOT_FOUND",
          message: msg,
        });
      }

      // Safely parse JSON body with error handling
      const body = yield* request.json.pipe(
        Effect.catchAll(() => Effect.succeed(null)),
      );

      yield* Effect.log("body", body);

      // handle body validation
      const { md5 } = yield* Schema.validate(CheckTransactionMD5Payload)(body);

      // Validate MD5 hash format (32 hex characters)
      if (!/^[a-f0-9]{32}$/i.test(md5)) {
        yield* Effect.logError("Invalid MD5 hash format").pipe(
          Effect.annotateLogs("receivedHash", md5),
        );
        return yield* HttpServerResponse.json(
          {
            error: "Invalid MD5 hash format",
            received: md5,
            expected:
              "32-character hexadecimal string (e.g., 'd41d8cd98f00b204e9800998ecf8427e')",
          },
          { status: 400 },
        );
      }

      // Mock banking API call - replace with actual banking API integration
      const client = yield* HttpClient.HttpClient;
      const bankingResponse = yield* HttpClientRequest.post(
        "http://localhost:9000/v1/check_transaction_by_md5",
      )
        .pipe(
          HttpClientRequest.setHeader("Authorization", "Bearer 123456789"),
          HttpClientRequest.bodyJson({
            md5: md5,
          }),
          Effect.flatMap(client.execute),
          Effect.flatMap((res) => res.json),
        )
        .pipe(Effect.provide(FetchHttpClient.layer));

      yield* Effect.log("bankingResponse$$", bankingResponse);

      // handle route callbacks

      const fiber = yield* Effect.gen(function* () {
        const adapterArgs = yield* AdapterArguments;
        const runMiddleware = yield* Effect.tryPromise({
          try: async () =>
            route.middleware({
              input: { md5 },
              ...adapterArgs,
            }),
          catch: (error) =>
            error instanceof VeluyError
              ? error
              : new VeluyError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "Failed to run middleware",
                  cause: error,
                }),
        }).pipe(Effect.tap(() => Effect.log("middleware done")));

        yield* Effect.tryPromise({
          try: async () =>
            route.onTransactionComplete({
              metadata: runMiddleware,
              transactionId: `tx_${Date.now()}`,
              md5,
              bankingResponse,
              ...adapterArgs,
            }),
          catch: (error) =>
            new VeluyError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                "Failed to run onUploadComplete. You probably shouldn't be throwing errors here.",
              cause: error,
            }),
        }).pipe(Effect.tap(() => Effect.log("onTransactionComplete done")));
      }).pipe(Effect.forkDaemon);

      yield* fiber.await;

      return yield* HttpServerResponse.json(
        {
          success: false,
          error: "Transaction processing failed",
        },
        { status: 500 },
      );
    }).pipe(
      Effect.catchTags({
        ParseError: (e) =>
          HttpServerResponse.json(
            formatError(
              new VeluyError({
                code: "BAD_REQUEST",
                message: "Invalid input",
                cause: e.message,
              }),
              opts.router,
            ),
            { status: 400 },
          ),
        VeluyError: (e) =>
          HttpServerResponse.json(formatError(e, opts.router), {
            status: getStatusCodeFromError(e),
          }),
      }),
      Effect.withLogSpan("POST_handler"),
    );

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
      Effect.catchAll(() => Effect.succeed(null)),
    );
  });
};
