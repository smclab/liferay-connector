
'use strict';

var inherits = require('../inherits');
var invoker = require('../invoker');
var errors = require('../errors');
var Connector = require('./base');
var Promise = require('bluebird');

module.exports = Liferay70;

function Liferay70(portalURL, auth) {
  Connector.call(this, portalURL, auth);
}

Liferay70.version = '7.0';

inherits(Liferay70, Connector, {

  raw: function (payload) {
    return invoker(this.portalURL, '/api/jsonws', this.auth, this.mangle(payload));
  },

  mangle: function (payload) {
    return this.mangleCamelCase(this.mangleInstantiation(payload));
  },

  getUser: function () {
    var auth = this.auth;
    var login = auth.login;
    var companyId = this.companyId;

    return Promise.bind(this)
    .then(function () {
      if (companyId) return this.invoke({
        "/user/get-user-by-email-address": {
          emailAddress: login,
          companyId: companyId
        }
      });
      else throw new errors.NotFound();
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
          screenName: login,
          companyId: companyId
        }
      });
    })
    .then(function (user) {
      if (user) return user;
      else throw new errors.NotFound("Could not retrieve the user");
    });
  },

  getUserSites: function () {
    return {
      "/group/get-user-sites-groups": {}
    }
  }

});

Liferay70.matches = function (buildnumber) {
  return buildnumber >= 7000 && buildnumber < 7100; // 7000
};
