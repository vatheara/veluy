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

            const { slug } = yield* HttpRouter.schemaParams(
                Schema.Struct({
                    slug: Schema.String,
                })
            );

            yield* Effect.log(slug);
            const isValidRoute = opts.router[slug];
            Effect.log(isValidRoute);
            if (!isValidRoute) {
                const msg = `No route found for slug ${slug}`;
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
                const routeKey = Object.keys(opts.router)[0];
                if (routeKey) {
                    const route = opts.router[routeKey];
                    const adapterArgs = yield* AdapterArguments.pipe(
                        Effect.catchAll(() => Effect.succeed({}))
                    );

                    try {
                        // Execute middleware for general requests
                        const metadata = route.middleware({
                            input: body || {},
                            ...adapterArgs,
                        });

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
            const verificationResult = yield* handleCheckTransaction(
                md5Hash
            ).pipe(Effect.either);

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
                        ...adapterArgs,
                    });

                    // Check if verification was successful
                    if (verificationResult._tag === "Right") {
                        const successData = verificationResult.right;

                        // Execute completion callback
                        const result = route.onTransactionComplete({
                            metadata,
                            transactionId:
                                successData.transactionId || `tx_${Date.now()}`,
                            md5Hash,
                            bankingResponse: successData,
                            ...adapterArgs,
                        });

                        return yield* HttpServerResponse.json({
                            status: {
                                code: 0, // Success
                                errorCode: null,
                                message: "Success",
                            },
                            data: {
                                ...successData,
                                callbackResult: result,
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
                            transactionId: `tx_${Date.now()}`,
                            md5Hash,
                            ...adapterArgs,
                        });

                        return yield* HttpServerResponse.json(errorResponse, {
                            status: 400,
                        });
                    }
                } catch (error) {
                    // Execute error callback
                    route.onTransactionError({
                        error: new VeluyError({
                            code: "INTERNAL_SERVER_ERROR",
                            message:
                                KHQR_ERROR_MESSAGES[
                                    KHQR_ERROR_CODES.TRANSACTION_FAILED
                                ],
                        }),
                        transactionId: `tx_${Date.now()}`,
                        md5Hash,
                        ...adapterArgs,
                    });

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
            const fallbackResult = yield* handleCheckTransaction(md5Hash).pipe(
                Effect.either
            );

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
    md5Hash: string
): Effect.Effect<TransactionVerificationData, BakongResponse> => {
    return Effect.gen(function* () {
        // Validate MD5 hash
        const validatedHash = yield* validateMD5Hash(md5Hash);

        try {
            // Mock transaction verification - replace with actual banking API
            const verificationData: TransactionVerificationData = {
                status: "verified",
                transactionId: `tx_${Date.now()}`,
                verified: true,
                timestamp: new Date().toISOString(),
                md5Hash: validatedHash,
            };

            return verificationData;
        } catch (error) {
            return yield* failBakong(
                KHQR_ERROR_CODES.CANNOT_CONNECT_TO_SERVER,
                KHQR_ERROR_MESSAGES[KHQR_ERROR_CODES.CANNOT_CONNECT_TO_SERVER]
            );
        }
    });
};

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
