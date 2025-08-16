import {
    HttpApp,
    HttpRouter,
    HttpServerResponse,
    HttpServerRequest,
} from "@effect/platform";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

import { VeluyError, getStatusCodeFromError } from "@veluy/shared";
import { formatError } from "./error-formatter";
import {
    BakongResponse,
    bakongError,
    failBakong,
    KHQR_ERROR_CODES,
    KHQR_ERROR_MESSAGES,
    TransactionVerificationData,
} from "./khqr-response";

import * as pkgJson from "../../package.json";
import type {
    AnyTransactionRoute,
    TransactionRouter,
    RouteHandlerOptions,
} from "../types";
import { IsDevelopment } from "./config";
import { makeRuntime } from "./runtime";
import { extractRouterConfig } from "./route-config";

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
    beAdapter?: string
): ((...args: Args) => Promise<Response>) => {
    const managed = makeRuntime(
        opts.config?.fetch as typeof globalThis.fetch,
        opts.config
    );
    const handle = Effect.promise(() =>
        managed.runtime().then(HttpApp.toWebHandlerRuntime)
    );

    const app = (...args: Args) =>
        Effect.map(
            Effect.promise(() =>
                managed.runPromise(
                    createRequestHandler(opts, beAdapter ?? "custom")
                )
            ),
            Effect.provideServiceEffect(
                AdapterArguments,
                makeAdapterArgs(...args)
            )
        );

    return async (...args: Args) => {
        const result = await handle.pipe(
            Effect.ap(app(...args)),
            Effect.ap(toRequest(...args)),
            Effect.withLogSpan("requestHandler"),
            managed.runPromise
        );

        return result;
    };
};

export const createRequestHandler = <
    TRouter extends Record<string, AnyTransactionRoute>,
