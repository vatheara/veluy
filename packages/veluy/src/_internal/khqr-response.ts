import * as Effect from "effect/Effect";

/**
 * Bakong KHQR Error Codes based on the standard response format
 */
export const KHQR_ERROR_CODES = {
    // Status codes (Custom Code -> Code Int)
    SUCCESS: 0,
    FAIL: 1,

    // Error codes (Error Code -> Int)
    TRANSACTION_NOT_FOUND: 1,
    STATIC_QR_NOT_SUPPORTED: 2,
    TRANSACTION_FAILED: 3,
    DEEPLINK_REQUEST_ERROR: 4,
    MISSING_REQUIRED_FIELDS: 5,
    UNAUTHORIZED: 6,
    EMAIL_SERVER_DOWN: 7,
    EMAIL_ALREADY_REGISTERED: 8,
    CANNOT_CONNECT_TO_SERVER: 9,
    NOT_REGISTERED: 10,
    ACCOUNT_ID_NOT_FOUND: 11,
    ACCOUNT_ID_INVALID: 12,
} as const;

/**
 * Error messages corresponding to each error code
 */
export const KHQR_ERROR_MESSAGES: Record<number, string> = {
    [KHQR_ERROR_CODES.SUCCESS]: "Success",
    [KHQR_ERROR_CODES.TRANSACTION_NOT_FOUND]:
        "Transaction could not be found. Please try again.",
    [KHQR_ERROR_CODES.STATIC_QR_NOT_SUPPORTED]:
        "Sorry, the system does not support static QR code.",
    [KHQR_ERROR_CODES.TRANSACTION_FAILED]: "Transaction failed.",
    [KHQR_ERROR_CODES.DEEPLINK_REQUEST_ERROR]:
        "Error occurred on requesting deeplink from provider.",
    [KHQR_ERROR_CODES.MISSING_REQUIRED_FIELDS]: "Missing required fields.",
    [KHQR_ERROR_CODES.UNAUTHORIZED]: "Unauthorized.",
    [KHQR_ERROR_CODES.EMAIL_SERVER_DOWN]: "Email server has been down.",
    [KHQR_ERROR_CODES.EMAIL_ALREADY_REGISTERED]:
        "Email has been registered already.",
    [KHQR_ERROR_CODES.CANNOT_CONNECT_TO_SERVER]:
        "Cannot connect to server. Please try again later.",
    [KHQR_ERROR_CODES.NOT_REGISTERED]: "Not registered yet.",
    [KHQR_ERROR_CODES.ACCOUNT_ID_NOT_FOUND]: "Account ID not found.",
    [KHQR_ERROR_CODES.ACCOUNT_ID_INVALID]: "Account ID is invalid.",
};

/**
 * Standard Bakong response structure
 */
export interface BakongResponse<T = any> {
    status: {
        code: 0 | 1; // 0 = Success, 1 = Failed
        errorCode: number | null;
        message: string;
    };
    data?: T;
}

/**
 * KHQR Generation Response Data
 */
export interface KHQRData {
    qr: string;
}

/**
 * Transaction verification response data
 */
export interface TransactionVerificationData {
    status: string;
    transactionId: string;
    verified: boolean;
    timestamp: string;
    md5Hash?: string;
}

/**
 * Create a success response following Bakong standard format
 */
export const bakongSuccess = <T>(data: T): BakongResponse<T> => ({
    status: {
        code: 0, // Success
        errorCode: null,
        message: "Success",
    },
    data,
});

/**
 * Create an error response following Bakong standard format
 */
export const bakongError = (
    errorCode: number,
    customMessage?: string
): BakongResponse => ({
    status: {
        code: 1, // Failed
        errorCode,
        message:
            customMessage || KHQR_ERROR_MESSAGES[errorCode] || "Unknown error",
    },
});

/**
 * Effect-based success response creator
 */
export const succeedBakong = <T>(data: T) =>
    Effect.succeed(bakongSuccess(data));

/**
 * Effect-based error response creator
 */
export const failBakong = (errorCode: number, customMessage?: string) =>
    Effect.fail(bakongError(errorCode, customMessage));
