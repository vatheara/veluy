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
import type { QRPayload } from "ts-khqr";

export type UnsetMarker = "unsetMarker" & {
  __brand: "unsetMarker";
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
  TOutput extends JsonObject,
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
  middleware: <TOutput extends JsonObject>(
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
          : TParams["_metadata"]
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
  routerConfig: QRPayload; 
  routeOptions: RouteOptions;
  inputParser: JsonParser<any>;
  middleware: MiddlewareFn<any, JsonObject, any>;
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