>(
    opts: RouteHandlerOptions<TRouter>,
    beAdapter: string
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
                message:
                    'handleDaemonPromise: "await" is forbidden in development.',
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

            // Use the first configured route by default (no slug required)
            const routeKeyToUse = Object.keys(opts.router)[0];

            if (!routeKeyToUse) {
                const msg = "No routes configured";
                yield* Effect.logError(msg);
                return yield* new VeluyError({
                    code: "NOT_FOUND",
                    message: msg,
                });
            }

            // Safely parse JSON body with error handling
            const body = yield* request.json.pipe(
                Effect.catchAll(() => Effect.succeed(null))
            );

            // Check if this is a transaction verification request (has md5Hash)
            const isTransactionVerification = body && body.md5Hash;

            if (!isTransactionVerification) {
                // Handle non-transaction requests with original format
                const routeKey = routeKeyToUse;
                if (routeKey) {
                    const route = opts.router[routeKey];
                    const adapterArgs = yield* AdapterArguments.pipe(
                        Effect.catchAll(() => Effect.succeed({}))
                    );

                    try {
                        // Execute middleware for general requests (sync/async)
                        const metadata = yield* Effect.promise(() =>
                            Promise.resolve(
                                route.middleware({
                                    input: body || {},
                                    ...adapterArgs,
                                })
                            )
                        );

                        return yield* HttpServerResponse.json({
                            message: "Veluy endpoint ready",
                            status: "active",
                            timestamp: new Date().toISOString(),
                            metadata,
                        });
                    } catch (error) {
                        return yield* HttpServerResponse.json(
                            {
                                error: "Failed to process request",
                                message:
                                    error instanceof Error
                                        ? error.message
                                        : "Unknown error",
                            },
                            { status: 500 }
                        );
                    }
                }

                // Fallback for requests without valid routes
                return yield* HttpServerResponse.json({
                    message: "Veluy API endpoint",
                    status: "ready",
                    timestamp: new Date().toISOString(),
                });
            }

            // Transaction verification logic (Bakong format)
            if (!body.md5Hash) {
                yield* Effect.logError("Missing md5Hash in request body").pipe(
                    Effect.annotateLogs("receivedBody", body)
                );
                return yield* HttpServerResponse.json(
                    bakongError(
                        KHQR_ERROR_CODES.MISSING_REQUIRED_FIELDS,
                        KHQR_ERROR_MESSAGES[
                            KHQR_ERROR_CODES.MISSING_REQUIRED_FIELDS
                        ]
                    ),
                    { status: 400 }
                );
            }

            const md5Hash = body.md5Hash as string;

            // Validate MD5 hash format (32 hex characters)
            if (!/^[a-f0-9]{32}$/i.test(md5Hash)) {
                yield* Effect.logError("Invalid MD5 hash format").pipe(
                    Effect.annotateLogs("receivedHash", md5Hash)
                );
                return yield* HttpServerResponse.json(
                    bakongError(
                        KHQR_ERROR_CODES.MISSING_REQUIRED_FIELDS,
                        KHQR_ERROR_MESSAGES[
                            KHQR_ERROR_CODES.MISSING_REQUIRED_FIELDS
                        ]
                    ),
                    { status: 400 }
                );
            }

            // Use the new transaction verification system
            const verificationResult = yield* handleCheckTransaction(md5Hash, {
                bankingApiUrl: opts.config?.bankingApiUrl,
                verifyEndpoint: (opts.config as any)?.verifyEndpoint,
                verifyMethod: (opts.config as any)?.verifyMethod,
                token: opts.config?.token,
                fetch: opts.config?.fetch as any,
            }).pipe(Effect.either);

            // Get first route for callbacks
            const routeKey = routeKeyToUse;
            if (routeKey) {
                const route = opts.router[routeKey];
                const adapterArgs = yield* AdapterArguments.pipe(
                    Effect.catchAll(() => Effect.succeed({}))
                );

                try {
                    // Execute middleware (supports sync or async)
                    const metadata = yield* Effect.promise(() =>
                        Promise.resolve(
                            route.middleware({
                                input: { md5Hash },
                                ...adapterArgs,
                            })
                        )
                    );

                    // Check if verification was successful
                    if (verificationResult._tag === "Right") {
                        const successData = verificationResult.right;

                        // Try to execute completion callback, but do not fail the response if it throws
                        let callbackResult: unknown = undefined;
                        try {
                            callbackResult = yield* Effect.promise(() =>
                                Promise.resolve(
                                    route.onTransactionComplete({
                                        metadata,
                                        transactionId:
                                            successData.transactionId,
                                        md5Hash,
                                        bankingResponse: successData,
                                        ...adapterArgs,
                                    })
                                )
                            );
                        } catch (err) {
                            // Best-effort error callback; don't break success flow
                            yield* Effect.promise(() =>
                                Promise.resolve(
                                    route.onTransactionError({
                                        error: new VeluyError({
                                            code: "INTERNAL_SERVER_ERROR",
                                            message: "Callback error",
                                            cause: err,
                                        }),
                                        transactionId:
                                            successData.transactionId,
                                        md5Hash,
                                        ...adapterArgs,
                                    })
                                )
                            ).pipe(Effect.ignore);
                        }

                        return yield* HttpServerResponse.json({
                            status: {
                                code: 0, // Success
                                errorCode: null,
                                message: "Success",
                            },
                            data: {
                                ...successData,
                                callbackResult,
                            },
                        });
                    } else {
                        // Verification failed, execute error callback
                        const errorResponse = verificationResult.left;

                        route.onTransactionError({
                            error: new VeluyError({
                                code: "BAD_REQUEST",
                                message: errorResponse.status.message,
                            }),
                            md5Hash,
                            ...adapterArgs,
                        });

                        return yield* HttpServerResponse.json(errorResponse, {
                            status: 400,
                        });
                    }
                } catch (error) {
                    // Execute error callback
                    yield* Effect.promise(() =>
                        Promise.resolve(
                            route.onTransactionError({
                                error: new VeluyError({
                                    code: "INTERNAL_SERVER_ERROR",
                                    message:
                                        KHQR_ERROR_MESSAGES[
                                            KHQR_ERROR_CODES.TRANSACTION_FAILED
                                        ],
                                }),
                                md5Hash,
                                ...adapterArgs,
                            })
                        )
                    );

                    return yield* HttpServerResponse.json(
                        bakongError(
                            KHQR_ERROR_CODES.TRANSACTION_FAILED,
                            KHQR_ERROR_MESSAGES[
                                KHQR_ERROR_CODES.TRANSACTION_FAILED
                            ]
                        ),
                        { status: 500 }
                    );
                }
            }

            // Fallback response if no routes are found
            const fallbackResult = yield* handleCheckTransaction(md5Hash, {
                bankingApiUrl: opts.config?.bankingApiUrl,
                verifyEndpoint: (opts.config as any)?.verifyEndpoint,
                verifyMethod: (opts.config as any)?.verifyMethod,
                token: opts.config?.token,
                fetch: opts.config?.fetch as any,
            }).pipe(Effect.either);

            if (fallbackResult._tag === "Right") {
                return yield* HttpServerResponse.json({
                    status: {
                        code: 0, // Success
                        errorCode: null,
                        message: "Success",
                    },
                    data: fallbackResult.right,
                });
            } else {
                return yield* HttpServerResponse.json(fallbackResult.left, {
                    status: 400,
                });
            }
        }).pipe(
            Effect.catchAll((e) => {
                // Handle all errors with Bakong response format
                return HttpServerResponse.json(
                    bakongError(
                        KHQR_ERROR_CODES.TRANSACTION_FAILED,
                        KHQR_ERROR_MESSAGES[KHQR_ERROR_CODES.TRANSACTION_FAILED]
                    ),
                    { status: 500 }
                );
            })
        );

        const appendResponseHeaders = Effect.map(
            HttpServerResponse.setHeader("x-veluy-version", pkgJson.version)
        );

        return HttpRouter.empty.pipe(
            HttpRouter.get("*", GET),
            HttpRouter.post("*", POST),
            HttpRouter.use(appendResponseHeaders)
        );
    }).pipe(Effect.withLogSpan("createRequestHandler"));

