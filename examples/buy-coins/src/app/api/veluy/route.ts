import { createRouteHandler } from "../../../../../../packages/veluy/next";
import {ourFileRouter} from "./core"


export const { GET, POST } = createRouteHandler({
    router: ourFileRouter
})