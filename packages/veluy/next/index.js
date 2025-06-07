import * as Effect from 'effect/Effect';
import { makeAdapterHandler } from '../dist/_internal/handler.js';
import { createBuilder } from '../dist/_internal/veluy-builder.js';
export { UTFiles, UTRegion as experimental_UTRegion } from '../dist/_internal/types.js';

const createVeluy = (opts)=>createBuilder(opts);
const createRouteHandler = (opts)=>{
    const handler = makeAdapterHandler((req)=>Effect.succeed({
            req
        }), (req)=>Effect.succeed(req), opts, "nextjs-app");
    return {
        POST: handler,
        GET: handler
    };
};

export { createRouteHandler, createVeluy };
