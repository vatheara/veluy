import { createRouteHandler } from "../../../../../../packages/veluy/next";
import {ourFileRouter} from "./core"


export const { GET } = createRouteHandler({
    router: ourFileRouter
})