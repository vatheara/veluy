import type { Schema } from "effect/Schema";

import type {
  ErrorMessage,
  Json,
  JsonObject,
  MaybePromise,
  RouteOptions,
  Simplify,
  VeluyError,
} from "@veluy/shared";

import type { JsonParser } from "./parser";
import type { NewPresignedUrl, UploadActionPayload } from "./shared-schemas";

export type UTRegionAlias =
  | "bom1"
  | "icn1"
  | "syd1"
  | "can1"
  | "fra1"
  | "zrh1"
  | "dub1"
  | "cle1"
  | "sfo1"
  | "sea1";

/**
 * Marker used to select the region based on the incoming request
 */
export const UTRegion = Symbol("veluy-region-symbol");

/**
 * Marker used to append custom metadata to transaction data in `.middleware()`
 * @example
 * ```ts
 * .middleware((opts) => {
 *   return {
 *     [UTTransactionData]: {
 *       customId: generateId(),
 *       userId: opts.input.userId,
 *     }
 *   };
 * })
 * ```
 */
export const UTTransactionData = Symbol("veluy-transaction-data-symbol");

export type UnsetMarker = "unsetMarker" & {
  __brand: "unsetMarker";
};

export type ValidMiddlewareObject = {
  [UTRegion]?: UTRegionAlias;
  [UTTransactionData]?: Record<string, unknown>;
  [key: string]: unknown;
};

export interface AnyParams {
  _routeOptions: any;
  _input: {
    in: any;
    out: any;
  };
  _metadata: any; // imaginary field used to bind metadata return type to a transaction resolver
  _adapterFnArgs: Record<string, unknown>;
  _errorShape: any;
  _errorFn: any; // used for onTransactionError
  _output: any;
}

type MiddlewareFn<
  TInput extends Json | UnsetMarker,
  TOutput extends ValidMiddlewareObject,
  TArgs extends Record<string, unknown>,
> = (
  opts: TArgs & {
    input: TInput extends UnsetMarker ? undefined : TInput;
  },
) => MaybePromise<TOutput>;

// Transaction-related types
type TransactionCompleteFn<
  TMetadata,
  TOutput extends JsonObject | void,
  TArgs extends Record<string, unknown>,
> = (
  opts: TArgs & {
    metadata: TMetadata;
    transactionId: string;
    md5Hash: string;
    bankingResponse: any;
  },
) => MaybePromise<TOutput>;

type TransactionErrorFn<TArgs extends Record<string, unknown>> = (
  input: TArgs & {
    error: VeluyError;
    transactionId: string;
    md5Hash?: string;
  },
) => MaybePromise<void>;

export interface VeluyBuilder<TParams extends AnyParams> {
  input: <TIn extends Json, TOut>(
    parser: TParams["_input"]["in"] extends UnsetMarker
      ? JsonParser<TIn, TOut>
      : ErrorMessage<"input is already set">,
  ) => VeluyBuilder<{
    _routeOptions: TParams["_routeOptions"];
    _input: { in: TIn; out: TOut };
    _metadata: TParams["_metadata"];
    _adapterFnArgs: TParams["_adapterFnArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: TParams["_errorFn"];
    _output: UnsetMarker;
  }>;
  middleware: <TOutput extends ValidMiddlewareObject>(
    fn: TParams["_metadata"] extends UnsetMarker
      ? MiddlewareFn<
          TParams["_input"]["out"],
          TOutput,
          TParams["_adapterFnArgs"]
        >
      : ErrorMessage<"middleware is already set">,
  ) => VeluyBuilder<{
    _routeOptions: TParams["_routeOptions"];
    _input: TParams["_input"];
    _metadata: TOutput;
    _adapterFnArgs: TParams["_adapterFnArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: TParams["_errorFn"];
    _output: UnsetMarker;
  }>;
  onError: (
    fn: TParams["_errorFn"] extends UnsetMarker
      ? TransactionErrorFn<TParams["_adapterFnArgs"]>
      : ErrorMessage<"onTransactionError is already set">,
  ) => VeluyBuilder<{
    _routeOptions: TParams["_routeOptions"];
    _input: TParams["_input"];
    _metadata: TParams["_metadata"];
    _adapterFnArgs: TParams["_adapterFnArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: TransactionErrorFn<TParams["_adapterFnArgs"]>;
    _output: UnsetMarker;
  }>;
  onComplete: <TOutput extends JsonObject | void>(
    fn: TransactionCompleteFn<
      Simplify<
        TParams["_metadata"] extends UnsetMarker
          ? undefined
          : Omit<
              TParams["_metadata"],
              typeof UTTransactionData | typeof UTRegion
            >
      >,
      TOutput,
      TParams["_adapterFnArgs"]
    >,
  ) => TransactionRoute<{
    input: TParams["_input"]["in"] extends UnsetMarker
      ? undefined
      : TParams["_input"]["in"];
    output: TParams["_routeOptions"]["awaitServerData"] extends false
      ? null
      : TOutput extends void | undefined // JSON serialization
        ? null
        : TOutput;
    errorShape: TParams["_errorShape"];
  }>;
}

export type AnyBuiltTransactionTypes = {
  input: any;
  output: any;
  errorShape: any;
};

export interface TransactionRoute<TTypes extends AnyBuiltTransactionTypes> {
  $types: TTypes;
  routerConfig: any;
  routeOptions: RouteOptions;
  inputParser: JsonParser<any>;
  middleware: MiddlewareFn<any, ValidMiddlewareObject, any>;
  onError: TransactionErrorFn<any>;
  errorFormatter: (err: VeluyError) => any;
  onComplete: TransactionCompleteFn<any, any, any>;
}
export type AnyTransactionRoute = TransactionRoute<AnyBuiltTransactionTypes>;

/**
 * Map actionType to the required payload for that action
 * @todo Look into using @effect/rpc :thinking:
 */
export type UTEvents = {
  transaction: {
    in: { md5Hash: string };
    out: { status: string; verified: boolean };
  };
};

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type TransactionRouterInputConfig = Record<string, unknown>;
