import * as ___internal_types from '../dist/_internal/types.js';
export { UTTransactionData, UTRegion as experimental_UTRegion } from '../dist/_internal/types.js';
import * as _veluy_shared from '@veluy/shared';
import { Json } from '@veluy/shared';
import { NextRequest } from 'next/server';
import { CreateBuilderOptions } from '../dist/_internal/veluy-builder.js';
import { TransactionRouter, RouteHandlerOptions } from '../types/index.js';
export { TransactionRouter } from '../types/index.js';

type AdapterArgs = {
    req: NextRequest;
};
declare const createVeluy: <TErrorShape extends Json>(opts?: CreateBuilderOptions<TErrorShape>) => <TRouteOptions extends _veluy_shared.RouteOptions>(input: any, config?: TRouteOptions | undefined) => ___internal_types.VeluyBuilder<{
    _routeOptions: TRouteOptions;
    _input: {
        in: ___internal_types.UnsetMarker;
        out: ___internal_types.UnsetMarker;
    };
    _metadata: ___internal_types.UnsetMarker;
    _adapterFnArgs: AdapterArgs;
    _errorShape: TErrorShape;
    _errorFn: ___internal_types.UnsetMarker;
    _output: ___internal_types.UnsetMarker;
}>;
declare const createRouteHandler: <TRouter extends TransactionRouter>(opts: RouteHandlerOptions<TRouter>) => {
    POST: (args_0: NextRequest) => Promise<Response>;
    GET: (args_0: NextRequest) => Promise<Response>;
};

export { createRouteHandler, createVeluy };
