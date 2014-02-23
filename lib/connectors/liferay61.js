
var inherits = require('../inherits');
var invoker = require('../invoker');
var Connector = require('./base');

module.exports = Liferay61;

function Liferay61(portalURL, auth) {
  Connector.call(this, portalURL, auth);
}

Liferay61.version = '6.1';

inherits(Liferay61, Connector, {

  raw: function (payload) {
    return invoker(this.portalURL, '/api/secure/jsonws/invoke', this.auth, this.mangle(payload));
  },

  getUser: function () {
    var auth = this.auth;
    var login = auth.login;
    var companyId = this.companyId;
    return this.any(
      (companyId || null) && {
        "/user/get-user-by-email-address": {
          emailAddress: login,
          //companyId: companyId
        }
      },
      {
        "/user/get-user-by-id": {
          userId: login
        }
      }
    ).catch(function () {
      // Only if REALLY necessary
      return this.invoke({
        "/user/get-user-by-screen-name": {
          screenName: login,
          //companyId: companyId
        }
      });
    });
  }

});

Liferay61.matches = function (buildnumber) {
  return buildnumber >= 6100 && buildnumber < 6200;
};
