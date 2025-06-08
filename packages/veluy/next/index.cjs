var Effect = require('effect/Effect');
var handler_cjs = require('../dist/_internal/handler.cjs');
var veluyBuilder_cjs = require('../dist/_internal/veluy-builder.cjs');
var types_cjs = require('../dist/_internal/types.cjs');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return n;
}

var Effect__namespace = /*#__PURE__*/_interopNamespace(Effect);

const createVeluy = (opts)=>veluyBuilder_cjs.createBuilder(opts);
const createRouteHandler = (opts)=>{
    const handler = handler_cjs.makeAdapterHandler((req)=>Effect__namespace.succeed({
            req
        }), (req)=>Effect__namespace.succeed(req), opts, "nextjs-app");
    return {
        POST: handler,
        GET: handler
    };
};

Object.defineProperty(exports, "UTTransactionData", {
  enumerable: true,
  get: function () { return types_cjs.UTTransactionData; }
});
Object.defineProperty(exports, "experimental_UTRegion", {
  enumerable: true,
  get: function () { return types_cjs.UTRegion; }
});
exports.createRouteHandler = createRouteHandler;
exports.createVeluy = createVeluy;
