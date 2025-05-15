import { NextRequest, NextResponse } from "next/server";

export type HTTPMethod =
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "PATCH"
    | "HEAD"
    | "OPTIONS";

export type RouteHandler<T = any> = (
    req: NextRequest,
    params: { params: Record<string, string> }
) => Promise<NextResponse<T>> | Promise<Response>;

export type RouteHandlerMap<T = any> = {
    [key in HTTPMethod]?: RouteHandler<T>;
};
