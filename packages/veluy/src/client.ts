import * as Arr from "effect/Array";
import * as Micro from "effect/Micro";
import type {
    TransactionRouter,
    GenerateTransactionCheckerOptions,
    EndpointArg,
    RouteRegistry
} from "./types"
import { createIdentityProxy } from "@veluy/shared"

export const genUploader = <TRouter extends TransactionRouter>(
    initOpts?: GenerateTransactionCheckerOptions,
) => {
    
};