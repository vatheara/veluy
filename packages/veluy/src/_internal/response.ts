import { NextResponse } from "next/server";

export type JsonResponse<T = any> = NextResponse<T>;

/**
 * Creates a JSON response with the provided data and optional status code and headers
 */
export function json<T = any>(
    data: T,
    status = 200,
    headers: Record<string, string> = {}
): JsonResponse<T> {
    return NextResponse.json(data, { status, headers });
}

/**
 * Creates an error response
 */
export function errorResponse(
    message: string,
    status = 400,
    headers: Record<string, string> = {}
): JsonResponse<{ error: string }> {
    return NextResponse.json({ error: message }, { status, headers });
}
