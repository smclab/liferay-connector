var should = require('should');

var liferay;
var config;

try {
  liferay = require('liferay-core-connector');
  config = require('config');
}
catch (e) {
  liferay = require('..');
  config = require('./fake-titanium-app/Resources/config');
}

var TIMEOUT = 10e3;

var PORTAL_URL = config.PORTAL_URL;
var AUTH = config.AUTH;

var connector;
var connection;

describe("The global connector", function () {

  this.timeout(TIMEOUT);

  it("should be able to indentify a Liferay (≥6.1)", function (done) {
    liferay.identify(PORTAL_URL, AUTH).done(function (conn) {
      connector = conn;
      done();
    }, done);
  });

  /*it("sould throw at unauthorized access", function (done) {
    liferay.identify(PORTAL_URL)
    .catch(liferay.errors.Unauthorized, done.bind(null, null))
    .done(function (res) {
      done(new Error("Identification passed without an authentication"));
    }, function (err) {
      if (err instanceof liferay.errors.Unauthorized) {
        done();
      }
    });
  });*/

});

describe("The given connector", function () {

  this.timeout(TIMEOUT);

  it("should give a valid connector", function () {
    connector.should.have.a.property('authenticate');
  });

  it("should authenticate correctly", function (done) {
    connector.authenticate(PORTAL_URL, AUTH).done(function (conn) {
      connection = conn;
      done();
    }, done);
  });

  testConnectionQuality(1);
});

describe("Automatic authentication", function () {

  this.timeout(TIMEOUT);

  it("should authenticate without an identification", function (done) {
    liferay.authenticate(PORTAL_URL, AUTH).done(function (conn) {
      connection = conn;
      done();
    }, done);
  });

  testConnectionQuality(2);
});

function testConnectionQuality(count) {
  it("should have a few interesting properties (" + count + ")", function () {
    connection.should.have.a.property('user');
    connection.should.have.a.property('companyId');
    connection.companyId.should.be.greaterThan(0);
    connection.user.should.have.a.property('userId');
  });

  it("should have a few interesting methods (" + count + ")", function () {
    connection.should.have.a.property('invoke');
    connection.should.have.a.property('raw');

    connection.invoke.should.be.a.Function;
    connection.raw.should.be.a.Function;
  });
}

describe("The given connection", function () {});
