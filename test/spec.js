var should = require('should');

var liferay;
var config;

try {
  liferay = require('liferay-connector');
  config = require('config');
}
catch (e) {
  liferay = require('..');
  config = require('./fake-titanium-app/Resources/config');
}

var Promise = liferay.Promise;

var TIMEOUT = 10e3;

var PORTAL_URL = config.PORTAL_URL;
var AUTH = config.AUTH;
var WRONG_AUTH = config.WRONG_AUTH;

var connector;
var connection;
var userGroup;

describe("The global connector", function () {

  this.timeout(TIMEOUT);

  it("should be able to indentify a Liferay (≥6.1)", function () {
    return liferay.identify(PORTAL_URL, AUTH).then(function (conn) {
      connector = conn;
    });
  });

});

describe("The given connector", function () {

  this.timeout(TIMEOUT);

  it("should give a valid connector", function () {
    connector.should.have.a.property('authenticate');
  });

  it("should authenticate correctly", function () {
    return connector.authenticate(PORTAL_URL, AUTH).then(function (conn) {
      connection = conn;
    });
  });

  it("should not authenticate with wrong credentials", function () {
    return connector.authenticate(PORTAL_URL, WRONG_AUTH).then(function () {
      throw new Error("The portal authenticated with wrong credentials!");
    })
    .catch(liferay.errors.Unauthorized, function (err) {
      return null;
    });
  });

  testConnectionQuality(1);
});

describe("Automatic authentication", function () {

  this.timeout(TIMEOUT);

  it("should authenticate without an identification", function () {
    return liferay.authenticate(PORTAL_URL, AUTH).then(function (conn) {
      connection = conn;
    });
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

describe("Error assimilation", function () {
  it("should not get an MBMessage by a random id", function () {
    return connection.invoke({
      "/mbmessage/get-message": {
        messageId: 99999999
      }
    })
    .then(function (message) {
      throw new Error("Got a message with random id");
    })
    .catch(liferay.errors.NotFound, function (err) {
      return null;
    });
  });

  it("should understand wrong services", function () {
    return connection.invoke({
      "/i-do-not-exists/neither-i": {}
    })
    .then(function () {
      throw new Error("Resolved an non-existent service");
    })
    .catch(liferay.errors.BadRequest, function (err) {
      return null;
    });
  });
});

describe("Blogs services", function () {
  it("(with the user group)", function () {
    var candidates = connection.sites.filter(function (group) {
      return group.friendlyURL === '/' + connection.user.screenName;
    });

    candidates.should.have.length(1);

    userGroup = candidates[0];

    userGroup.should.have.a.property('groupId');
    userGroup.should.have.a.property('companyId');
  });

  var entry;

  it("should be able to create (valid) entries", function () {
    var now = new Date();
    return connection.invoke({
      "/blogsentry/add-entry": {
        title: 'title-' + Math.random(),
        description: 'description-' + Math.random(),
        content: 'content-' + Math.random(),
        displayDateMonth: now.getMonth(),
        displayDateDay: now.getDate(),
        displayDateYear: now.getFullYear(),
        displayDateHour: now.getHours(),
        displayDateMinute: now.getMinutes(),
        allowPingbacks: false,
        allowTrackbacks: false,
        trackbacks: [],
        smallImage: false,
        smallImageUrl: null,
        // Issue #5
        /*smallImageURL: null,*/
        smallImageFileName: null,
        smallImageInputStream: null,
        '+serviceContext': 'com.liferay.portal.service.ServiceContext',
        'serviceContext.companyId': userGroup.companyId,
        'serviceContext.scopeGroupId': userGroup.groupId,
        'serviceContext.addGuestPermissions': true,
        'serviceContext.addGroupPermissions': true
        // Issue #4
        /*serviceContext: {
          companyId: userGroup.groupId,
          scopeGroupId: userGroup.companyId,
          addGuestPermissions: true,
          addGroupPermissions: true
        }*/
      }
    })
    .then(function (result) {
      entry = result;

      entry.should.have.a.property('entryId');
      entry.should.have.a.property('title');
      entry.should.have.a.property('description');
      entry.should.have.a.property('content');

      entry.entryId.should.be.a.Number;
    });
  });

  it("should get that same entry", function () {
    return connection.invoke({
      "/blogsentry/get-entry": {
        entryId: entry.entryId
      }
    })
    .then(function (result) {
      result.should.eql(entry);
    });
  });

  it("should delete a fresh entry", function () {
    return connection.invoke({
      "/blogsentry/delete-entry": {
        entryId: entry.entryId
      }
    });
  });
});
