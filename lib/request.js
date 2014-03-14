var Promise = require('bluebird');
var superagent = require('superagent');

module.exports = superagent;

superagent.parse[ 'text/javascript' ] = superagent.parse[ 'application/json' ];

var originalEnd = superagent.Request.prototype.end;

superagent.Request.prototype.end = end;

function end(fn) {
  var req = this;

  return new Promise(function (resolve, reject) {

    originalEnd.call(req, function (res) {
      resolve(res);
    });

    req.on('error', function (err) {
      reject(err);
    });

    req.on('abort', function () {
      reject(new Promise.CancellationError("Request aborted"));
    });

  })
  .cancellable()
  .catch(Promise.CancellationError, function (err) {
    req.abort();
    throw err;
  })
  .nodeify(fn);
}
