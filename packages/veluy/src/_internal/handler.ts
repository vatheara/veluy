import {
  HttpApp,
  HttpRouter,
  HttpServerResponse,
} from "@effect/platform";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

import { VeluyError } from "@veluy/shared";

import * as pkgJson from "../../package.json";
import type { AnyFileRoute, FileRouter, RouteHandlerOptions } from "../types";
import { IsDevelopment } from "./config";
import { extractRouterConfig } from "./route-config";
import { makeRuntime } from "./runtime";

export class AdapterArguments extends Context.Tag(
  "uploadthing/AdapterArguments",
)<AdapterArguments, Record<string, unknown>>() {}

/**
 * Create a request handler adapter for any framework or server library.
 * Refer to the existing adapters for examples on how to use this function.
 * @public
 *
 * @param makeAdapterArgs - Function that takes the args from your framework and returns an Effect that resolves to the adapter args.
 * These args are passed to the `.middleware`, `.onUploadComplete`, and `.onUploadError` hooks.
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
  opts: RouteHandlerOptions<FileRouter>,
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
    createRequestHandler(opts, beAdapter ?? "custom").pipe(
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

export const createRequestHandler = <TRouter extends Record<string, AnyFileRoute>>(
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
      return yield* HttpServerResponse.json(routerConfig);
    });


    const appendResponseHeaders = Effect.map(
      HttpServerResponse.setHeader("x-veluy-version", pkgJson.version),
    );

    return HttpRouter.empty.pipe(
      HttpRouter.get("*", GET),
      HttpRouter.use(appendResponseHeaders),
    );
  }).pipe(Effect.withLogSpan("createRequestHandler"));
