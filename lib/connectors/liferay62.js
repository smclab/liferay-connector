
var inherits = require('../inherits');
var invoker = require('../invoker');
var Connector = require('./base');

module.exports = Liferay62;

function Liferay62(portalURL, auth) {
  Connector.call(this, portalURL, auth);
}

Liferay62.version = '6.2';

inherits(Liferay62, Connector, {

  raw: function (payload) {
    return invoker(this.portalURL, '/api/jsonws/invoke', this.auth, this.mangle(payload));
  },

  getUser: function () {
    var auth = this.auth;
    var login = auth.login;
    var companyId = this.companyId;
    return this.any(
      (companyId || null) && {
        "/user/get-user-by-email-address": {
          emailAddress: login,
          companyId: companyId
        }
      },
      // Test only numeric logins
      isNaN(+login) ? null : {
        "/user/get-user-by-id": {
          userId: login
        }
      }
    ).catch(function () {
      // Only if REALLY necessary
      return this.invoke({
        "/user/get-user-by-screen-name": {
          screenName: login,
          companyId: companyId
        }
      });
    });
  }

});

Liferay62.matches = function (buildnumber) {
  return buildnumber >= 6200 && buildnumber < 6300; // 7000
};
