import { createRouteHandler } from "../../../../../../packages/veluy/src/next";
import { ourTransactionRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourTransactionRouter,
  config: {
    token: process.env.BAKONG_API_TOKEN,
  },
});
