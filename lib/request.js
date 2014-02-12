var Promise = require('bluebird');
var superagent = require('superagent');

module.exports = superagent;

superagent.parse[ 'text/javascript' ] = superagent.parse[ 'application/json' ];

var original = superagent.Request.prototype.end;

superagent.Request.prototype.end = promisedEnd;

function promisedEnd(fn) {
	var req = this;

	req._parser = superagent.parse[ 'application/json' ];

	if (fn) {
		return original.apply(req, arguments);
	}

	return new Promise(function (resolve, reject) {
		original.call(req, function (err, res) {
			if (err) reject(err);
			else resolve(res);
		});
	}).catch(Promise.CancellationError, function () {
		req.abort();
	});
}