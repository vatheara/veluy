import { createRouteHandler } from "../../../../../../packages/veluy/src/next";
import {ourFileRouter} from "./core"


export const { GET, POST } = createRouteHandler({
    router: ourFileRouter
})