const handleCheckTransaction = (
    md5Hash: string,
    cfg: {
        bankingApiUrl?: string;
        verifyEndpoint?: string;
        verifyMethod?: "GET" | "POST";
        token?: string;
        tokenHeader?: string;
        tokenPrefix?: string;
        verifyQueryParamName?: string;
        fetch?: typeof fetch;
    }
): Effect.Effect<TransactionVerificationData, BakongResponse> => {
    return Effect.gen(function* () {
        // Validate MD5 hash
        const validatedHash = yield* validateMD5Hash(md5Hash);

        // Build request
        const baseUrl =
            (typeof cfg.bankingApiUrl === "string" &&
                cfg.bankingApiUrl.replace(/\/$/, "")) ||
            "https://api-bakong.nbc.gov.kh";
        const verifyEndpoint = cfg.verifyEndpoint || "/pg/check-transaction";
        const method: "GET" | "POST" = cfg.verifyMethod || "POST";
        const token = cfg.token;
        const tokenHeader = cfg.tokenHeader || "Authorization";
        const tokenPrefix = cfg.tokenPrefix ?? "Bearer";
        const verifyQueryParamName = cfg.verifyQueryParamName || "md5Hash";

        const url =
            method === "GET"
                ? `${baseUrl}${verifyEndpoint}?${encodeURIComponent(
                      verifyQueryParamName
                  )}=${encodeURIComponent(validatedHash)}`
                : `${baseUrl}${verifyEndpoint}`;

        const doFetch = cfg.fetch ?? fetch;

        const headers: Record<string, string> = {};
        if (method === "POST") {
            headers["Content-Type"] = "application/json";
        }
        if (token) {
            headers[tokenHeader] = tokenPrefix
                ? `${tokenPrefix} ${token}`
                : token;
        }

        const res = yield* Effect.tryPromise({
            try: () =>
                doFetch(url, {
                    method,
                    headers,
                    body:
                        method === "POST"
                            ? JSON.stringify({
                                  [verifyQueryParamName]: validatedHash,
                              })
                            : undefined,
                } as RequestInit),
            catch: (e) => e as Error,
        }).pipe(
            Effect.catchAll(() =>
                failBakong(
                    KHQR_ERROR_CODES.CANNOT_CONNECT_TO_SERVER,
                    KHQR_ERROR_MESSAGES[
                        KHQR_ERROR_CODES.CANNOT_CONNECT_TO_SERVER
                    ]
                )
            )
        );

        // Map HTTP errors to Bakong error codes
        if (!res.ok) {
            const code = mapHttpStatusToErrorCode(res.status);
            return yield* failBakong(code, KHQR_ERROR_MESSAGES[code]);
        }

        // Parse JSON body
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            return yield* failBakong(
                KHQR_ERROR_CODES.TRANSACTION_FAILED,
                KHQR_ERROR_MESSAGES[KHQR_ERROR_CODES.TRANSACTION_FAILED]
            );
        }

        const json: any = yield* Effect.tryPromise({
            try: () => res.json(),
            catch: (e) => e as Error,
        }).pipe(
            Effect.catchAll(() =>
                failBakong(
                    KHQR_ERROR_CODES.TRANSACTION_FAILED,
                    KHQR_ERROR_MESSAGES[KHQR_ERROR_CODES.TRANSACTION_FAILED]
                )
            )
        );

        // If response already matches our BakongResponse envelope
        if (
            json &&
            json.status &&
            typeof json.status.code === "number" &&
            (json.status.code === 0 || json.status.code === 1)
        ) {
            if (json.status.code === 0) {
                // Success, try to map data if present
                const mapped: TransactionVerificationData = mapVerificationData(
                    json.data ?? {},
                    validatedHash
                );
                return mapped;
            } else {
                return yield* failBakong(
                    json.status.errorCode ??
                        KHQR_ERROR_CODES.TRANSACTION_FAILED,
                    json.status.message ||
                        KHQR_ERROR_MESSAGES[
                            json.status.errorCode ??
                                KHQR_ERROR_CODES.TRANSACTION_FAILED
                        ]
                );
            }
        }

        // Otherwise, attempt to map from Bakong Open API transaction info format
        const mapped: TransactionVerificationData = mapVerificationData(
            json,
            validatedHash
        );
        return mapped;
    });
};

