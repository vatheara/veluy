import * as Arr from "effect/Array";
import * as Micro from "effect/Micro";
import type {
  TransactionRouter,
  GenerateTransactionCheckerOptions,
  EndpointArg,
  RouteRegistry,
} from "./types";
import { createIdentityProxy } from "@veluy/shared";

export const genService = <TRouter extends TransactionRouter>(
  initOpts?: GenerateTransactionCheckerOptions,
) => {
  const routeRegistry = createIdentityProxy<RouteRegistry<TRouter>>();
};
