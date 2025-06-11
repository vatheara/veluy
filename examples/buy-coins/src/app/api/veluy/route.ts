import { createRouteHandler } from "../../../../../../packages/veluy/src/next";
import {ourTransactionRouter} from "./core"


export const { GET, POST } = createRouteHandler({
    router: ourTransactionRouter
})