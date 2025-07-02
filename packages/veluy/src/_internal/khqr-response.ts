import * as Effect from "effect/Effect";
import { VeluyError } from "@veluy/shared";

/**
 * Bakong KHQR Error Codes based on the standard response format
 */
export const KHQR_ERROR_CODES = {
    // Success and general codes
    SUCCESS: 0,
    FAILED: 1,

    // Bakong specific error codes (matching official documentation)
    BAKONG_ACCOUNT_ID_NULL: 1,
    MERCHANT_NAME_NULL: 2,
    BAKONG_ACCOUNT_ID_INVALID: 3,
    AMOUNT_INVALID: 4,
    MERCHANT_TYPE_NULL: 5,
    BAKONG_ACCOUNT_ID_LENGTH_INVALID: 6,
    MERCHANT_NAME_LENGTH_INVALID: 7,
    KHQR_INVALID: 8,
    CURRENCY_TYPE_NULL: 9,
    BILL_NUMBER_LENGTH_INVALID: 10,
    STORE_LABEL_LENGTH_INVALID: 11,
    TERMINAL_LABEL_LENGTH_INVALID: 12,
    BAKONG_API_UNREACHABLE: 13,
    DEEP_LINK_SOURCE_INVALID: 14,
    INTERNAL_SERVER_ERROR: 15,
    PAYLOAD_FORMAT_INDICATOR_LENGTH_INVALID: 16,
    POINT_OF_INITIATION_LENGTH_INVALID: 17,
    MERCHANT_CATEGORY_LENGTH_INVALID: 18,
    TRANSACTION_CURRENCY_LENGTH_INVALID: 19,
    COUNTRY_CODE_LENGTH_INVALID: 20,
    MERCHANT_CITY_LENGTH_INVALID: 21,
    CRC_LENGTH_INVALID: 22,
    PAYLOAD_FORMAT_INDICATOR_NULL: 23,
    CRC_NULL: 24,
    MERCHANT_CATEGORY_NULL: 25,
    COUNTRY_CODE_NULL: 26,
    MERCHANT_CITY_NULL: 27,
    UNSUPPORTED_CURRENCY: 28,
    DEEP_LINK_URL_INVALID: 29,
    MERCHANT_ID_NULL: 30,
    ACQUIRING_BANK_NULL: 31,
    MERCHANT_ID_LENGTH_INVALID: 32,
    ACQUIRING_BANK_LENGTH_INVALID: 33,
    MOBILE_NUMBER_LENGTH_INVALID: 34,
    TAG_NOT_IN_ORDER: 35,
    ACCOUNT_INFORMATION_LENGTH_INVALID: 36,
    MERCHANT_ALTERNATE_LANGUAGE_PREFERENCE_NULL: 37,
    MERCHANT_ALTERNATE_LANGUAGE_PREFERENCE_LENGTH_INVALID: 38,
    MERCHANT_NAME_ALTERNATE_LANGUAGE_NULL: 39,
    MERCHANT_NAME_ALTERNATE_LANGUAGE_LENGTH_INVALID: 40,
    MERCHANT_CITY_ALTERNATE_LANGUAGE_LENGTH_INVALID: 41,
    PURPOSE_OF_TRANSACTION_LENGTH_INVALID: 42,
    UPI_ACCOUNT_INFORMATION_LENGTH_INVALID: 43,
} as const;

/**
 * Error messages corresponding to each error code
 */
