import * as Micro from "effect/Micro";
import * as Predicate from "effect/Predicate";

import type { Json } from "./types";

const ERROR_CODES = {
  // Generic
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
  INTERNAL_CLIENT_ERROR: 500,
  UNAUTHORIZED: 401,
  TOO_MANY_REQUESTS: 429,

  // Veluy specific
  MISSING_ENV: 500,
  INVALID_SERVER_CONFIG: 500,
} as const;

type ErrorCode = keyof typeof ERROR_CODES;
type VeluyErrorOptions<T> = {
  code: keyof typeof ERROR_CODES;
  message?: string | undefined;
  cause?: unknown;
  data?: T;
};

function messageFromUnknown(cause: unknown, fallback?: string) {
  if (typeof cause === "string") {
    return cause;
  }
  if (cause instanceof Error) {
    return cause.message;
  }
  if (
    cause &&
    typeof cause === "object" &&
    "message" in cause &&
    typeof cause.message === "string"
  ) {
    return cause.message;
  }
  return fallback ?? "An unknown error occurred";
}

export interface SerializedUploadThingError {
  code: ErrorCode;
  message: string;
  data?: Json;
}

export class VeluyError<
  TShape extends Json = { message: string },
> extends Micro.Error<{ message: string }> {
  readonly _tag = "VeluyError";
  readonly name = "VeluyError";

  public readonly cause?: unknown;
  public readonly code: ErrorCode;
  public readonly data: TShape | undefined;

  constructor(initOpts: VeluyErrorOptions<TShape> | string) {
    const opts: VeluyErrorOptions<TShape> =
      typeof initOpts === "string"
        ? { code: "INTERNAL_SERVER_ERROR", message: initOpts }
        : initOpts;
    const message = opts.message ?? messageFromUnknown(opts.cause, opts.code);

    super({ message });
    this.code = opts.code;
    this.data = opts.data;

    if (opts.cause instanceof Error) {
      this.cause = opts.cause;
    } else if (
      Predicate.isRecord(opts.cause) &&
      Predicate.isNumber(opts.cause.status) &&
      Predicate.isString(opts.cause.statusText)
    ) {
      this.cause = new Error(
        `Response ${opts.cause.status} ${opts.cause.statusText}`,
      );
    } else if (Predicate.isString(opts.cause)) {
      this.cause = new Error(opts.cause);
    } else {
      this.cause = opts.cause;
    }
  }

  public static toObject(error: VeluyError): SerializedUploadThingError {
    return {
      code: error.code,
      message: error.message,
      data: error.data,
    };
  }

  public static serialize(error: VeluyError) {
    return JSON.stringify(VeluyError.toObject(error));
  }
}

export function getErrorTypeFromStatusCode(statusCode: number): ErrorCode {
  for (const [code, status] of Object.entries(ERROR_CODES)) {
    if (status === statusCode) {
      return code as ErrorCode;
    }
  }
  return "INTERNAL_SERVER_ERROR";
}

export function getStatusCodeFromError(error: VeluyError<any>) {
  return ERROR_CODES[error.code];
}

export const INTERNAL_DO_NOT_USE__fatalClientError = (e: Error) =>
  new VeluyError({
    code: "INTERNAL_CLIENT_ERROR",
    message: "Something went wrong. Please report this to Veluy.",
    cause: e,
  });
