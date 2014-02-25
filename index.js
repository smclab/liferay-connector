
// Move to titaniumifier!
global.setTimeout = (function (setTimeout) {
  return function _setTimeout(fn, timeout) {
    return setTimeout(fn, timeout);
  };
})(global.setTimeout);

var Promise = require('bluebird');

var liferay = exports;

liferay.errors = require('./lib/errors');
liferay.identify = require('./lib/identify');

liferay.v61 = require('./lib/connectors/liferay61');
liferay.v62 = require('./lib/connectors/liferay62');

liferay.connectors = [
  liferay.v61, liferay.v62
];

liferay.authenticate = function (portalURL, auth) {
  return liferay.identify(portalURL, auth).then(function (connector) {
    return connector.authenticate(portalURL, auth);
  });
}
