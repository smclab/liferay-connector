
'use strict';

var inherits = require('../inherits');
var invoker = require('../invoker');
var errors = require('../errors');
var Connector = require('./base');
var Promise = require('bluebird');

module.exports = Liferay61;

function Liferay61(portalURL, auth) {
  Connector.call(this, portalURL, auth);
}

Liferay61.version = '6.1';

inherits(Liferay61, Connector, {

  raw: function (payload) {
    return invoker(this.portalURL, this.getAPIPath(), this.auth, this.mangle(payload));
  },

  mangle: function (payload) {
    return this.mangleCamelCase(this.mangleInstantiation(payload));
  },

  getAPIPath: function () {
    if (this.isGuest()) {
      return '/api/secure/jsonws';
    }
    else {
      return '/api/jsonws';
    }
  },

  getUser: function () {
    var auth = this.auth;
    var login = auth.login;

    return Promise.bind(this)
    .then(function () {
      return this.invoke({
        "/user/get-user-by-email-address": {
          emailAddress: login
        }
      });
    })
    .catch(errors.NotFound, function () {
      if (!isNaN(+login)) return this.invoke({
        "/user/get-user-by-id": {
          userId: +login
        }
      });
      else throw new errors.NotFound();
    })
    .catch(errors.NotFound, function () {
      return this.invoke({
        "/user/get-user-by-screen-name": {
          screenName: login
        }
      });
    })
    .then(function (user) {
      if (user) return user;
      else throw new errors.NotFound("Could not retrieve the user");
    });
  }

});

Liferay61.matches = function (buildnumber) {
  return buildnumber >= 6100 && buildnumber < 6200;
};
