import type { NextRequest } from "next/server";
import * as Effect from "effect/Effect";

import type { Json } from "@veluy/shared";

import { makeAdapterHandler } from "./_internal/handler";
import type { CreateBuilderOptions } from "./_internal/veluy-builder";
import { createBuilder } from "./_internal/veluy-builder";
import type { TransactionRouter, RouteHandlerOptions } from "./types";

export type { TransactionRouter };
export {
  UTTransactionData,
  /**
   * This is an experimental feature.
   * You need to be feature flagged on our backend to use this
   */
  UTRegion as experimental_UTRegion,
} from "./_internal/types";

type AdapterArgs = {
  req: NextRequest;
};

export const createVeluy = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<AdapterArgs, TErrorShape>(opts);

export const createVeluyQR = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<AdapterArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends TransactionRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  const handler = makeAdapterHandler<[NextRequest], AdapterArgs>(
    (req) => Effect.succeed({ req }),
    (req) => Effect.succeed(req),
    opts,
    "nextjs-app",
  );
  return { POST: handler, GET: handler };
};
