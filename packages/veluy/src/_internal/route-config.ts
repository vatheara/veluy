import * as Effect from "effect/Effect";
import { objectKeys } from "@veluy/shared";

import type { TransactionRouter } from "../types";

export const extractRouterConfig = <TRouter extends TransactionRouter>(
  router: TRouter,
) =>
  Effect.forEach(objectKeys(router), (slug) =>
    Effect.succeed({
      slug,
      config: router[slug]!.routerConfig,
    }),
  );
