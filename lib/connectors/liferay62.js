
var inherits = require('../inherits');
var invoker = require('../invoker');
var errors = require('../errors');
var Connector = require('./base');
var Promise = require('bluebird');

module.exports = Liferay62;

function Liferay62(portalURL, auth) {
  Connector.call(this, portalURL, auth);
}

Liferay62.version = '6.2';

inherits(Liferay62, Connector, {

  raw: function (payload) {
    return invoker(this.portalURL, '/api/jsonws/invoke', this.auth, this.mangle(payload));
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
      else throw new errors.NotFound;
    })
    .catch(errors.NotFound, function () {
      if (!isNaN(+login)) return this.invoke({
        "/user/get-user-by-id": {
          userId: +login
        }
      })
      else throw new errors.NotFound;
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
  }

});

Liferay62.matches = function (buildnumber) {
  return buildnumber >= 6200 && buildnumber < 6300; // 7000
};
