import * as Micro from "effect/Micro";
import {
  InvalidFileSizeError,
  InvalidFileTypeError,
  InvalidRouteConfigError,
  InvalidURLError,
  UnknownFileTypeError,
} from "./tagged-errors";

import type {
  ExpandedRouteConfig,
  FileProperties,
  FileSize,
  Json,
  ResponseEsque,
  RouteConfig,
  Time,
  TimeShort,
} from "./types";

/** typesafe Object.keys */
export function objectKeys<T extends Record<string, unknown>>(
  obj: T,
): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function semverLite(required: string, toCheck: string) {
  // Pull out numbers from strings like `6.0.0`, `^6.4`, `~6.4.0`
  const semverRegex = /(\d+)\.?(\d+)?\.?(\d+)?/;
  const requiredMatch = semverRegex.exec(required);
  if (!requiredMatch?.[0]) {
    throw new Error(`Invalid semver requirement: ${required}`);
  }
  const toCheckMatch = semverRegex.exec(toCheck);
  if (!toCheckMatch?.[0]) {
    throw new Error(`Invalid semver to check: ${toCheck}`);
  }

  const [_1, rMajor, rMinor, rPatch] = requiredMatch;
  const [_2, cMajor, cMinor, cPatch] = toCheckMatch;

  if (required.startsWith("^")) {
    // Major must be equal, minor must be greater or equal
    if (rMajor !== cMajor) return false;
    if (rMinor && cMinor && rMinor > cMinor) return false;
    return true;
  }

  if (required.startsWith("~")) {
    // Major must be equal, minor must be equal
    if (rMajor !== cMajor) return false;
    if (rMinor !== cMinor) return false;
    return true;
  }

  // Exact match
  return rMajor === cMajor && rMinor === cMinor && rPatch === cPatch;
}

export function warnIfInvalidPeerDependency(
  pkg: string,
  required: string,
  toCheck: string,
) {
  if (!semverLite(required, toCheck)) {
    // eslint-disable-next-line no-console
    console.warn(
      `!!!WARNING::: ${pkg} requires "uploadthing@${required}", but version "${toCheck}" is installed`,
    );
  }
}

export const getRequestUrl = (req: Request) =>
  Micro.gen(function* () {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const protocol = proto.endsWith(":") ? proto : `${proto}:`;
    const url = yield* Micro.try({
      try: () => new URL(req.url, `${protocol}//${host}`),
      catch: () => new InvalidURLError(req.url),
    });
    url.search = "";
    return url;
  });

export const getFullApiUrl = (
  maybeUrl?: string,
): Micro.Micro<URL, InvalidURLError> =>
  Micro.gen(function* () {
    const base = (() => {
      if (typeof window !== "undefined") return window.location.origin;
      if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
      return "http://localhost:3000";
    })();

    const url = yield* Micro.try({
      try: () => new URL(maybeUrl ?? "/api/uploadthing", base),
      catch: () => new InvalidURLError(maybeUrl ?? "/api/uploadthing"),
    });

    if (url.pathname === "/") {
      url.pathname = "/api/uploadthing";
    }
    return url;
  });

/*
 * Returns a full URL to the dev's uploadthing endpoint
 * Can take either an origin, or a pathname, or a full URL
 * and will return the "closest" url matching the default
 * `<VERCEL_URL || localhost>/api/uploadthing`
 */
export const resolveMaybeUrlArg = (maybeUrl: string | URL | undefined): URL => {
  return maybeUrl instanceof URL
    ? maybeUrl
    : Micro.runSync(getFullApiUrl(maybeUrl));
};

export function parseTimeToSeconds(time: Time) {
  if (typeof time === "number") return time;

  const match = time.split(/(\d+)/).filter(Boolean);
  const num = Number(match[0]);
  const unit = (match[1] ?? "s").trim().slice(0, 1) as TimeShort;

  const multiplier = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  }[unit];

  return num * multiplier;
}

/**
 * Replacer for JSON.stringify that will replace numbers that cannot be
 * serialized to JSON with "reasonable equivalents".
 *
 * Infinity and -Infinity are replaced by MAX_SAFE_INTEGER and MIN_SAFE_INTEGER
 * NaN is replaced by 0
 *
 */
export const safeNumberReplacer = (_: string, value: unknown) => {
  if (typeof value !== "number") return value;
  if (
    Number.isSafeInteger(value) ||
    (value <= Number.MAX_SAFE_INTEGER && value >= Number.MIN_SAFE_INTEGER)
  ) {
    return value;
  }
  if (value === Infinity) return Number.MAX_SAFE_INTEGER;
  if (value === -Infinity) return Number.MIN_SAFE_INTEGER;
  if (Number.isNaN(value)) return 0;
};

export function noop() {
  // noop
}

export function createIdentityProxy<TObj extends Record<string, unknown>>() {
  return new Proxy(noop, {
    get: (_, prop) => prop,
  }) as unknown as TObj;
}

export function unwrap<T extends Json | PropertyKey, Param extends unknown[]>(
  x: T | ((...args: Param) => T),
  ...args: Param
) {
  return typeof x === "function" ? x(...args) : x;
}

export function filterDefinedObjectValues<T>(
  obj: Record<string, T | null | undefined>,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(obj).filter((pair): pair is [string, T] => pair[1] != null),
  );
}