export const KHQR_ERROR_MESSAGES: Record<number, string> = {
    [KHQR_ERROR_CODES.SUCCESS]: "Success",
    [KHQR_ERROR_CODES.BAKONG_ACCOUNT_ID_NULL]:
        "Bakong Account ID cannot be null or empty",
    [KHQR_ERROR_CODES.MERCHANT_NAME_NULL]:
        "Merchant name cannot be null or empty",
    [KHQR_ERROR_CODES.BAKONG_ACCOUNT_ID_INVALID]:
        "Bakong Account ID is invalid",
    [KHQR_ERROR_CODES.AMOUNT_INVALID]: "Amount is invalid",
    [KHQR_ERROR_CODES.MERCHANT_TYPE_NULL]:
        "Merchant type cannot be null or empty",
    [KHQR_ERROR_CODES.BAKONG_ACCOUNT_ID_LENGTH_INVALID]:
        "Bakong Account ID Length is invalid",
    [KHQR_ERROR_CODES.MERCHANT_NAME_LENGTH_INVALID]:
        "Merchant Name Length is invalid",
    [KHQR_ERROR_CODES.KHQR_INVALID]: "KHQR provided is invalid",
    [KHQR_ERROR_CODES.CURRENCY_TYPE_NULL]:
        "Currency type cannot be null or empty",
    [KHQR_ERROR_CODES.BILL_NUMBER_LENGTH_INVALID]:
        "Bill Number Length is invalid",
    [KHQR_ERROR_CODES.STORE_LABEL_LENGTH_INVALID]:
        "Store Label Length is invalid",
    [KHQR_ERROR_CODES.TERMINAL_LABEL_LENGTH_INVALID]:
        "Terminal Label Length is invalid",
    [KHQR_ERROR_CODES.BAKONG_API_UNREACHABLE]:
        "Cannot reach Bakong Open API service. Please check internet connection",
    [KHQR_ERROR_CODES.DEEP_LINK_SOURCE_INVALID]:
        "Source Info for Deep Link is invalid",
    [KHQR_ERROR_CODES.INTERNAL_SERVER_ERROR]: "Internal Server Error",
    [KHQR_ERROR_CODES.PAYLOAD_FORMAT_INDICATOR_LENGTH_INVALID]:
        "Payload Format Indicator Length is invalid",
    [KHQR_ERROR_CODES.POINT_OF_INITIATION_LENGTH_INVALID]:
        "Point of Initiation Length is invalid",
    [KHQR_ERROR_CODES.MERCHANT_CATEGORY_LENGTH_INVALID]:
        "Merchant Category Length is invalid",
    [KHQR_ERROR_CODES.TRANSACTION_CURRENCY_LENGTH_INVALID]:
        "Transaction Currency Length is invalid",
    [KHQR_ERROR_CODES.COUNTRY_CODE_LENGTH_INVALID]:
        "Country Code Length is invalid",
    [KHQR_ERROR_CODES.MERCHANT_CITY_LENGTH_INVALID]:
        "Merchant City Length is invalid",
    [KHQR_ERROR_CODES.CRC_LENGTH_INVALID]: "CRC Length is invalid",
    [KHQR_ERROR_CODES.PAYLOAD_FORMAT_INDICATOR_NULL]:
        "Payload Format Indicator cannot be null or empty",
    [KHQR_ERROR_CODES.CRC_NULL]: "CRC cannot be null or empty",
    [KHQR_ERROR_CODES.MERCHANT_CATEGORY_NULL]:
        "Merchant Category cannot be null or empty",
    [KHQR_ERROR_CODES.COUNTRY_CODE_NULL]:
        "Country Code cannot be null or empty",
    [KHQR_ERROR_CODES.MERCHANT_CITY_NULL]:
        "Merchant City cannot be null or empty",
    [KHQR_ERROR_CODES.UNSUPPORTED_CURRENCY]: "Unsupported currency",
    [KHQR_ERROR_CODES.DEEP_LINK_URL_INVALID]: "Deep Link URL is not valid",
    [KHQR_ERROR_CODES.MERCHANT_ID_NULL]: "Merchant ID cannot be null or empty",
    [KHQR_ERROR_CODES.ACQUIRING_BANK_NULL]:
        "Acquiring Bank cannot be null or empty",
    [KHQR_ERROR_CODES.MERCHANT_ID_LENGTH_INVALID]:
        "Merchant ID Length is invalid",
    [KHQR_ERROR_CODES.ACQUIRING_BANK_LENGTH_INVALID]:
        "Acquiring Bank Length is invalid",
    [KHQR_ERROR_CODES.MOBILE_NUMBER_LENGTH_INVALID]:
        "Mobile Number Length is invalid",
    [KHQR_ERROR_CODES.TAG_NOT_IN_ORDER]: "Tag not in order",
    [KHQR_ERROR_CODES.ACCOUNT_INFORMATION_LENGTH_INVALID]:
        "Account information length is invalid",
    [KHQR_ERROR_CODES.MERCHANT_ALTERNATE_LANGUAGE_PREFERENCE_NULL]:
        "Merchant Alternate Language Preference cannot be null or empty",
    [KHQR_ERROR_CODES.MERCHANT_ALTERNATE_LANGUAGE_PREFERENCE_LENGTH_INVALID]:
        "Merchant Alternate Language Preference Length is invalid",
    [KHQR_ERROR_CODES.MERCHANT_NAME_ALTERNATE_LANGUAGE_NULL]:
        "Merchant Name Alternate Language cannot be null or empty",
    [KHQR_ERROR_CODES.MERCHANT_NAME_ALTERNATE_LANGUAGE_LENGTH_INVALID]:
        "Merchant Name Alternate Language Length is invalid",
    [KHQR_ERROR_CODES.MERCHANT_CITY_ALTERNATE_LANGUAGE_LENGTH_INVALID]:
        "Merchant City Alternate Language Length is invalid",
    [KHQR_ERROR_CODES.PURPOSE_OF_TRANSACTION_LENGTH_INVALID]:
        "Purpose of Transaction Length is invalid",
    [KHQR_ERROR_CODES.UPI_ACCOUNT_INFORMATION_LENGTH_INVALID]:
        "Upi Account Information Length is invalid",
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
export const createSuccessResponse = <T>(data: T): BakongResponse<T> => ({
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
export const createErrorResponse = (
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
export const successResponse = <T>(data: T) =>
    Effect.succeed(createSuccessResponse(data));

/**
 * Effect-based error response creator
 */
export const errorResponse = (errorCode: number, customMessage?: string) =>
    Effect.fail(createErrorResponse(errorCode, customMessage));