function mapHttpStatusToErrorCode(status: number): number {
    switch (status) {
        case 400:
            return KHQR_ERROR_CODES.MISSING_REQUIRED_FIELDS;
        case 401:
            return KHQR_ERROR_CODES.UNAUTHORIZED;
        case 403:
            return KHQR_ERROR_CODES.UNAUTHORIZED;
        case 404:
            return KHQR_ERROR_CODES.TRANSACTION_NOT_FOUND;
        case 429:
            return KHQR_ERROR_CODES.CANNOT_CONNECT_TO_SERVER;
        case 500:
        default:
            return KHQR_ERROR_CODES.TRANSACTION_FAILED;
    }
}

function mapVerificationData(
    json: any,
    md5Hash: string
): TransactionVerificationData {
    // Attempt to normalize a few likely shapes
    const statusField = (
        json?.status ??
        json?.Status ??
        json?.result ??
        ""
    ).toString();
    const isVerified =
        typeof json?.verified === "boolean"
            ? json.verified
            : /success/i.test(statusField);
    const transactionId =
        (json?.transactionId ?? json?.TransactionId ?? json?.transaction_id) ||
        undefined;
    const timestamp =
        (json?.timestamp ?? json?.TransactionDate ?? json?.date) || undefined;
    return {
        status: statusField || (isVerified ? "Success" : "Failed"),
        transactionId,
        verified: Boolean(isVerified),
        timestamp,
        md5Hash,
    };
}

const validateMD5Hash = (
    hash: string
): Effect.Effect<string, BakongResponse> => {
    if (!hash) {
        return failBakong(
            KHQR_ERROR_CODES.MISSING_REQUIRED_FIELDS,
            KHQR_ERROR_MESSAGES[KHQR_ERROR_CODES.MISSING_REQUIRED_FIELDS]
        );
    }

    if (!/^[a-f0-9]{32}$/i.test(hash)) {
        return failBakong(
            KHQR_ERROR_CODES.MISSING_REQUIRED_FIELDS,
            KHQR_ERROR_MESSAGES[KHQR_ERROR_CODES.MISSING_REQUIRED_FIELDS]
        );
    }

    return Effect.succeed(hash);
};
