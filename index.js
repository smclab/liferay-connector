
'use strict';

// Move to titaniumifier!
process.execPath || (process.execPath = '/path/to/node');

var Promise = require('bluebird');
var request = require('./lib/request');

var liferay = exports;

liferay.Promise = Promise;
liferay.request = request;

liferay.errors = require('./lib/errors');
liferay.identify = require('./lib/identify');
liferay.camelcase = require('./lib/camelcase');

liferay.base = require('./lib/connectors/base');
liferay.v61 = require('./lib/connectors/liferay61');
liferay.v62 = require('./lib/connectors/liferay62');

liferay.connectors = [
  liferay.v61, liferay.v62
];

liferay.guest = function (portalURL, auth, callback) {
  return liferay.identify(portalURL, null).then(function (connector) {
    return connector.guest(portalURL);
  }).nodeify(callback);
};

liferay.authenticate = function (portalURL, auth, callback) {
  return liferay.identify(portalURL, auth).then(function (connector) {
    return connector.authenticate(portalURL, auth);
  }).nodeify(callback);
};
