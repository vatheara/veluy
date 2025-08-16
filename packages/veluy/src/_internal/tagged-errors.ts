import * as Micro from "effect/Micro";
import * as Predicate from "effect/Predicate";

export class InvalidRouteConfigError
  extends /** #__PURE__ */ Micro.TaggedError("InvalidRouteConfig")<{
    reason: string;
  }>
{
  constructor(type: string, field?: string) {
    const reason = field
      ? `Expected route config to have a ${field} for key ${type} but none was found.`
      : `Encountered an invalid route config during backfilling. ${type} was not found.`;
    super({ reason });
  }
}

export class UnknownFileTypeError
  extends /** #__PURE__ */ Micro.TaggedError("UnknownFileType")<{
    reason: string;
  }>
{
  constructor(fileName: string) {
    const reason = `Could not determine type for ${fileName}`;
    super({ reason });
  }
}

export class InvalidFileTypeError
  extends /** #__PURE__ */ Micro.TaggedError("InvalidFileType")<{
    reason: string;
  }>
{
  constructor(fileType: string, fileName: string) {
    const reason = `File type ${fileType} not allowed for ${fileName}`;
    super({ reason });
  }
}

export class InvalidFileSizeError
  extends /** #__PURE__ */ Micro.TaggedError("InvalidFileSize")<{
    reason: string;
  }>
{
  constructor(fileSize: string) {
    const reason = `Invalid file size: ${fileSize}`;
    super({ reason });
  }
}

export class InvalidURLError
  extends /** #__PURE__ */ Micro.TaggedError("InvalidURL")<{
    reason: string;
  }>
{
  constructor(attemptedUrl: string) {
    super({ reason: `Failed to parse '${attemptedUrl}' as a URL.` });
  }
}

export class RetryError
  extends /** #__PURE__ */ Micro.TaggedError("RetryError") {}

export class FetchError
  extends /** #__PURE__ */ Micro.TaggedError("FetchError")<{
    readonly input: {
      url: string;
      method: string | undefined;
      body: unknown;
      headers: Record<string, string>;
    };
    readonly error: unknown;
  }> {}

export class InvalidJsonError
  extends /** #__PURE__ */ Micro.TaggedError("InvalidJson")<{
    readonly input: unknown;
    readonly error: unknown;
  }> {}

export class BadRequestError<T = unknown>
  extends /** #__PURE__ */ Micro.TaggedError("BadRequestError")<{
    readonly message: string;
    readonly status: number;
    readonly json: T;
  }>
{
  getMessage() {
    if (Predicate.isRecord(this.json)) {
      if (typeof this.json.message === "string") return this.json.message;
    }
    return this.message;
  }
}

export class VeluyPausedError
  extends /** #__PURE__ */ Micro.TaggedError("UploadAborted") {}

export class VeluyAbortedError
  extends /** #__PURE__ */ Micro.TaggedError("UploadAborted") {}

/**
 * =============================================================================
 * ======================== Bakong 12 Possible Error ============================
 * =============================================================================
 */

export class BakongTransactionNotFoundError extends Micro.TaggedError(
  "BakongTransactionNotFoundError"
) {}
export class BakongNotSupportStaticQRCodeError extends Micro.TaggedError(
  "BakongNotSupportStaticQRCodeError"
) {}
export class BakongTransactionFailedError extends Micro.TaggedError(
  "BakongTransactionFailedError"
) {}
export class BakongRequestDeeplinkError extends Micro.TaggedError(
  "BakongRequestDeeplinkError"
) {}
export class BakongMissingRequiredFieldError extends Micro.TaggedError(
  "BakongMissingRequiredFieldError"
) {}
export class BakongUnauthorizedError extends Micro.TaggedError(
  "BakongUnauthorizedError"
) {}
export class BakongEmailServerDownError extends Micro.TaggedError(
  "BakongEmailServerDownError"
) {}
export class BakongEmailRegisterError extends Micro.TaggedError(
  "BakongEmailRegisterError"
) {}
export class BakongCannotConnectToServerError extends Micro.TaggedError(
  "BakongCannotConnectToServerError"
) {}
export class BakongNotRegisteredError extends Micro.TaggedError(
  "BakongNotRegisteredError"
) {}
export class BakongAccountIdNotFoundError extends Micro.TaggedError(
  "BakongAccountIdNotFoundError"
) {}
export class BakongAccountIdInvalidError extends Micro.TaggedError(
  "BakongAccountIdInvalidError"
) {}
