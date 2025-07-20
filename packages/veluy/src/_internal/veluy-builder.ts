/**
 * Transaction Builder for Veluy
 *
 * Example usage for MD5 transaction checking:
 *
 * ```typescript
 * const transactionRoute = createBuilder()
 *   .input(z.object({ md5Hash: z.string() }))
 *   .middleware(async ({ input }) => {
 *     // Validate MD5 hash format
 *     if (!/^[a-f0-9]{32}$/i.test(input.md5Hash)) {
 *       throw new Error("Invalid MD5 hash format");
 *     }
 *     return { transactionId: generateTransactionId() };
 *   })
 *   .onTransactionComplete(async ({ metadata, md5Hash, bankingResponse }) => {
 *     // Handle successful transaction verification
 *     console.log(`Transaction ${metadata.transactionId} verified successfully`);
 *     return { status: "success", verified: true };
 *   })
 *   .onTransactionError(async ({ error, transactionId, md5Hash }) => {
 *     // Handle transaction verification errors
 *     console.error(`Transaction ${transactionId} failed:`, error.message);
 *   });
 * ```
 */

import type { Json, RouteOptions, VeluyError } from "@veluy/shared";

import { defaultErrorFormatter } from "./error-formatter";
import type {
  AnyBuiltTransactionTypes,
  AnyTransactionRoute,
  UnsetMarker,
  VeluyBuilder,
} from "./types";

function internalCreateBuilder<
  TAdapterFnArgs extends Record<string, unknown>,
  TRouteOptions extends RouteOptions,
  TErrorShape extends Json = { message: string },
>(
  initDef: Partial<AnyTransactionRoute> = {},
): VeluyBuilder<{
  _routeOptions: TRouteOptions;
  _input: { in: UnsetMarker; out: UnsetMarker };
  _metadata: UnsetMarker;
  _adapterFnArgs: TAdapterFnArgs;
  _errorShape: TErrorShape;
  _errorFn: UnsetMarker;
  _output: UnsetMarker;
}> {
  const _def: AnyTransactionRoute = {
    $types: {} as AnyBuiltTransactionTypes,
    // Default transaction config
    routerConfig: {
      transaction: {
        timeout: "30s",
      },
    },
    routeOptions: {
      awaitServerData: true,
    },

    inputParser: {
      parseAsync: () => Promise.resolve(undefined),
      _input: undefined,
      _output: undefined,
    },

    middleware: () => ({}),
    onTransactionError: () => {
      // noop
    },
    onTransactionComplete: () => undefined,

    errorFormatter: initDef.errorFormatter ?? defaultErrorFormatter,

    // Overload with properties passed in
    ...initDef,
  };

  return {
    input(userParser) {
      return internalCreateBuilder({
        ..._def,
        inputParser: userParser,
      }) as VeluyBuilder<any>;
    },
    middleware(userMiddleware) {
      return internalCreateBuilder({
        ..._def,
        middleware: userMiddleware,
      }) as VeluyBuilder<any>;
    },
    onTransactionComplete(userTransactionComplete) {
      return {
        ..._def,
        onTransactionComplete: userTransactionComplete,
      } as AnyTransactionRoute;
    },
    onTransactionError(userOnTransactionError) {
      return internalCreateBuilder({
        ..._def,
        onTransactionError: userOnTransactionError,
      }) as VeluyBuilder<any>;
    },
  };
}

export type CreateBuilderOptions<TErrorShape extends Json> = {
  errorFormatter: (err: VeluyError) => TErrorShape;
};

/**
 * Create a builder for your backend adapter.
 * Refer to the existing adapters for examples on how to use this function.
 * @public
 *
 * @param opts - Options for the builder
 * @returns A transaction route builder for making Veluy transaction routes
 */
export function createBuilder<
  TAdapterFnArgs extends Record<string, unknown>,
  TErrorShape extends Json = { message: string },
>(opts?: CreateBuilderOptions<TErrorShape>) {
  return <TRouteOptions extends RouteOptions>(
    input: any,
    config?: TRouteOptions,
  ): VeluyBuilder<{
    _routeOptions: TRouteOptions;
    _input: { in: UnsetMarker; out: UnsetMarker };
    _metadata: UnsetMarker;
    _adapterFnArgs: TAdapterFnArgs;
    _errorShape: TErrorShape;
    _errorFn: UnsetMarker;
    _output: UnsetMarker;
  }> => {
    return internalCreateBuilder<TAdapterFnArgs, TRouteOptions, TErrorShape>({
      routerConfig: input,
      routeOptions: config ?? {},
      ...opts,
    });
  };
}
