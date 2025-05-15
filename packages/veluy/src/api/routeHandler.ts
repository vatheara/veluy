import { NextRequest, NextResponse } from "next/server";
import { HTTPMethod, RouteHandlerMap } from "./types";

/**
 * Creates a Next.js App Router route handler with method-based routing
 *
 * @param handlers An object mapping HTTP methods to handler functions
 * @returns A Next.js compatible route handler function
 */
export function createRouteHandler<T = any>(handlers: RouteHandlerMap<T>) {
    return async function handler(
        req: NextRequest,
        params: { params: Record<string, string> }
    ): Promise<NextResponse<T | { error: string }> | Response> {
        const method = req.method as HTTPMethod;
        const handler = handlers[method];

        if (!handler) {
            return NextResponse.json(
                { error: `Method ${method} not allowed` },
                { status: 405 }
            );
        }

        try {
            return await handler(req, params);
        } catch (error) {
            console.error(`Error in ${method} handler:`, error);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 }
            );
        }
    };
}
