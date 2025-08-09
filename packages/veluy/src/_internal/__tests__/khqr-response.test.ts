import { describe, it, expect } from "vitest";
import {
    bakongSuccess,
    bakongError,
    KHQR_ERROR_CODES,
    KHQR_ERROR_MESSAGES,
} from "../khqr-response";

describe("khqr-response", () => {
    it("bakongSuccess returns success envelope", () => {
        const data = { foo: "bar" };
        const res = bakongSuccess(data);
        expect(res.status.code).toBe(0);
        expect(res.status.errorCode).toBeNull();
        expect(res.status.message).toBe("Success");
        expect(res.data).toEqual(data);
    });

    it("bakongError returns error envelope with mapped message", () => {
        const code = KHQR_ERROR_CODES.MISSING_REQUIRED_FIELDS;
        const res = bakongError(code);
        expect(res.status.code).toBe(1);
        expect(res.status.errorCode).toBe(code);
        expect(res.status.message).toBe(KHQR_ERROR_MESSAGES[code]);
        expect(res.data).toBeUndefined();
    });

    it("bakongError allows overriding message", () => {
        const code = KHQR_ERROR_CODES.TRANSACTION_FAILED;
        const custom = "Custom failure";
        const res = bakongError(code, custom);
        expect(res.status.message).toBe(custom);
    });

    it("KHQR_ERROR_CODES messages match provided spec", () => {
        const mapping: Array<[number, string]> = [
            [
                KHQR_ERROR_CODES.TRANSACTION_NOT_FOUND,
                "Transaction could not be found. Please try again.",
            ],
            [
                KHQR_ERROR_CODES.STATIC_QR_NOT_SUPPORTED,
                "Sorry, the system does not support static QR code.",
            ],
            [KHQR_ERROR_CODES.TRANSACTION_FAILED, "Transaction failed."],
            [
                KHQR_ERROR_CODES.DEEPLINK_REQUEST_ERROR,
                "Error occurred on requesting deeplink from provider.",
            ],
            [
                KHQR_ERROR_CODES.MISSING_REQUIRED_FIELDS,
                "Missing required fields.",
            ],
            [KHQR_ERROR_CODES.UNAUTHORIZED, "Unauthorized."],
            [KHQR_ERROR_CODES.EMAIL_SERVER_DOWN, "Email server has been down."],
            [
                KHQR_ERROR_CODES.EMAIL_ALREADY_REGISTERED,
                "Email has been registered already.",
            ],
            [
                KHQR_ERROR_CODES.CANNOT_CONNECT_TO_SERVER,
                "Cannot connect to server. Please try again later.",
            ],
            [KHQR_ERROR_CODES.NOT_REGISTERED, "Not registered yet."],
            [KHQR_ERROR_CODES.ACCOUNT_ID_NOT_FOUND, "Account ID not found."],
            [KHQR_ERROR_CODES.ACCOUNT_ID_INVALID, "Account ID is invalid."],
        ];

        for (const [code, msg] of mapping) {
            expect(KHQR_ERROR_MESSAGES[code]).toBe(msg);
        }
    });
});
