
"use strict";

var liferay = require('..');
var errors = require('./errors');
var request = require('./request');
var invoker = require('./invoker');

module.exports = identify;

function identify(portalURL, auth) {
  return request.head(portalURL)
  .end()
  .then(invoker.retrieveBuildNumber)
  .catch(function () {
    return invoker(portalURL, liferay.v62.API_PATH, auth, {
      "/portal/get-build-number": {}
    })
    .end()
    .then(invoker.parseLiferayResponse)
    .then(invoker.getBody);
  })
  .catch(function () {
    return invoker(portalURL, liferay.v61.API_PATH, auth, {
      "/portal/get-build-number": {}
    })
    .end()
    .then(invoker.parseLiferayResponse)
    .then(invoker.getBody);
  })
  .then(function (buildnumber) {
    var connector;

    if (!isFinite(+buildnumber)) {
      throw new errors.UnrecognizedLiferayVersion(buildnumber);
    }

    liferay.connectors.some(function (conn) {
      if (conn.matches(+buildnumber)) {
        connector = conn;
        return true;
      }
    });

    if (connector) {
      return connector;
    }
    else {
      throw new errors.UnrecognizedLiferayVersion(buildnumber);
    }
  });
}
